import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { api, ApiError, setOnUnauthorized } from './apiClient'

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  localStorage.clear()
  setOnUnauthorized(null)
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiClient', () => {
  test('prefixes API_URL and sends the auth header when a token exists', async () => {
    localStorage.setItem('token', 'abc')
    const fetchMock = mockFetch(200, { ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await api.get('/api/user/me')

    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/user/me')
    expect(opts.headers.Authorization).toBe('Bearer abc')
  })

  test('omits the auth header when there is no token', async () => {
    const fetchMock = mockFetch(200, {})
    vi.stubGlobal('fetch', fetchMock)

    await api.post('/api/auth/google', { credential: 'x' })

    const [, opts] = fetchMock.mock.calls[0]
    expect(opts.headers.Authorization).toBeUndefined()
    expect(opts.headers['Content-Type']).toBe('application/json')
  })

  test('on 401 clears the token and notifies the unauthorized handler', async () => {
    localStorage.setItem('token', 'abc')
    const onUnauth = vi.fn()
    setOnUnauthorized(onUnauth)
    vi.stubGlobal('fetch', mockFetch(401, { message: 'nope' }))

    await expect(api.get('/api/user/me')).rejects.toBeInstanceOf(ApiError)
    expect(localStorage.getItem('token')).toBeNull()
    expect(onUnauth).toHaveBeenCalled()
  })

  test('throws ApiError carrying the server message', async () => {
    vi.stubGlobal('fetch', mockFetch(400, { message: 'Monto inválido' }))
    await expect(api.post('/api/impuestos/agregar', {})).rejects.toMatchObject({
      status: 400,
      message: 'Monto inválido',
    })
  })
})
