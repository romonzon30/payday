# Arquitectura — PayDay

> Referencia de arquitectura del sistema, servicios externos, APIs y las decisiones de diseño que las justifican.
> La fuente de verdad del esquema de datos son los **modelos de Mongoose** (`server/models/`), no `dbSchema.json`, que quedó desactualizado.

## 1. Visión general

PayDay es un SaaS de cumplimiento fiscal para **monotributistas argentinos**. El usuario entra con Google,
completa su perfil (DNI / CUIT / categoría de monotributo) y la app genera y hace seguimiento de los
**vencimientos AFIP** en un calendario, con recordatorios por email e in-app. El dominio y la UI están en español.

Es un **monorepo de dos partes** con dependencias separadas:

| Parte | Ubicación | Stack |
|-------|-----------|-------|
| Frontend | `/src` | React 18 + TypeScript + Vite, CSS Modules, SPA sin router |
| Backend | `/server` | Express 5 + Mongoose (MongoDB), CommonJS, paquete npm propio |

**Por qué monorepo de dos paquetes:** front y back se despliegan por separado (Vercel / Render) pero comparten
el repositorio y el contexto del dominio. Tener `node_modules` independientes evita mezclar dependencias de
navegador y de Node.

---

## 2. Backend — arquitectura por capas

El backend está organizado en capas con una regla clara de responsabilidades:

```
config/      env.js (acceso único a entorno + validateEnv + isEmailConfigured), db.js (connect + seed AFIP)
data/        afipCategorias.js, taxCalendar2026.js (tabla IMPUESTOS), holidays2026.js     ← ESTÁTICO
domain/      businessDays.js, monotributo.js, taxCalendar.js, vencimientoEstado.js        ← PURO (sin Express/Mongoose)
services/    authService, userService, vencimientoService, monotributoService,
             impuestoService, emailService, notificationScheduler                          ← lógica + acceso a DB
controllers/ authController, userController, impuestoController                            ← solo req/res
routes/      auth.js, user.js, impuestos.js                                                ← path → controller
middleware/  auth.js (JWT → req.user), errorHandler.js (+ HttpError), asyncHandler.js
app.js       createApp() — arma la app Express (sin listen); la usan index.js y los tests
index.js     boot: validateEnv → connectDB → seed → listen → (verify SMTP + scheduler)
```

**Regla de oro:** *las rutas cablean, los controllers adaptan HTTP, los services tienen la lógica de negocio +
acceso a DB, `domain/` es puro, `data/` es configuración estática, `config/` es entorno y wiring.*

### Justificación

- **Dominio puro (`domain/`)**: no importa Express ni Mongoose. Esto lo hace **testeable como funciones puras**
  (entrada → salida, sin DB ni red) y es exactamente lo que está cubierto por los tests unitarios
  (`businessDays`, `monotributo`, `taxCalendar`, `vencimientoEstado`). La lógica fiscal —la parte que no puede
  estar mal— se valida sin levantar nada.
- **Services como única puerta a la DB**: concentrar el acceso a Mongoose en services evita que los controllers
  o las rutas terminen con queries dispersas. Si cambia el modelo de datos, el impacto queda contenido.
- **`createApp()` separado del `listen()`**: permite montar la app real en los tests de integración con
  `supertest` sin abrir un puerto. El mismo código que corre en producción es el que se testea.
- **Errores centralizados**: los services lanzan `HttpError(status, message)` para errores esperables de cliente;
  `asyncHandler` reenvía los rechazos; `errorHandler` mapea `HttpError` → status, el `11000` de Mongo → 409, y el
  resto → 500. Todas las respuestas de error son `{ message }`. Un solo lugar decide cómo se ve un error.

### Boot (`index.js` + `config/`)

1. `validateEnv()` — avisa si faltan `JWT_SECRET` / `GOOGLE_CLIENT_ID`.
2. `connectDB()` — conecta a `MONGO_URI` (Atlas) o cae a `mongodb-memory-server` en memoria.
3. `seedAfipCategorias()` — siembra las 11 categorías AFIP (A–K) en `configuracion_afip`.
4. `listen(PORT)`.
5. Si el email está completamente configurado (`isEmailConfigured()`), verifica el SMTP y arranca el scheduler.

---

## 3. Frontend — arquitectura

