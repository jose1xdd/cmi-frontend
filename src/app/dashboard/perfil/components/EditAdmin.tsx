'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import {
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Users,
  Building,
  HelpCircle,
  Key,
} from 'lucide-react'
import {
  enumEscolaridad,
  enumDocumento,
  enumSexo,
  enumParentesco,
} from '@/constants/enums'

interface FamiliaResponse {
  items: Familia[]
}

interface ParcialidadResponse {
  items: Parcialidad[]
}

interface EditarPerfilAdminProps {
  data: {
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
    familia: string
    parcialidad: string
  }
  onClose: () => void
  onSuccess: () => void
}

interface Parcialidad {
  id: number
  nombre: string
}

interface Familia {
  id: number
  integrantes: number
}

export default function EditarPerfilAdminModal({
  data,
  onClose,
  onSuccess,
}: EditarPerfilAdminProps) {
  const [form, setForm] = useState(data)
  const [parcialidades, setParcialidades] = useState<Parcialidad[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [loading, setLoading] = useState(false)
  const [mensajeModal, setMensajeModal] = useState<string | null>(null)

  // Cargar catálogos
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const dataParcialidades = await apiFetch<ParcialidadResponse>('/parcialidad/?page=1&page_size=100')
        setParcialidades(dataParcialidades.items)
        const dataFamilias = await apiFetch<FamiliaResponse>('/familias/?page=1&page_size=100')
        setFamilias(dataFamilias.items)
      } catch {
        setMensajeModal('Error al cargar opciones de parcialidad o familia.')
      }
    }
    cargarCatalogos()
  }, [])

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleGuardar = async () => {
    const required = ['nombre', 'apellido', 'tipoDocumento', 'identificacion', 'nacimiento', 'sexo', 'direccion', 'telefono']
    for (const field of required) {
      if (!form[field as keyof typeof form]?.trim()) {
        setMensajeModal('Por favor complete todos los campos obligatorios.')
        return
      }
    }

    setLoading(true)
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
      onSuccess()
    } catch {
      setMensajeModal('Error al guardar la información.')
    } finally {
      setLoading(false)
    }
  }

  const Tooltip = ({ text }: { text: string }) => (
    <div className="relative group inline-block ml-1">
      <HelpCircle className="w-4 h-4 text-[#7d4f2b] cursor-pointer" />
      <div className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2 bg-black text-white text-xs rounded px-3 py-2 shadow-md min-w-[200px] max-w-sm text-left whitespace-normal z-20">
        {text}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4 h-full">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[91vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#7d4f2b] flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#2c3e50]">Editar mi perfil</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="text-[#7d4f2b]" />
                Tipo de documento *
              </label>
              <select
                value={form.tipoDocumento}
                onChange={(e) => handleChange('tipoDocumento', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              >
                {Object.entries(enumDocumento).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <UserCircle size={16} className="text-[#7d4f2b]" />
                Identificación *
              </label>
              <input
                value={form.identificacion}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-100 text-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <UserCircle size={16} className="text-[#7d4f2b]" />
                Nombre *
              </label>
              <input
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <UserCircle size={16} className="text-[#7d4f2b]" />
                Apellido *
              </label>
              <input
                value={form.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="text-[#7d4f2b]" />
                Fecha de nacimiento *
              </label>
              <input
                type="date"
                value={form.nacimiento}
                onChange={(e) => handleChange('nacimiento', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Users size={16} className="text-[#7d4f2b]" />
                Sexo *
              </label>
              <select
                value={form.sexo}
                onChange={(e) => handleChange('sexo', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              >
                {Object.entries(enumSexo).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="text-[#7d4f2b]" />
                Dirección *
              </label>
              <input
                value={form.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="text-[#7d4f2b]" />
                Correo *
              </label>
              <input
                value={form.correo}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-100 text-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="text-[#7d4f2b]" />
                Teléfono *
              </label>
              <input
                value={form.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <GraduationCap size={16} className="text-[#7d4f2b]" />
                Escolaridad *
                <Tooltip text="Seleccione el nivel educativo alcanzado" />
              </label>
              <select
                value={form.escolaridad}
                onChange={(e) => handleChange('escolaridad', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              >
                {Object.entries(enumEscolaridad).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Briefcase size={16} className="text-[#7d4f2b]" />
                Profesión *
                <Tooltip text="Escriba su profesión u ocupación principal" />
              </label>
              <input
                value={form.profesion}
                onChange={(e) => handleChange('profesion', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Users size={16} className="text-[#7d4f2b]" />
                Parentesco *
                <Tooltip text="Seleccione el parentesco que tiene en su familia" />
              </label>
              <select
                value={form.parentesco}
                onChange={(e) => handleChange('parentesco', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              >
                {Object.entries(enumParentesco).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Building size={16} className="text-[#7d4f2b]" />
                Parcialidad *
                <Tooltip text="Seleccione la parcialidad correspondiente" />
              </label>
              <select
                value={form.parcialidad}
                onChange={(e) => handleChange('parcialidad', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
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
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={loading}
              className="px-5 py-2.5 bg-[#7d4f2b] text-white rounded-lg hover:bg-[#5e3c1f] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* Modal de mensaje */}
        {mensajeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
              <p className="text-gray-800 mb-4">{mensajeModal}</p>
              <button
                onClick={() => setMensajeModal(null)}
                className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f]"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}