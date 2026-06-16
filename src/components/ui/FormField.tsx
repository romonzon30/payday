import type { ReactNode } from 'react'
import styles from './FormField.module.css'

interface FormFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  icon?: ReactNode
  type?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

// Labelled text input with an optional leading icon.
// Extracted from the duplicated field markup in RegisterCard / UserProfilePage.
export default function FormField({
  id,
  label,
  value,
  onChange,
  icon,
  type = 'text',
  placeholder,
  disabled,
  required,
}: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={styles.inputWrapper}>
        {icon && <span className={styles.inputIcon} aria-hidden="true">{icon}</span>}
        <input
          id={id}
          className={styles.input}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
        />
      </div>
    </div>
  )
}
