'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { BookMarked, Copy, HelpCircle, KeyRound, Lightbulb, LightbulbIcon, PencilLine, Recycle, Users } from 'lucide-react'
import { Reunion } from '@/types/reuniones'
import { LiaGithub } from 'react-icons/lia'

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

export default function FormularioReunionPage({ reunionId }: { reunionId: number | null }) {
  const searchParams = useSearchParams()

  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [editable, setEditable] = useState(true)
  const [descripcion ,setDescripcion] = useState('')

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
  <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
    {/* Encabezado */}
    <div className="flex items-center justify-between">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#2c3e50] flex items-center gap-2">
        <PencilLine size={30} /> Editar reunión
        <Tooltip text="Modifica la información básica de la reunión, administra usuarios y controla la asistencia." />
      </h1>
    </div>

    {/* Sección: Información de la reunión */}
    <section className="form-section bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="section-title mb-5">
        <h2 className="text-xl font-semibold text-[#2c3e50] flex items-center gap-2">
          <BookMarked size={20} /> Información de la Reunión
        </h2>
      </div>

      <div className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Reunión *</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            placeholder="Ej: Asamblea Comunitaria"
          />
        </div>

        {/* Fecha y Hora (en fila en pantallas grandes) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio *</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin *</label>
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
          <input
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            placeholder="Ej: Salón Comunal, Casa del Cabildo"
          />
        </div>

        {/* Descripción / Agenda (añadido) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Agenda</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            placeholder="Descripción de la reunión, temas a tratar, etc."
          />
        </div>
      </div>
    </section>

    {/* Sección: Código de Acceso */}
    <section className="form-section bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="section-title mb-5">
        <h2 className="text-xl font-semibold text-[#2c3e50] flex items-center gap-2">
          <KeyRound size={20} /> Código de Acceso QR
        </h2>
      </div>

      {token ? (
        <div className="text-center space-y-4">
          <div className="access-code-display">
            <div className="text-sm text-gray-600 mb-1">Código Actual</div>
            <div className="text-2xl font-bold text-[#2c3e50] bg-gray-100 inline-block px-6 py-3 rounded-lg border border-[#7d4f2b]">
              {token}
              <Tooltip text="Este es el código que los usuarios deben usar para registrar su asistencia." />
            </div>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={desactivarToken}
              disabled={!editable}
              className="px-4 py-2 bg-[#7d4f2b] text-white rounded-lg hover:bg-[#5e3c1f] disabled:opacity-50 flex items-center gap-2"
            >
              <Copy size={20} className='text-red-600'/> Desactivar código
            </button>
            <button
              onClick={generarToken}
              disabled={!editable}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center gap-2"
            >
              <Recycle size={20} className='text-blue-700'/> Generar nuevo
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={generarToken}
            disabled={loadingToken || !editable}
            className="px-6 py-3 bg-[#7d4f2b] text-white rounded-lg hover:bg-[#5e3c1f] disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loadingToken ? '⏳ Generando...' : '➕ Generar código de acceso'}
          </button>
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg flex items-center justify-center gap-2">
        <LightbulbIcon size={23} className='text-yellow-500'/> Los asistentes pueden ingresar este código para registrar su asistencia a la reunión.
      </div>
    </section>

    {/* Sección: Gestión de Asistentes */}
    <section className="form-section bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="section-title mb-5">
        <h2 className="text-xl font-semibold text-[#2c3e50] flex items-center gap-2">
          <Users size={20} className='text-blue-700'/> Gestión de Asistentes
        </h2>
      </div>

      {/* Filtros */}
      <div className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o documento..."
              value={filtroNombre}
              onChange={(e) => {
                setPage(1);
                setFiltroNombre(e.target.value);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Buscar por apellido..."
              value={filtroApellido}
              onChange={(e) => {
                setPage(1);
                setFiltroApellido(e.target.value);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabla de asistentes */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-[#7d4f2b] text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Documento</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Apellido</th>
              <th className="px-4 py-3 text-center text-sm font-medium">Asistencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u, i) => (
              <tr key={u.Numero_documento} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-3 text-gray-800">{u.Numero_documento}</td>
                <td className="px-4 py-3 text-gray-800">{u.Nombre}</td>
                <td className="px-4 py-3 text-gray-800">{u.Apellido}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={u.Asistencia}
                    onChange={() => toggleAsistencia(u.Numero_documento, u.Asistencia)}
                    disabled={!editable}
                    className="w-5 h-5 accent-[#7d4f2b] cursor-pointer disabled:opacity-50"
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
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-gray-600">
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* Resumen de asistencia + botones */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
        {usuarios.length > 0 && (
          <div className="text-sm font-medium text-[#2c3e50]">
            <strong>Resumen de Asistencia:</strong>
            <span className="text-green-600 ml-4">✅ {usuarios.filter(u => u.Asistencia).length} Presentes</span>
            <span className="text-red-600 ml-4">❌ {usuarios.filter(u => !u.Asistencia).length} Ausentes</span>
            <span className="text-gray-700 ml-4">📊 Total: {usuarios.length}</span>
          </div>
        )}
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={descargarReporte}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            📊 Descargar reporte
          </button>
          <button
            onClick={actualizarReunion}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            💾 Actualizar reunión
          </button>
          <button
            onClick={cerrarReunion}
            disabled={!editable}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            🔒 Cerrar reunión
          </button>
        </div>
      </div>
    </section>

    {/* Modales */}
    {modalExito && (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
          <p className="text-lg mb-4">{modalExito}</p>
          <button
            onClick={() => setModalExito(null)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Aceptar
          </button>
        </div>
      </div>
    )}

    {modalError && (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
          <p className="text-lg mb-4 text-red-600">{modalError}</p>
          <button
            onClick={() => setModalError(null)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    )}
  </div>
);
}
