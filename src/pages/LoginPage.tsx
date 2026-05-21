import LoginCard from "../components/LoginCard";
import styles from "./LoginPage.module.css";

type LoginPageProps = {
  onLoginSuccess: () => void;
};

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return (
    <main className={styles.page}>
      <LoginCard onLoginSuccess={onLoginSuccess} />
    </main>
  );
}