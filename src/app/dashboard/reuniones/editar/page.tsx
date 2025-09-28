'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { HelpCircle } from 'lucide-react'

/* Tooltip reutilizable */
function Tooltip({
  text,
  color = '#7d4f2b',
  responsive = false,
}: {
  text: string
  color?: string
  responsive?: boolean
}) {
  return (
    <div className="relative group inline-block ml-1">
      <HelpCircle className="w-4 h-4 cursor-pointer" style={{ color }} />
      <div
        className={`absolute hidden group-hover:block top-[120%] left-1/2 -translate-x-1/2
                    bg-black text-white text-xs rounded px-3 py-2 shadow-md text-left whitespace-normal z-50
                    ${responsive ? 'max-w-[80vw] sm:max-w-xs break-words' : 'min-w-[200px] max-w-xs'}`}
      >
        {text}
      </div>
    </div>
  )
}

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
  const [ubicacion, setUbicacion] = useState('')
  const [editable, setEditable] = useState(true)

  const [usuarios, setUsuarios] = useState<UsuarioAsistencia[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroApellido, setFiltroApellido] = useState('')

  const [token, setToken] = useState('')
  const [loadingToken, setLoadingToken] = useState(false)

  // Modales
  const [modalExito, setModalExito] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)

  // === CARGAR DATOS DE LA REUNIÓN ===
  const fetchReunion = async () => {
    if (!reunionId) return
    try {
      const data = await apiFetch<{
        titulo: string
        fecha: string
        horaInicio: string
        horaFinal: string
        ubicacion: string
        editable: boolean
        codigoAsistencia?: string
      }>(`/reunion/reunion/${reunionId}`)

      setTitulo(data.titulo)
      setFecha(data.fecha)
      setHoraInicio(data.horaInicio)
      setHoraFin(data.horaFinal)
      setUbicacion(data.ubicacion)
      setEditable(data.editable)

      if (data.codigoAsistencia) {
        setToken(data.codigoAsistencia)
        localStorage.setItem(`token_${reunionId}`, data.codigoAsistencia)
      } else {
        const saved = localStorage.getItem(`token_${reunionId}`)
        if (saved) setToken(saved)
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setModalError('Error cargando la reunión.')
    }
  }

  useEffect(() => {
    fetchReunion()
  }, [reunionId])

  // === ACTUALIZAR REUNIÓN ===
  const actualizarReunion = async () => {
    if (!reunionId) return
    try {
      await apiFetch(`/reunion/reunion/${reunionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          titulo,
          fecha,
          horaInicio,
          horaFinal: horaFin,
          ubicacion,
          editable,
        }),
      })
      setModalExito('Reunión actualizada con éxito.')
      fetchReunion()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setModalError('No se pudo actualizar la reunión.')
    }
  }

  // === CERRAR REUNIÓN ===
  const cerrarReunion = async () => {
    if (!reunionId) return
    try {
      await apiFetch(`/reunion/reunion/${reunionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          titulo,
          fecha,
          horaInicio,
          horaFinal: horaFin,
          ubicacion,
          editable: false,
        }),
      })
      setEditable(false)
      setModalExito('La reunión ha sido cerrada. Ya no se puede marcar asistencia.')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setModalError('No se pudo cerrar la reunión.')
    }
  }

  // === CARGAR ASISTENTES ===
  const fetchAsistentes = async () => {
    if (!reunionId) return
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })
      if (filtroNombre.trim()) params.append('nombre', filtroNombre)
      if (filtroApellido.trim()) params.append('apellido', filtroApellido)

      const data = await apiFetch<PersonasResponse>(
        `/asistencia/asistencia/${reunionId}/personas?${params.toString()}`
      )
      setUsuarios(data.items)
      setTotalPages(data.total_pages || 1)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setModalError('Error cargando asistentes.')
    }
  }

  useEffect(() => {
    fetchAsistentes()
  }, [reunionId, page, filtroNombre, filtroApellido])

  // === DESCARGAR REPORTE ===
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setModalError('No se pudo descargar el reporte.')
    }
  }

  // === TOKEN ===
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
        setModalError(res.message || 'No se pudo generar el código.')
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setModalError('Error inesperado generando código.')
    } finally {
      setLoadingToken(false)
    }
  }

  const desactivarToken = async () => {
    if (!reunionId) return
    try {
      const res = await apiFetch<{ estado: string; message: string }>(
        `/reunion/reunion/${reunionId}/delete-asistencia-code`,
        { method: 'PATCH' }
      )

      if (res.estado === 'Exitoso') {
        setToken('')
        localStorage.removeItem(`token_${reunionId}`)
      } else {
        setModalError(res.message || 'No se pudo desactivar el código.')
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setModalError('Error inesperado al desactivar el código.')
    }
  }

  // === TOGGLE asistencia ===
  const toggleAsistencia = async (personaId: string, current: boolean) => {
    if (!reunionId || !editable) return
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setModalError('No se pudo actualizar la asistencia.')
    }
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-[#333] flex items-center">
        Editar reunión
        <Tooltip text="Modifica la información básica de la reunión, administra usuarios y controla la asistencia." />
      </h1>

      {/* Botones superiores */}
      <div className="mb-6 flex flex-wrap gap-4 justify-end items-center">
        <button
          onClick={descargarReporte}
          className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
        >
          Descargar reporte de asistencia
        </button>
        <button
          onClick={actualizarReunion}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Actualizar reunión
        </button>
        <button
          onClick={cerrarReunion}
          disabled={!editable}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          Cerrar reunión
        </button>
        <Tooltip text="Al cerrar la reunión, nadie podrá marcar asistencia automáticamente ni manualmente." responsive />
      </div>

      {/* Datos básicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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
        <div>
          <label className="block text-sm text-gray-700 mb-1">Ubicación</label>
          <input
            value={ubicacion}
            onChange={e => setUbicacion(e.target.value)}
            className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
          />
        </div>
      </div>

      {/* TOKEN */}
      <div className="flex flex-col items-center mb-6">
        {token ? (
          <>
            <div className="border-2 border-[#7d4f2b] px-8 py-4 text-2xl font-bold text-[#333] rounded flex items-center gap-2">
              {token}
              <Tooltip text="Este es el código que los usuarios deben usar para registrar su asistencia." />
            </div>
            <button
              onClick={desactivarToken}
              disabled={!editable}
              className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f] mt-2 disabled:opacity-50"
            >
              Desactivar token
            </button>
          </>
        ) : (
          <button
            onClick={generarToken}
            disabled={loadingToken || !editable}
            className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f] disabled:opacity-50"
          >
            {loadingToken ? 'Generando...' : 'Generar token'}
          </button>
        )}
      </div>

      {/* Lista usuarios */}
      <h2 className="text-xl font-semibold mb-2 text-[#333] flex items-center">
        Usuarios
        <Tooltip text="Lista de personas asociadas a la reunión. Puedes filtrar y marcar asistencia." />
      </h2>

      {/* Filtros */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col">
          <label className="block text-sm text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filtroNombre}
            onChange={e => {
              setPage(1)
              setFiltroNombre(e.target.value)
            }}
            className="border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700 max-w-xs"
          />
        </div>
        <div className="flex flex-col">
          <label className="block text-sm text-gray-700 mb-1">Apellido</label>
          <input
            type="text"
            placeholder="Buscar por apellido..."
            value={filtroApellido}
            onChange={e => {
              setPage(1)
              setFiltroApellido(e.target.value)
            }}
            className="border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700 max-w-xs"
          />
        </div>
      </div>

      {/* Tabla */}
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
                    disabled={!editable}
                    className="w-4 h-4 accent-[#7d4f2b] cursor-pointer disabled:opacity-50"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
          className="px-4 py-2 rounded bg-[#7d4f2b] text-white disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 rounded bg-[#7d4f2b] text-white disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* Modal de éxito */}
      {modalExito && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
            <p className="text-lg mb-6">{modalExito}</p>
            <button
              onClick={() => setModalExito(null)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {modalError && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
            <p className="text-lg mb-6 text-red-600">{modalError}</p>
            <button
              onClick={() => setModalError(null)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
