'use client'

import { useState, useEffect } from 'react'
import { Trash2, Search, Edit3, X, HelpCircle, UserPlus, Users, CalendarDays, BarChart3, UserCog, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { AnimatedFilterField } from '@/components/AnimatedFilterField'
import { StatCard } from '@/components/StatCard'
import { Tooltip } from '@/components/Tooltip'
import FormularioUsuarioSistemaPage from './formulario/page'

function contarUsuariosPorRol(usuarios: { rol: 'admin' | 'usuario' }[]) {
  let admin = 0;
  let usuario = 0;

  for (const u of usuarios) {
    if (u.rol === 'admin') admin++;
    else if (u.rol === 'usuario') usuario++;
  }

  return {
    admin,
    usuario,
    total: admin + usuario,
  };
}

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

export default function UsuariosSistemaPage() {
  const router = useRouter()

  const [busqueda, setBusqueda] = useState('')
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<string | null>(null); // email

  const [userToDelete, setUserToDelete] = useState<UsuarioSistema | null>(null)
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null)
  const [resultModal, setResultModal] = useState<{ success: boolean; message: string } | null>(null)
  const [cantidadUsuarios, setCantidadUsuarios] = useState({ admin: 0, usuario: 0, total: 0 });
  
  
  useEffect(() => {
    setCantidadUsuarios(contarUsuariosPorRol(usuarios));
  }, [usuarios]); // Se ejecuta solo cuando `usuarios` cambia

  console.log(cantidadUsuarios); // { admin: 2, usuario: 8, total: 10 }

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
    router.push(`/dashboard/usuarios/formulario?email=${encodeURIComponent(email)}`)
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
        setUsuarios((prev) => prev.filter((u) => u.email !== userToDelete.email))
        if (usuarios.length === 1 && page > 1) setPage((p) => p - 1)
        setResultModal({ success: true, message: 'Usuario eliminado con éxito' })
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
      <div className='bg-white p-6 rounded-lg shadow-md mb-6'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5'>
          {/* Título */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] flex items-center gap-2">
            <Users size={25} className="text-[#7d4f2b] stroke-[2.5]" />
            Usuarios del sistema
            <Tooltip text="Aquí puedes visualizar, buscar, editar o eliminar los usuarios que tienen acceso al sistema." />
          </h1>

          {/* Botón nuevo usuario */}
          <div className="text-right mt-2">
            <button
              onClick={() => setShowModal(true)}
              className="relative overflow-hidden bg-[#7d4f2b] text-white px-4 py-2 sm:px-6 sm:py-2 rounded flex items-center gap-2 
                      text-sm sm:text-base transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <UserPlus size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Nuevo usuario</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <AnimatedFilterField
          icon={Search}
          label="Buscar por Email o ID"
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Ej: Pedro o 1565412"
          texttooltip="Busca usuarios por coincidencia en el Email o Persona ID."
        />
      </div>
      
      <div className='grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-8 mb-8'>
        <StatCard
          label="Cantidad de censadores"
          value={cantidadUsuarios.usuario}
          icon={<User className="w-4 h-4 sm:w-6 sm:h-6" />}
          bg="bg-[#e3f2fd]"
          color="text-[#2196F3]"
          
        />

        <StatCard
          label="Cantidad de administradores"
          value={cantidadUsuarios.admin}
          icon={<UserCog className="w-4 h-4 sm:w-6 sm:h-6" />}
          bg="bg-[#e8f5e9]"
          color="text-[#4CAF50]"
        />

        <StatCard
          label="Total"
          value={cantidadUsuarios.total}
          icon={<BarChart3 className="w-4 h-4 sm:w-6 sm:h-6" />}
          bg="bg-[#f3e5f5]"
          color="text-[#9C27B0]"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="min-w-full">
            <thead className="bg-[#7d4f2b] text-white sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Persona ID</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Rol</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                usuarios.map((u, index) => (
                  <tr key={u.email} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-5 py-3 text-gray-800">{u.email}</td>
                    <td className="px-5 py-3 text-gray-800">{u.personaId}</td>
                    <td className="px-5 py-3 text-center">
                      {u.rol === 'admin' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full capitalize">
                          { u.rol }
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full capitalize">
                          Censador
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => {
                            setUsuarioAEditar(u.email);
                            setEditModalOpen(true);
                          }}
                          className="text-[#7d4f2b] hover:text-blue-600 transition-colors"
                          title="Editar usuario"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="text-[#7d4f2b] hover:text-red-600 transition-colors disabled:opacity-50"
                          disabled={deletingEmail === u.email}
                          title="Eliminar usuario"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 mt-6">
        <div className="text-sm text-gray-600">
          Mostrando página {page} de {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-[#7d4f2b] text-white hover:bg-[#5e3c1f] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal: Confirmar eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setUserToDelete(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Eliminar usuario</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar al usuario{' '}
              <span className="font-medium text-[#7d4f2b]">{userToDelete.email}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarUsuario}
                disabled={deletingEmail === userToDelete.email}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingEmail === userToDelete.email ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resultado */}
      {resultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setResultModal(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <p
              className={`text-lg font-medium ${
                resultModal.success ? 'text-gray-800' : 'text-red-600'
              }`}
            >
              {resultModal.message}
            </p>
            <div className="mt-6 text-right">
              <button
                onClick={() => setResultModal(null)}
                className="px-4 py-2 rounded-lg bg-[#7d4f2b] text-white hover:bg-[#5e3c1f]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Formulario de nuevo usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <FormularioUsuarioSistemaPage
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              fetchUsuarios(); // Recarga la lista de usuarios
            }}
          />
        </div>
      )}

      {/* Modal: Editar usuario */}
      {editModalOpen && usuarioAEditar && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <FormularioUsuarioSistemaPage
            email={usuarioAEditar}
            onClose={() => setEditModalOpen(false)}
            onSuccess={() => {
              setEditModalOpen(false);
              fetchUsuarios(); // Recarga la lista
            }}
          />
        </div>
      )}
    </div>
  )
}