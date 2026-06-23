import styles from './SobreNosotrosPage.module.css'

interface SobreNosotrosPageProps {
  onBack: () => void
}

const TEAM = [
  { name: 'Ezequiel Mario Zinno', role: 'CEO & Arquitecto', initials: 'EZ' },
  { name: 'Agustín Monzón', role: 'CFO & Backend Lead', initials: 'AM' },
  { name: 'Juan Pablo Fernández Tarragona', role: 'CTO & Frontend Lead', initials: 'JF' },
]

const VALUES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      </svg>
    ),
    title: 'Transparencia',
    desc: 'Sin letra chica. Te mostramos exactamente qué hacemos con tus datos y cómo funciona cada cálculo.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Simplicidad',
    desc: 'El sistema impositivo argentino es complejo. Nosotros lo simplificamos para que puedas enfocarte en lo que realmente importa.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Accesibilidad',
    desc: 'Construimos para todos los monotributistas, sin importar su nivel técnico ni el tamaño de su negocio.',
  },
]

export default function SobreNosotrosPage({ onBack }: SobreNosotrosPageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Volver
        </button>

        <header className={styles.hero}>
          <span className={styles.badge}>Proyecto Universitario · Argentina · 2026</span>
          <h1 className={styles.heroTitle}>
            Simplificando el monotributo<br/>para millones de argentinos.
          </h1>
          <p className={styles.heroText}>
            PayDay nació en 2026 como proyecto universitario con una misión clara: eliminar el estrés fiscal de los trabajadores independientes de Argentina.
          </p>
        </header>

        <section className={styles.storySection}>
          <div className={styles.storyCard}>
            <h2 className={styles.storyTitle}>El problema que resolvemos</h2>
            <p className={styles.storyText}>
              Argentina tiene más de 4 millones de monotributistas. La gran mayoría gestiona sus obligaciones fiscales de forma manual — con hojas de cálculo, recordatorios de celular y muchas veces llegando tarde. Las multas, los recargos y la incertidumbre sobre qué pagar y cuándo son problemas cotidianos que afectan directamente el bolsillo y la tranquilidad de miles de emprendedores, freelancers y profesionales independientes.
            </p>
            <p className={styles.storyText}>
              PayDay automatiza ese proceso. Calculamos tus vencimientos según tu categoría y CUIT, te avisamos antes de que venzan y llevamos el historial por vos. Sin Excel, sin excusas.
            </p>
          </div>
        </section>

        <section className={styles.valuesSection}>
          <h2 className={styles.sectionTitle}>Nuestros valores</h2>
          <div className={styles.valuesGrid}>
            {VALUES.map((v) => (
              <div key={v.title} className={styles.valueCard}>
                <div className={styles.valueIcon}>{v.icon}</div>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueDesc}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.teamSection}>
          <h2 className={styles.sectionTitle}>El equipo</h2>
          <p className={styles.teamIntro}>
            Somos tres estudiantes universitarios apasionados por la tecnología y las finanzas, unidos por el objetivo de hacer más fácil la vida del monotributista argentino.
          </p>
          <div className={styles.teamGrid}>
            {TEAM.map((member) => (
              <div key={member.name} className={styles.memberCard}>
                <div className={styles.memberAvatar}>{member.initials}</div>
                <p className={styles.memberName}>{member.name}</p>
                <p className={styles.memberRole}>{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.closingSection}>
          <div className={styles.closingCard}>
            <h2 className={styles.closingTitle}>Recién empezamos</h2>
            <p className={styles.closingText}>
              Este es un proyecto universitario en constante evolución. Si sos monotributista y tenés ideas para mejorar la herramienta, nos encanta escucharte.
            </p>
            <a href="mailto:soporte@payday.ai" className={styles.closingBtn}>
              Escribinos a soporte@payday.ai
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
