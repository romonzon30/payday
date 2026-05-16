import GoogleIcon from "./GoogleIcon";
import ShieldIcon from "./ShieldIcon";
import WalletIcon from "./WalletIcon";
import styles from "./LoginCard.module.css";

export default function LoginCard() {
  function loginWithGoogle() {
    alert("Google Login todavía no está conectado");
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

      <button
        className={styles.googleBtn}
        onClick={loginWithGoogle}
        type="button"
        aria-label="Iniciar sesión con Google"
      >
        <GoogleIcon />
        <span>Iniciar sesión con Google</span>
      </button>

      <div className={styles.divider} role="separator" />

      <div className={styles.securityBadge}>
        <ShieldIcon />
        <span>CONEXIÓN SEGURA DE NIVEL BANCARIO</span>
      </div>
    </div>
  );
}
