import '@testing-library/jest-dom'

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:5000',
    VITE_GOOGLE_CLIENT_ID: 'test-client-id',
  },
})
