'use client'

import { useState } from 'react'

export default function RecuperarContrasena() {
  const [nombre] = useState('Ana Marcela Rodríguez')
  const [correo] = useState('ana.rodz@gmail.com')
  const [contrasena, setContrasena] = useState('')

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)

  const handleCambiar = () => setMostrarConfirmacion(true)

  const confirmarCambio = () => {
    setMostrarConfirmacion(false)
    setMostrarExito(true)
  }

  return (
    <div className="w-full px-4 pt-9 flex justify-center items-start">
      <div className="w-full max-w-xl bg-white p-4 sm:p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold text-[#3a2a19] text-center mb-4">
          Recuperar contraseña
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-[#7d4f2b] mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              readOnly
              className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-gray-700 bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[#7d4f2b] mb-1">Correo</label>
            <input
              type="email"
              value={correo}
              readOnly
              className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-gray-700 bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[#7d4f2b] mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2 text-gray-700"
            />
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleCambiar}
              className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
            >
              Cambiar contraseña
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 pointer-events-auto">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
            <p className="mb-6 text-[#3a2a19]">
              ¿Está seguro de querer cambiar la contraseña del usuario <strong>{nombre}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmarCambio}
                className="bg-[#7d4f2b] text-white px-4 py-2 rounded hover:bg-[#5e3c1f]"
              >
                Aceptar
              </button>
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="bg-[#ccc] text-[#3a2a19] px-4 py-2 rounded hover:bg-[#bbb]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO */}
      {mostrarExito && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 pointer-events-auto">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
            <p className="mb-6 text-[#3a2a19]">La contraseña ha sido cambiada con éxito</p>
            <button
              onClick={() => setMostrarExito(false)}
              className="bg-[#7d4f2b] text-white px-4 py-2 rounded hover:bg-[#5e3c1f]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
