'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface UsuarioAsistencia {
  Numero_documento: string
  Nombre: string
  Apellido: string
  Asistencia: boolean
}

interface PersonasResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: UsuarioAsistencia[]
}

export default function FormularioReunionPage() {
  const searchParams = useSearchParams()
  const reunionId = searchParams.get('id')

  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [usuarios, setUsuarios] = useState<UsuarioAsistencia[]>([])
  const [token, setToken] = useState('')
  const [loadingToken, setLoadingToken] = useState(false)

  // === CARGAR DATOS DE LA REUNIÓN ===
  useEffect(() => {
    if (!reunionId) return

    const fetchReunion = async () => {
      try {
        const data = await apiFetch<{
          titulo: string
          fecha: string
          horaInicio: string
          horaFinal: string
          codigoAsistencia?: string
        }>(`/reunion/reunion/${reunionId}`)

        setTitulo(data.titulo)
        setFecha(data.fecha)
        setHoraInicio(data.horaInicio)
        setHoraFin(data.horaFinal)

        if (data.codigoAsistencia) {
          setToken(data.codigoAsistencia)
          localStorage.setItem(`token_${reunionId}`, data.codigoAsistencia)
        } else {
          const saved = localStorage.getItem(`token_${reunionId}`)
          if (saved) setToken(saved)
        }
      } catch (err) {
        console.error('Error cargando reunión', err)
      }
    }

    const fetchAsistentes = async () => {
      try {
        const data = await apiFetch<PersonasResponse>(
          `/asistencia/asistencia/${reunionId}/personas?page=1&page_size=100`
        )
        setUsuarios(data.items)
      } catch (err) {
        console.error('Error cargando asistentes', err)
      }
    }

    fetchReunion()
    fetchAsistentes()
    const interval = setInterval(fetchAsistentes, 5000)
    return () => clearInterval(interval)
  }, [reunionId])

  const descargarReporte = async () => {
    if (!reunionId) return
    try {
      const blob = await apiFetch<Blob>(
        `/reportes/reporte/asistencia/${reunionId}`,
        { responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_asistencia_${reunionId}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando reporte', err)
      alert('No se pudo descargar el reporte')
    }
  }

  // === TOKEN desde API ===
  const generarToken = async () => {
    if (!reunionId) return
    setLoadingToken(true)
    try {
      const res = await apiFetch<{
        estado: string
        message: string
        data: { codigo: string }
      }>(`/reunion/reunion/${reunionId}/generate-asistencia-code`, {
        method: 'PATCH',
      })

      if (res.estado === 'Exitoso') {
        setToken(res.data.codigo)
        localStorage.setItem(`token_${reunionId}`, res.data.codigo)
      } else {
        alert(res.message || 'No se pudo generar el código')
      }
    } catch (err) {
      console.error('Error generando token', err)
      alert('Error inesperado generando código')
    } finally {
      setLoadingToken(false)
    }
  }

  const desactivarToken = async () => {
    if (!reunionId) return
    try {
      const res = await apiFetch<{
        estado: string
        message: string
      }>(`/reunion/reunion/${reunionId}/delete-asistencia-code`, {
        method: 'PATCH',
      })

      if (res.estado === 'Exitoso') {
        setToken('')
        localStorage.removeItem(`token_${reunionId}`)
      } else {
        alert(res.message || 'No se pudo desactivar el código')
      }
    } catch (err) {
      console.error('Error desactivando token', err)
      alert('Error inesperado al desactivar el código')
    }
  }

  // === TOGGLE asistencia ===
  const toggleAsistencia = async (personaId: string, current: boolean) => {
    if (!reunionId) return
    try {
      if (current) {
        await apiFetch(`/asistencia/asistencia/${reunionId}/${personaId}`, {
          method: 'DELETE',
        })
      } else {
        await apiFetch(`/asistencia/asistencia/assign/${reunionId}`, {
          method: 'POST',
          body: JSON.stringify({ persona_id: personaId }),
        })
      }
      setUsuarios(prev =>
        prev.map(u =>
          u.Numero_documento === personaId
            ? { ...u, Asistencia: !current }
            : u
        )
      )
    } catch (err) {
      console.error('Error actualizando asistencia', err)
      alert('No se pudo actualizar la asistencia')
    }
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-[#333]">
        Editar reunión
      </h1>

      {/* Botón reporte */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={descargarReporte}
          className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
        >
          Descargar reporte de asistencia
        </button>
      </div>

      {/* Datos básicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Título</label>
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Hora inicio</label>
          <input
            type="time"
            value={horaInicio}
            onChange={e => setHoraInicio(e.target.value)}
            className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Hora fin</label>
          <input
            type="time"
            value={horaFin}
            onChange={e => setHoraFin(e.target.value)}
            className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
          />
        </div>
      </div>

      {/* TOKEN */}
      <div className="flex justify-center mb-6">
        {token ? (
          <div className="flex flex-col items-center gap-2">
            <div className="border-2 border-[#7d4f2b] px-8 py-4 text-2xl font-bold text-[#333] rounded">
              {token}
            </div>
            <button
              onClick={desactivarToken}
              className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
            >
              Desactivar token
            </button>
          </div>
        ) : (
          <button
            onClick={generarToken}
            disabled={loadingToken}
            className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f] disabled:opacity-50"
          >
            {loadingToken ? 'Generando...' : 'Generar token'}
          </button>
        )}
      </div>

      {/* Lista usuarios */}
      <h2 className="text-xl font-semibold mb-3 text-[#333]">Usuarios</h2>
      <div className="overflow-x-auto border rounded mb-6">
        <table className="min-w-full">
          <thead className="bg-[#7d4f2b] text-white">
            <tr>
              <th className="px-4 py-2 text-left">Documento</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Apellido</th>
              <th className="px-4 py-2 text-center">Asistencia</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => (
              <tr
                key={u.Numero_documento}
                className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                <td className="px-4 py-2">{u.Numero_documento}</td>
                <td className="px-4 py-2">{u.Nombre}</td>
                <td className="px-4 py-2">{u.Apellido}</td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={u.Asistencia}
                    onChange={() =>
                      toggleAsistencia(u.Numero_documento, u.Asistencia)
                    }
                    className="w-4 h-4 accent-[#7d4f2b] cursor-pointer"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
