'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function NuevaFamiliaPage() {
  const router = useRouter()
  const [idFamilia, setIdFamilia] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [mensajeModal, setMensajeModal] = useState('')

  const crearFamilia = async () => {
    if (!idFamilia) {
      setMensajeModal('Debes ingresar un número de familia')
      setShowModal(true)
      return
    }

    try {
      const res = await apiFetch<{ estado: string; message: string; data: string }>(
        '/familias/create',
        {
          method: 'POST',
          body: JSON.stringify({ idFamilia: Number(idFamilia) }),
        }
      )

      if (res.estado === 'Exitoso') {
        setMensajeModal('Familia creada con éxito')
        setShowModal(true)
      } else {
        setMensajeModal(res.message || 'Error al crear la familia')
        setShowModal(true)
      }
    } catch {
      setMensajeModal('Error al crear la familia')
      setShowModal(true)
    }
  }

  const cerrarModal = () => {
    setShowModal(false)
    router.push('/dashboard/familias')
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-[#333]">
        Nueva familia
      </h1>

      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-1">
          Número de familia
        </label>
        <input
          type="number"
          value={idFamilia}
          onChange={(e) => setIdFamilia(e.target.value)}
          className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
        />
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={crearFamilia}
          className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded"
        >
          Crear familia
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
            <p className="text-gray-800 mb-4">{mensajeModal}</p>
            <button
              onClick={cerrarModal}
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
