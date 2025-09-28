'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'

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

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'informe_censo.xlsx'
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
    <div className="flex flex-col items-center w-full text-center px-4">
      {/* Texto arriba */}
      <div className="mt-8 mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-[#222]">
          Informes en el formato del censo
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Aquí puedes descargar el informe en formato Excel con la información consolidada
          de todas las personas registradas en el sistema. El archivo contiene los datos
          estructurados tal como se solicitan en el censo oficial.
        </p>
      </div>

      {/* Botón centrado en la pantalla */}
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
        <form
          onSubmit={handleDescargar}
          className="flex flex-col items-center gap-6 w-full"
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
    </div>
  )
}
