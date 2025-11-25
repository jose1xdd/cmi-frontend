'use client'

import { useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

// Registrar plugins necesarios
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Tipos
interface GraficoCrecimientoPoblacionalProps {
  datos: { [anio: string]: number } // Ej: { "2020": 1500, "2021": 1550, ... }
}

export default function GraficoCrecimientoPoblacional({ datos }: GraficoCrecimientoPoblacionalProps) {
  const chartRef = useRef<ChartJS<'bar', number[], string>>(null)

  // Preparar datos para Chart.js
  const años = Object.keys(datos).sort() // Ordenar años
  const valores = años.map(año => datos[año])

  // Generar un array de colores para cada barra
  // Puedes usar colores fijos, generarlos dinámicamente, o usar una paleta
  // Ejemplo con una paleta de colores temáticos (tonos de marrón, naranja, etc.)
  const coloresBase = [
    '#8B5A3C', // Marrón oscuro
    '#A0522D', // Sienna
    '#CD853F', // Peru
    '#D2691E', // Chocolate
    '#DEB887', // Burlywood
    '#F4A460', // SandyBrown
    '#DAA520', // Goldenrod
    '#B8860B', // DarkGoldenrod
    '#BC8F8F', // RosyBrown
    '#F5DEB3', // Wheat
    '#D2B48C', // Tan
    '#D8BFD8', // Thistle (si necesitas más)
    '#DDA0DD', // Plum
    '#EE82EE', // Violet
    '#DA70D6', // Orchid
    '#BA55D3', // MediumOrchid
    '#9932CC', // DarkOrchid
    '#9400D3', // Violet
    '#8A2BE2', // BlueViolet
    '#9370DB', // MediumPurple
  ]

  // Opcional: Si tienes más años que colores en la paleta, puedes repetir la paleta o generar colores dinámicamente
  // const coloresBarras = años.map((_, index) => coloresBase[index % coloresBase.length])

  // O usar colores dinámicos (más escalable si no sabes cuántos años habrá)
  const coloresBarras = años.map((_, index) => {
    // Generar un color basado en el índice (esto produce una gama continua de colores)
    const hue = (index * 137.5) % 360 // Distribución de colores basada en el número áureo
    return `hsla(${hue}, 70%, 50%, 0.7)` // Saturation 70%, Lightness 50%, Alpha 0.7
  })

  const data = {
    labels: años,
    datasets: [
      {
        label: 'Total Personas',
        data: valores,
        // --- COLORES POR BARRA ---
        backgroundColor: coloresBarras,
        borderColor: coloresBarras.map(c => c.replace('0.7)', '1)')), // Borde más oscuro (cambiar alpha a 1)
        borderWidth: 2,
        // ---
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Ocultar leyenda porque solo hay un dataset
      },
    },
    scales: {
      y: {
        beginAtZero: true, // Comenzar en 0 para gráficos de barras
        ticks: {
          callback: function (value: any) {
            return value.toLocaleString() // Formatear números con comas
          },
        },
      },
      x: {
        grid: {
          display: false // Ocultar líneas de la grilla en el eje X
        }
      },
    },
  }

  return (
    <div className="h-72 w-full">
      <Bar ref={chartRef} data={data} options={options} />
    </div>
  )
}