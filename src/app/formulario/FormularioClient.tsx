"use client";

import { useState, FormEvent, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Check, AlertCircle, User, Mail, Calendar, MapPin, Loader2, Info, Clock, RefreshCw } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

// Tipos
interface FormData {
  documento: string
  nombre: string
  correo: string
  telefono?: string
}

interface AsistenciaResponse {
  estado: 'Exitoso' | 'Fallido'
  mensaje: string
  data?: {
    id_registro: number
    fecha_registro: string
  }
}

// ✅ AGREGAR ESTE TIPO QUE FALTABA
interface Reunion {
  id: number
  titulo: string
  fecha: string
  horaInicio: string
  horaFinal: string
  ubicacion: string
  estado: string
}

export default function RegistroAsistenciaPage() {
  const [formData, setFormData] = useState<FormData>({
    documento: '',
    nombre: '',
    correo: '',
  })

  const searchParams = useSearchParams()
  const reunionId = Number(searchParams.get('id'))

  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [loading, setLoading] = useState(false) // ✅ Para el formulario
  const [mensaje, setMensaje] = useState<{ tipo: 'info' | 'error'; texto: string } | null>(null)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [datosConfirmados, setDatosConfirmados] = useState<FormData & { hora: string }>({
    documento: '',
    nombre: '',
    correo: '',
    telefono: '',
    hora: '',
  })

  const [reunion, setReunion] = useState<Reunion | null>(null);
  const [cargandoReunion, setCargandoReunion] = useState(true); // ✅ Nuevo estado para carga de reunión

  // === OBTENER UNA REUNIÓN ESPECÍFICA ===
  const fetchReunion = async (reunionId: number) => {
    setCargandoReunion(true); // ✅ Usar el estado correcto
    try {
      const data = await apiFetch<Reunion>(`/reunion/reunion/${reunionId}`);
      console.log(data);
      setReunion(data);
    } catch (err) {
      console.error('Error cargando reunión', err);
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar la información de la reunión' });
    } finally {
      setCargandoReunion(false); // ✅ Usar el estado correcto
    }
  }

  useEffect(() => {
    if (reunionId) {
      fetchReunion(reunionId)
    }
  }, [reunionId])

  // ✅ Función para formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // ✅ Función para formatear hora
  const formatearHora = (hora: string) => {
    return new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Validaciones
  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.documento.trim()) {
      newErrors.documento = 'El número de documento es obligatorio.'
    } else if (formData.documento.length < 6 || formData.documento.length > 12 || !/^\d+$/.test(formData.documento)) {
      newErrors.documento = 'Documento inválido. Usa entre 6 y 12 dígitos.'
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio.'
    } else if (formData.nombre.trim().split(' ').length < 2) {
      newErrors.nombre = 'Por favor ingresa nombre y apellido.'
    }

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es obligatorio.'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.correo)) {
        newErrors.correo = 'Correo electrónico no válido.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Si es el campo de documento, solo permite números
    if (name === 'documento') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    // Limpiar error si se está escribiendo
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    setMensaje(null)

    try {
      const res = await apiFetch<AsistenciaResponse>(`/asistencia/asistencia/user-assign/${reunionId}`, {
        method: 'POST',
        body: JSON.stringify({
          // ✅ CAMBIAR A LOS NOMBRES QUE ESPERA EL BACKEND
          numero_documento: formData.documento, // "documento" → "numero_documento"
          nombre_completo: formData.nombre,     // "nombre" → "nombre_completo"  
          correo_electronico: formData.correo   // "correo" → "correo_electronico"
        }),
      })

      if (res.estado === 'Exitoso') {
        setDatosConfirmados({
          ...formData,
          hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        })
        setMostrarExito(true)
      } else {
        setMensaje({ tipo: 'error', texto: res.mensaje || 'Error desconocido.' })
      }
    } catch (err: any) {
      console.error('Error al registrar asistencia', err)
      setMensaje({ tipo: 'error', texto: err.message || 'Error de conexión.' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ documento: '', nombre: '', correo: '', telefono: '' })
    setErrors({})
    setMensaje(null)
    setMostrarExito(false)
  }

  // ✅ Mostrar loading mientras carga la reunión
  if (cargandoReunion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#8B5A3C] to-[#6D4428] flex items-center justify-center p-4">
        <div className="text-white text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} />
          <p>Cargando información de la reunión...</p>
        </div>
      </div>
    )
  }

  // ✅ Mostrar error si no hay reunión
  if (!reunion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#8B5A3C] to-[#6D4428] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Reunión no encontrada</h2>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información de la reunión solicitada.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-[#8B5A3C] text-white rounded-lg hover:bg-[#6D4428] transition-colors"
          >
            Volver atrás
          </button>
        </div>
      </div>
    )
  }

  if (mostrarExito) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#8B5A3C] to-[#6D4428] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Encabezado */}
          <div className="bg-white p-6 text-center border-b">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#2c3e50]">¡Asistencia Registrada!</h2>
            <p className="text-gray-600 mt-2">
              Tu presencia ha sido confirmada exitosamente
            </p>
          </div>

          {/* Detalles */}
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium text-gray-800">{datosConfirmados.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documento:</span>
                <span className="font-mono font-medium text-gray-800">{datosConfirmados.documento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Correo:</span>
                <span className="font-medium text-gray-800 truncate max-w-[150px]">{datosConfirmados.correo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hora de registro:</span>
                <span className="font-medium text-gray-800">{datosConfirmados.hora}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 bg-[#7d4f2b] text-white rounded-lg hover:bg-[#5e3c1f] transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} className="stroke-[3]" />
              Registrar Otra Asistencia
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B5A3C] to-[#6D4428] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Tarjeta de encabezado */}
        <div className="bg-white rounded-t-xl shadow-lg p-6 text-center">
          <div className="flex justify-center py-4">
            <Image src="/quillacinga.png" alt="Logo" width={100} height={100} />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] mb-2">Registro de Asistencia</h1>
          <p className="text-gray-600">
            Confirma tu asistencia a la reunión ingresando tus datos
          </p>

          {/* ✅ Información de la reunión - AHORA DINÁMICA */}
          <div className="mt-5 bg-gray-50 p-4 rounded-lg text-left text-sm text-gray-700 space-y-2">
            <div className="flex items-center gap-3">
              <Calendar className="text-[#8B5A3C]" size={18} />
              <span><strong>Reunión:</strong> {reunion.titulo}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="text-[#8B5A3C]" size={18} />
              <span><strong>Lugar:</strong> {reunion.ubicacion}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="text-[#8B5A3C]" size={18} />
              <span>
                <strong>Fecha:</strong> {formatearFecha(reunion.fecha)} - {formatearHora(reunion.horaInicio)}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-white rounded-b-xl shadow-lg p-6 -mt-6">
          {mensaje && (
            <div className={`p-3 rounded-lg mb-4 flex items-start gap-3 text-sm ${
              mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {mensaje.tipo === 'error' ? (
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              ) : (
                <Info size={18} className="flex-shrink-0 mt-0.5 text-blue-600" />
              )}
              <span>{mensaje.texto}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg text-sm text-blue-800">
              <p className="font-medium">Instrucciones:</p>
              <p className="mt-1">
                Completa todos los campos requeridos para registrar tu asistencia. 
                Los datos ingresados deben coincidir con tu registro en la comunidad.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="text-[#8B5A3C]" />
                Número de Documento *
              </label>
              <input
                type="text"
                name="documento"
                value={formData.documento}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#8B5A3C] focus:border-transparent ${
                  errors.documento ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingresa tu número de documento"
              />
              {errors.documento && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.documento}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Ingresa solo números, sin puntos ni espacios
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="text-[#8B5A3C]" />
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#8B5A3C] focus:border-transparent ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingresa tu nombre completo"
              />
              {errors.nombre && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.nombre}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="text-[#8B5A3C]" />
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#8B5A3C] focus:border-transparent ${
                  errors.correo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ejemplo@correo.com"
              />
              {errors.correo && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.correo}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#8B5A3C] text-white rounded-lg hover:bg-[#6D4428] disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Registrando...
                </>
              ) : (
                <>
                  <Check size={18} className="stroke-[3]" />
                  Registrar Asistencia
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-white text-opacity-80 text-center text-xs mt-6">
          © 2025 Comunidad Quillacinga - Sistema de Registro de Asistencia
        </p>
      </div>
    </div>
  )
}