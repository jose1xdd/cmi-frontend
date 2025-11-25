import { Eye, Info, Key, Users, MapPin, Calendar, Clock, X, Pen } from 'lucide-react';
import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react';

interface Reunion {
  id: number;
  titulo: string;
  fecha: string;
  horaInicio: string;
  horaFinal: string;
  ubicacion: string;
  estado?: 'programada' | 'enCurso' | 'completada' | 'cancelada';
  asistentes?: number;
  codigo?: string;
  descripcion?: string;
}

interface UsuarioAsistencia {
  Numero_documento: string;
  Nombre: string;
  Apellido: string;
  Asistencia: boolean;
}

interface VerReunionModalProps {
  reunion: Reunion;
  onClose: () => void;
  onGestionar: (reunion: Reunion) => void;
}

export default function VerReunionModal({
  reunion,
  onClose,
  onGestionar
}: VerReunionModalProps) {
    const [asistentes, setAsistentes] = useState<UsuarioAsistencia[]>([]);

    // Formatear fecha legible
    const fechaFormateada = new Date(reunion.fecha).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    // Formatear hora
    const formatearHora = (hora: string | undefined): string => {
    if (!hora) return '—';
    const [h, m] = hora.split(':');
    const date = new Date();
    date.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

  const horaInicioFormateada = formatearHora(reunion.horaInicio);
  const horaFinFormateada = formatearHora(reunion.horaFinal);

  // Estado visual
  const estadoBadge = () => {
    switch (reunion.estado) {
      case 'programada':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Programada</span>;
      case 'enCurso':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">En curso</span>;
      case 'completada':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Completada</span>;
      case 'cancelada':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Cancelada</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">—</span>;
    }
  };

  // === CARGAR ASISTENTES ===
    const fetchAsistentes = async () => {
    if (!reunion.id) return;
    try {
        const response = await apiFetch<{ items: UsuarioAsistencia[] }>(`/asistencia/asistencia/${reunion.id}/personas`);
        setAsistentes(response.items || []);
    } catch (err) {
        console.error('Error al cargar asistentes:', err);
        setAsistentes([]); // fallback seguro
    }
    };

    useEffect(() => {
        fetchAsistentes();
    }, [reunion.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Eye className="text-[#2c3e50]" size={24} />
            <h2 className="text-xl font-bold text-[#2c3e50]">Detalles de la Reunión</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sección: Información General */}
          <section className="form-section bg-gray-50 p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Info className="text-[#2c3e50]" size={18} />
              <h3 className="text-lg font-semibold text-[#2c3e50]">Información General</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="detail-card">
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <span>Título</span>
                </div>
                <div className="font-medium text-gray-900">{reunion.titulo || '—'}</div>
              </div>

              <div className="detail-card">
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <span>Estado</span>
                </div>
                <div className="font-medium">{estadoBadge()}</div>
              </div>

              <div className="detail-card">
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Fecha</span>
                </div>
                <div className="font-medium text-gray-900">{fechaFormateada}</div>
              </div>

              <div className="detail-card">
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock size={14} />
                  <span>Horario</span>
                </div>
                <div className="font-medium text-gray-900">
                  {horaInicioFormateada} – {horaFinFormateada}
                </div>
              </div>

              <div className="detail-card">
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin size={14} />
                  <span>Ubicación</span>
                </div>
                <div className="font-medium text-gray-900">{reunion.ubicacion || '—'}</div>
              </div>

              <div className="detail-card">
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Users size={14} />
                  <span>Asistentes</span>
                </div>
                <div className="font-medium text-gray-900">
                  {asistentes.length} registrados
                </div>
              </div>
            </div>
          </section>

          {/* Sección: Código de Acceso */}
          <section className="form-section p-5 rounded-xl bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Key size={20} className='text-yellow-500'/>
              <h3 className="text-base font-semibold">Código de Acceso</h3>
            </div>
            <div className="text-center bg-[#7d4f2b] py-8 rounded-lg text-white">
              <div className="text-base mb-0">Código QR para Asistencia</div>
              <div className="text-3xl font-bold inline-block px-6 py-3 rounded-lg">
                {reunion.codigo || 'Sin codigo'}
              </div>
              <p className="text-base mt-0">
                Los miembros pueden usar este código para registrar su asistencia.
              </p>
            </div>
          </section>

          {/* Sección: Lista de Asistentes */}
          <section className="form-section bg-gray-50 p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-[#2c3e50]" size={18} />
              <h3 className="text-lg font-semibold text-[#2c3e50]">Lista de Asistentes</h3>
            </div>

            <div className="text-sm text-gray-600 mb-4 bg-blue-400/10 p-3 rounded-lg border-l-4 border-blue-400">
              📊 {asistentes.length} personas han registrado su asistencia hasta el momento
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#7d4f2b] text-left text-white">
                    <th className="px-4 py-2">Documento</th>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Apellido</th>
                    <th className="px-4 py-2 text-center">Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {asistentes.map((u) => (
                    <tr key={u.Numero_documento} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{u.Numero_documento}</td>
                      <td className="px-4 py-2 text-gray-900">{u.Nombre}</td>
                      <td className="px-4 py-2 text-gray-900">{u.Apellido}</td>
                      <td className="px-4 py-2 text-center">
                        {u.Asistencia ? (
                          <span className="text-green-600 font-medium">✅</span>
                        ) : (
                          <span className="text-red-600 font-medium">❌</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Encabezado */}
            <div className="flex justify-end items-center p-6 border-b border-gray-200">
                <div className="flex gap-2">
                    <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1 bg-slate-400/10 px-3 py-1 rounded-md
                     hover:bg-gray-200 hover:-translate-y-2 duration-300 transition-transform"
                    aria-label="Cerrar"
                    >
                        <X size={24} /> Cerrar
                    </button>
                    <button
                    onClick={() => onGestionar(reunion)}
                    className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-3 py-1 rounded-md 
                                hover:bg-yellow-600 hover:text-white hover:-translate-y-2 transition-colors duration-300 transition-transform"
                    aria-label="Gestionar reunión"
                    >
                        <Pen size={16} />
                        Editar
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}