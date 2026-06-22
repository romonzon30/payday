# Plan de fix — PayDay

> Plan de remediación accionable, ordenado en PRs chicos y revisables. Cubre los hallazgos del test de responsive/mobile
> y todo el roadmap de [`MEJORAS.md`](./MEJORAS.md). Cada ítem: **`archivo:línea` · cambio concreto · esfuerzo (S/M/L)**.
> Orden = por impacto y por lo que desbloquea. Cada PR es independiente y deja tests en verde.

## Mapa de PRs

| PR | Tema | Prioridad | Esfuerzo |
|----|------|-----------|----------|
| 1 | Seguridad backend | 🔴 P0 | S/M |
| 2 | Correctitud que le miente al usuario | 🔴 P0 | M |
| 3 | Navegación mobile + bugs visuales | 🔴 bloqueante mobile | M |
| 4 | PII + rendimiento backend | 🟠 P1 | S/M |
| 5 | Tests de lo no cubierto | 🟠 P1 | M/L |
| 6 | Refactor + accesibilidad frontend | 🟠 P1 | M |
| 7 | Limpieza, deuda e infra local | 🟡 P2 | S |

**Hacer YA:** PR 1, 2 y 3. Son los que comprometen seguridad o dejan la app inusable (en mobile) / mintiéndole al usuario.

---

## PR 1 — Seguridad backend 🔴

- **JWT con expiración** — `server/services/authService.js:12`. Firmar con `jwt.sign({ id }, env.jwtSecret, { expiresIn: '7d' })`.
  El front ya hace logout en 401, así que un token vencido manda al login solo. **S**
- **`validateEnv` aborta en prod** — `server/index.js:11` + `server/config/env.js:33`. Llamar
  `validateEnv({ throwOnMissing: true })` cuando `NODE_ENV === 'production'` (en dev seguir con warning).
  Evita arrancar con `JWT_SECRET` vacío (tokens forjables). **S**
- **`helmet` + rate limiting** — `server/app.js`. `app.use(helmet())` global y `express-rate-limit` sobre `/api/auth/*`
  (p. ej. 10 req/min por IP). Agregar `express.json({ limit: '100kb' })`. Instala dos deps nuevas. **S/M**

**Verificación:** test que un token expirado da 401; arranque en prod sin `JWT_SECRET` falla ruidoso; header `X-Powered-By`
ausente y `429` tras N requests a `/api/auth`.

---

## PR 2 — Correctitud que le miente al usuario 🔴

- **Validar CUIT/CUIL** — `server/domain/taxCalendar.js:7` (`parseCuitLastDigit` devuelve `0` ante basura) +
  `server/services/userService.js:22`. Agregar validación de formato + dígito verificador al guardar perfil y al usar;
  lanzar `HttpError(400, 'CUIT inválido')` en vez de calcular un calendario equivocado en silencio. **M**
- **Validación de CUIL/email en el cliente** — `src/pages/UserProfilePage.tsx:125-132`. Validar formato antes de enviar
  (regex CUIT `XX-XXXXXXXX-X`, email). Mensaje inline. **S**
- **Race del scheduler → emails duplicados** — `server/services/notificationScheduler.js`. Reemplazar el patrón
  `find().lean()` → enviar → `updateOne` por un **claim atómico**: `findOneAndUpdate({ _id, notif48hEnviada: false }, { $set: { notif48hEnviada: true } })`
  ANTES de enviar; si el envío falla, revertir el flag. Además guard de corrida única (no solapar cron + boot). **M**
- **Errores de fetch silenciados** — `src/hooks/useVencimientos.ts:18,43,56`. Sacar los `catch {}` vacíos: exponer
  `error` desde el hook y que las páginas muestren un estado de fallo (distinto del estado vacío real "Estás al día"). **M**
- **Bug de estado `'pagado'`** — `src/hooks/useVencimientos.ts:29-48` + `src/types/index.ts:18`. Eliminar el string mágico
  `'pagado'`; usar los valores reales de `EstadoVencimiento` y tipar el body del PATCH para que el compilador atrape el error. **S**

