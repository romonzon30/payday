# PayDay - Documentación de Tests

## Resumen

| Área | Framework | Tests | Estado |
|------|-----------|-------|--------|
| Frontend (componentes, páginas, App) | Vitest + React Testing Library | 121 | ✅ Pass |
| Backend (modelos, rutas, middleware) | Jest + Supertest | 62 | ✅ Pass |
| **Total** | | **183** | **✅ All pass** |

---

## Configuración

### Frontend
- **Framework**: [Vitest](https://vitest.dev/) con jsdom
- **Librerías**: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- **Config**: `vite.config.ts` → sección `test`
- **Setup**: `src/test/setup.ts` (importa jest-dom matchers y configura env vars)
- **Mocks comunes**: `src/test/mocks.ts` (objetos User completo e incompleto)

### Backend
- **Framework**: [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest)
- **BD en tests**: `mongodb-memory-server` (instancia in-memory por cada archivo de test)
- **Config**: `server/package.json` → sección `jest`

### Comandos

```bash
# Frontend tests
npm test              # Ejecutar todos los tests
npm run test:watch    # Modo watch
npm run test:coverage # Con coverage

# Backend tests
cd server
npm test              # Ejecutar todos los tests
npm run test:watch    # Modo watch
```

---

## Tests Frontend

### Componentes (`src/components/__tests__/`)

#### `AppFooter.test.tsx` (7 tests)
| Test | Descripción |
|------|-------------|
| renders the brand name | Verifica que se muestra "PAYDAY" |
| renders the tagline | Verifica el texto de descripción |
| renders social links with aria-labels | Links de Twitter, Instagram, LinkedIn y Email accesibles |
| renders Empresa links section | Sección con links corporativos |
| renders Contacto links section | Sección de contacto con Soporte, FAQ, etc. |
| renders compliance badges | Badges de SSL, GDPR y Encriptación |
| renders copyright with current year | Copyright dinámico con año actual |

#### `Footer.test.tsx` (5 tests)
| Test | Descripción |
|------|-------------|
| renders the brand name | Muestra "PayDay" |
| renders copyright with current year | Copyright con año actual |
| renders navigation links | Links de Privacy, Terms, Security, Accessibility |
| has correct hrefs on links | Verifica URLs de cada link |
| has footer navigation with aria-label | Navegación accesible |

#### `GoogleIcon.test.tsx` (4 tests)
| Test | Descripción |
|------|-------------|
| renders an SVG element | SVG presente en el DOM |
| has aria-hidden attribute | Ícono decorativo marcado como aria-hidden |
| has correct dimensions | 18x18 píxeles |
| contains Google brand color paths | 4 paths con colores oficiales de Google |

#### `ShieldIcon.test.tsx` (3 tests)
| Test | Descripción |
|------|-------------|
| renders an SVG element | SVG presente |
| has aria-hidden attribute | Decorativo |
| has correct dimensions | 14x14 píxeles |

#### `WalletIcon.test.tsx` (4 tests)
| Test | Descripción |
|------|-------------|
| renders a container div | Contenedor DIV presente |
| has aria-hidden attribute | Decorativo |
| contains an SVG element | SVG dentro del contenedor |
| has correct SVG dimensions | 30x30 píxeles |

#### `Navbar.test.tsx` (5 tests)
| Test | Descripción |
|------|-------------|
| renders the brand name | Muestra "PayDay" |
| does not show menu when not logged in | Menú oculto sin sesión |
| shows menu button when logged in | Botón de menú visible con sesión |
| toggles dropdown on menu button click | Abre/cierra dropdown correctamente |
| calls logout on "Cerrar sesión" click | Limpia token y recarga página |

#### `LoginCard.test.tsx` (5 tests)
| Test | Descripción |
|------|-------------|
| renders the heading and subtitle | Título "Bienvenido" y subtítulo |
| renders Google login button | Botón de Google presente |
| calls onLoginSuccess after successful Google login | Login exitoso con Google pasa token y user |
| shows alert on API error | Alerta en error de API |
| shows alert on network error | Alerta "Error de conexión" en fallo de red |

#### `RegisterCard.test.tsx` (10 tests)
| Test | Descripción |
|------|-------------|
| renders the heading and subtitle | Título "Crea tu cuenta" |
| renders progress indicator | Indicador "Paso 1 de 2" |
| renders form fields with correct labels | Labels de Nombre, DNI, Email |
| pre-fills nombre and email from user prop | Datos pre-cargados desde props |
| disables email when hasGoogleData is true | Email disabled con datos de Google |
| enables email when hasGoogleData is false | Email editable sin datos de Google |
| shows error when submitting without required fields | Validación de campos vacíos |
| calls API on valid submit with hasGoogleData | Llamada POST a /api/auth/register |
| shows error message on API failure | Muestra mensaje de error del servidor |
| updates input values on change | Inputs controlados actualizan estado |

### Páginas (`src/pages/__tests__/`)

#### `LoginPage.test.tsx` (5 tests)
| Test | Descripción |
|------|-------------|
| renders the brand name | "PAYDAY" visible |
| renders the tagline | Tagline de claridad financiera |
| renders the value proposition | Propuesta de valor |
| renders the AFIP badge | Badge "AFIP Monotributo Simplificado" |
| renders the LoginCard component | Componente LoginCard presente |

#### `DashboardPage.test.tsx` (16 tests)
| Test | Descripción |
|------|-------------|
| renders greeting with user first name | Saludo "Hola, Juan" capitalizado |
| renders welcome subtitle | "Bienvenido a tu panel de control" |
| renders brand name in sidebar | "PAYDAY" en sidebar |
| renders navigation items | Inicio, Calendario, Configuración, Salir |
| calls onGoToCalendar when Calendario is clicked | Navegación a calendario |
| calls onGoToProfile when Configuración is clicked | Navegación a perfil |
| calls onLogout when Salir is clicked | Cierre de sesión |
| shows "Completá tu perfil" banner when incomplete | Banner para perfil incompleto |
| does not show banner when profile is complete | Sin banner para perfil completo |
| shows category and CUIL cards | Cards de info monotributo |
| renders user avatar when avatarUrl is present | Avatar renderizado |
| renders avatar fallback when no avatarUrl | Inicial del nombre como fallback |
| renders the marketing hero section | Sección de marketing |
| renders hero stats | Estadísticas 4.6M, ~45%, 5.91% |
| renders about section | Sección "¿Qué es PayDay?" con features |
| renders AppFooter | Footer presente |

#### `CalendarPage.test.tsx` (13 tests)
| Test | Descripción |
|------|-------------|
| renders the brand in sidebar | "PAYDAY" en sidebar |
| renders sidebar navigation | Items de navegación |
| calls onBack when Inicio is clicked | Navegación atrás |
| calls onGoToProfile when Configuración is clicked | Navegación a config |
| calls onLogout when Salir is clicked | Logout |
| renders month name and year in page title | Mes y año dinámicos |
| renders calendar day headers | Lun, Mar, Mié, etc. |
| renders today button | Botón "Hoy" |
| renders Vencimientos del Mes panel | Panel de vencimientos |
| fetches vencimientos on mount | Fetch a API al montar |
| renders vencimiento data after loading | Datos de vencimiento visibles |
| navigates to next month | Navegación de meses |
| renders user avatar or fallback | Avatar en topbar |

#### `UserProfilePage.test.tsx` (11 tests)
| Test | Descripción |
|------|-------------|
| renders page title | "Información personal" |
| renders user email as subtitle | Email del usuario |
| renders the PAYDAY brand | Brand en header |
| renders the Volver button | Botón de volver |
| calls onBack when Volver/Cancelar clicked | Navegación atrás |
| pre-fills form with user data | Datos pre-cargados |
| shows avatar when user has avatarUrl | Avatar renderizado |
| shows categoría monotributo | Categoría visible |
| shows validation error when name is empty | Validación frontend |
| submits profile update successfully | PUT exitoso |
| calls onProfileCompleted when adding CUIL | Flujo de completar perfil con CUIL |
| shows error on API/network failure | Manejo de errores |

#### `ProfileCompletedPage.test.tsx` (7 tests)
| Test | Descripción |
|------|-------------|
| renders the congratulations title | "¡Felicidades!" |
| renders the success subtitle | Mensaje de éxito |
| renders the Lottie animation | Animación de celebración |
| renders user data in monotributo card | Datos del usuario en card |
| renders monthly due dates grid | Grilla de 12 meses |
| calculates correct vencimiento day from CUIT | Cálculo día según penúltimo dígito |
| calls onGoToDashboard when button is clicked | Navegación al panel |

#### `RegisterPage.test.tsx` (5 tests)
| Test | Descripción |
|------|-------------|
| renders the brand name | "PAYDAY" |
| renders the brand description | "Simplificando tu gestión financiera." |
| renders the RegisterCard component | Card de registro presente |
| renders the login link | Link "¿Ya tienes una cuenta?" |
| calls onBackToLogin when login link is clicked | Navegación a login |

### App (`src/__tests__/`)

#### `App.test.tsx` (6 tests)
| Test | Descripción |
|------|-------------|
| renders LoginPage when no token is stored | Vista inicial sin sesión |
| fetches user data when token exists | Verificación de token guardado |
| shows dashboard for incomplete profile | Ruta correcta según perfil |
| shows calendar for complete profile | Ruta correcta con perfil completo |
| removes invalid token and shows login | Limpieza de token inválido |
| navigates to dashboard on login with incomplete profile | Flujo de login |

#### `designSystem.test.ts` (11 tests)
| Test | Descripción |
|------|-------------|
| Colors: primary, error, surface, all tokens | Constantes de colores definidas |
| Typography: fontFamily, all variants, mono | Tipografía completa |
| Roundness: all values | Border-radius sm a full |
| Spacing: base values | Espaciado rem correcto |
| Shadows: card, modal, btn | Sombras definidas |
| Transitions: fast and normal | Transiciones definidas |

---

## Tests Backend

### Modelos (`server/__tests__/models/`)

#### `User.test.js` (11 tests)
| Test | Descripción |
|------|-------------|
| should create a user with valid data | Creación exitosa |
| should require googleUid | Validación campo requerido |
| should require email | Validación campo requerido |
| should require emailNotificaciones | Validación campo requerido |
| should require nombreCompleto | Validación campo requerido |
| should enforce unique googleUid | Índice único |
| should enforce unique email | Índice único |
| should default perfilCompleto to false | Valor por defecto |
| should accept valid categoriaMonotributo values | Enum A-K válido |
| should reject invalid categoriaMonotributo | Enum inválido rechazado |
| should save optional fields correctly | Campos opcionales |
| should have timestamps | creadoEn y actualizadoEn |

#### `ConfiguracionAfip.test.js` (7 tests)
| Test | Descripción |
|------|-------------|
| should create a config with valid data | Creación con datos válidos |
| should require categoria | Campo requerido |
| should require montoMensual | Campo requerido |
| should require vigenciaDesde | Campo requerido |
| should enforce unique categoria | Índice único |
| should default moneda to ARS | Default ARS |
| should default vigenciaHasta to null | Default null |

#### `Vencimiento.test.js` (8 tests)
| Test | Descripción |
|------|-------------|
| should create a vencimiento with valid data | Creación exitosa |
| should require userId | Campo requerido |
| should require fechaVencimiento | Campo requerido |
| should default estado to pendiente | Default pendiente |
| should accept valid estado values | Enum válidos |
| should reject invalid estado | Enum inválido |
| should default monto to 0 | Default 0 |
| should default recordatorioEnviado to false | Default false |

#### `otherModels.test.js` (8 tests)
| Test | Descripción |
|------|-------------|
| Impuesto: create, require tipo, validate enum | Validaciones de impuesto |
| Notificacion: create, require fields, validate enum | Validaciones de notificación |
| Sesion: create, require refreshToken | Validaciones de sesión |
| DueDate: create, require userId | Validaciones de due date |

### Middleware (`server/__tests__/middleware/`)

#### `auth.test.js` (5 tests)
| Test | Descripción |
|------|-------------|
| should return 401 when no Authorization header | Sin header → 401 |
| should return 401 when not Bearer | Esquema incorrecto → 401 |
| should return 401 for invalid token | Token inválido → 401 |
| should return 401 when user not found | Usuario inexistente → 401 |
| should attach user to req and call next | Token válido → req.user + next() |

### Rutas (`server/__tests__/routes/`)

#### `user.test.js` (12 tests)
| Test | Descripción |
|------|-------------|
| GET /me: 401 without token | Autenticación requerida |
| GET /me: returns authenticated user | Datos del usuario autenticado |
| PUT /profile: 401 without token | Autenticación requerida |
| PUT /profile: update name and email | Actualización exitosa |
| PUT /profile: set perfilCompleto when CUIL added | CUIL → perfilCompleto=true + categoría |
| PUT /profile: duplicate CUIL handling | Manejo de CUIL duplicado |
| GET /vencimientos: 401 without token | Autenticación requerida |
| GET /vencimientos: empty for incomplete profile | [] si perfil incompleto |
| GET /vencimientos: returns data for complete profile | Vencimiento con monto correcto |
| GET /vencimientos: correct day from CUIL | Día de vencimiento según dígito |
| GET /vencimientos: 0 monto when config not found | Monto 0 sin config |
| GET /vencimientos: default year/month params | Parámetros por defecto |

#### `dueDates.test.js` (6 tests)
| Test | Descripción |
|------|-------------|
| GET /: 401 without token | Autenticación requerida |
| GET /: empty array when no due dates | Array vacío |
| GET /: returns user due dates | Due dates del usuario |
| GET /: not return other users due dates | Aislamiento por usuario |
| POST /: 401 without token | Autenticación requerida |
| POST /: creates a new due date | Creación exitosa |
| POST /: persists the created due date | Persistencia en BD |

---

## Estructura de archivos de tests

```
src/
  __tests__/
    App.test.tsx
    designSystem.test.ts
  test/
    setup.ts              # Setup global de Vitest
    mocks.ts              # Objetos mock reutilizables
  components/
    __tests__/
      AppFooter.test.tsx
      Footer.test.tsx
      GoogleIcon.test.tsx
      LoginCard.test.tsx
      Navbar.test.tsx
      RegisterCard.test.tsx
      ShieldIcon.test.tsx
      WalletIcon.test.tsx
  pages/
    __tests__/
      CalendarPage.test.tsx
      DashboardPage.test.tsx
      LoginPage.test.tsx
      ProfileCompletedPage.test.tsx
      RegisterPage.test.tsx
      UserProfilePage.test.tsx

server/
  __tests__/
    setup.js               # Setup global de Jest
    middleware/
      auth.test.js
    models/
      ConfiguracionAfip.test.js
      otherModels.test.js
      User.test.js
      Vencimiento.test.js
    routes/
      dueDates.test.js
      user.test.js
```
