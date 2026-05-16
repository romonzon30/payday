import { useState } from "react";
import GoogleIcon from "./GoogleIcon";
import ShieldIcon from "./ShieldIcon";
import WalletIcon from "./WalletIcon";
import styles from "./LoginCard.module.css";

const API_URL = "https://payday-w8er.onrender.com";

export default function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function register() {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    alert(data);
  }

  async function login() {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      alert("Login correcto");
    } else {
      alert(data);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        <WalletIcon />
      </div>

      <h1 className={styles.heading}>Simplifica tus impuestos</h1>

      <p className={styles.subtitle}>
        Accede a tu cuenta de PayDay de forma segura y gestiona tus obligaciones
        fiscales en segundos.
      </p>

      <input
        className={styles.input}
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className={styles.input}
        type="password"
        placeholder="Contraseña"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className={styles.googleBtn} onClick={login} type="button">
        Iniciar sesión
      </button>

      <button className={styles.googleBtn} onClick={register} type="button">
        Registrarse
      </button>

      <div className={styles.divider} role="separator" />

      <div className={styles.securityBadge}>
        <ShieldIcon />
        <span>CONEXIÓN SEGURA DE NIVEL BANCARIO</span>
      </div>
    </div>
  );
}
