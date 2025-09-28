'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircle } from 'lucide-react'

interface UsuarioData {
  nombre: string
  apellido: string
  tipoDocumento: string
  identificacion: string
  nacimiento: string
  sexo: string
  direccion: string
  correo: string
  telefono: string
}

interface PerfilUsuarioProps {
  data: UsuarioData
}

export default function PerfilUsuario({ data }: PerfilUsuarioProps) {
  const [form] = useState(data)
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'usuario' | null>(null)
  const router = useRouter()

  useEffect(() => {
    const tipo = localStorage.getItem('tipoUsuario') as 'admin' | 'usuario' | null
    setTipoUsuario(tipo)
  }, [])

  const handleRecuperar = () => {
    router.push('/dashboard/perfil/recuperar')
  }

  return (
    <div className="w-full px-4 pt-5">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-[#7d4f2b] shadow-md">
            <UserCircle className="w-16 h-16 text-[#7d4f2b]" />
          </div>
          <p
            className={`mt-2 text-sm font-semibold uppercase ${
              tipoUsuario === 'admin' ? 'text-black-600' : 'text-black-600'
            }`}
          >
            {tipoUsuario || 'USUARIO'}
          </p>
        </div>

        {/* Formulario (solo lectura) */}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-1 text-[#7d4f2b]">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              readOnly
              className="w-full border border-[#b57d50] rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#7d4f2b]">Apellido</label>
            <input
              name="apellido"
              value={form.apellido}
              readOnly
              className="w-full border border-[#b57d50] rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#7d4f2b]">
              Tipo de documento
            </label>
            <input
              name="tipoDocumento"
              value={form.tipoDocumento}
              readOnly
              className="w-full border border-[#b57d50] rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#7d4f2b]">
              Identificación
            </label>
            <input
              name="identificacion"
              value={form.identificacion}
              readOnly
              className="w-full border border-[#b57d50] rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#7d4f2b]">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              name="nacimiento"
              value={form.nacimiento}
              readOnly
              className="w-full border border-[#b57d50] rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#7d4f2b]">Sexo</label>
            <input
              name="sexo"
              value={form.sexo}
              readOnly
              className="w-full border border-[#b57d50] rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 text-[#7d4f2b]">Dirección</label>
            <input
              name="direccion"
              value={form.direccion}
              readOnly
              className="w-full border border-[#b57d50] rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#7d4f2b]">Correo</label>
            <input
              name="correo"
              value={form.correo}
              readOnly
              className="w-full border border-[#b57d50] rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#7d4f2b]">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              readOnly
              className="w-full border border-[#b57d50] rounded px-3 py-2 bg-gray-100"
            />
          </div>
        </form>

        {/* Botón recuperar contraseña */}
        <div className="mt-4 flex justify-center w-full">
          <button
            type="button"
            onClick={handleRecuperar}
            className="bg-[#7d4f2b] hover:bg-[#7b4317] text-white px-8 py-2 rounded-lg font-semibold transition-colors"
          >
            Cambiar contraseña
          </button>
        </div>
      </div>
    </div>
  )
}
