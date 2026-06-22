# Mejoras — PayDay

> Roadmap accionable priorizado por impacto. Cada hallazgo: **severidad · `archivo:línea` · problema · fix · esfuerzo (S/M/L)**.
> Severidad: 🔴 alta · 🟠 media · 🟡 baja. Esfuerzo: **S** (<1h) · **M** (unas horas) · **L** (un día o más).
> Hallazgos sobre código real (no sobre `dbSchema.json`, que está desactualizado).

## Resumen ejecutivo

| Bloque | Qué resuelve | Items |
|--------|--------------|-------|
| **P0 — Crítico** | Seguridad y corrección: el sistema puede mentirle al usuario o ser vulnerable | 7 |
| **P1 — Importante** | PII, rendimiento, UX y cobertura de tests | 9 |
| **P2 — Limpieza** | Código muerto, deuda técnica, consistencia | 10 |

**Lo más urgente:** el JWT no expira nunca, el scheduler puede mandar emails duplicados, un CUIT mal cargado genera
un calendario fiscal **confiable pero equivocado**, y en el front un fallo de red se muestra como "estás al día" —
el usuario cree que no debe nada cuando en realidad la app falló.

---

## P0 — Crítico (seguridad / corrección)

### Backend

#### 🔴 JWT sin expiración
- **Dónde:** `server/services/authService.js:12` — `jwt.sign({ id: user._id }, env.jwtSecret)` sin `expiresIn`.
- **Problema:** los tokens valen para siempre y no hay revocación. Un token filtrado nunca caduca.
- **Fix:** firmar con `{ expiresIn: '7d' }` (o el plazo que se defina). El front ya hace logout en 401, así que
  un token expirado expulsa al usuario al login automáticamente.
- **Esfuerzo:** S

#### 🔴 `validateEnv` no aborta el boot
- **Dónde:** `server/index.js:11` + `server/config/env.js:33` (`throwOnMissing=false` por default).
- **Problema:** si falta `JWT_SECRET` el server **igual arranca** con secreto vacío, y con `""` como secreto los
  tokens son triviales de forjar.
- **Fix:** en arranque de producción usar `validateEnv({ throwOnMissing: true })` para fallar rápido y ruidoso.
- **Esfuerzo:** S

#### 🔴 Sin `helmet` ni rate limiting
- **Dónde:** `server/app.js` — solo monta `cors` + `express.json`.
- **Problema:** los endpoints `/api/auth/*` (públicos) no tienen throttle → exposición a fuerza bruta / abuso. Sin
  headers de seguridad.
- **Fix:** agregar `helmet` global y `express-rate-limit` sobre las rutas de auth. Considerar también un límite de
  tamaño de body en `express.json({ limit: '...' })`.
- **Esfuerzo:** S/M

#### 🔴 Race en el scheduler → emails duplicados
- **Dónde:** `server/services/notificationScheduler.js`.
- **Problema:** lee con `.find().lean()` y después hace `updateOne` de los flags `notif*Enviada`. Corre por cron
  **y** al boot, sin lock. Dos corridas solapadas (proceso reiniciado dentro de la hora, o corrida que dura >1h)
  leen ambas `notif48hEnviada:false` y mandan el mismo email dos veces.
- **Fix:** claim atómico con `findOneAndUpdate` (marcar el flag **antes** de enviar) o un guard de corrida única.
- **Esfuerzo:** M

#### 🔴 CUIT inválido → calendario fiscal incorrecto silencioso
- **Dónde:** `server/domain/taxCalendar.js:7` (`parseCuitLastDigit` devuelve `0` ante basura) +
  `server/services/userService.js:22` (no valida formato de CUIT).
- **Problema:** un CUIT mal cargado no falla: produce un calendario del grupo de dígito 0, **confiable pero
  equivocado**. El usuario recibe vencimientos con fechas erróneas sin ningún aviso.
- **Fix:** validar formato y dígito verificador del CUIT al guardar el perfil y al usarlo; rechazar con `HttpError`
  en vez de devolver 0.
- **Esfuerzo:** M

### Frontend

#### 🔴 Errores de fetch silenciados
- **Dónde:** `src/hooks/useVencimientos.ts:18,43,56` — bloques `catch` vacíos.
- **Problema:** un fallo de red muestra "Sin vencimientos" / "Estás al día". El usuario interpreta que no debe nada
  cuando en realidad la request falló. Es el bug de UX más peligroso del front.
