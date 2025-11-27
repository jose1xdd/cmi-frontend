'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import * as XLSX from "xlsx"
import { apiFetch } from '@/lib/api'
import { QRCodeCanvas } from "qrcode.react";
import {
  Users,
  X,
  ChevronLeft,
  Check,
  Edit3,
  Download,
  Info,
  Lock,
  Copy,
  Printer,
  Save,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react'

// Tipos
interface Reunion {
  id: number
  titulo: string
  fecha: string // YYYY-MM-DD
  horaInicio: string // HH:mm
  horaFinal: string // HH:mm
  ubicacion: string
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CERRADA'
  codigo?: string
  descripcion?: string
  asistentes?: number
}

interface Asistente {
  Numero_documento: string
  Nombre: string
  Apellido: string
  Asistencia: boolean
}

function generarCodigoReunion() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';

  const parteLetras = Array.from({ length: 3 }, () =>
    letras[Math.floor(Math.random() * letras.length)]
  ).join('');

  const parteNumeros = Array.from({ length: 3 }, () =>
    numeros[Math.floor(Math.random() * numeros.length)]
  ).join('');

  return parteLetras + parteNumeros;
}


export default function DetalleReunionPage() {
  const router = useRouter()
  const params = useParams()
  const reunionId = Number(params.id)

  // Estados
  const [reunionOriginal, setReunionOriginal] = useState<Reunion | null>(null) // Datos originales
  const [reunion, setReunion] = useState<Reunion | null>(null) // Datos editables
  const [asistentes, setAsistentes] = useState<Asistente[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAsistentes, setLoadingAsistentes] = useState(true)
  const [mensajeError, setMensajeError] = useState<string | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [codigo, setCodigo] = useState(generarCodigoReunion())

  // Estados para acciones
  const [mensajeModal, setMensajeModal] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [asistentesFiltrados, setAsistentesFiltrados] = useState<Asistente[]>([])

  // === Cargar datos ===
  const fetchReunion = async () => {
    setLoading(true)
    setMensajeError(null)
    try {
      const data = await apiFetch<Reunion>(`/reunion/reunion/${reunionId}`)
      setReunion(data)
      setReunionOriginal(data)
    } catch (err: any) {
      console.error('Error al cargar reunión', err)
      setMensajeError(err.message || 'No se pudo cargar la información de la reunión.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAsistentes = async () => {
    setLoadingAsistentes(true)
    try {
      const data = await apiFetch<{ items: Asistente[] }>(`/asistencia/asistencia/${reunionId}/personas`)
      setAsistentes(data.items || [])
    } catch (err) {
      console.error('Error al cargar asistentes', err)
      setAsistentes([])
    } finally {
      setLoadingAsistentes(false)
    }
  }

  useEffect(() => {
    if (reunionId) {
      fetchReunion()
      fetchAsistentes()
    }
  }, [reunionId])

  // Filtrar asistentes cuando cambia la búsqueda
  useEffect(() => {
    const filtrados = asistentes.filter(a =>
      a.Nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.Apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.Numero_documento.includes(busqueda)
    )
    setAsistentesFiltrados(filtrados)
  }, [asistentes, busqueda])

  // === Funciones de acción ===

  const handleEditar = () => setModoEdicion(true)

  const handleCancelarEdicion = () => {
    setModoEdicion(false)
    // Revertir cambios: restaurar los datos originales
    if (reunionOriginal) {
      setReunion({ ...reunionOriginal })
    }
  }

  const handleGuardar = async () => {
    if (!reunion) return
    try {
      // Asegúrate de que los campos obligatorios no estén vacíos
      if (!reunion.titulo || !reunion.fecha || !reunion.horaInicio || !reunion.horaFinal) {
        setMensajeModal('Por favor complete todos los campos obligatorios.')
        setShowSuccessModal(true)
        return
      }

      const payload = {
        id: reunion.id, // Asegúrate de no sobrescribir el ID
        titulo: reunion.titulo,
        fecha: reunion.fecha,
        horaInicio: reunion.horaInicio,
        horaFinal: reunion.horaFinal,
        ubicacion: reunion.ubicacion,
        estado: reunion.estado, // Si el estado no debe cambiar, envíalo igual
        // Añade aquí otros campos que puedan ser editables
      }

      await apiFetch(`/reunion/reunion/${reunion.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      setModoEdicion(false)
      setMensajeModal('Reunión actualizada con éxito.')
      setShowSuccessModal(true)
      // Opcional: recargar datos para reflejar cambios si es necesario
      // fetchReunion()
    } catch (err: any) {
      console.error('Error al guardar reunión', err)
      setMensajeModal(err.message || 'No se pudieron guardar los cambios.')
      setShowSuccessModal(true)
    }
  }

  const handleCerrarReunion = async () => {
    if (!reunion) return
    if (!confirm(`¿Estás seguro de que deseas cerrar la reunión "${reunion.titulo}"?\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      await apiFetch(`/reunion/reunion/${reunion.id}/cerrar`, { method: 'PATCH' })
      setMensajeModal('Reunión cerrada exitosamente.')
      setShowSuccessModal(true)
      fetchReunion() // Refrescar estado
    } catch (err: any) {
      console.error('Error al cerrar reunión', err)
      setMensajeModal(err.message || 'No se pudo cerrar la reunión.')
      setShowSuccessModal(true)
    }
  }

  const handleAbrirReunion = async () => {
    if (!reunion) return
    if (!confirm(`¿Estás seguro de que deseas abrir la reunión "${reunion.titulo}"?\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      await apiFetch(`/reunion/reunion/${reunion.id}/abrir`, { method: 'PATCH' })
      setMensajeModal('Reunión abierta exitosamente.')
      setShowSuccessModal(true)
      fetchReunion() // Refrescar estado
    } catch (err: any) {
      console.error('Error al abrir reunión', err)
      setMensajeModal(err.message || 'No se pudo abrir la reunión.')
      setShowSuccessModal(true)
    }
  }

  const handleDescargarInforme = async () => {
    if (!reunion?.id) {
      setMensajeModal("No se puede descargar el informe: ID de reunión no disponible.")
      setShowSuccessModal(true)
      return
    }

    try {
      // 1. Obtener token
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de sesión.')
      }

      // 2. Hacer la solicitud al endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-quillacinga.ddns.net/cmi-apigateway'}/reportes/reporte/asistencia/${reunion.id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            // No se necesita Accept: 'application/json' si el backend devuelve el archivo directamente
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      // 3. Obtener el blob del archivo
      const blob = await response.blob()

      // 4. Crear URL y enlace para descargar
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Opcional: extraer nombre del archivo del header 'content-disposition'
      const disposition = response.headers.get('Content-Disposition')
      let filename = `informe_asistencia_reunion_${reunion.id}.xlsx` // nombre por defecto
      if (disposition && disposition.includes('attachment')) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        const matches = filenameRegex.exec(disposition)
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '')
        }
      }
      link.download = filename

      document.body.appendChild(link)
      link.click()
      link.remove()

      // 5. Liberar la URL del objeto
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error al descargar informe de asistencia', err)
      setMensajeModal(err.message || "Ocurrió un error al descargar el informe.")
      setShowSuccessModal(true)
    }
  }

  const handleCopiarCodigo = () => {
    if (codigo.trim()) {
      navigator.clipboard.writeText(codigo)
        .then(() => {
          setMensajeModal('Código copiado al portapapeles.')
          setShowSuccessModal(true)
        })
        .catch(err => {
          console.error('Error al copiar código', err)
          setMensajeModal('No se pudo copiar el código.')
          setShowSuccessModal(true)
        })
    } else {
      setMensajeModal('No hay código para copiar.')
      setShowSuccessModal(true)
    }
  }


  const handleImprimirCodigo = () => {
    window.print()
  }


  const cerrarModal = () => {
    setShowSuccessModal(false)
    setMensajeModal(null)
  }

  // === JSX ===
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-gray-600">Cargando detalles de la reunión...</p>
      </div>
    )
  }

  if (mensajeError && !reunion) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg border border-red-200">
          <p>{mensajeError}</p>
          <button
            onClick={() => router.push('/dashboard/reuniones')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Volver a reuniones
          </button>
        </div>
      </div>
    )
  }

  if (!reunion) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-gray-600">Reunión no encontrada.</p>
      </div>
    )
  }

  const qrUrl = `https://quillacinga-consaca.ddns.net/formulario?id=${reunion.id}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-col justify-start items-start sm:items-start gap-4 mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/reuniones')}
              className="hover:text-[#7d4f2b] transition-colors flex items-center gap-1 text-gray-600"
            >
              <ChevronLeft size={16} />
              Reuniones
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Reunión #{reunion.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#333] flex items-center gap-2">
            <Calendar size={25} className="text-[#7d4f2b]" />
            {reunion.titulo}
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 justify-between items-center">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
            reunion.estado === 'PROGRAMADA' ? 'bg-blue-100 text-blue-800' :
            reunion.estado === 'EN_CURSO' ? 'bg-yellow-100 text-yellow-800' :
            reunion.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {reunion.estado}
          </span>
          <div className="flex flex-wrap gap-2">
            {reunion.estado !== "CERRADA" && (
              <>
                {!modoEdicion ? (
                  <button
                    onClick={handleEditar}
                    className="relative overflow-hidden bg-[#7d4f2b] text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <Edit3 size={16} className="stroke-[3] relative z-10" />
                    <span className="relative z-10">Editar reunión</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleGuardar}
                      className="relative overflow-hidden bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <Check size={16} className="stroke-[3] relative z-10" />
                      <span className="relative z-10">Guardar</span>
                    </button>

                    <button
                      onClick={handleCancelarEdicion}
                      className="relative overflow-hidden bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <X size={16} className="stroke-[3] relative z-10" />
                      <span className="relative z-10">Cancelar</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {reunion.estado === 'EN_CURSO' && (
              <button
                onClick={handleCerrarReunion}
                className="relative overflow-hidden bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <Lock size={16} className="stroke-[3] relative z-10" />
                <span className="relative z-10">Cerrar reunión</span>
              </button>
            )}

            {/* PROGRAMADA → ABRIR */}
            {reunion.estado === "PROGRAMADA" && (
              <button
                onClick={handleAbrirReunion}
                className="flex items-center gap-1  bg-green-600 text-white px-3 py-1 rounded-md transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
              >
                <CheckCircle size={16} /> Abrir reunión
              </button>
            )}

            <button
              onClick={handleDescargarInforme}
              className="relative overflow-hidden bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Download size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Descargar informe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la reunión */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-[#2c3e50] mb-4 flex items-center gap-2">
            <Info size={20} className="text-[#7d4f2b]" />
            Información de la Reunión
          </h2>

          <div className="space-y-4">
            {/* Título */}
            <div className="info-row grid grid-cols-[140px_1fr] py-3 border-b border-gray-100">
              <span className="info-label text-sm font-medium text-gray-600">Título:</span>
              <span className="info-value font-medium text-gray-800">
                {modoEdicion ? (
                  <input
                    type="text"
                    value={reunion?.titulo || ''}
                    onChange={(e) => setReunion(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                    className="w-full border-b-2 border-[#7d4f2b] bg-transparent text-gray-800 focus:outline-none"
                  />
                ) : (
                  reunion?.titulo || '—'
                )}
              </span>
            </div>

            {/* Fecha */}
            <div className="info-row grid grid-cols-[140px_1fr] py-3 border-b border-gray-100">
              <span className="info-label text-sm font-medium text-gray-600">Fecha:</span>
              <span className="info-value font-medium text-gray-800">
                {modoEdicion ? (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="date"
                      value={reunion?.fecha || ''}
                      onChange={(e) => setReunion(prev => prev ? { ...prev, fecha: e.target.value } : null)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                    />
                  </div>
                ) : (
                  reunion?.fecha
                    ? new Date(reunion.fecha).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'
                )}
              </span>
            </div>

            {/* Hora Inicio */}
            <div className="info-row grid grid-cols-[140px_1fr] py-3 border-b border-gray-100">
              <span className="info-label text-sm font-medium text-gray-600">Hora inicio:</span>
              <span className="info-value font-medium text-gray-800">
                {modoEdicion ? (
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="time"
                      value={reunion?.horaInicio || ''}
                      onChange={(e) => setReunion(prev => prev ? { ...prev, horaInicio: e.target.value } : null)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                    />
                  </div>
                ) : (
                  reunion?.horaInicio
                    ? (() => {
                        const [h, m] = reunion.horaInicio.split(':')
                        const date = new Date()
                        date.setHours(Number(h), Number(m))
                        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      })()
                    : '—'
                )}
              </span>
            </div>

            {/* Hora Fin */}
            <div className="info-row grid grid-cols-[140px_1fr] py-3 border-b border-gray-100">
              <span className="info-label text-sm font-medium text-gray-600">Hora fin:</span>
              <span className="info-value font-medium text-gray-800">
                {modoEdicion ? (
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="time"
                      value={reunion?.horaFinal || ''}
                      onChange={(e) => setReunion(prev => prev ? { ...prev, horaFinal: e.target.value } : null)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                    />
                  </div>
                ) : (
                  reunion?.horaFinal
                    ? (() => {
                        const [h, m] = reunion.horaFinal.split(':')
                        const date = new Date()
                        date.setHours(Number(h), Number(m))
                        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      })()
                    : '—'
                )}
              </span>
            </div>

            {/* Duración (solo lectura) */}
            <div className="info-row grid grid-cols-[140px_1fr] py-3 border-b border-gray-100">
              <span className="info-label text-sm font-medium text-gray-600">Duración:</span>
              <span className="info-value font-medium text-gray-800">
                {reunion?.horaInicio && reunion?.horaFinal
                  ? (() => {
                      const [h1, m1] = reunion.horaInicio.split(':').map(Number)
                      const [h2, m2] = reunion.horaFinal.split(':').map(Number)
                      const inicio = h1 * 60 + m1
                      const fin = h2 * 60 + m2
                      const diff = fin - inicio
                      const horas = Math.floor(diff / 60)
                      const minutos = diff % 60
                      return `${horas}h ${minutos}m`
                    })()
                  : '—'}
              </span>
            </div>

            {/* Ubicación */}
            <div className="info-row grid grid-cols-[140px_1fr] py-3 border-b border-gray-100">
              <span className="info-label text-sm font-medium text-gray-600">Ubicación:</span>
              <span className="info-value font-medium text-gray-800">
                {modoEdicion ? (
                  <input
                    type="text"
                    value={reunion?.ubicacion || ''}
                    onChange={(e) => setReunion(prev => prev ? { ...prev, ubicacion: e.target.value } : null)}
                    className="w-full border-b-2 border-[#7d4f2b] bg-transparent text-gray-800 focus:outline-none"
                  />
                ) : (
                  reunion?.ubicacion || '—'
                )}
              </span>
            </div>

            {/* Estado (solo lectura) */}
            <div className="info-row grid grid-cols-[140px_1fr] py-3">
              <span className="info-label text-sm font-medium text-gray-600">Estado:</span>
              <span className="info-value font-medium">
                <span className={`status-badge px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  reunion?.estado === 'PROGRAMADA' ? 'bg-blue-100 text-blue-800' :
                  reunion?.estado === 'EN_CURSO' ? 'bg-yellow-100 text-yellow-800' :
                  reunion?.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                  reunion?.estado === 'CANCELADA' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {reunion?.estado || '—'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Código QR */}
        <div className="bg-gradient-to-br from-[#8B5A3C] to-[#6D4428] p-6 rounded-xl text-center text-white">
          <h2 className="text-lg font-semibold mb-4">🔑 Código QR de Asistencia</h2>

          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <QRCodeCanvas
              value={qrUrl}
              size={170}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="H"
              includeMargin={true}
              className="w-40 h-40"
            />
          </div>

          <p className="text-sm opacity-80 mb-4">
            Escanea el código QR para registrar tu asistencia.
          </p>

          <div className="flex flex-wrap gap-2 justify-center">
            {/* Copiar código manual */}
            <button
              onClick={handleCopiarCodigo}
              className="bg-white/20 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-white/30 transition-colors flex items-center gap-1"
            >
              <Copy size={14} />
              Copiar Código
            </button>

            {/* Descargar QR generado */}
            <button
              onClick={() => {
                const canvas = document.querySelector("canvas") as HTMLCanvasElement;
                const pngUrl = canvas
                  .toDataURL("image/png")
                  .replace("image/png", "image/octet-stream");

                const link = document.createElement("a");
                link.href = pngUrl;
                link.download = `qr_reunion_${reunion.id}.png`;
                link.click();
              }}
              className="bg-white/20 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-white/30 transition-colors flex items-center gap-1"
            >
              <Save size={14} />
              Descargar QR
            </button>

            <button
              onClick={handleImprimirCodigo}
              className="bg-white/20 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-white/30 transition-colors flex items-center gap-1"
            >
              <Printer size={14} />
              Imprimir
            </button>
          </div>
        </div>

      </div>

      {/* Sección de asistentes */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#2c3e50] flex items-center gap-2">
            <Users size={20} className="text-[#7d4f2b]" />
            Lista de Asistentes ({asistentes.length})
          </h2>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Presentes: <span className="font-medium">{asistentes.filter(a => a.Asistencia).length}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Ausentes: <span className="font-medium">{asistentes.filter(a => !a.Asistencia).length}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Total: <span className="font-medium">{asistentes.length}</span></span>
            </div>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, apellido o documento..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
            <Search className="absolute left-3 top-3 text-[#7d4f2b]" size={18} />
          </div>

          <div className="overflow-x-auto max-h-[50vh]">
            {loadingAsistentes ? (
              <p className="text-center text-gray-500 py-4">Cargando asistentes...</p>
            ) : asistentesFiltrados.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No se encontraron asistentes</p>
            ) : (
              <table className="min-w-full">
                <thead className="bg-[#f8f9fa] text-[#2c3e50] sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider">Documento</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider">Nombre</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider">Apellido</th>
                    <th className="px-5 py-3 text-center text-sm font-semibold uppercase tracking-wider">Asistencia</th>
                  </tr>
                </thead>
                <tbody>
                  {asistentesFiltrados.map((a, index) => (
                    <tr key={a.Numero_documento} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-5 py-3 text-gray-800 font-mono">{a.Numero_documento}</td>
                      <td className="px-5 py-3 text-gray-800">{a.Nombre}</td>
                      <td className="px-5 py-3 text-gray-800">{a.Apellido}</td>
                      <td className="px-5 py-3 text-center">
                        {a.Asistencia ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} />
                            Asistió
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle size={12} />
                            No asistió
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal de éxito/error */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full relative">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-gray-500">
              <X size={20} />
            </button>
            <p className="text-gray-800 mb-6">{mensajeModal}</p>
            <div className="text-center">
              <button
                onClick={cerrarModal}
                className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f]"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}