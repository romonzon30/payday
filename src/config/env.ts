// Resolved frontend configuration.

// Base URL of the backend API (trailing slashes stripped). Replaces the
// constant that used to be copy-pasted across every fetch call site.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '')

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