- **Fix:** exponer estado de error desde el hook y renderizar un mensaje de fallo (distinto del estado vacío real).
- **Esfuerzo:** M

#### 🔴 Bug de estado `'pagado'`
- **Dónde:** `src/hooks/useVencimientos.ts:29-48`.
- **Problema:** `toggleEstado` usa `'pagado'`, que **no existe** en `EstadoVencimiento` (`src/types/index.ts:18` =
  `'al_dia' | 'pendiente' | 'vencido'`). Solo "funciona" porque el body del PATCH es `unknown` y hace `refetch()`
  inmediato. Frágil y type-unsafe.
- **Fix:** alinear el valor con el enum real y tipar el body del PATCH para que el compilador atrape el error.
- **Esfuerzo:** S

---

## P1 — Importante (PII, rendimiento, UX, cobertura)

### Backend

#### 🟠 Se expone el documento Mongoose completo (PII)
- **Dónde:** `server/controllers/userController.js:6` (`me`), `:11` (`updateProfile`), y los retornos de
  `authService`.
- **Problema:** se devuelve `req.user` entero — DNI, CUIT, `googleUid`, email — en cada llamada. Para una app que
  maneja PII argentina (DNI/CUIT) esto debería ser una proyección.
- **Fix:** serializar con un DTO / `.select()` que devuelva solo los campos necesarios al cliente.
- **Esfuerzo:** M

#### 🟠 Faltan índices para las queries reales
- **Dónde:** `server/models/Vencimiento.js` — solo índices de campo único en `userId` y `fechaVencimiento`.
- **Problema:** la query real en todos lados es `{ userId, tipo, fechaVencimiento }` (sin índice compuesto), y el
  scheduler filtra por `estado / notif*Enviada / notificarEmail / fechaVencimiento` **sin índice** → scans
  completos de colección cada hora.
- **Fix:** índice compuesto `{ userId, tipo, fechaVencimiento }` + un índice para el patrón del scheduler.
- **Esfuerzo:** S

#### 🟠 `loginWithGoogleAccess` sin timeout ni verificación de audience
- **Dónde:** `server/services/authService.js:51` — `fetch` a userinfo.
- **Problema:** un Google colgado cuelga el request de Express indefinidamente; además no verifica el `audience`
  del token (a diferencia del flujo de ID token).
- **Fix:** `AbortController` con timeout en el `fetch` y validación del audience.
- **Esfuerzo:** S/M

#### 🟠 Cobertura cero en lo más riesgoso
- **Dónde:** `server/services/authService.js`, `notificationScheduler.js`, `emailService.js` — sin tests.
- **Problema:** el código de seguridad (auth) y el scheduler recién modificado (ventanas 48h/24h/hoy +
  idempotencia) no tienen ninguna prueba. Es la parte que más duele si se rompe.
- **Fix:** tests de los flujos de auth mockeando `OAuth2Client` y `fetch`; tests de las ventanas de notificación y
  de los guards de idempotencia.
- **Esfuerzo:** M/L

#### 🟠 `month` / `year` sin validar
- **Dónde:** `server/services/impuestoService.js` (`agregar`) y `server/controllers/impuestoController.js`
  (`preview`).
- **Problema:** `month`/`year` llegan crudos del request; un valor enorme o negativo entra en `Date.UTC` y en el
  loop `for (m = month; m <= 11)`.
- **Fix:** validar rango (`year` razonable, `month` 0–11 / 1–12 según el endpoint) antes de usarlos.
- **Esfuerzo:** S

### Frontend

#### 🟠 Páginas sobredimensionadas / concerns mezclados
- **Dónde:** `src/pages/ImpuestosPage.tsx` (338 líneas, 11 `useState`, IIFE renderizando JSX) y
  `src/pages/CalendarPage.tsx` (307 líneas, modal de detalle inline).
- **Problema:** container y presentación entrelazados, difícil de testear y mantener.
- **Fix:** extraer componentes presentacionales (`ImpuestoCard`, `VencimientoDetailModal`) y mover el fetching a
  un hook dedicado.
- **Esfuerzo:** M

#### 🟠 Accesibilidad
- **Dónde:** `src/pages/CalendarPage.tsx` (interacción solo por doble-click sobre `<div>`), modales sin
  `role="dialog"` / `aria-modal` / focus trap, `AppSidebar` sin `aria-current`.
