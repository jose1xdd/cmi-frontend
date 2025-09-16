'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import { Menu } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'usuario' | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const tipo = localStorage.getItem('tipoUsuario') as 'admin' | 'usuario' | null
    if (!tipo || (tipo !== 'admin' && tipo !== 'usuario')) {
      router.replace('/')
    } else {
      setTipoUsuario(tipo)
    }
  }, [router])

  if (!tipoUsuario) return null

  return (
    <div className="flex min-h-screen relative">
      {/* Sidebar escritorio */}
      <div className="hidden md:block w-64 bg-[#7d4f2b] text-white">
        <Sidebar tipoUsuario={tipoUsuario} />
      </div>

      {/* Botón hamburguesa móvil */}
      {!sidebarOpen && (
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-white rounded p-1 shadow"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="text-[#7d4f2b]" />
        </button>
      )}

      {/* Overlay y Sidebar móvil */}
      {sidebarOpen && (
        <>
          {/* Fondo oscuro */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar móvil */}
          <div className="fixed top-0 left-0 z-50 w-64 h-full bg-[#7d4f2b] text-white transition-transform duration-300 transform md:hidden">
            <Sidebar tipoUsuario={tipoUsuario} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Contenido principal */}
      <div className="flex-1 bg-[#f9f9f9] p-4 sm:p-8 overflow-y-auto w-full">
        {children}
      </div>
    </div>
  )
}
