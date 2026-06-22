import type { Vencimiento } from '../types'
import { formatMonto, statusLabel, vencimientoDateLabel } from '../utils/fecha'
import { useFocusTrap } from '../hooks/useFocusTrap'
// Reuses the calendar page's modal styles (single source of truth for these classes).
import styles from '../pages/CalendarPage.module.css'

interface VencimientoDetailModalProps {
  venc: Vencimiento
  onClose: () => void
  onToggleEstado: (v: Vencimiento) => void
  onDelete: (v: Vencimiento) => void
}

function statusClass(estado: string): string {
  if (estado === 'al_dia') return styles.statusAlDia
  if (estado === 'pendiente') return styles.statusPendiente
  return styles.statusVencido
}

export default function VencimientoDetailModal({ venc, onClose, onToggleEstado, onDelete }: VencimientoDetailModalProps) {
  const ref = useFocusTrap<HTMLDivElement>(onClose)
  const title = venc.tipo === 'custom' ? (venc.titulo || venc.descripcion) : venc.descripcion

  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div
        ref={ref}
        className={styles.detailModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vencDetailTitle"
        tabIndex={-1}
      >
        <button className={styles.detailCloseBtn} onClick={onClose} aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <p className={styles.detailType}>{venc.tipo === 'monotributo' ? 'Monotributo AFIP' : 'Vencimiento custom'}</p>
        <h3 id="vencDetailTitle" className={styles.detailTitle}>{title}</h3>
        <span className={`${styles.vencCardStatus} ${statusClass(venc.estado)}`} style={{ marginBottom: 16, display: 'inline-block' }}>
          {statusLabel(venc.estado)}
        </span>

        <div className={styles.detailMonto}>{formatMonto(venc.monto)}</div>
        <p className={styles.detailDate}>{vencimientoDateLabel(venc.fechaVencimiento, true)}</p>

        <div className={styles.detailActions}>
          {venc.estado === 'pendiente' && (
            <button className={styles.vencCardBtnBlue} onClick={() => onToggleEstado(venc)}>
              ✓ Marcar como pagado
            </button>
          )}
          {venc.estado === 'vencido' && (
            <button className={styles.vencCardBtnRed} onClick={() => onToggleEstado(venc)}>
              Regularizar
            </button>
          )}
          {venc.estado === 'al_dia' && (
            <button className={styles.vencCardBtnGhost} onClick={() => onToggleEstado(venc)}>
              Marcar como pendiente
            </button>
          )}
          {venc.tipo === 'custom' && (
            <button className={styles.detailDeleteBtn} onClick={() => onDelete(venc)}>
              Eliminar vencimiento
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
