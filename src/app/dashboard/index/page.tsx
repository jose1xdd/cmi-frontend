'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, FileText } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import PublicacionesCarrusel from './components/PublicacionesCarrusel'
import FormularioPublicacionModal from './nuevo/page'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFormModal, setShowFormModal] = useState(false)
  const [publicacionAEditionar, setPublicacionAEditionar] = useState<Publicacion | null>(null)

  const [idAEliminar, setIdAEliminar] = useState<number | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const fetchPublicaciones = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<PublicacionesResponse>(
        `/index/index?page=${currentPage}&page_size=50`
      )
      setPublicaciones(data.items)
      setTotalPages(data.total_pages)
      setCurrentIndex(0) // Reiniciar al cambiar página
    } catch (error) {
      console.error('Error cargando publicaciones', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPublicaciones()
  }, [currentPage])

  // === Eliminación (igual que antes) ===
  const abrirModalEliminar = (id: number) => setIdAEliminar(id)
  const cerrarModalEliminar = () => setIdAEliminar(null)

  const handleEliminar = async () => {
    if (idAEliminar !== null) {
      try {
        const publicacion = publicaciones.find((p) => p.id === idAEliminar)
        if (!publicacion) return

        const token = localStorage.getItem('token')
        if (!token) throw new Error('Token no encontrado')

        // Eliminar fotos
        for (const foto of publicacion.fotos) {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://148.113.175.43:8080/cmi-apigateway'}/index/index/foto/${foto.id}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        }

        // Eliminar publicación
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://148.113.175.43:8080/cmi-apigateway'}/index/index/${idAEliminar}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        // Actualizar lista
        const nuevas = publicaciones.filter((pub) => pub.id !== idAEliminar)
        setPublicaciones(nuevas)
        setIdAEliminar(null)
        setShowSuccessModal(true)

        // Ajustar índice si se elimina la publicación actual
        if (nuevas.length > 0) {
          setCurrentIndex(Math.min(currentIndex, nuevas.length - 1))
        }
      } catch (err) {
        console.error('Error eliminando publicación', err)
        alert('No se pudo eliminar la publicación')
      }
    }
  }

  const cerrarModalExito = () => setShowSuccessModal(false)

  const publicacionActual = publicaciones[currentIndex]

  const abrirModalCrear = () => {
    setPublicacionAEditionar(null) // <-- Limpiar para crear nueva
    setShowFormModal(true)
  }

  const abrirModalEditar = (pub: Publicacion) => {
    setPublicacionAEditionar(pub)
    setShowFormModal(true)
  }

  const cerrarModalForm = () => {
    setShowFormModal(false)
    setPublicacionAEditionar(null)
  }

  const handleFormSuccess = () => {
    cerrarModalForm()
    fetchPublicaciones() // Recarga la lista
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-xl shadow-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#7d4f2b] text-white mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2c3e50]">
          Publicaciones del index
        </h1>
      </div>

      {/* Carrusel */}
      <PublicacionesCarrusel
        publicaciones={publicaciones}
        onEliminar={abrirModalEliminar}
        onEditar={abrirModalEditar}
      />

      {/* Botón agregar (ahora abre modal) */}
      <div className="text-center">
        <button
          onClick={abrirModalCrear}
          className="relative overflow-hidden bg-[#7d4f2b] mt-20 lg:mt-0 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-base font-medium transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <Plus size={18} className="stroke-[3] relative z-10" />
          <span className="relative z-10">Agregar publicación</span>
        </button>
      </div>

      {/* Modal: Crear/Editar */}
      {showFormModal && (
        <FormularioPublicacionModal
          publicacion={publicacionAEditionar} // <-- Pasa la publicación si es edición
          onClose={cerrarModalForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {idAEliminar !== null && (
        <ModalConfirmacion
          titulo={publicaciones.find(p => p.id === idAEliminar)?.titulo || ''}
          onAceptar={handleEliminar}
          onCancelar={cerrarModalEliminar}
        />
      )}
      {showSuccessModal && <ModalExito onClose={cerrarModalExito} />}
    </div>
  )
}

// Reusamos tus componentes de foto y modales (solo actualizamos estilos si es necesario)
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

  if (!src) return <span className="text-gray-400">Cargando...</span>

  return (
    <div className="relative w-full h-[170px]">
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
        <p className="text-gray-800 mb-6">
          ¿Estás seguro de eliminar la publicación<br />
          <span className="font-semibold text-[#7d4f2b]">“{titulo}”</span>?
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancelar}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onAceptar}
            className="px-4 py-2 rounded-lg bg-[#7d4f2b] text-white hover:bg-[#5e3c1f]"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalExito({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
        <p className="text-gray-800 mb-6">Publicación eliminada correctamente.</p>
        <button
          onClick={onClose}
          className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f]"
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}