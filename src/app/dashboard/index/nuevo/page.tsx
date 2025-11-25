'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Plus, FileText, X, AlertCircle, Image as ImageIcon, Save, Loader2 } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'
import Image from 'next/image'

// Interfaces
interface Foto {
  id: number
}

interface Publicacion {
  id: number
  titulo: string
  contenido: string
  fotos: Foto[]
}

interface FormularioPublicacionModalProps {
  publicacion?: Publicacion // Si se pasa, es edición
  onClose: () => void
  onSuccess: () => void
}

export default function FormularioPublicacionModal({
  publicacion, // Puede ser undefined si es creación
  onClose,
  onSuccess,
}: FormularioPublicacionModalProps) {
  const esEdicion = !!publicacion

  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  // Cargar datos si es edición
  useEffect(() => {
    if (esEdicion && publicacion) {
      setTitulo(publicacion.titulo)
      setContenido(publicacion.contenido)
      // Cargar la primera imagen como preview si existe
      if (publicacion.fotos.length > 0) {
        const cargarImagen = async () => {
          try {
            const blob = await apiFetch<Blob>(`/index/index/${publicacion.fotos[0].id}`, {
              responseType: 'blob',
            })
            setPreviewUrl(URL.createObjectURL(blob))
          } catch (err) {
            console.error('Error al cargar imagen de la publicación', err)
          }
        }
        cargarImagen()
      }
    }
  }, [esEdicion, publicacion])

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file && file.size > MAX_FILE_SIZE) {
      setMensajeError('La imagen no puede superar los 5 MB.')
      e.target.value = '' // Resetear input
      return
    }

    setImagen(file || null)
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else if (!esEdicion) {
      // Si es creación y se limpia la imagen, resetear preview
      setPreviewUrl(null)
    }
    // Si es edición y se limpia la imagen, dejar la existente
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensajeError(null)

    if (!titulo.trim() || !contenido.trim()) {
      setMensajeError('Por favor completa el título y el contenido.')
      return
    }

    // Si es edición y no se subió una nueva imagen, se mantiene la existente
    if (!imagen && !esEdicion) {
      setMensajeError('Debes seleccionar una imagen.')
      return
    }

    setLoading(true)

    try {
      const data = {
        titulo: titulo,
        contenido: contenido,
      }

      let res
      if (esEdicion && publicacion) {
        // PUT /index/index/{id}
        res = await apiFetch<{ estado: string; message: string }>(
          `/index/index/${publicacion.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        )

      if (imagen) {
        const formDataImagen = new FormData()
        formDataImagen.append('fotos', imagen)

        const fotoRes = await apiFetch<{ estado: string; message: string }>(
          `/index/index/${publicacion.id}/fotos`,
          {
            method: 'POST',
            body: formDataImagen,
          }
        )
        
        console.log('Foto agregada:', fotoRes)
      }
      } else {
        const formData = new FormData()
        formData.append('titulo', titulo)
        formData.append('contenido', contenido)
        // POST /index/index/create
        if (imagen) {
          formData.append('fotos', imagen) // Asumiendo que el backend acepta `fotos` como archivo
        }
        res = await apiFetch<{ estado: string; message: string }>(
          '/index/index/create',
          {
            method: 'POST',
            body: formData,
          }
        )
      }

      if (res.estado === 'Exitoso') {
        onSuccess()
      } else {
        setMensajeError(res.message || 'Error al guardar la publicación.')
      }
    } catch (err: any) {
      console.error('Error al guardar publicación', err)
      setMensajeError(err.message || 'Error inesperado al guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7d4f2b] flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-[#2c3e50]">
              {esEdicion ? 'Editar publicación' : 'Crear nueva publicación'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del formulario */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* Mensaje de error global */}
          {mensajeError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {mensajeError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Columna izquierda: Título y Contenido */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="text-[#7d4f2b]" />
                  Título *
                  <Tooltip text="Título de la publicación." />
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                  placeholder="Ej: Asamblea General del Mes"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="text-[#7d4f2b]" />
                  Contenido *
                  <Tooltip text="Contenido o descripción de la publicación." />
                </label>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                  placeholder="Escribe el contenido de la publicación aquí..."
                />
              </div>
            </div>

            {/* Columna derecha: Imagen */}
            <div className="flex flex-col h-full">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <ImageIcon size={16} className="text-[#7d4f2b]" />
                Imagen *
                <Tooltip text="Sube una imagen representativa para la publicación." />
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center min-h-[200px] relative overflow-hidden">
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={previewUrl}
                      alt="Vista previa"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-gray-400">
                    <ImageIcon size={48} className="mb-2" />
                    <p className="text-sm">Haz clic para seleccionar una imagen</p>
                    <p className="text-xs mt-1">Tamaño máximo: 5 MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Subir imagen"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-[#7d4f2b] text-white rounded-lg hover:bg-[#5e3c1f] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  {esEdicion ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {esEdicion ? 'Actualizar' : 'Crear'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}