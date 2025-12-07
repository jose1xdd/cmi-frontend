'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import {
  Users,
  UsersRound,
  Calendar,
  Shield,
  ChartColumnIncreasing,
  Cake,
  FileChartColumnIcon,
  MapPinHouse,
} from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import GraficoCrecimientoPoblacional from './graficos/GraficoCrecimientoPoblacional'
import GraficoDistribucionEdad from './graficos/GraficoDistribucionEdad'

// === Nuevas interfaces basadas en la respuesta de la API ===
interface DashboardDataAPI {
  total_personas: number
  total_familias: number
  total_reuniones: number
  total_hombres: number
  total_mujeres: number
  edad_promedio: number
  promedio_miembros_familia: number
  distribucion_edad: {
    '0_17': number
    '18_35': number
    '36_60': number
    '60+': number
  }
  crecimiento_poblacional: {
    [year: string]: number // Ej: { "2025": 7 }
  }
  por_parcialidad: {
    [nombre: string]: number // Ej: { "Parcialidad A": 7, "Parcialidad C": 2 }
  }
}

interface UsuariosSistemaResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: UsuarioSistema[]
}

interface UsuarioSistema {
  email: string
  personaId: string
  rol: 'admin' | 'usuario'
}

// Interfaces para el uso interno del componente
interface StatsData {
  totalPersonas: number
  totalFamilias: number
  usuariosActivos: number
  reunionesEsteMes: number
}

interface ParcialidadData {
  nombre: string
  cantidad: number
}

interface DemografiaData {
  hombres: number
  mujeres: number
  edadPromedio: number
  promedioFamilia: number
  distribucionEdad: any
  crecimiento_poblacional: any
}

export default function DashboardPage() {
  const toast = useToast()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [parcialidades, setParcialidades] = useState<ParcialidadData[]>([])
  const [demografia, setDemografia] = useState<DemografiaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<number>(0)

  // === Cargar datos del dashboard desde el nuevo endpoint ===
  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const data = await apiFetch<DashboardDataAPI>('/reportes/reportes/resumen')

      const params = new URLSearchParams({
        page: "1",
        page_size: "20",
      })

      const dataUsers = await apiFetch<UsuariosSistemaResponse>(
        `/?${params.toString()}`
      )
      console.log("dataUsers", dataUsers.items.length)
      setUsuarios(dataUsers.items.length)

      // Mapear la respuesta a los formatos que usan los componentes
      const statsMapeadas: StatsData = {
        totalPersonas: data.total_personas,
        totalFamilias: data.total_familias,
        usuariosActivos: usuarios, // <-- Pendiente: no lo devuelve la API
        reunionesEsteMes: data.total_reuniones, // <-- Aproximación
      }

      const parcialidadesMapeadas: ParcialidadData[] = Object.entries(data.por_parcialidad).map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
      }))

      const demografiaMapeada: DemografiaData = {
        hombres: data.total_hombres,
        mujeres: data.total_mujeres,
        edadPromedio: data.edad_promedio,
        promedioFamilia: data.promedio_miembros_familia,
        distribucionEdad: data.distribucion_edad,
        crecimiento_poblacional: data.crecimiento_poblacional,
      }

      setStats(statsMapeadas)
      setParcialidades(parcialidadesMapeadas)
      setDemografia(demografiaMapeada)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudieron cargar los datos del dashboard'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-gray-600">Cargando dashboard...</p>
      </div>
    )
  }

  if (!stats || !demografia) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-gray-600">No se encontraron datos.</p>
      </div>
    )
  }

  return (
    <div className="flex h-auto bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 p-0 md:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-[#2c3e50]">Dashboard - Panel de Control</h1>
          <p className="text-gray-600">Comunidad Indígena Quillacinga - Municipio de Consacá</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Personas"
            value={stats.totalPersonas}
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
            bg="bg-blue-50"
            color="text-blue-700"
            trendLabel="vs año anterior"
          />
          <StatCard
            label="Familias Registradas"
            value={stats.totalFamilias}
            icon={<UsersRound className="w-5 h-5 sm:w-6 sm:h-6" />}
            bg="bg-purple-50"
            color="text-purple-700"
            trendLabel="vs año anterior"
          />
          <StatCard
            label="Usuarios"
            value={usuarios}
            icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6" />}
            bg="bg-green-50"
            color="text-green-700"
            trendLabel="nuevos este mes"
          />
          <StatCard
            label="Reuniones Este Mes"
            value={stats.reunionesEsteMes}
            icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6" />}
            bg="bg-orange-50"
            color="text-orange-700"
            trendLabel="vs mes anterior"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Crecimiento Poblacional */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#2c3e50]">
                <ChartColumnIncreasing className="inline-block mr-2" />
                 Crecimiento Poblacional
              </h2>
            </div>
            {/* Gráfico de Crecimiento Poblacional */}
            {demografia && (
              <GraficoCrecimientoPoblacional datos={demografia.crecimiento_poblacional} />
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#2c3e50]">
                <Cake className="inline-block mr-2" />  
                Distribución por Edad
              </h2>
            </div>
            {/* Gráfico de Distribución por Edad */}
            {demografia && (
              <GraficoDistribucionEdad datos={demografia.distribucionEdad} />
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estadísticas Demográficas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-[#2c3e50] mb-4">
              <FileChartColumnIcon className="inline-block mr-2" />               
              Estadísticas Demográficas
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">Hombres</span>
                <span className="font-medium text-gray-800">{demografia.hombres} ({((demografia.hombres / (demografia.hombres + demografia.mujeres)) * 100).toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">Mujeres</span>
                <span className="font-medium text-gray-800">{demografia.mujeres} ({((demografia.mujeres / (demografia.hombres + demografia.mujeres)) * 100).toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">Edad Promedio</span>
                <span className="font-medium text-gray-800">{demografia.edadPromedio} años</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Promedio Miembros/Familia</span>
                <span className="font-medium text-gray-800">{demografia.promedioFamilia.toFixed(1)} personas</span>
              </div>
            </div>
          </div>

          {/* Distribución por Parcialidades */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-[#2c3e50] mb-4">
              <MapPinHouse className="inline-block mr-2" />
              Distribución por Parcialidades
            </h2>
            <div className="space-y-4">
              {parcialidades.length > 0 ? (
                parcialidades.map((p, index) => (
                  <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600">{p.nombre}</span>
                    <span className="font-medium text-gray-800">{p.cantidad}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}