**Verificación:** test backend de CUIT inválido → 400; test de idempotencia del scheduler con dos corridas concurrentes →
un solo email; en el front, cortar la red y ver mensaje de error (no "Estás al día"); `npm run build` sin el `'pagado'`.

---

## PR 3 — Navegación mobile + bugs visuales 🔴 (bloqueante en celular)

- **Nav en mobile (el bloqueante)** — `src/components/AppSidebar.module.css:131` hace `display:none` a ≤768px sin
  reemplazo → el usuario queda atrapado en el calendario, sin poder ir a Impuestos/Configuración ni salir.
  **Fix:** agregar una navegación mobile. Opción lazy recomendada: **bottom-nav fija** (`position: fixed; bottom: 0`)
  visible solo a ≤768px con los 4 ítems (Inicio/Calendario/Impuestos/Configuración) + Salir, reutilizando los mismos
  `onClick`/`navItems` que ya viven en `AppSidebar.tsx:28-78`. No requiere estado nuevo. Alternativa: hamburguesa que
  abra el sidebar como drawer (necesita estado open/close). **M**
- **Bloque "al día" contradictorio** — `src/pages/CalendarPage.tsx:233-241`. Renderizar "Sin más vencimientos / Estás al
  día" **solo cuando la lista del mes está vacía**, no incondicionalmente al pie de una lista con pendientes. **S**
- **"Venció el 22 de Jun" para algo que vence HOY** — lógica de etiqueta en `src/utils/fecha.ts` (statusLabel) /
  `server/domain/vencimientoEstado.js`. Distinguir "vence hoy" de "venció" con `<=` vs `<` en la comparación de fecha. **S**

**Verificación:** screenshot a 390px con sesión: la bottom-nav aparece y navega entre las 4 pantallas; a ≥769px no
aparece (sidebar normal); el bloque verde solo sale con 0 vencimientos; un ítem que vence hoy dice "Vence hoy".
(Reusar el harness de Playwright de esta sesión: `/tmp/pw/shots.cjs`.)

---

## PR 4 — PII + rendimiento backend 🟠

- **DTO/proyección de usuario** — `server/controllers/userController.js:6,11` + retornos de `authService`. No devolver el
  documento Mongoose entero (expone `dni`, `cuit`, `googleUid`). Serializar solo los campos que el front consume. **M**
- **Índices compuestos** — `server/models/Vencimiento.js`. Agregar `schema.index({ userId: 1, tipo: 1, fechaVencimiento: 1 })`
  (query real de listados) y un índice para el patrón del scheduler (`estado`, `notif*Enviada`, `fechaVencimiento`). **S**
- **`loginWithGoogleAccess`: timeout + audience** — `server/services/authService.js:51`. Envolver el `fetch` a userinfo con
  `AbortController` (p. ej. 5s) y verificar el `aud` del token. **S/M**
- **Validar `month`/`year`** — `server/services/impuestoService.js` (`agregar`) y `server/controllers/impuestoController.js`
  (`preview`). Rechazar fuera de rango (`month` 0-11/1-12 según endpoint, `year` razonable). **S**

**Verificación:** `GET /api/user/me` no incluye `googleUid`/`dni`; `explain()` de la query de listados usa el índice;
`agregar` con `month: 99` → 400; userinfo lento no cuelga el request.

---

## PR 5 — Tests de lo no cubierto 🟠

- **`authService`** — `server/__tests__/`. Mockear `OAuth2Client` y `fetch`; cubrir ID-token, `register`, `google-access`,
  y los caminos de error. **M**
- **`notificationScheduler` + `emailService`** — testear ventanas 48h/24h/hoy, los guards de idempotencia y el claim atómico
  del PR 2 (mockear el envío de email). **M/L**

**Verificación:** `cd server && npm test` verde con los nuevos archivos; cobertura de auth y scheduler > 0.

