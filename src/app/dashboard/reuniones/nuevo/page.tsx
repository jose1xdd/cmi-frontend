'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function NuevaReunionPage() {
  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [ubicacion, setUbicacion] = useState('') // ✅ Nuevo campo
  const [loading, setLoading] = useState(false)
  const [showModalExito, setShowModalExito] = useState(false)

  const router = useRouter()

  // === CREAR REUNIÓN ===
  const agendarReunion = async () => {
    if (!titulo || !fecha || !horaInicio || !horaFin || !ubicacion) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    setLoading(true)
    try {
      await apiFetch<{
        estado: string
        message: string
        data: { id: number }
      }>(`/reunion/reunion/create`, {
        method: 'POST',
        body: JSON.stringify({
          titulo,
          fecha,
          horaInicio,
          horaFinal: horaFin,
          ubicacion, // ✅ Se envía en el body
        }),
      })

      setShowModalExito(true) // ✅ mostrar modal
    } catch (err) {
      console.error('Error agendando reunión', err)
      alert('No se pudo agendar la reunión')
    } finally {
      setLoading(false)
    }
  }

  const cerrarModalExito = () => {
    setShowModalExito(false)
    router.push('/dashboard/reuniones')
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-[#333]">
        Agendar reunión
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Título *</label>
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Fecha *</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Hora de inicio *</label>
          <input
            type="time"
            value={horaInicio}
            onChange={e => setHoraInicio(e.target.value)}
            className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Hora de fin *</label>
          <input
            type="time"
            value={horaFin}
            onChange={e => setHoraFin(e.target.value)}
            className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
            required
          />
        </div>
        {/* ✅ Nuevo input Ubicación */}
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Ubicación *</label>
          <input
            value={ubicacion}
            onChange={e => setUbicacion(e.target.value)}
            placeholder="Ej: Salón comunal, Oficina 101, etc."
            className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
            required
          />
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={agendarReunion}
          disabled={loading}
          className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Agendando...' : 'Agendar reunión'}
        </button>
      </div>

      {/* Modal éxito */}
      {showModalExito && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
            <p className="text-lg mb-6">Reunión creada con éxito</p>
            <button
              onClick={cerrarModalExito}
              className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
