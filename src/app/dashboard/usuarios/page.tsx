'use client'

import { useState, useEffect } from 'react'
import { Trash, Search, Pencil, X, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface UsuarioSistema {
  email: string
  personaId: string
  rol: 'admin' | 'usuario'
}

interface UsuariosSistemaResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: UsuarioSistema[]
}

// Tooltip genérico (mejorado)
function Tooltip({ text }: { text: string }) {
  return (
    <div className="relative group inline-block">
      <HelpCircle className="w-4 h-4 text-[#7d4f2b] ml-1 cursor-pointer" />
      <div
        className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2
                   bg-black text-white text-xs rounded px-3 py-2 shadow-md 
                   min-w-[200px] max-w-sm text-left whitespace-normal z-20"
      >
        {text}
      </div>
    </div>
  )
}

export default function UsuariosSistemaPage() {
  const router = useRouter()

  const [busqueda, setBusqueda] = useState('')
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  // eliminar: estados de modal/resultado
  const [userToDelete, setUserToDelete] = useState<UsuarioSistema | null>(null)
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null)
  const [resultModal, setResultModal] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })

      if (busqueda) {
        if (busqueda.includes('@')) {
          params.append('email', busqueda)
        } else {
          params.append('personaId', busqueda)
        }
      }

      const data = await apiFetch<UsuariosSistemaResponse>(
        `/?${params.toString()}`
      )
      setUsuarios(data.items)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Error cargando usuarios del sistema', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [page, busqueda])

  const handleEditar = (email: string) => {
    router.push(
      `/dashboard/usuarios/formulario?email=${encodeURIComponent(email)}`
    )
  }

  const eliminarUsuario = async () => {
    if (!userToDelete) return
    try {
      setDeletingEmail(userToDelete.email)
      const res = await apiFetch<{ estado: string; message: string }>(
        `/delete/${encodeURIComponent(userToDelete.email)}`,
        { method: 'DELETE' }
      )

      if (res.estado === 'Exitoso') {
        setUsuarios((prev) =>
          prev.filter((u) => u.email !== userToDelete.email)
        )
        setTimeout(() => {
          setResultModal({ success: true, message: 'Usuario eliminado con éxito' })
          if (usuarios.length === 1 && page > 1) setPage((p) => p - 1)
        }, 0)
      } else {
        setResultModal({
          success: false,
          message: res.message || 'No se pudo eliminar el usuario',
        })
      }
    } catch {
      setResultModal({
        success: false,
        message: 'Error inesperado al eliminar el usuario',
      })
    } finally {
      setDeletingEmail(null)
      setUserToDelete(null)
    }
  }

  return (
    <div>
      {/* Título con ayuda */}
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-[#333] flex items-center">
        Usuarios del sistema
        <Tooltip text="Aquí puedes visualizar, buscar, editar o eliminar los usuarios que tienen acceso al sistema." />
      </h1>

      {/* Buscador con ayuda */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative w-full sm:max-w-xs flex items-center">
          <Search className="absolute left-3 top-2.5 text-[#7d4f2b]" size={18} />
          <input
            type="text"
            placeholder="Buscar por email o personaId..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-[#7d4f2b] rounded text-sm text-gray-700"
          />
          <div className="absolute right-2 top-2.5">
          </div>
          <Tooltip text="Puedes buscar un usuario ingresando su email o su personaId." />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full">
          <thead className="bg-[#7d4f2b] text-white sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Persona ID</th>
              <th className="text-center px-4 py-2">Rol</th>
              <th className="text-center px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  Cargando...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              usuarios.map((u, index) => (
                <tr
                  key={u.email}
                  className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.personaId}</td>
                  <td className="px-4 py-2 text-center capitalize">{u.rol}</td>
                  <td className="px-4 py-2 flex justify-center gap-2">
                    <button
                      onClick={() => handleEditar(u.email)}
                      className="text-[#7d4f2b] hover:text-blue-600"
                      title="Editar usuario"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setUserToDelete(u)}
                      className="text-[#7d4f2b] hover:text-red-600 disabled:opacity-50"
                      disabled={deletingEmail === u.email}
                      title="Eliminar usuario"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-4 py-2 rounded bg-[#7d4f2b] text-white disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 rounded bg-[#7d4f2b] text-white disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* Botón nuevo usuario */}
      <div className="mt-6 text-right">
        <button
          onClick={() => router.push('/dashboard/usuarios/formulario')}
          className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded"
        >
          Nuevo usuario
        </button>
      </div>

      {/* Modal confirmación eliminar */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center relative">
            <button
              onClick={() => setUserToDelete(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <p className="text-lg mb-6">
              ¿Está seguro de querer eliminar al usuario <br />
              <strong>{userToDelete.email}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={eliminarUsuario}
                className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                disabled={deletingEmail === userToDelete.email}
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setUserToDelete(null)}
                className="bg-gray-400 text-white px-5 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal resultado eliminar */}
      {resultModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center relative">
            <button
              onClick={() => setResultModal(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <p
              className={`text-lg mb-6 ${
                resultModal.success ? '' : 'text-red-700'
              }`}
            >
              {resultModal.message}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setResultModal(null)}
                className="bg-[#7d4f2b] text-white px-5 py-2 rounded hover:bg-[#5e3c1f]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