---

## PR 6 — Refactor + accesibilidad frontend 🟠

- **Partir páginas sobredimensionadas** — `src/pages/ImpuestosPage.tsx` (338 líneas) → extraer `ImpuestoCard` y mover el
  fetching a un hook; `src/pages/CalendarPage.tsx` (307 líneas) → extraer `VencimientoDetailModal`. **M**
- **Accesibilidad** — calendario navegable por teclado (`role="button"` + `tabIndex` + `onKeyDown`, hoy es doble-click
  sobre `<div>`); modales con `role="dialog"`/`aria-modal` + focus trap; `aria-current` en el ítem activo del nav. **M**
- **`alert()` → error inline** — `src/components/LoginCard.tsx`, `src/pages/ImpuestosPage.tsx`. Unificar con el estilo de
  error inline del resto. **S**

**Verificación:** navegar el calendario solo con teclado; Tab atrapado dentro del modal abierto; sin `alert(` en el código.

---

## PR 7 — Limpieza, deuda e infra local 🟡

**Backend**
- Eliminar `bcryptjs` de `server/package.json` (sin uso, auth es solo Google). Revisar `mongodb` directo (redundante con mongoose). **S**
- `Notificacion` write-only: decidir — exponer un endpoint de lectura para el feature in-app, o dejar de crear esos docs. **S/M**
- Borrar campos de schema muertos en `server/models/Vencimiento.js`: `impuestoId` (ref a modelo inexistente), `recordatorioEnviado`, `notificarSms`, `notaUsuario`. **S**
- `server/middleware/errorHandler.js:22` loguear `err.stack`, no solo `err.message`. **S**
- **Default de puerto** — el backend default `5000` choca con Control Center de macOS (AirPlay). Cambiar el default a `5001`
  en `server/config/env.js:9` y alinear `server/.env.example` + el proxy de Vite. **S**
- **`db.js` ignora el dbName en memoria** — `server/config/db.js:24`: `mongoose.connect(mongod.getUri())` no incluye el
  `dbName`, así que el fallback usa la base `test`. Pasar `mongod.getUri('monotributo_saas')` o setear `dbName` en connect. **S**

**Frontend**
- Borrar `src/components/ui/FormField.tsx` + su CSS (muerto) **o** adoptarlo en `UserProfilePage`. **S**
- Consolidar tsconfig: `tsconfig.app.json` (sin `strict`) está huérfano; eliminar o referenciarlo desde `tsconfig.json`; quitar el `src/tsconfig.node.json` duplicado. **S**
- Ternario no-op `currentYear : currentYear` en `src/pages/ProfileCompletedPage.tsx:89`. **S**
- Reemplazar `MESES` por `MONTH_NAMES` (`src/utils/fecha.ts`) en `ProfileCompletedPage.tsx`. **S**
- Sacar el email personal hardcodeado de `src/components/AppFooter.tsx` (usar el de soporte real o una env). **S**

**Verificación:** `npm run build` y `cd server && npm test` verdes; backend arranca en 5001 sin tocar AirPlay; grep sin los campos/archivos borrados.

---

## Notas de ejecución

- **Orden sugerido:** 1 → 2 → 3 primero (seguridad + lo que rompe la experiencia), después 4 → 5 → 6, y 7 en paralelo/oportunista
  (idealmente tocando cada limpieza cuando ya estás en ese archivo por otro motivo).
- **Cada PR cierra con tests en verde.** Los PR 1, 2 y 4 deberían sumar tests nuevos en el mismo PR; el PR 5 completa el resto.
- **Dependencias nuevas:** solo `helmet` y `express-rate-limit` (PR 1). El resto se resuelve con lo ya instalado.
- **No reintroducir** las determinaciones deliberadas (sin react-router, auth por hook, tokens en CSS) — ver `CLAUDE.md`.
  La bottom-nav del PR 3 NO necesita router: reusa los callbacks de vista que ya existen.
