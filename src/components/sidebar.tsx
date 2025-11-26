'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Building,
  Calendar,
  ChevronRight,
  FileSpreadsheet,
  HomeIcon,
  LogOut,
  Notebook,
  User,
  UserRound,
  UsersRound,
  X,

} from 'lucide-react'

interface SidebarProps {
  tipoUsuario: 'admin' | 'usuario'
  onClose?: () => void
  isOpen?: boolean
}

export default function Sidebar({ tipoUsuario, onClose, isOpen = true }: SidebarProps) {
  const pathname = usePathname()

  // Definir rutas por tipo de usuario
  const navItems = tipoUsuario === 'admin'
    ? [
        { label: 'Dashboard', icon: <BarChart3 size={20} />, href: '/dashboard/dashboard' },
        { label: 'Mi perfil', icon: <User size={20} />, href: '/dashboard/perfil' },
        { label: 'Usuarios', icon: <UsersRound size={20} />, href: '/dashboard/usuarios' },
        { label: 'Personas', icon: <UserRound size={20} />, href: '/dashboard/personas' },
        { label: 'Familias', icon: <HomeIcon size={20} />, href: '/dashboard/familias' },
        { label: 'Parcialidades', icon: <Building size={20} />, href: '/dashboard/parcialidades' },
        { label: 'Reuniones', icon: <Calendar size={20} />, href: '/dashboard/reuniones' },
        { label: 'Publicaciones', icon: <Notebook size={20} />, href: '/dashboard/index' },
        { label: 'Censo', icon: <FileSpreadsheet size={20} />, href: '/dashboard/censo' },
      ]
    : [
        { label: 'Dashboard', icon: <BarChart3 size={20} />, href: '/dashboard/dashboard' },
        { label: 'Mi perfil', icon: <User size={20} />, href: '/dashboard/perfil' },
        { label: 'Personas', icon: <UserRound size={20} />, href: '/dashboard/personas' },
        { label: 'Familias', icon: <HomeIcon size={20} />, href: '/dashboard/familias' },
        { label: 'Parcialidades', icon: <Building size={20} />, href: '/dashboard/parcialidades' },
      ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    window.location.href = '/'
  }

  return (
    <aside className="h-screen w-64 bg-gradient-to-b from-[#8B5A3C] via-[#7d4f2b] to-[#6D4428] text-white flex flex-col overflow-hidden fixed left-0 top-0 z-40">
      {/* Botón cerrar solo visible en mobile */}
      {onClose && (
        <div className="flex justify-end p-4 md:hidden">
          <button onClick={onClose}>
            <X />
          </button>
        </div>
      )}

      {/* Logo */}
      <div className="flex justify-center py-4">
        <Image src="/quillacinga.png" alt="Logo" width={80} height={80} />
      </div>

      {/* Menú navegación */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300
                ${isActive 
                  ? 'text-[#7d4f2b] font-semibold -mr-2 bg-[#f9f9f9]' // Color texto y margen para el triángulo
                  : 'text-[#e0d6c5] hover:bg-white/10 rounded-lg'
                }
              `}
            >
              
              <span className={isActive ? 'text-[#7d4f2b]' : 'text-white'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              
              {/* Flecha derecha solo en activo */}
              {isActive && (
                <ChevronRight size={18} className="ml-auto text-[#7d4f2b]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Botón cerrar sesión */}
      <div className="px-4 py-6">
        <button
          onClick={handleLogout}
          className="w-full bg-[#5e3c1f] hover:bg-[#4a3118] text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}