- **Problema:** el calendario no es navegable por teclado; los modales no atrapan el foco; el item activo del nav
  no se anuncia.
- **Fix:** roles ARIA, handlers de teclado (`onKeyDown` + `tabIndex`/`role="button"`), focus trap en modales,
  `aria-current` en el nav.
- **Esfuerzo:** M

#### 🟠 Validación de cliente floja
- **Dónde:** `src/pages/UserProfilePage.tsx` — no valida formato de CUIL/email (solo no-vacío).
- **Problema:** se puede enviar un CUIL malformado, que aguas abajo genera el calendario fiscal equivocado (ver P0).
- **Fix:** validación de formato de CUIL y email en el cliente, antes de enviar.
- **Esfuerzo:** S

#### 🟠 `alert()` para errores
- **Dónde:** `src/components/LoginCard.tsx`, `src/pages/ImpuestosPage.tsx`.
- **Problema:** `alert()` es brusco e inconsistente con los errores inline que usa el resto de la app.
- **Fix:** unificar en mensajes de error inline.
- **Esfuerzo:** S

---

## P2 — Limpieza (código muerto, deuda, consistencia)

### Backend

- 🟡 **`bcryptjs` declarado y sin usar** (auth es solo Google, no hay hashing de password) → eliminar la dependencia.
- 🟡 **`mongodb` como dependencia directa** redundante con `mongoose` (que trae su propio driver) → revisar si se puede quitar.
- 🟠 **`Notificacion` es write-only:** el scheduler las crea pero **ningún endpoint las lee**. O se expone el feature
  in-app, o se dejan de crear (la colección crece sin que nadie la consuma).
- 🟡 **Campos de schema muertos** en `server/models/Vencimiento.js`: `impuestoId` (ref a un modelo `Impuesto`
  inexistente), `recordatorioEnviado`, `notificarSms`, `notaUsuario`; `al_dia` nunca se persiste (es render-only).
- 🟡 **`errorHandler.js:22` loguea solo `err.message`**, no `err.stack` → debugear un 500 en prod es más difícil.
- 🟡 **`seedAfipCategorias` corre en cada boot** con `vigenciaDesde` hardcodeado y sin `vigenciaHasta` → sin ciclo de vida de vigencias.

### Frontend

- 🟠 **`src/components/ui/FormField.tsx` (+ su CSS) muerto:** nunca se importa; `UserProfilePage` reescribe a mano
  justo lo que ese componente resuelve. Adoptarlo o borrarlo.
- 🟠 **`tsconfig.app.json` huérfano** (sin `strict`), no referenciado por `tsconfig.json` (que solo referencia
  `tsconfig.node.json`); además hay un `src/tsconfig.node.json` duplicado. Consolidar para evitar que el IDE use el
  config equivocado.
- 🟡 **Ternario no-op** en `src/pages/ProfileCompletedPage.tsx:89` — `currentYear : currentYear` (ambas ramas
  iguales; probablemente se quería mostrar el año siguiente para meses pasados).
- 🟡 **Bloque "Estás al día" siempre visible** al pie de una lista no vacía (`src/pages/CalendarPage.tsx:233-241`) →
  mensaje contradictorio cuando hay vencimientos pendientes arriba.
- 🟡 **`MESES` duplica `MONTH_NAMES`** (`src/utils/fecha.ts`) en `ProfileCompletedPage.tsx` → reusar el de utils.
- 🟡 **Email personal hardcodeado** en `src/components/AppFooter.tsx` (`mailto:` con una dirección personal mientras
  el texto dice `support@payday.ai`).
- 🟡 **Proxy de Vite (3001) ≠ PORT del backend (5000)** → alinear o documentar (ya figura como caveat en `CLAUDE.md`).

---

## Orden sugerido de ejecución

1. **P0 backend de bajo esfuerzo primero:** JWT expiry, `throwOnMissing`, helmet + rate limit (todo S/M, alto impacto de seguridad).
2. **CUIT validation + bug `'pagado'` + errores de fetch silenciados:** la tríada que hace que la app le mienta al usuario.
3. **Race del scheduler:** requiere más cuidado (claim atómico), pero evita emails duplicados.
4. **P1:** DTO de PII, índices, tests de auth/scheduler.
5. **P2:** limpieza incremental, idealmente junto a cada cambio que toque esos archivos.
