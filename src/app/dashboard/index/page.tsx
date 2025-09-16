'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Trash, Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Foto {
  id: number
}

interface Publicacion {
  id: number
  titulo: string
  contenido: string
  fotos: Foto[]
}

interface PublicacionesResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: Publicacion[]
}

export default function IndexPublicacionesPage() {
  const router = useRouter()
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const [idAEliminar, setIdAEliminar] = useState<number | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const fetchPublicaciones = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<PublicacionesResponse>(
        `/index/index?page=${page}&page_size=5`
      )
      setPublicaciones(data.items)
      setTotalPages(data.total_pages)
    } catch (error) {
      console.error('Error cargando publicaciones', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPublicaciones()
  }, [page])

  const abrirModalEliminar = (id: number) => setIdAEliminar(id)
  const cerrarModalEliminar = () => setIdAEliminar(null)

  const handleEliminar = async () => {
    if (idAEliminar !== null) {
      try {
        // Buscar la publicación a eliminar
        const publicacion = publicaciones.find((p) => p.id === idAEliminar)
        if (!publicacion) return

        const token = localStorage.getItem('token')
        if (!token) throw new Error('Token no encontrado')

        // 1️⃣ Eliminar fotos primero
        for (const foto of publicacion.fotos) {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://148.113.175.43:8080/cmi-apigateway'}/index/index/foto/${foto.id}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        }

        // 2️⃣ Eliminar publicación
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://148.113.175.43:8080/cmi-apigateway'}/index/index/${idAEliminar}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        // 3️⃣ Actualizar lista
        setPublicaciones((prev) => prev.filter((pub) => pub.id !== idAEliminar))
        setIdAEliminar(null)
        setShowSuccessModal(true)
      } catch (err) {
        console.error('Error eliminando publicación', err)
        alert('No se pudo eliminar la publicación')
      }
    }
  }


  const cerrarModalExito = () => setShowSuccessModal(false)

  const publicacionSeleccionada = publicaciones.find((p) => p.id === idAEliminar)

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-center mb-8">
        Publicaciones del index
      </h1>
      <div
        className="bg-[#dddddd] rounded-2xl max-w-4xl mx-auto p-8 flex flex-col gap-8"
        style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.07)' }}
      >
        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : publicaciones.length === 0 ? (
          <div className="text-center text-gray-400">No hay publicaciones aún.</div>
        ) : (
          publicaciones.map((pub) => (
            <div
              key={pub.id}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-8"
            >
              {/* Columna izquierda */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1 text-base text-[#444]">Título</label>
                  <div className="w-full border border-[#9c5a25] rounded-lg p-2 bg-white">
                    {pub.titulo}
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-base text-[#444]">
                    Contenido
                  </label>
                  <div className="w-full border border-[#9c5a25] rounded-lg p-2 bg-white min-h-[90px]">
                    {pub.contenido}
                  </div>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="flex flex-col h-full">
                <label className="block mb-1 text-base text-[#444]">Foto</label>
                <div className="w-full border border-[#9c5a25] rounded-lg bg-white flex items-center justify-center min-h-[170px]">
                  {pub.fotos && pub.fotos.length > 0 ? (
                    <PublicacionFoto fotoId={pub.fotos[0].id} titulo={pub.titulo} />
                  ) : (
                    <span className="text-gray-400 text-sm">Sin foto</span>
                  )}
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={() => abrirModalEliminar(pub.id)}
                    className="bg-[#9c5a25] hover:bg-[#7b4317] text-white rounded-lg px-5 py-2 flex items-center gap-2 transition-colors"
                  >
                    <Trash size={18} /> Eliminar publicación
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {/* Botón agregar */}
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/index/nuevo')}
            className="bg-[#9c5a25] hover:bg-[#7b4317] text-white px-8 py-2 rounded-lg text-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={22} /> Agregar publicación
          </button>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-4 py-2 rounded bg-[#9c5a25] text-white disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 rounded bg-[#9c5a25] text-white disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* Modales */}
      {idAEliminar !== null && publicacionSeleccionada && (
        <ModalConfirmacion
          titulo={publicacionSeleccionada.titulo}
          onAceptar={handleEliminar}
          onCancelar={cerrarModalEliminar}
        />
      )}
      {showSuccessModal && <ModalExito onClose={cerrarModalExito} />}
    </div>
  )
}

/* Renderiza la foto desde el endpoint usando apiFetch */
function PublicacionFoto({ fotoId, titulo }: { fotoId: number; titulo: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    const fetchFoto = async () => {
      try {
        const blob = await apiFetch<Blob>(`/index/index/${fotoId}`, {
          responseType: 'blob',
        })
        setSrc(URL.createObjectURL(blob))
      } catch (err) {
        console.error('Error cargando foto', err)
      }
    }

    fetchFoto()
  }, [fotoId])

  if (!src) return <span className="text-gray-400 text-sm">Cargando...</span>

  return (
    <div className="relative w-[210px] h-[140px]">
      <Image
        src={src}
        alt={titulo}
        fill
        className="object-cover rounded-lg"
      />
    </div>
  )
}

function ModalConfirmacion({
  titulo,
  onAceptar,
  onCancelar,
}: {
  titulo: string
  onAceptar: () => void
  onCancelar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full flex flex-col items-center">
        <p className="text-lg mb-8 text-center">
          ¿Está seguro de querer eliminar la publicación <br />
          <span className="font-semibold">“{titulo}”</span>?
        </p>
        <div className="flex gap-4 w-full">
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-[#9c5a25] text-white font-medium hover:bg-[#7b4317] transition-colors"
            onClick={onAceptar}
          >
            Aceptar
          </button>
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-gray-400 text-white font-medium hover:bg-gray-500 transition-colors"
            onClick={onCancelar}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalExito({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
        <p className="text-lg mb-6 text-center">
          Publicación eliminada correctamente.
        </p>
        <button
          className="px-8 py-2 rounded-lg bg-[#9c5a25] text-white font-medium hover:bg-[#7b4317] transition-colors"
          onClick={onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
