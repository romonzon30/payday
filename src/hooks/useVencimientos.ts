import { useState, useEffect, useCallback } from 'react'
import type { Vencimiento } from '../types'
import { api } from '../lib/apiClient'

// Loads and mutates the vencimientos for a given month, with an optimistic
// estado toggle that rolls back on failure.
// The estado the API accepts on a PATCH (write contract). Distinct from the
// display EstadoVencimiento the API returns: the server stores 'pagado' and
// renders it back as 'al_dia'.
type EstadoUpdate = 'pagado' | 'pendiente'

export function useVencimientos(year: number, month: number) {
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ vencimientos: Vencimiento[] }>(
        `/api/user/vencimientos?year=${year}&month=${month + 1}`
      )
      setVencimientos(data.vencimientos)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    refetch()
  }, [refetch])

  const toggleEstado = useCallback(
    async (v: Vencimiento) => {
      const willPay = v.estado !== 'al_dia' // pendiente/vencido -> pagar; al_dia -> desmarcar
      const writeEstado: EstadoUpdate = willPay ? 'pagado' : 'pendiente'
      let prev: Vencimiento[] = []
      setVencimientos((list) => {
        prev = list
        return list.map((x) =>
          x._id === v._id ? { ...x, estado: willPay ? 'al_dia' : 'pendiente' } : x
        )
      })
      try {
        await api.patch(`/api/user/vencimientos/${v._id}`, { estado: writeEstado })
        // refetch so the server recomputes the real estado (pendiente vs vencido)
        refetch()
      } catch {
        setVencimientos(prev)
      }
    },
    [refetch]
  )

  const remove = useCallback(
    async (v: Vencimiento) => {
      try {
        await api.del(`/api/user/vencimientos/${v._id}`)
        refetch()
        return true
      } catch {
        return false
      }
    },
    [refetch]
  )

  return { vencimientos, loading, error, refetch, toggleEstado, remove }
}
