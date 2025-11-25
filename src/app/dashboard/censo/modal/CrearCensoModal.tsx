// CrearCensoModal.tsx

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Plus, MapPin, X, AlertTriangle, Info, Loader2, Save, AlertCircle, FileText, Calendar } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'
import DatePicker from "react-datepicker"

interface CrearCensoModalProps {
  onClose: () => void
  onSuccess: () => void
  tipoCrearModal: 'borrador' | 'definitivo'
}

export default function CrearCensoModal({
  onClose,
  onSuccess,
  tipoCrearModal,
}: CrearCensoModalProps) {
  const [anio, setAnio] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensajeError(null)

    if (!anio.trim()) {
      setMensajeError('El año del censo es obligatorio.')
      return
    }

    const anioNum = Number(anio)
    if (isNaN(anioNum) || anioNum < 2000 || anioNum > 2100) {
      setMensajeError('Por favor ingresa un año válido (entre 2000 y 2100).')
      return
    }

    setLoading(true)
    try {
      // Endpoint correcto
      const payload = {
        anio: anioNum,
        usuario: 'usuario_actual', // <-- Obtener del contexto de auth o usar email del token
        esPrueba: tipoCrearModal === 'borrador', // 'borrador' => true, 'definitivo' => false
      }

      await apiFetch('/censo/generar', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      onSuccess()
    } catch (err: any) {
      console.error('Error al generar censo', err)
      // El backend probablemente devuelve un objeto con `message`
      let msg = 'Error al generar el censo.'
      if (err?.mensaje) {
        msg = err.mensaje
      } else if (err?.message) {
        msg = err.message
      } else if (typeof err === 'string') {
        msg = err
      }
      setMensajeError(msg)
    } finally {
      setLoading(false)
    }
  }

  const titulo = tipoCrearModal === 'borrador' ? 'Generar Censo Borrador' : 'Generar Censo Definitivo'
  const colorBoton = tipoCrearModal === 'borrador' ? 'bg-[#7d4f2b]' : 'bg-green-600'
  const textoAlerta = tipoCrearModal === 'borrador'
    ? 'Los censos borradores pueden ser editados y eliminados posteriormente.'
    : '⚠️ Los censos definitivos NO pueden ser eliminados una vez generados. Esta acción es permanente.'

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Encabezado */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${colorBoton} flex items-center justify-center`}>
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-[#2c3e50]">{titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Alerta */}
          <div className={`p-3 rounded-lg flex items-start gap-3 text-sm ${
            tipoCrearModal === 'borrador' ? 'bg-blue-50 text-blue-800' : 'bg-yellow-50 text-yellow-800'
          }`}>
            {tipoCrearModal === 'borrador' ? (
              <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
            ) : (
              <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={16} />
            )}
            <div>{textoAlerta}</div>
          </div>

          {/* Campo: Año */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="text-[#7d4f2b]" />
              Año del censo *
              <Tooltip text="Ingresa el año al que corresponderá el censo." />
            </label>
<DatePicker
  selected={anio ? new Date(`${anio}-01-01`) : null}
  onChange={(date) => setAnio(date?.getFullYear().toString() ?? '')}
  showYearPicker
  dateFormat="yyyy"
  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 
             focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
/>

          </div>

          {/* Mensaje de error */}
          {mensajeError && (
            <div className="text-sm p-3 rounded-lg bg-red-50 text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {mensajeError}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                tipoCrearModal === 'borrador'
                  ? 'bg-[#7d4f2b] hover:bg-[#5e3c1f]'
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Generando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {tipoCrearModal === 'borrador' ? 'Generar Borrador' : 'Generar Definitivo'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}