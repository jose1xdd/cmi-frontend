'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function NuevaParcialidadPage() {
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [exito, setExito] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setMensaje('El nombre de la parcialidad es obligatorio')
      setExito(false)
      setShowModal(true)
      return
    }

    try {
      setLoading(true)
      const res = await apiFetch<{ estado: string; message: string }>(
        '/parcialidad/create',
        {
          method: 'POST',
          body: JSON.stringify({ nombre_parcialidad: nombre }),
        }
      )

      if (res.estado === 'Exitoso') {
        setMensaje(`Parcialidad "${nombre}" creada exitosamente`)
        setExito(true)
        setNombre('')
      } else {
        setMensaje(res.message || 'Error creando la parcialidad')
        setExito(false)
      }
    } catch {
      setMensaje('Error al crear la parcialidad')
      setExito(false)
    } finally {
      setLoading(false)
      setShowModal(true)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    if (exito) {
      router.push('/dashboard/parcialidades')
    }
  }

  return (
    <div className="p-4 sm:p-8 flex flex-col items-center">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-[#333]">
        Nueva parcialidad
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-4 w-full max-w-md"
      >
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la parcialidad"
          className="w-full border border-[#7d4f2b] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7d4f2b]"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded transition disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear parcialidad'}
        </button>
      </form>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-sm w-full text-center">
            <p className="mb-4">{mensaje}</p>
            <button
              onClick={handleCloseModal}
              className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
