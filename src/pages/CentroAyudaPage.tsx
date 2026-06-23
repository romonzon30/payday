import { useState } from 'react'
import styles from './CentroAyudaPage.module.css'

interface CentroAyudaPageProps {
  onBack: () => void
}

const FAQS = [
  {
    q: '¿Qué es PayDay y para qué sirve?',
    a: 'PayDay es tu asistente digital para gestionar el monotributo sin estrés. Te ayuda a conocer tus fechas de vencimiento, calcular tus cuotas mensuales, recibir recordatorios antes de que venza cada impuesto y llevar un registro de tus pagos al día.',
  },
  {
    q: '¿Cómo agrego mis impuestos al calendario?',
    a: 'Completá tu perfil con tu CUIT y categoría de monotributo. Una vez hecho eso, accedé a la sección "Impuestos", seleccioná los que quieras seguir y hacé clic en "Agregar". Automáticamente aparecerán en tu calendario con la fecha de vencimiento correspondiente.',
  },
  {
    q: '¿Cómo funcionan los recordatorios?',
    a: 'PayDay te envía notificaciones por email 48 horas antes, 24 horas antes y el mismo día del vencimiento. Podés activar o desactivar las notificaciones por email desde la configuración de cada vencimiento en tu calendario.',
  },
  {
    q: '¿Puedo cambiar mi categoría de monotributo?',
    a: 'Sí. Desde tu perfil podés actualizar tu categoría en cualquier momento. Al hacerlo, PayDay recalcula automáticamente los montos de tus cuotas mensuales y ajusta tus vencimientos futuros.',
  },
  {
    q: '¿Qué pasa si un vencimiento ya pasó?',
    a: 'Los vencimientos pasados quedan registrados en tu historial con el estado "Vencido". Podés marcarlos como pagados manualmente desde el calendario. PayDay no modifica ni elimina registros históricos para que siempre tengas trazabilidad.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Toda la comunicación entre tu dispositivo y nuestros servidores va cifrada con SSL/TLS. No almacenamos contraseñas ni credenciales de AFIP — el acceso es únicamente con tu cuenta de Google. Tus datos nunca se comparten con terceros.',
  },
  {
    q: '¿PayDay tiene costo?',
    a: 'Actualmente estamos en fase beta abierta y el acceso es completamente gratuito. En el futuro podríamos lanzar un plan premium con funciones avanzadas, pero siempre habrá una versión gratuita disponible.',
  },
]

export default function CentroAyudaPage({ onBack }: CentroAyudaPageProps) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Volver
        </button>

        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h1 className={styles.title}>Centro de ayuda</h1>
          <p className={styles.subtitle}>
            Encontrá respuestas a las preguntas más frecuentes sobre PayDay.
          </p>
        </header>

        <section className={styles.faqSection}>
          <h2 className={styles.sectionTitle}>Preguntas frecuentes</h2>
          <div className={styles.faqList}>
            {FAQS.map((item, i) => (
              <div key={i} className={`${styles.faqItem} ${open === i ? styles.faqItemOpen : ''}`}>
                <button
                  className={styles.faqQuestion}
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                >
                  <span>{item.q}</span>
                  <svg
                    className={`${styles.faqChevron} ${open === i ? styles.faqChevronOpen : ''}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {open === i && (
                  <p className={styles.faqAnswer}>{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.contactSection}>
          <h2 className={styles.sectionTitle}>¿No encontraste lo que buscabas?</h2>
          <p className={styles.contactText}>
            Nuestro equipo está disponible para ayudarte. Escribinos por email o abrí un chat directo con soporte.
          </p>
          <div className={styles.contactActions}>
            <a href="mailto:support@payday.ai" className={styles.emailBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              support@payday.ai
            </a>
            <a
              href="https://wa.me/5491134333262"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappBtn}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              Chatear por WhatsApp
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
