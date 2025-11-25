import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js'

// Registrar plugins
ChartJS.register(ArcElement, ChartTooltip, Legend)

// Tipos
interface GraficoDistribucionEdadProps {
  datos: {
    '0_17': number
    '18_35': number
    '36_60': number
    '60+': number
  }
}

export default function GraficoDistribucionEdad({ datos }: GraficoDistribucionEdadProps) {
  // Mapear los datos al formato de Chart.js
  const labels = ['0-17 años', '18-35 años', '36-60 años', '60+ años']
  const valores = [datos['0_17'], datos['18_35'], datos['36_60'], datos['60+']]
  const colores = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0']


  const data = {
    labels,
    datasets: [
      {
        data: valores,
        backgroundColor: colores,
        borderWidth: 3,
        borderColor: '#fff',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
    },
  }

  return (
    <div className="h-72 w-full">
      <Doughnut data={data} options={options} />
    </div>
  )
}