```
config/env.ts        API_URL + GOOGLE_CLIENT_ID (acceso único a entorno)
lib/apiClient.ts     api.get/post/put/patch/del — base URL + header de auth + logout en 401 + ApiError tipado
types/index.ts       tipos compartidos: User, Vencimiento, ImpuestoPreview, View
hooks/               useAuth (sesión), useVencimientos (datos del calendario), useTheme (store único)
utils/fecha.ts       MONTH_NAMES, grilla del calendario, formatMonto, etiquetas de estado
components/ui/        FormField (input etiquetado reutilizable)
components/          AppSidebar, AppFooter, NuevoVencimientoModal, LoginCard
pages/               LoginPage, DashboardPage, UserProfilePage, ProfileCompletedPage, CalendarPage, ImpuestosPage
App.tsx              "ruteo" (estado de vista + render por página)
```

### Determinaciones deliberadas y su justificación

Estas decisiones fueron tomadas a propósito (ver "Architecture determinations" en `CLAUDE.md`). No son accidentes:

- **Sin react-router.** Son 6 vistas, sin necesidad de URLs ni deep-linking. `App.tsx` mantiene una unión `View`
  y renderiza una página por vez. *Justificación:* agregar routing sería complejidad sin beneficio para el alcance
  actual. Es un no-goal **conocido y diferido** (ver `docs/MEJORAS.md` para cuándo reconsiderarlo).
- **Auth por hook `useAuth`, no Context.** Menos piezas móviles. El acoplamiento apiClient ↔ logout se resuelve
  con `setOnUnauthorized`. *Justificación:* un Context para una sola sesión es boilerplate sin ganancia.
- **Theme como store único** (`useTheme` con `useSyncExternalStore`). *Justificación:* todos los call sites quedan
  sincronizados sin re-renders innecesarios ni Context; se aplica de forma síncrona para evitar el flash (FOUC).
- **Todo el HTTP pasa por `lib/apiClient.ts`.** Nunca se escribe `fetch` + header `Authorization` a mano en un
  componente. *Justificación:* el cliente inyecta el token, prefija `API_URL`, lanza `ApiError` tipado y dispara
  logout en 401. Centralizar esto evita repetir la lógica de auth en cada llamada.
- **Design system = custom properties de `index.css`** (consumidas con `var(--…)`). No hay objeto de tokens en TS.
  *Justificación:* una sola fuente de verdad para el diseño; la copia previa en TS había divergido y se eliminó.

---

## 4. Servicios externos

| Servicio | Librería (versión) | Para qué | Cómo está cableado | Fallback |
|----------|-------------------|----------|--------------------|----------|
| **MongoDB Atlas** | `mongoose@^9.6.2` (+ `mongodb@^7.2.0`) | Base de datos principal | `config/db.js` → `connectDB()`, `serverSelectionTimeoutMS: 5000` | `mongodb-memory-server@^11` en memoria si Atlas no responde |
| **Google OAuth (back)** | `google-auth-library@^10.6.2` | Verificar identidad del usuario | `authService.js` — `verifyIdToken` (flujo ID token) y `fetch` a userinfo (flujo access token) | — |
| **Google OAuth (front)** | `@react-oauth/google@^0.13.5` | Botón de login | `GoogleOAuthProvider` en `main.tsx`, `GoogleLogin` en `LoginCard.tsx` | mensaje si falta el client ID |
| **JWT** | `jsonwebtoken@^9.0.3` | Sesión stateless | `authService.signToken` firma `{ id }`; `middleware/auth.js` lo verifica y carga `req.user` | — |
| **Email SMTP** | `nodemailer@^8.0.10` | Recordatorios por email | `emailService.js`, transporter lazy desde `env.smtp` | gate `isEmailConfigured()`: si falta SMTP, no se envía y el scheduler no arranca |
| **Cron** | `node-cron@^4.2.1` | Disparar recordatorios cada hora | `notificationScheduler.js`, `cron.schedule("0 * * * *", …)` + una corrida al boot | — |

### Justificaciones

- **MongoDB con fallback in-memory:** permite levantar el proyecto **sin servicios externos** para desarrollo y
  tests. *Riesgo a tener presente:* el fallback corre también en el path de runtime, no solo en tests — en
  producción, una caída transitoria de Atlas degrada silenciosamente a una DB en memoria efímera (se pierden datos).
  Confirmar siempre `MONGO_URI` en prod.
- **Google OAuth:** login sin gestionar contraseñas. No hay almacenamiento de credenciales propio, lo que elimina
  toda una clase de riesgos (hashing, leaks de password). El flujo ID token verifica el `audience`; el flujo access
  token hace una consulta a `userinfo`.
- **JWT stateless:** la sesión vive en el token, no en una tabla `sesiones`. *Justificación:* sin estado de sesión
  en DB, el backend escala horizontalmente sin sticky sessions.
