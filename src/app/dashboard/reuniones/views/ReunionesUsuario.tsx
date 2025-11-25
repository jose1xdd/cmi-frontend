'use client'

import { useState, useEffect } from 'react'
import { Pencil, CheckSquare, HelpCircle, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { jwtDecode } from 'jwt-decode'

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

interface Reunion {
  id: number
  titulo: string
  horaInicio: string
  horaFinal: string
  fecha: string
  ubicacion: string
  editable: boolean
}

interface ReunionUsuario extends Reunion {
  asistencia?: boolean
}

interface ReunionesResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: Reunion[]
}

interface JwtPayload {
  persona_id: string
  exp: number
}

export default function ReunionesUsuario() {
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [reuniones, setReuniones] = useState<ReunionUsuario[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { token: authToken } = useAuth()
  const [personaId, setPersonaId] = useState<string | null>(null)

  // === Obtener personaId del token ===
  useEffect(() => {
    if (authToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(authToken)
        setPersonaId(decoded.persona_id)
      } catch (err) {
        console.error('Error decodificando token', err)
      }
    }
  }, [authToken])

  // === Cargar reuniones ===
  const fetchReuniones = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
      })
      if (fechaFiltro) {
        params.append('fecha', fechaFiltro)
      }

      const data = await apiFetch<ReunionesResponse>(
        `/reunion/reunion/?${params.toString()}`
      )

      let reunionesConAsistencia: ReunionUsuario[] = data.items

      // Si tenemos personaId, consultar asistencia de cada reunión
      if (personaId) {
        const checks = await Promise.all(
          data.items.map(async reunion => {
            try {
              const res = await apiFetch<{ asistencia_persona: boolean }>(
                `/asistencia/asistencia/${reunion.id}/persona/${personaId}`
              )
              return { ...reunion, asistencia: res.asistencia_persona === true }
            } catch {
              return { ...reunion, asistencia: false }
            }
          })
        )
        reunionesConAsistencia = checks
      }

      setReuniones(reunionesConAsistencia)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Error cargando reuniones', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (personaId) {
      fetchReuniones()
    }
  }, [page, fechaFiltro, personaId])

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-8 text-[#333] flex items-center">
        Reuniones
        <Tooltip text="Aquí puedes ver todas las reuniones y registrar tu asistencia." />
      </h1>

      {/* Filtro por fecha */}
      <div className="flex justify-start mb-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1 flex items-center">
            Filtrar por fecha
            <Tooltip text="Selecciona una fecha para ver solo reuniones de ese día." />
          </label>
          <input
            type="date"
            value={fechaFiltro}
            onChange={e => {
              setFechaFiltro(e.target.value)
              setPage(1)
            }}
            className="border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700 w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border rounded">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="min-w-full">
            <thead className="bg-[#7d4f2b] text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Reunión</th>
                <th className="px-4 py-2 text-left">Ubicación</th>
                <th className="px-4 py-2 text-center">Hora Inicio</th>
                <th className="px-4 py-2 text-center">Hora Fin</th>
                <th className="px-4 py-2 text-center">Fecha</th>
                <th className="px-4 py-2 text-center flex items-center justify-center">
                  Asistencia
                  <Tooltip text="✔️ indica asistencia registrada. ✏️ permite marcar asistencia (si la reunión está abierta)." responsive />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    Cargando...
                  </td>
                </tr>
              ) : reuniones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    No hay reuniones disponibles
                  </td>
                </tr>
              ) : (
                reuniones.map((reunion, index) => (
                  <tr
                    key={reunion.id}
                    className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="px-4 py-2">{reunion.id}</td>
                    <td className="px-4 py-2">{reunion.titulo}</td>
                    <td className="px-4 py-2">{reunion.ubicacion || '-'}</td>
                    <td className="px-4 py-2 text-center">{reunion.horaInicio}</td>
                    <td className="px-4 py-2 text-center">{reunion.horaFinal}</td>
                    <td className="px-4 py-2 text-center">{reunion.fecha}</td>
                    <td className="px-4 py-2 text-center">
                      {reunion.asistencia ? (
                        <CheckSquare
                          className="mx-auto text-green-600"
                          size={22}
                        />
                      ) : reunion.editable ? (
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/reuniones/editar/usuario?id=${reunion.id}`
                            )
                          }
                          className="mx-auto block"
                        >
                          <Pencil className="text-[#b57d50]" size={22} />
                        </button>
                      ) : (
                        <Lock className="mx-auto text-gray-400" size={22} />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-6">
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
    </div>
  )
}
