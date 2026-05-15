import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoginPage from './pages/LoginPage'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.layout}>
      <Navbar />
      <LoginPage />
      <Footer />
    </div>
  )
}
