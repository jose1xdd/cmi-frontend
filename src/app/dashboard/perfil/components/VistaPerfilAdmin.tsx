'use client'

import { UserCircle, Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase, Users, Building, Key } from 'lucide-react'
import { enumDocumento, enumSexo, enumEscolaridad, enumParentesco } from '@/constants/enums'
import EditarPerfilAdminModal from './EditAdmin'
import { useState } from 'react'
import CambiarContrasenaModal from './CambiarContrasenaModal'

interface PerfilData {
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
  familia: string | number
  parcialidad: string
  rol?: 'admin' | 'usuario'
}

interface VistaPerfilProps {
  data: PerfilData
  recargarDatos: () => void
}

export default function VistaPerfil({ data, recargarDatos }: VistaPerfilProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCambiarContrasena, setShowCambiarContrasena] = useState(false)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tarjeta de perfil */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Encabezado con avatar */}
        <div className="bg-gradient-to-r from-[#7d4f2b] to-[#5e3c1f] p-6 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
            <UserCircle className="w-14 h-14 text-[#7d4f2b]" />
          </div>
          <h1 className="text-2xl font-bold text-white mt-4">
            {data.nombre} {data.apellido}
          </h1>
          <p className="text-[#f8f4f0] mt-1 uppercase text-sm font-medium">
            {data.rol === 'admin' ? 'Administrador' : 'Usuario'}
          </p>
        </div>

        {/* Información */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Documento */}
            <div className="flex items-start gap-3">
              <Mail className="mt-1 text-[#7d4f2b] flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Documento</p>
                <p className="font-medium">
                  {enumDocumento[data.tipoDocumento as keyof typeof enumDocumento] || data.tipoDocumento} •{' '}
                  <span className="font-mono">{data.identificacion}</span>
                </p>
              </div>
            </div>

            {/* Fecha de nacimiento */}
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 text-[#7d4f2b] flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Nacimiento</p>
                <p className="font-medium">{data.nacimiento}</p>
              </div>
            </div>

            {/* Sexo */}
            <div className="flex items-start gap-3">
              <Users className="mt-1 text-[#7d4f2b] flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Sexo</p>
                <p className="font-medium">
                  {enumSexo[data.sexo as keyof typeof enumSexo] || data.sexo}
                </p>
              </div>
            </div>

            {/* Contacto */}
            <div className="flex items-start gap-3">
              <Phone className="mt-1 text-[#7d4f2b] flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Contacto</p>
                <p className="font-medium">{data.correo} • {data.telefono}</p>
              </div>
            </div>

            {/* Dirección */}
            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="mt-1 text-[#7d4f2b] flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Dirección</p>
                <p className="font-medium">{data.direccion}</p>
              </div>
            </div>

            {/* Detalles adicionales */}
            <div className="flex items-start gap-3">
              <GraduationCap className="mt-1 text-[#7d4f2b] flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Escolaridad</p>
                <p className="font-medium">
                  {enumEscolaridad[data.escolaridad as keyof typeof enumEscolaridad] || data.escolaridad}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="mt-1 text-[#7d4f2b] flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Profesión</p>
                <p className="font-medium">{data.profesion}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-1 text-[#7d4f2b] flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Parentesco</p>
                <p className="font-medium">
                  {enumParentesco[data.parentesco as keyof typeof enumParentesco] || data.parentesco}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-1 text-[#7d4f2b] flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Familia</p>
                <p className="font-medium">
                  {data.familia ? `Familia ${data.familia}` : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building className="mt-1 text-[#7d4f2b] flex-shrink-0" size={18} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Parcialidad</p>
                <p className="font-medium">{data.parcialidad || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de acción (opcional) */}
      <div className="text-center flex mt-6">
        <button
          onClick={() => setShowEditModal(true)}
          className="text-[#7d4f2b] hover:text-[#5e3c1f] font-medium flex items-center gap-2 mx-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          Editar mi perfil
        </button>

        <button
        onClick={() => setShowCambiarContrasena(true)}
        className="text-[#7d4f2b] hover:text-[#5e3c1f] font-medium flex items-center gap-2 mx-auto"
        >
        <Key size={16} />
        Cambiar contraseña
        </button>
      </div>


      {showEditModal && (
        <EditarPerfilAdminModal
            data={data}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
            setShowEditModal(false)
            recargarDatos()
            }}
        />
      )}

      {showCambiarContrasena && (
        <CambiarContrasenaModal
            correo={data.correo}
            nombre={data.nombre}
            apellido={data.apellido}
            onClose={() => setShowCambiarContrasena(false)}
            onSuccess={() => {
            setShowCambiarContrasena(false)
            }}
        />
      )}

    </div>
  )
}