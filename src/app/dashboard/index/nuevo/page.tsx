'use client'

import { useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function NuevaPublicacionPage() {
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 📌 Límite de 5 MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

  const handleImagenChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file && file.size > MAX_FILE_SIZE) {
      alert('La imagen no puede superar los 5 MB')
      e.target.value = '' // resetear input
      return
    }

    setImagen(file || null)
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imagen) {
      alert('Debes seleccionar una foto')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Sesión expirada')

      const formData = new FormData()
      formData.append('titulo', titulo)
      formData.append('contenido', contenido)
      formData.append('fotos', imagen)

      const BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        'http://148.113.175.43:8080/cmi-apigateway'

      const res = await fetch(`${BASE_URL}/index/index/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Error al crear publicación')
      }

      alert('Publicación creada con éxito')
      router.push('/dashboard/index')
    } catch (err) {
      console.error(err)
      alert('No se pudo crear la publicación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-center mb-8">Agregar publicación</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-[#dddddd] rounded-2xl max-w-4xl mx-auto p-8 flex flex-col gap-8"
        style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.07)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Columna izquierda */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block mb-1 text-base text-[#444]">Título</label>
              <input
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                required
                className="w-full border border-[#9c5a25] rounded-lg p-2 bg-white"
                placeholder="Título de la publicación"
              />
            </div>
            <div>
              <label className="block mb-1 text-base text-[#444]">Contenido</label>
              <textarea
                value={contenido}
                onChange={e => setContenido(e.target.value)}
                required
                className="w-full border border-[#9c5a25] rounded-lg p-2 bg-white min-h-[90px]"
                placeholder="Contenido..."
              />
            </div>
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col h-full">
            <label className="block mb-1 text-base text-[#444]">Foto</label>
            <div className="w-full border border-[#9c5a25] rounded-lg bg-white flex items-center justify-center min-h-[170px] relative">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={210}
                  height={140}
                  style={{ objectFit: 'cover', width: '210px', height: '140px' }}
                  className="rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <svg
                    width={80}
                    height={80}
                    fill="none"
                    stroke="#b18b66"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5-4 4-2-2-5 5" />
                  </svg>
                  <span className="text-sm text-gray-400 mt-2">
                    Sin imagen seleccionada
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImagenChange}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Subir foto"
              />
            </div>
            {/* 📌 Mensaje de tamaño máximo permitido */}
            <span className="text-xs text-gray-500 mt-2">
              Tamaño máximo permitido: 5 MB
            </span>
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#9c5a25] hover:bg-[#7b4317] text-white px-8 py-2 rounded-lg text-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Agregando...' : 'Agregar publicación'}
          </button>
        </div>
      </form>
    </div>
  )
}
