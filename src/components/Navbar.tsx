import { useState } from "react";
import styles from "./Navbar.module.css";

type NavbarProps = {
  isLoggedIn: boolean;
};

export default function Navbar({ isLoggedIn }: NavbarProps) {
  const [open, setOpen] = useState(false);

  function logout() {
    localStorage.removeItem("token");
    window.location.reload();
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.logo}>PayDay</div>

      {isLoggedIn && (
        <div className={styles.menuWrapper}>
          <button className={styles.menuButton} onClick={() => setOpen(!open)}>
            ☰ Menú
          </button>

          {open && (
            <div className={styles.dropdown}>
              <button>Configuración</button>
              <button>Datos personales</button>
              <button>Notificaciones</button>
              <button onClick={logout}>Cerrar sesión</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}