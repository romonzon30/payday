import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import Lottie from "lottie-react";
import type { User } from "../types";
import { api } from "../lib/apiClient";
import { GOOGLE_CLIENT_ID } from "../config/env";
import loadingAnimation from "../assets/loading.json";
import styles from "./LoginCard.module.css";

interface LoginCardProps {
  onLoginSuccess: (token: string, user: User) => void
}

export default function LoginCard({ onLoginSuccess }: LoginCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin(credential: string) {
    setLoading(true);
    setError("");

    try {
      const data = await api.post<{ token: string; user: User }>("/api/auth/google", { credential });
      onLoginSuccess(data.token, data.user);
    } catch (e: unknown) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Error con Google");
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
            onError={() => setError("Error al iniciar sesión con Google")}
          />
        ) : (
          <p className={styles.subtitle}>
            Google no esta configurado en este entorno. Define VITE_GOOGLE_CLIENT_ID
            (o GOOGLE_CLIENT_ID en build) para habilitar el acceso.
          </p>
        )}
        {error && (
          <p className={styles.subtitle} role="alert" style={{ color: "#dc2626" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
