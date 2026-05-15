import styles from './Footer.module.css'

interface FooterLink {
  label: string
  href: string
}

const footerLinks: FooterLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Security Disclosure', href: '/security' },
  { label: 'Accessibility', href: '/accessibility' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.left}>
        <span className={styles.brand}>PayDay</span>
        <span className={styles.copyright}>
          © {currentYear} PayDay Tax Compliance. All rights reserved.
        </span>
      </div>

      <nav className={styles.links} aria-label="Footer navigation">
        {footerLinks.map((link) => (
          <a key={link.href} href={link.href} className={styles.link}>
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  )
}
