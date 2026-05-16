import { GoogleLogin } from "@react-oauth/google";
import ShieldIcon from "./ShieldIcon";
import WalletIcon from "./WalletIcon";
import styles from "./LoginCard.module.css";

const API_URL = "https://payday-w8er.onrender.com";

export default function LoginCard() {
  async function handleGoogleLogin(credential: string) {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      alert("Login con Google correcto");
    } else {
      alert(data.message || "Error con Google");
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

      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            handleGoogleLogin(credentialResponse.credential);
          }
        }}
        onError={() => alert("Error al iniciar sesión con Google")}
      />

      <div className={styles.divider} role="separator" />

      <div className={styles.securityBadge}>
        <ShieldIcon />
        <span>CONEXIÓN SEGURA DE NIVEL BANCARIO</span>
      </div>
    </div>
  );
}