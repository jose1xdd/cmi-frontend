'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import {
  enumEscolaridad,
  enumDocumento,
  enumSexo,
  enumParentesco,
} from '@/constants/enums'

interface AdminData {
  nombre: string
  apellido: string
  tipoDocumento: string
  identificacion: string
  nacimiento: string
  sexo: string
  direccion: string
  correo: string
  telefono: string
  escolaridad: string
  profesion: string
  parentesco: string
  integrantes: string
  familia: string
  parcialidad: string
}

interface PerfilAdminProps {
  data: AdminData
}

interface Parcialidad {
  id: number
  nombre: string
}

interface Familia {
  id: number
  integrantes: number
}

export default function PerfilAdmin({ data }: PerfilAdminProps) {
  const router = useRouter()
  const [form, setForm] = useState(data)
  const [showModal, setShowModal] = useState(false)

  const [parcialidades, setParcialidades] = useState<Parcialidad[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])

  useEffect(() => {
    apiFetch<{ items: Parcialidad[] }>('/parcialidad/?page=1&page_size=100')
      .then((res) => setParcialidades(res.items))
      .catch(() => setParcialidades([]))

    apiFetch<{ items: Familia[] }>('/familias/?page=1&page_size=100')
      .then((res) => setFamilias(res.items))
      .catch(() => setFamilias([]))
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleGuardar = async () => {
    try {
      await apiFetch(`/personas/${form.identificacion}`, {
        method: 'PUT',
        body: JSON.stringify({
          tipoDocumento: form.tipoDocumento,
          nombre: form.nombre,
          apellido: form.apellido,
          fechaNacimiento: form.nacimiento,
          parentesco: form.parentesco,
          sexo: form.sexo,
          profesion: form.profesion,
          escolaridad: form.escolaridad,
          direccion: form.direccion,
          telefono: form.telefono,
          idFamilia: form.familia ? Number(form.familia) : 0,
          idParcialidad: form.parcialidad ? Number(form.parcialidad) : 0,
          activo: true,
        }),
      })
      setShowModal(true)
    } catch {
      alert('Error al guardar la información')
    }
  }

  const closeModal = () => setShowModal(false)

  return (
    <div className="w-full px-4 pt-5">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl border-4 border-[#7d4f2b]">
            👤
          </div>
        </div>

        {/* Formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de documento */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">
              Tipo de documento
            </label>
            <select
              name="tipoDocumento"
              value={form.tipoDocumento}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            >
              {Object.entries(enumDocumento).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Identificación */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">
              Identificación
            </label>
            <input
              name="identificacion"
              value={form.identificacion}
              readOnly
              className="w-full border border-[#7d4f2b] rounded px-3 py-2 bg-gray-100"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Apellido</label>
            <input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Fecha de nacimiento */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              name="nacimiento"
              value={form.nacimiento}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Sexo */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Sexo</label>
            <select
              name="sexo"
              value={form.sexo}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            >
              {Object.entries(enumSexo).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Dirección */}
          <div className="md:col-span-2">
            <label className="block text-sm text-[#7d4f2b] mb-1">Dirección</label>
            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Correo</label>
            <input
              name="correo"
              value={form.correo}
              readOnly
              className="w-full border border-[#7d4f2b] rounded px-3 py-2 bg-gray-100"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Escolaridad */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Escolaridad</label>
            <select
              name="escolaridad"
              value={form.escolaridad}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            >
              {Object.entries(enumEscolaridad).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Profesión */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Profesión</label>
            <input
              name="profesion"
              value={form.profesion}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Parentesco */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Parentesco</label>
            <select
              name="parentesco"
              value={form.parentesco}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            >
              {Object.entries(enumParentesco).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Familia */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Familia</label>
            <select
              name="familia"
              value={form.familia}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            >
              <option value="">Seleccione familia</option>
              {familias.map((f) => (
                <option key={f.id} value={f.id}>
                  {`${f.id}`}
                </option>
              ))}
          </select>
          </div>

          {/* Parcialidad */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Parcialidad</label>
            <select
              name="parcialidad"
              value={form.parcialidad}
              onChange={handleChange}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            >
              <option value="">Seleccione parcialidad</option>
              {parcialidades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col md:flex-row justify-center gap-6 mt-4">
          <button
            onClick={handleGuardar}
            className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
          >
            Guardar información
          </button>
          <button
            className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
            onClick={() => router.push('/dashboard/perfil/recuperar')}
          >
            Recuperar contraseña
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white px-8 py-6 rounded shadow-md w-80 text-center">
            <p className="text-gray-800 mb-4">
              Su información ha sido actualizada con éxito
            </p>
            <button
              onClick={closeModal}
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
