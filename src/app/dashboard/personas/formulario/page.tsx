'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  GraduationCap,
  Briefcase,
  Users,
  Building,
  HelpCircle,
} from 'lucide-react'
import {
  enumEscolaridad,
  enumDocumento,
  enumSexo,
  enumParentesco,
} from '@/constants/enums'

interface ParcialidadResponse {
  items: Parcialidad[]
}

interface FamiliaResponse {
  items: Familia[]
}

// Tipos
interface Parcialidad {
  id: number
  nombre: string
}

interface Familia {
  id: number
  integrantes: number
}

interface PersonaPayload {
  id: string
  tipoDocumento: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  parentesco: string
  sexo: string
  profesion: string
  escolaridad: string
  direccion: string
  telefono: string
  idFamilia: number
  idParcialidad: number
}

interface FormularioPersonaPageProps {
  idPersona?: string // si es edición
  idFamilia?: number // si es para agregar a una familia existente
  esNuevaFamilia?: boolean // indica si se está creando una nueva familia con ese usuario como lider
  onClose: () => void
  onSuccess: (idPersona: string) => void // <-- Cambia la firma para recibir el ID
}

export default function FormularioPersonaPage({
  idPersona,
  idFamilia,
  esNuevaFamilia = false,
  onClose,
  onSuccess,
}: FormularioPersonaPageProps) {
  const esEdicion = !!idPersona

  const [data, setData] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: '',
    identificacion: '',
    nacimiento: '',
    sexo: '',
    direccion: '',
    telefono: '',
    escolaridad: '',
    profesion: '',
    parentesco: '',
    familia: idFamilia?.toString() || '', 
    parcialidad: '',
  })

  const [parcialidades, setParcialidades] = useState<Parcialidad[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [loading, setLoading] = useState(false)
  const [mensajeModal, setMensajeModal] = useState<string | null>(null)

  // Cargar datos si es edición
  useEffect(() => {
    if (esEdicion && idPersona) {
      setLoading(true)
      apiFetch<{
        nombre: string
        apellido: string
        tipoDocumento: string
        id: string
        fechaNacimiento: string
        sexo: string
        direccion: string
        telefono: string
        escolaridad: string
        profesion: string
        parentesco: string
        idFamilia?: number
        parcialidad?: { id?: number }
      }>(`/personas/${idPersona}`)
        .then((res) => {
          setData({
            nombre: res.nombre,
            apellido: res.apellido,
            tipoDocumento: res.tipoDocumento,
            identificacion: res.id,
            nacimiento: res.fechaNacimiento,
            sexo: res.sexo,
            direccion: res.direccion,
            telefono: res.telefono,
            escolaridad: res.escolaridad,
            profesion: res.profesion,
            parentesco: res.parentesco,
            familia: res.idFamilia?.toString() || '',
            parcialidad: res.parcialidad?.id?.toString() || '',
          })
        })
        .catch(() => setMensajeModal('Error al cargar los datos de la persona.'))
        .finally(() => setLoading(false))
    }
  }, [esEdicion, idPersona])

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

  const handleInputChange = (key: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const handleGuardar = async () => {
    const requiredFields = ['nombre', 'apellido', 'tipoDocumento', 'identificacion', 'nacimiento', 'sexo']
    for (const field of requiredFields) {
      if (!data[field as keyof typeof data]?.trim()) {
        setMensajeModal('Por favor complete todos los campos obligatorios.')
        return
      }
    }

    setLoading(true)
    try {
      const payload: PersonaPayload = {
        id: data.identificacion,
        tipoDocumento: data.tipoDocumento,
        nombre: data.nombre,
        apellido: data.apellido,
        fechaNacimiento: data.nacimiento,
        parentesco: data.parentesco,
        sexo: data.sexo,
        profesion: data.profesion,
        escolaridad: data.escolaridad,
        direccion: data.direccion,
        telefono: data.telefono,
        idFamilia: esNuevaFamilia ? null : (data.familia ? Number(data.familia) : idFamilia || null),
        idParcialidad: data.parcialidad ? Number(data.parcialidad) : 0,
      }

      let nuevaPersonaId: string

      if (esEdicion) {
        // Edición: usar idPersona
        await apiFetch(`/personas/${idPersona}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        nuevaPersonaId = idPersona // <-- En edición, el ID ya existe
      } else {
        // Creación: obtener ID de la respuesta
        const nuevaPersona = await apiFetch<Persona>('/personas/create', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        nuevaPersonaId = nuevaPersona.id // <-- Capturar el ID de la nueva persona
      }

      onSuccess(nuevaPersonaId) // <-- Devolver el ID de la persona creada o editada
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? (err as any).message
        : 'Error al guardar la persona.'
      setMensajeModal(msg)
    } finally {
      setLoading(false)
    }
  }

  // Tooltip reutilizable
  const Tooltip = ({ text }: { text: string }) => (
    <div className="relative group inline-block ml-1">
      <HelpCircle className="w-4 h-4 text-[#7d4f2b] cursor-pointer" />
      <div className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2 bg-black text-white text-xs rounded px-3 py-2 shadow-md min-w-[200px] max-w-sm text-left whitespace-normal z-20">
        {text}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Encabezado */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-[#2c3e50] text-center">
          {esEdicion ? 'Editar persona' : 'Crear nueva persona'}
        </h2>
      </div>

      {/* Formulario */}
      <div className="p-6 space-y-6">
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
              <option value="">Seleccionar</option>
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
              Identificación *
              <Tooltip text="Número único de identificación. En edición no puede cambiarse." />
            </label>
            <input
              value={data.identificacion}
              onChange={(e) => handleInputChange('identificacion', e.target.value)}
              disabled={esEdicion}
              className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent ${
                esEdicion ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="text-[#7d4f2b]" />
              Nombre *
              <Tooltip text="Escribe el nombre completo de la persona." />
            </label>
            <input
              value={data.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="text-[#7d4f2b]" />
              Apellido *
              <Tooltip text="Escribe los apellidos de la persona." />
            </label>
            <input
              value={data.apellido}
              onChange={(e) => handleInputChange('apellido', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>

          {/* Fecha nacimiento */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="text-[#7d4f2b]" />
              Fecha nacimiento *
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
              <MapPin size={16} className="text-[#7d4f2b]" />
              Dirección *
              <Tooltip text="Dirección de residencia de la persona." />
            </label>
            <input
              value={data.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="text-[#7d4f2b]" />
              Teléfono *
              <Tooltip text="Número de contacto de la persona." />
            </label>
            <input
              value={data.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
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
              value={data.profesion}
              onChange={(e) => handleInputChange('profesion', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>

          {/* Parentesco */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="text-[#7d4f2b]" />
              Parentesco *
              <Tooltip text="Relación de la persona con la familia registrada (padre, madre, hijo, etc.)." />
            </label>
            <select
              value={data.parentesco}
              onChange={(e) => handleInputChange('parentesco', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            >
              <option value="">Seleccionar</option>
              {Object.entries(enumParentesco).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Familia */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="text-[#7d4f2b]" />
              Familia
              <Tooltip text="Selecciona la familia a la que pertenece esta persona." />
            </label>
            <select
              value={data.familia}
              onChange={(e) => handleInputChange('familia', e.target.value)}
              // Deshabilitar si idFamilia fue pasado como prop
              disabled={!!idFamilia}
              className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent ${
                idFamilia ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">Seleccionar familia</option>
              {familias.map((f) => (
                <option key={f.id} value={f.id}>
                  Familia {f.id} ({f.integrantes} integrantes)
                </option>
              ))}
            </select>
            {/* Mensaje informativo si está deshabilitado */}
            {idFamilia && (
              <p className="text-xs text-gray-500 mt-1">
                Este campo está bloqueado porque la persona se agregará a la familia #{idFamilia}.
              </p>
            )}
          </div>

          {/* Parcialidad */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building size={16} className="text-[#7d4f2b]" />
              Parcialidad
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
        <div className="flex justify-center gap-4 pt-4">
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
            className="px-5 py-2.5 bg-[#7d4f2b] text-white rounded-lg hover:bg-[#5e3c1f] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Guardar'}
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
  )
}