import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import Lottie from "lottie-react";
import type { User } from "../types";
import loadingAnimation from "../assets/loading.json";
import styles from "./LoginCard.module.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface LoginCardProps {
  onLoginSuccess: (token: string, user: User) => void
}

export default function LoginCard({ onLoginSuccess }: LoginCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin(credential: string) {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data.token, data.user);
      } else {
        setLoading(false);
        alert(data.message || "Error con Google");
      }
    } catch {
      setLoading(false);
      alert("Error de conexión");
    }
  }

  return (
    <div className={styles.container}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <Lottie animationData={loadingAnimation} loop className={styles.lottie} />
          </div>
        </div>
      )}

      <div className={styles.header}>
        <h2 className={styles.heading}>Bienvenido</h2>
        <p className={styles.subtitle}>
          Ingresa tus credenciales para acceder a tu panel de control.
        </p>
      </div>

      <div className={styles.formSection}>
        {GOOGLE_CLIENT_ID ? (
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                handleGoogleLogin(credentialResponse.credential);
              }
            }}
            onError={() => alert("Error al iniciar sesión con Google")}
          />
        ) : (
          <p className={styles.subtitle}>
            Google no esta configurado en este entorno. Define VITE_GOOGLE_CLIENT_ID
            (o GOOGLE_CLIENT_ID en build) para habilitar el acceso.
          </p>
        )}
      </div>
    </div>
  );
}
