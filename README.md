# PayDay – Login UI

Interfaz de login para PayDay Tax Compliance. Construida con **React + TypeScript + Vite**.

## Estructura del proyecto

```
payday-app/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
└── src/
    ├── main.tsx          # Entry point
    ├── index.css         # Variables globales + reset
    ├── App.tsx           # Layout raíz (Navbar + Page + Footer)
    ├── App.module.css
    ├── components/
    │   ├── Navbar.tsx        # Barra de navegación superior
    │   ├── Navbar.module.css
    │   ├── LoginCard.tsx     # Tarjeta de login principal
    │   ├── LoginCard.module.css
    │   ├── Footer.tsx        # Pie de página con links
    │   ├── Footer.module.css
    │   ├── GoogleIcon.tsx    # SVG del logo de Google
    │   ├── ShieldIcon.tsx    # SVG del ícono de seguridad
    │   └── WalletIcon.tsx    # SVG del ícono de la app
    └── pages/
        ├── LoginPage.tsx     # Página que contiene LoginCard
        └── LoginPage.module.css
```

## Inicio rápido

```bash
npm install
npm run dev
```

La app estará disponible en `https://payday-w8er.onrender.com`.

## Scripts disponibles

| Comando           | Descripción                             |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con HMR          |
| `npm run build`   | Build de producción (TypeScript + Vite) |
| `npm run preview` | Preview del build de producción         |

## Integrar Google OAuth

En `src/pages/LoginPage.tsx`, reemplazá el `alert()` del handler con tu URL de OAuth real:

```ts
const handleGoogleSignIn = () => {
  window.location.href = "/auth/google";
};
```

## Tecnologías

- **React 18** – UI declarativa
- **TypeScript 5** – tipado estático
- **Vite 4** – bundler ultrarrápido
- **CSS Modules** – estilos con scope local
- **DM Sans** – tipografía (Google Fonts)
