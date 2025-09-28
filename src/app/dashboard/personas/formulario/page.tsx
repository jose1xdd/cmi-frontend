'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { HelpCircle } from 'lucide-react'
import {
  enumEscolaridad,
  enumDocumento,
  enumSexo,
  enumParentesco,
} from '@/constants/enums'

interface Persona {
  nombre: string
  apellido: string
  tipoDocumento: string
  identificacion: string
  nacimiento: string
  sexo: string
  direccion: string
  telefono: string
  escolaridad: string
  profesion: string
  parentesco: string
  familia: string
  parcialidad: string
}

interface Parcialidad {
  id: number
  nombre: string
}

interface Familia {
  id: number
  integrantes: number
}

export default function FormularioPersonaPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const idPersona = searchParams.get('id') || undefined
  const esEdicion = !!idPersona

  const [showModal, setShowModal] = useState(false)
  const [parcialidades, setParcialidades] = useState<Parcialidad[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])

  const [data, setData] = useState<Persona>({
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
    familia: '',
    parcialidad: '',
  })

  // Cargar datos de la persona en edición
  useEffect(() => {
    if (esEdicion) {
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
        .then((res) =>
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
        )
        .catch(() => console.error('Error cargando persona'))
    }
  }, [esEdicion, idPersona])

  // Cargar parcialidades y familias
  useEffect(() => {
    apiFetch<{ items: Parcialidad[] }>('/parcialidad/?page=1&page_size=100')
      .then((res) => setParcialidades(res.items))
      .catch(() => setParcialidades([]))

    apiFetch<{ items: Familia[] }>('/familias/?page=1&page_size=100')
      .then((res) => setFamilias(res.items))
      .catch(() => setFamilias([]))
  }, [])

  const handleInputChange = (key: keyof Persona, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const handleGuardar = async () => {
    try {
      const payload = {
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
        idFamilia: data.familia ? Number(data.familia) : 0,
        idParcialidad: data.parcialidad ? Number(data.parcialidad) : 0,
      }

      if (esEdicion) {
        await apiFetch(`/personas/${idPersona}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/personas/create', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      setShowModal(true)
    } catch {
      alert('Error al guardar la persona')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    router.push('/dashboard/personas')
  }

  function Tooltip({ text, color = '#7d4f2b' }: { text: string; color?: string }) {
    return (
      <div className="relative group inline-block ml-1">
        <HelpCircle className="w-4 h-4 cursor-pointer" style={{ color }} />
        <div
          className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2
                    bg-black text-white text-xs rounded px-3 py-2 shadow-md 
                    min-w-[200px] max-w-sm text-left whitespace-normal z-20"
        >
          {text}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 pt-5">
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-center text-[#7d4f2b]">
          {esEdicion ? 'Editar persona' : 'Crear nueva persona'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo Documento */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Tipo Documento <Tooltip text="Selecciona el tipo de documento de la persona." />
            </label>
            <select
              value={data.tipoDocumento}
              onChange={(e) => handleInputChange('tipoDocumento', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
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
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Identificación <Tooltip text="Número único de identificación. En edición no puede cambiarse." />
            </label>
            <input
              value={data.identificacion}
              onChange={(e) => handleInputChange('identificacion', e.target.value)}
              readOnly={esEdicion}
              className={`w-full border border-[#7d4f2b] rounded px-3 py-2 ${
                esEdicion ? 'bg-gray-100' : ''
              }`}
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Nombre <Tooltip text="Escribe el nombre completo de la persona." />
            </label>
            <input
              value={data.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Apellido <Tooltip text="Escribe los apellidos de la persona." />
            </label>
            <input
              value={data.apellido}
              onChange={(e) => handleInputChange('apellido', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Fecha nacimiento */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Fecha nacimiento <Tooltip text="Selecciona la fecha de nacimiento de la persona." />
            </label>
            <input
              type="date"
              value={data.nacimiento}
              onChange={(e) => handleInputChange('nacimiento', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Sexo */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Sexo <Tooltip text="Selecciona el sexo de la persona." />
            </label>
            <select
              value={data.sexo}
              onChange={(e) => handleInputChange('sexo', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
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
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Dirección <Tooltip text="Dirección de residencia de la persona." />
            </label>
            <input
              value={data.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Teléfono <Tooltip text="Número de contacto de la persona." />
            </label>
            <input
              value={data.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Escolaridad */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Escolaridad <Tooltip text="Nivel de estudios alcanzado por la persona." />
            </label>
            <select
              value={data.escolaridad}
              onChange={(e) => handleInputChange('escolaridad', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
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
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Profesión <Tooltip text="Profesión u ocupación principal de la persona." />
            </label>
            <input
              value={data.profesion}
              onChange={(e) => handleInputChange('profesion', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* Parentesco */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Parentesco <Tooltip text="Relación de la persona con la familia registrada (padre, madre, hijo, etc.)." />
            </label>
            <select
              value={data.parentesco}
              onChange={(e) => handleInputChange('parentesco', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
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
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Familia <Tooltip text="Selecciona la familia a la que pertenece esta persona." />
            </label>
            <select
              value={data.familia}
              onChange={(e) => handleInputChange('familia', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            >
              <option value="">Seleccionar familia</option>
              {familias.map((f) => (
                <option key={f.id} value={f.id}>
                  Familia {f.id} ({f.integrantes} integrantes)
                </option>
              ))}
            </select>
          </div>

          {/* Parcialidad */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1 flex items-center">
              Parcialidad <Tooltip text="Selecciona la parcialidad o comunidad de la persona." />
            </label>
            <select
              value={data.parcialidad}
              onChange={(e) => handleInputChange('parcialidad', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
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

        <div className="flex justify-center mt-6">
          <button
            onClick={handleGuardar}
            className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
          >
            {esEdicion ? 'Actualizar persona' : 'Guardar persona'}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white px-8 py-6 rounded shadow-md w-80 text-center">
            <p className="text-gray-800 mb-4">
              {esEdicion
                ? 'Persona actualizada con éxito'
                : 'Persona registrada con éxito'}
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