- **SMTP vía nodemailer (no Resend en el código):** el proveedor de email se cambia **solo por variables de entorno**
  (`SMTP_*`), sin tocar código. Nota: el sandbox de Resend (`onboarding@resend.dev`) solo entrega al dueño de la
  cuenta; para destinatarios reales hay que verificar un dominio y setear `SMTP_FROM`.
- **node-cron en proceso:** recordatorios periódicos **sin infraestructura de colas** (sin Redis, sin worker
  aparte). Adecuado al alcance; para mayor escala o múltiples instancias habría que coordinar las corridas
  (ver `docs/MEJORAS.md`, race del scheduler).

---

## 5. APIs expuestas

Todas las rutas se montan en `server/app.js`. Las de `/api/user/*` e `/api/impuestos/*` requieren
`Authorization: Bearer <JWT>` (`middleware/auth.js`). Todos los handlers van envueltos en `asyncHandler` con
manejo de errores centralizado.

### Auth — `routes/auth.js` (`/api/auth`, público)

| Método | Path | Propósito |
|--------|------|-----------|
| POST | `/api/auth/google` | Login/auto-registro con Google ID token |
| POST | `/api/auth/register` | Completar perfil (nombre / dni / emailNotificaciones) para un usuario con JWT |
| POST | `/api/auth/google-access` | Login con Google access token (consulta a userinfo) |

### Usuario — `routes/user.js` (`/api/user`, requiere auth)

| Método | Path | Propósito |
|--------|------|-----------|
| GET | `/api/user/me` | Usuario actual; además reconcilia los vencimientos del año en curso |
| PUT | `/api/user/profile` | Actualizar perfil |
| GET | `/api/user/vencimientos?year&month` | Listar vencimientos del mes (`month` 1-indexado) |
| POST | `/api/user/vencimientos` | Crear vencimiento custom (201) |
| DELETE | `/api/user/vencimientos/:id` | Borrar vencimiento custom |
| PATCH | `/api/user/vencimientos/:id` | Actualizar `estado` |

### Impuestos / calendario fiscal — `routes/impuestos.js` (`/api/impuestos`, requiere auth)

| Método | Path | Propósito |
|--------|------|-----------|
| GET | `/api/impuestos/preview?year&month` | Calcular el calendario AFIP del mes según el último dígito del CUIT; marca los ya agregados (`month` 0-indexado) |
| POST | `/api/impuestos/agregar` | Persistir un vencimiento de impuesto (un mes o `periodico` = resto del año), 201 |
| DELETE | `/api/impuestos/:vencimientoId` | Borrar un impuesto agregado |

> Nota: el `month` es **1-indexado** en `/user/vencimientos` y **0-indexado** en `/impuestos/preview`. Es una
> inconsistencia a tener presente al consumir la API.

---

## 6. APIs de terceros consumidas

- **Única salida HTTP del servidor:** `fetch("https://www.googleapis.com/oauth2/v3/userinfo")` en
  `authService.js` (endpoint de userinfo de Google, usado por el flujo de access token). El flujo de ID token
  valida localmente con la librería (que internamente puede traer los certificados de Google).
- **AFIP NO se consume.** No hay ninguna llamada a una API de AFIP. *Justificación:* AFIP no expone una API
  pública usable para este propósito. Todos los datos fiscales están **codificados de forma estática**:
  - `data/taxCalendar2026.js` — tabla `IMPUESTOS`: cada impuesto mapea grupos del último dígito del CUIT a un
    `baseDia` (fuente: Errepar, Calendario de Vencimientos 2026).
  - `data/holidays2026.js` — feriados nacionales 2026.
  - `data/afipCategorias.js` — tabla de categorías de monotributo (A–K) con montos 2026.

Esto implica que **el calendario hay que actualizarlo a mano cada año** (ver `docs/MEJORAS.md`).

---

## 7. Motor fiscal

El cálculo de un vencimiento combina tres piezas, todas en `domain/` (puras):

1. **Tabla `IMPUESTOS`** (`data/taxCalendar2026.js`): codifica las reglas AFIP 2026. `domain/taxCalendar.js`
   toma un CUIT + mes y, según el último dígito del CUIT (`parseCuitLastDigit` → grupo), resuelve el `baseDia`.
