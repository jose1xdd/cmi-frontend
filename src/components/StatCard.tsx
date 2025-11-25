import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  bg: string
  color: string
  trend?: number | null
  trendLabel?: string
}

export function StatCard({
  label,
  value,
  icon,
  bg,
  color,
  trend,
  trendLabel = 'vs periodo anterior', // Valor por defecto
}: StatCardProps) {
  // Determinar si mostrar la tendencia
  const mostrarTrend = trend != null && trend !== 0

  return (
    <div
      className="flex items-center gap-4 bg-white rounded-xl shadow-md p-5 hover:shadow-lg hover:scale-[1.02] 
                 transition-all duration-300 cursor-default"
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${bg} ${color}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xs font-medium text-gray-500 mb-1">{label}</h3>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
          </div>

          {/* Contenedor de la tendencia */}
          {mostrarTrend && (
            <div className="flex flex-col items-end gap-1">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trend > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {trend > 0 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {Math.abs(trend)}%
              </div>
              <span className="text-[10px] text-gray-500">
                {trendLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}