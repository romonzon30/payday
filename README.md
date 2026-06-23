# 💸 PayDay

> Tu asistente inteligente para gestionar el monotributo sin estrés.

**PayDay** es una aplicación de cumplimiento fiscal (tax-compliance) pensada para los **monotributistas argentinos**. Calcula automáticamente los vencimientos de AFIP según tu categoría y CUIT, los muestra en un calendario, y te avisa por email y dentro de la app antes de que venzan. Sin Excel, sin recargos por olvido, sin excusas.

---

## ✨ Características

- **🔐 Login con Google** — autenticación OAuth, sin contraseñas que recordar.
- **🧾 Cálculo automático de vencimientos** — el motor aplica las reglas de AFIP 2026 a partir del CUIT y la categoría del usuario.
- **📅 Calendario de vencimientos** — visualizá todos tus pagos del año, con estado al día / pendiente / vencido.
- **💰 Monotributo mensual** — cálculo del monto final con descuento por inicio de actividad y recargo de obra social por persona a cargo.
- **🔔 Recordatorios** — notificaciones por email a 48h, 24h y el día del vencimiento, más avisos in-app.
- **📆 Días hábiles y feriados** — la fecha de pago se corre al próximo día hábil, salteando fines de semana y feriados nacionales.

---

## 🏗️ Arquitectura

Monorepo con dos aplicaciones independientes:

| Capa | Stack | Ubicación |
| --- | --- | --- |
| **Frontend** | React 18 · TypeScript · Vite · CSS Modules (SPA sin router) | `/src` |
| **Backend** | Express 5 · Mongoose · MongoDB (CommonJS, paquete npm propio) | `/server` |
| **Base de datos** | MongoDB — base `monotributo_saas` | MongoDB Atlas |

El backend está organizado en capas con responsabilidades claras:

```
config/      acceso a env + conexión DB + seed AFIP
data/        tablas estáticas (categorías, calendario fiscal 2026, feriados)
domain/      lógica pura, sin Express ni Mongoose (testeada unitariamente)
services/    lógica de negocio + acceso a datos
controllers/ adaptan HTTP (req/res)
routes/      mapean paths a controllers
middleware/  auth (JWT), manejo de errores
```

> Regla de oro: **routes wire, controllers adapt HTTP, services hold business logic + DB, `domain/` is pure, `data/` is static config, `config/` is wiring.**

---

## 🚀 Inicio rápido

Requisitos: **Node 24** (gestionado con nvm).

### Frontend (desde la raíz)

```bash
npm install
npm run dev          # servidor Vite con HMR
```

### Backend (desde /server)

```bash
cd server
npm install
npm run dev          # nodemon index.js
```

> Sin `MONGO_URI` el backend levanta una MongoDB en memoria, y sin credenciales SMTP el scheduler de recordatorios queda deshabilitado. Así el entorno local funciona **sin servicios externos**.

> ⚠️ **Atención a los puertos.** El backend escucha en `PORT` (default `5000`) y el frontend apunta a `VITE_API_URL`. Asegurate de que `VITE_API_URL` coincida con el backend que estés corriendo.

---

## 📜 Scripts

### Frontend

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Type-check (tsc) + build de producción (Vite) |
| `npm run preview` | Preview del build de producción |
| `npm test` | Tests con Vitest |
| `npm run test:coverage` | Cobertura de tests |
| `npx eslint .` | Lint |

### Backend (desde `/server`)

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor con recarga (nodemon) |
| `npm start` | Servidor de producción |
| `npm test` | Tests con Jest + mongodb-memory-server |

---

## 🧪 Tests

Ambas suites corren **sin servicios externos**.

- **Frontend** — Vitest + Testing Library (`src/**/*.test.ts`).
- **Backend** — Jest con `mongodb-memory-server`: tests unitarios de las funciones puras de `domain/` + tests de integración con supertest sobre la app real.

---

## ⚙️ Variables de entorno

### Frontend (`.env` en la raíz)

| Variable | Descripción |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `VITE_API_URL` | URL del backend |

### Backend (`server/.env`)

| Variable | Descripción |
| --- | --- |
| `MONGO_URI` | Conexión a MongoDB Atlas (sin ella → Mongo en memoria) |
| `JWT_SECRET` | Secreto para firmar los tokens |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `CORS_ORIGIN` | Allowlist de orígenes (separados por coma; vacío = todos) |
| `PORT` | Puerto del backend (default `5000`) |
| `SMTP_*` | Configuración de email (nodemailer) |

---

## ☁️ Deployment

| Componente | Plataforma |
| --- | --- |
| **Frontend** | Vercel (build de Vite) |
| **Backend** | Render (`npm start` → `node index.js`) |
| **Base de datos** | MongoDB Atlas |
| **Email** | SMTP vía nodemailer |

---

## 👥 Equipo

PayDay nació en **2026** como **proyecto universitario**, construido por tres estudiantes apasionados por la tecnología y las finanzas:

| Integrante | Rol |
| --- | --- |
| **Ezequiel Mario Zinno** | CEO & Arquitecto |
| **Agustín Monzón** | CFO & Backend Lead |
| **Juan Pablo Fernández Tarragona** | CTO & Frontend Lead |

---

## 🛠️ Tecnologías

**Frontend:** React 18 · TypeScript 5 · Vite · CSS Modules · @react-oauth/google · lottie-react
**Backend:** Express 5 · Mongoose · MongoDB · jsonwebtoken · google-auth-library · node-cron · nodemailer · helmet · express-rate-limit
**Testing:** Vitest · Testing Library · Jest · supertest · mongodb-memory-server

---

<p align="center">Hecho con 💙 para los monotributistas argentinos.</p>
