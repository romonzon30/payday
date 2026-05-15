import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <a href="/" className={styles.logo}>
        PayDay
      </a>
      <nav>
        <a href="/help" className={styles.helpLink}>
          Help
        </a>
      </nav>
    </header>
  )
}
