// components/VerPersonaModal.tsx
import { X } from 'lucide-react'
import { enumDocumento, enumSexo } from '@/constants/enums'

interface Persona {
  id: string
  nombre: string
  apellido: string
  tipoDocumento: string
  fechaNacimiento: string
  sexo: string
  parcialidad?: { id: number; nombre: string } | null
  idFamilia?: number | null
}

interface VerPersonaModalProps {
  persona: Persona
  onClose: () => void
}

export default function VerPersonaModal({ persona, onClose }: VerPersonaModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-[#2c3e50] mb-5 text-center">Detalles de la persona</h2>

        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Nombre completo</span>
            <span className="text-gray-900">
              {persona.nombre} {persona.apellido}
            </span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Tipo de documento</span>
            <span className="text-gray-900">
              {enumDocumento[persona.tipoDocumento as keyof typeof enumDocumento] || persona.tipoDocumento}
            </span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Documento</span>
            <span className="text-gray-900 font-mono">{persona.id}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Fecha de nacimiento</span>
            <span className="text-gray-900">{persona.fechaNacimiento}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Sexo</span>
            <span className="text-gray-900">
              {enumSexo[persona.sexo as keyof typeof enumSexo] || persona.sexo}
            </span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Parcialidad</span>
            <span className="text-gray-900">
              {persona.parcialidad?.nombre || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Familia</span>
            <span className="text-gray-900">
              {persona.idFamilia ? `Familia ${persona.idFamilia}` : '—'}
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-[#7d4f2b] text-white px-5 py-2.5 rounded-lg hover:bg-[#5e3c1f] transition-colors w-full sm:w-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}