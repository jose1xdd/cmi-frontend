"use client"

import { Eye, CheckCircle, XCircle, Cog } from "lucide-react"
import { Reunion } from "@/types/reuniones"

interface ReunionResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: Reunion[]
}

interface ReunionesTabsProps {
  data: ReunionResponse
  onVer: (id: number) => void
  onGestionar: (reunion: Reunion) => void
  onCompletar: (id: number) => void
  onCancelar: (id: number) => void
  onPageChange: (page: number) => void
  currentTab: "todas" | "CERRADA" | "EN_CURSO" | "PROGRAMADA"   // <-- controlado por el padre
  onTabChange: (tab: "todas" | "CERRADA" | "EN_CURSO" | "PROGRAMADA") => void
  proximas: number
  enCurso: number
  cerradas: number
  totales: number
  onAbrir: (id: number) => void
  onCerrar: (id: number) => void
}

export function ReunionesTabs({
  data,
  onVer,
  onGestionar,
  onCompletar,
  onCancelar,
  onPageChange,
  currentTab,
  onTabChange,
  proximas,
  enCurso,
  cerradas,
  totales,
  onAbrir,
  onCerrar
}: ReunionesTabsProps) {

  // Ya no tenemos estado local `tab`
  const tab = currentTab

  // Si quieres filtrar localmente como respaldo, puedes:
  // const filteredReuniones = data?.items?.filter(r => tab === 'todas' ? true : r.estado === tab) || []
  // Pero si la API ya filtra, simplemente usamos:
  const filteredReuniones = data?.items || []

  const handleTabClick = (newTab: 'todas' | 'CERRADA' | 'EN_CURSO' | 'PROGRAMADA') => {
    // avisar al padre para que haga fetch con el nuevo filtro
    onTabChange(newTab)
    // y opcionalmente resetear la página desde el padre (ya lo haces en handleTabChange)
  }

  const tabs = [
    { id: "todas", label: "Todas", count: totales },
    { id: "CERRADA", label: "Cerrada", count: cerradas },
    { id: "EN_CURSO", label: "En Curso", count: enCurso },
    { id: "PROGRAMADA", label: "Programadas", count: proximas },
  ]

  return (
    <div className="w-full mt-6">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 bg-white rounded-t-xl px-6 py-3 shadow-sm">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabClick(t.id as any)}
            className={`relative pb-2 font-semibold text-sm transition-colors ${
              tab === t.id
                ? "text-[#7d4f2b] border-b-2 border-[#7d4f2b]"
                : "text-gray-500 hover:text-[#7d4f2b]"
            }`}
          >
            {t.label}
            <span className="ml-2 bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Contenedor de reuniones */}
      <div className="bg-white shadow-md rounded-b-xl p-6">
        {filteredReuniones.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay reuniones en esta categoría.</p>
        ) : (
          <>
            {/* LISTADO (lo mismo que tenías) */}
            <div className="grid gap-4">
              {filteredReuniones.map(reunion => (
                <div key={reunion.id} className="border-2 border-gray-100 rounded-xl p-4 hover:shadow-lg hover:-translate-y-2 hover:border-[#7d4f2b] transition-all cursor-pointer duration-300">
                  {/* ... tu JSX para cada reunion (idéntico al anterior) */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">REUNIÓN #{reunion.id}</p>
                      <h3 className="text-lg font-bold text-gray-800">{reunion.titulo}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">📍 {reunion.ubicacion || "Por definir"}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        reunion.estado === "COMPLETADA" ? "bg-green-100 text-green-700"
                        : reunion.estado === "ENCURSO" ? "bg-yellow-100 text-yellow-700"
                        : reunion.estado === "PROGRAMADA" ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {reunion.estado}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-4 text-sm text-gray-600 gap-3 mb-4">
                    <div>📅 {reunion.fecha}</div>
                    <div>🕐 {reunion.horaInicio} - {reunion.horaFinal}</div>
                    <div>👥 {reunion.asistentes || 0} asistentes</div>
                    {reunion.codigo && <div>🔑 Código: {reunion.codigo}</div>}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {reunion.estado === "CERRADA" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onVer(reunion.id); }}
                        className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Eye size={16} /> Ver
                      </button>
                    )}

                    {reunion.estado !== "CERRADA" && (
                      <button
                      onClick={(e) => { e.stopPropagation(); onGestionar(reunion); }} 
                      className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-3 py-1 rounded-md hover:bg-yellow-600 hover:text-white transition-colors"
                      > 
                        <Cog size={16} /> Gestionar 
                      </button>
                    )}
                    {/* PROGRAMADA → ABRIR */}
                    {reunion.estado === "PROGRAMADA" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAbrir(reunion.id); }}
                        className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-md hover:bg-green-600 hover:text-white transition-colors"
                      >
                        <CheckCircle size={16} /> Abrir reunión
                      </button>
                    )}

                    {/* EN_CURSO → CERRAR */}
                    {reunion.estado === "EN_CURSO" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onCerrar(reunion.id); }}
                        className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-md hover:bg-red-600 hover:text-white transition-colors"
                      >
                        <XCircle size={16} /> Cerrar reunión
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación (usa la data que te pasa el padre) */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
              <div className="text-sm text-gray-600">Página {data.current_page} de {data.total_pages}</div>
              <div className="flex gap-2">
                <button disabled={data.current_page <= 1} onClick={() => onPageChange(data.current_page - 1)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50">Anterior</button>
                <button disabled={data.current_page >= data.total_pages} onClick={() => onPageChange(data.current_page + 1)} className="px-4 py-2 rounded-lg bg-[#7d4f2b] text-white hover:bg-[#5e3c1f] disabled:opacity-50">Siguiente</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
