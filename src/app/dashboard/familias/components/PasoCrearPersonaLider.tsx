'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { User, Mail, Calendar, Users, Building, X, AlertCircle, Briefcase, GraduationCap } from 'lucide-react'
import { enumDocumento, enumSexo, enumParentesco, enumEscolaridad } from '@/constants/enums'
import { Tooltip } from '@/components/Tooltip'

// Asumiendo interfaces básicas, ajusta según tu estructura real
interface Parcialidad {
  id: number
  nombre: string
}

interface ParcialidadResponse {
  items: Parcialidad[]
}

interface PasoCrearPersonaLiderProps {
  onCancelar: () => void // Callback para volver al menú principal del modal
  onSuccess: any
}

export default function PasoCrearPersonaLider({
  onCancelar,
  onSuccess
}: PasoCrearPersonaLiderProps) {
  const [data, setData] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: 'CC',
    identificacion: '',
    nacimiento: '',
    sexo: '',
    direccion: '',
    telefono: '',
    escolaridad: '',
    profesion: '',
    parentesco: 'PA', // Líder por defecto
    parcialidad: '',
  })

  const [parcialidades, setParcialidades] = useState<Parcialidad[]>([])
  const [loading, setLoading] = useState(false)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  // Cargar catálogos al montar
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const dataParcialidades = await apiFetch<ParcialidadResponse>('/parcialidad/?page=1&page_size=100')
        setParcialidades(dataParcialidades.items || [])
      } catch (err) {
        console.error('Error al cargar parcialidades', err)
        setMensajeError('No se pudieron cargar las opciones de parcialidad.')
      }
    }
    cargarCatalogos()
  }, [])

  const handleInputChange = (key: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensajeError(null)
    setLoading(true)

    // Validación simple
    if (!data.nombre || !data.apellido || !data.tipoDocumento || !data.identificacion || !data.nacimiento || !data.sexo || !data.direccion || !data.telefono) {
      setMensajeError('Por favor completa todos los campos obligatorios.')
      setLoading(false)
      return
    }

    try {
      // 1. Crear la persona
      const payload = {
        id: data.identificacion,
        tipoDocumento: data.tipoDocumento,
        nombre: data.nombre,
        apellido: data.apellido,
        fechaNacimiento: data.nacimiento,
        parentesco: data.parentesco, // 'PA', 'MA', etc.
        sexo: data.sexo,
        profesion: data.profesion,
        escolaridad: data.escolaridad,
        direccion: data.direccion,
        telefono: data.telefono,
        idParcialidad: data.parcialidad ? Number(data.parcialidad) : 0,
      }

      const nuevaPersona = await apiFetch<any>('/personas/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const familiaRes = await apiFetch<{ id: number }>(`/familias/create`, {
        method: 'POST',
        body: JSON.stringify({
          "representante_id": data.identificacion,
          "estado": "ACTIVA"
        }),
      })

      const payload2 = {
        familia_id: Number(familiaRes.data.id), // convertir a número si tu API espera integer
        personas_id: [data.identificacion],       // arreglo de ids (strings según tu spec)
      }

      const res = await apiFetch<{ success?: boolean; message?: string }>(
        '/personas/assing-family',
        {
          method: 'PATCH',
          body: JSON.stringify(payload2),
        }
      )

      onSuccess()
    } catch (err: any) {
      console.error('Error al crear persona líder', err)
      setMensajeError(err.message || 'Error al crear la persona.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-bold text-yellow-800">Crear nueva persona como líder</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Se creará una nueva persona en el sistema que será designada como el líder de la nueva familia.
          </p>
        </div>
      </div>

      {mensajeError && (
        <div className="text-sm p-3 rounded-lg bg-red-50 text-red-700">
          {mensajeError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo Documento */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="text-[#7d4f2b]" />
              Tipo Documento *
              <Tooltip text="Selecciona el tipo de documento de la persona." />
            </label>
            <select
              value={data.tipoDocumento}
              onChange={(e) => handleInputChange('tipoDocumento', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
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
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="text-[#7d4f2b]" />
              Número de Documento *
              <Tooltip text="Número único de identificación de la persona." />
            </label>
            <input
              type="text"
              value={data.identificacion}
              onChange={(e) => handleInputChange('identificacion', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              placeholder="Ej: 123456789"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="text-[#7d4f2b]" />
              Nombres *
              <Tooltip text="Escribe el nombre completo de la persona." />
            </label>
            <input
              type="text"
              value={data.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              placeholder="Ej: José"
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="text-[#7d4f2b]" />
              Apellidos *
              <Tooltip text="Escribe los apellidos de la persona." />
            </label>
            <input
              type="text"
              value={data.apellido}
              onChange={(e) => handleInputChange('apellido', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              placeholder="Ej: Castillo Paguay"
            />
          </div>

          {/* Fecha Nacimiento */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="text-[#7d4f2b]" />
              Fecha de Nacimiento *
              <Tooltip text="Selecciona la fecha de nacimiento de la persona." />
            </label>
            <input
              type="date"
              value={data.nacimiento}
              onChange={(e) => handleInputChange('nacimiento', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>

          {/* Sexo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="text-[#7d4f2b]" />
              Sexo *
              <Tooltip text="Selecciona el sexo de la persona." />
            </label>
            <select
              value={data.sexo}
              onChange={(e) => handleInputChange('sexo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            >
              <option value="">Seleccionar</option>
              {Object.entries(enumSexo).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Dirección */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building size={16} className="text-[#7d4f2b]" />
              Dirección *
              <Tooltip text="Dirección de residencia de la persona." />
            </label>
            <input
              type="text"
              value={data.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              placeholder="Ej: Vereda El Carmen, Consacá"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="text-[#7d4f2b]" />
              Teléfono *
              <Tooltip text="Número de contacto de la persona." />
            </label>
            <input
              type="text"
              value={data.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              placeholder="Ej: +57 320 123 4567"
            />
          </div>

          {/* Escolaridad */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <GraduationCap size={16} className="text-[#7d4f2b]" />
              Escolaridad *
              <Tooltip text="Nivel de estudios alcanzado por la persona." />
            </label>
            <select
              value={data.escolaridad}
              onChange={(e) => handleInputChange('escolaridad', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            >
              <option value="">Seleccionar</option>
              {Object.entries(enumEscolaridad).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Profesión */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Briefcase size={16} className="text-[#7d4f2b]" />
              Profesión *
              <Tooltip text="Profesión u ocupación principal de la persona." />
            </label>
            <input
              type="text"
              value={data.profesion}
              onChange={(e) => handleInputChange('profesion', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              placeholder="Ej: Agricultor"
            />
          </div>

          {/* Parentesco (Líder predeterminado) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="text-[#7d4f2b]" />
              Parentesco *
              <Tooltip text="Relación de la persona con la familia. Selecciona 'Padre/Madre' para el líder." />
            </label>
            <select
              value={data.parentesco}
              onChange={(e) => handleInputChange('parentesco', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            >
              {Object.entries(enumParentesco).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Parcialidad */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building size={16} className="text-[#7d4f2b]" />
              Parcialidad *
              <Tooltip text="Selecciona la parcialidad o comunidad de la persona." />
            </label>
            <select
              value={data.parcialidad}
              onChange={(e) => handleInputChange('parcialidad', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            >
              <option value="">Seleccionar parcialidad</option>
              {parcialidades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancelar}
            className="px-5 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#7d4f2b] text-white rounded-lg hover:bg-[#5e3c1f] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creando...' : 'Crear Persona y Continuar'}
          </button>
        </div>
      </form>
    </div>
  )
}