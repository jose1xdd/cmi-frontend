'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { FileText, Download, BarChart3 } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'

export default function InformesPage() {
  const toast = useToast()
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

      toast.success('Informe descargado exitosamente')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo descargar el informe'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4">
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#7d4f2b] text-white mb-4">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2c3e50] mb-3">
            Informes en el formato del censo
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Descarga el informe en formato Excel con la información consolidada de todas las personas
            registradas en el sistema. Los datos están estructurados según los requisitos del censo oficial.
          </p>
        </div>
      </div>

      {/* Panel de acción */}
      <div className="bg-white p-8 rounded-xl shadow-md flex flex-col items-center">
        <div className="text-center mb-6">
          <FileText className="w-12 h-12 text-[#7d4f2b] mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-[#2c3e50]">Informe consolidado</h2>
          <p className="text-gray-600 mt-2">
            Archivo en formato <strong>.xlsx</strong> listo para entregar
          </p>
        </div>

        <form onSubmit={handleDescargar} className="w-full max-w-xs">
          <button
            type="submit"
            disabled={loading}
            className="relative overflow-hidden w-full bg-[#7d4f2b] text-white font-medium px-6 py-3.5 rounded-lg text-base transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <div className="flex items-center justify-center gap-2 relative z-10">
              <Download size={18} className="stroke-[3]" />
              <span>{loading ? 'Descargando...' : 'Descargar informe'}</span>
            </div>
          </button>
        </form>
      </div>

      {/* Instrucciones adicionales (opcional) */}
      <div className="text-center text-sm text-gray-500">
        <p>El archivo descargado contendrá todos los datos personales registrados hasta la fecha.</p>
      </div>
    </div>
  )
}