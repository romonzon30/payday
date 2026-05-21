import { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoginPage from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import styles from "./App.module.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  return (
    <div className={styles.layout}>
      <Navbar />

      {isLoggedIn ? (
        <CalendarPage />
      ) : (
        <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />
      )}

      <Footer />
    </div>
  );
}