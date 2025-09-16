'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api' // 👈 ajusta la ruta según donde tengas apiFetch

export default function InformesPage() {
  const [loading, setLoading] = useState(false)

  const handleDescargar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const blob = await apiFetch<Blob>('/reportes/reportes/personas', {
        method: 'GET',
        responseType: 'blob',
      })

      // crear link temporal para descargar
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'informe_personas.xlsx' // 👈 nombre sugerido
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al descargar informe:', error)
      alert('No se pudo descargar el informe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      <form
        onSubmit={handleDescargar}
        className="flex flex-col items-center gap-10 w-full"
      >
        <button
          type="submit"
          disabled={loading}
          className="bg-[#9c5a25] hover:bg-[#7b4317] text-white font-bold px-12 py-3 rounded-lg text-lg shadow-sm transition-colors disabled:opacity-60"
        >
          {loading ? 'Descargando...' : 'Descargar informe'}
        </button>
      </form>
    </div>
  )
}