2. **Días hábiles** (`domain/businessDays.js`): la fecha real de vencimiento es el **próximo día hábil** en o
   después del `baseDia`, **salteando fines de semana Y los feriados** de `data/holidays2026.js`. Toda la
   aritmética de fechas se hace en **UTC a las 12:00**. *Justificación:* fijar el mediodía UTC evita el drift de
   zona horaria que haría que una fecha "se corra" un día según el huso del servidor o del cliente.
3. **Motor monotributo** (`domain/monotributo.js` + `services/monotributoService.js`): `calcMontoFinal` aplica el
   descuento por inicio de actividad (50% / 75%) y el recargo de obra social por persona a cargo;
   `upsertMonotributoVencimientos` reconcilia los 12 documentos mensuales (los meses pagados no se tocan, los
   pendientes que se desfasaron se recrean).

---

## 8. Modelo de datos

MongoDB, base `monotributo_saas`. Modelos activos en `server/models/`: `User`, `Vencimiento`, `Notificacion`,
`ConfiguracionAfip`.

| Colección | Uso |
|-----------|-----|
| `users` | Usuarios + perfil (DNI, CUIT, categoría, preferencias de notificación) |
| `vencimientos` | Vencimientos generados y custom, con estado y flags de notificación |
| `notificaciones` | Notificaciones in-app (creadas por el scheduler) |
| `configuracion_afip` | Tabla AFIP sembrada al boot (11 categorías) |

**Seeding:** `seedAfipCategorias()` (`config/db.js`) hace upsert de las 11 categorías A–K desde
`data/afipCategorias.js` en cada arranque.

**Deriva modelo vs `dbSchema.json`:** `dbSchema.json` documenta el esquema *previsto*, pero los modelos
divergieron (p. ej. `Vencimiento` agrega `tipo`, `titulo`, `notif*Enviada`, `notificarEmail` y el estado
`al_dia`). Las colecciones `impuestos` / `sesiones` / `DueDate` del esquema viejo **no las usa el código vivo**
(la sesión es stateless por JWT). **Se confía en los archivos de modelos** para saber qué lee/escribe el código.

---

## 9. Build, tooling y tests

| Área | Herramienta | Notas |
|------|-------------|-------|
| Bundler front | Vite `^4.4.0` | `build` = `tsc && vite build`; proxy dev `/api → http://localhost:3001` |
| TypeScript | `^5.0.0` | `tsconfig.json` (strict) + `tsconfig.node.json` (+ `tsconfig.app.json` huérfano, ver mejoras) |
| Lint | ESLint flat config | aplica solo a `**/*.{ts,tsx}` — **el JS del server no se lintea** |
| Tests front | Vitest `^4` + jsdom | `utils/fecha`, `lib/apiClient` |
| Tests back | Jest `^30` + `mongodb-memory-server` + `supertest` | unit del dominio + integración montando `createApp()` |

Ambos suites corren **sin servicios externos**. Los tests de integración del backend levantan la app real con
MongoDB en memoria.

---

## 10. Deploy y entorno

| Componente | Plataforma | Notas |
|------------|-----------|-------|
| Frontend | **Vercel** (build de Vite) | setear `VITE_API_URL` a la URL del backend en Render |
| Backend | **Render** (`npm start` → `node index.js`) | necesita `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `SMTP_*`, `CORS_ORIGIN` |
| Base de datos | **MongoDB Atlas** (`monotributo_saas`) | vía `MONGO_URI` |
| Email | SMTP vía nodemailer | configurado solo por `SMTP_*` |

No hay manifiestos de deploy versionados (sin `vercel.json` / `render.yaml` / `Dockerfile`): el split
Vercel/Render se configura por dashboard.

### Variables de entorno

- **Frontend (`.env` en la raíz):** `VITE_GOOGLE_CLIENT_ID`, `VITE_API_URL`. `vite.config.ts` también acepta
  `GOOGLE_CLIENT_ID` / `API_URL` sin prefijo para CI/prod.
- **Backend (`server/.env`, ver `server/.env.example`):** `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`,
  `CORS_ORIGIN` (allowlist separada por comas; vacío = permite todo), `PORT`, y `SMTP_*`.

### Caveats de entorno

- **Desajuste de puerto:** el backend escucha en `PORT` (default `5000`) y el front apunta `VITE_API_URL` a
  `http://localhost:5000`, pero el **proxy dev de Vite** para `/api` apunta a `http://localhost:3001`. Como el
  front llama por `API_URL` completa (no por el proxy), hay que setear `VITE_API_URL` al backend que esté
  corriendo.
- **Fallback in-memory en prod:** sin `MONGO_URI`, la app usa Mongo en memoria silenciosamente — confirmar que
  esté seteada en producción o los datos no persisten.
