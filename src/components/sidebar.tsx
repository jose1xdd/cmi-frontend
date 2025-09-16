'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  User,
  Users,
  Calendar,
  Home,
  Book,
  FileText,
  Users2,
  LogOut,
  X,
} from 'lucide-react'

interface SidebarProps {
  tipoUsuario: 'admin' | 'usuario'
  onClose?: () => void
}

export default function Sidebar({ tipoUsuario, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItemsAdmin = [
    { label: 'Mi perfil', icon: <User size={20} />, href: '/dashboard/perfil' },
    { label: 'Usuarios', icon: <User size={20} />, href: '/dashboard/usuarios' },
    { label: 'Personas', icon: <Users2 size={20} />, href: '/dashboard/personas' },
    { label: 'Reuniones', icon: <Calendar size={20} />, href: '/dashboard/reuniones' },
    { label: 'Familias', icon: <Home size={20} />, href: '/dashboard/familias' },
    { label: 'Parcialidades', icon: <Book size={20} />, href: '/dashboard/parcialidades' },
    { label: 'Index', icon: <Users size={20} />, href: '/dashboard/index' },
    { label: 'Informes', icon: <FileText size={20} />, href: '/dashboard/informes' },
  ]

  const navItemsUsuario = [
    { label: 'Mi perfil', icon: <User size={20} />, href: '/dashboard/perfil' },
    { label: 'Reuniones', icon: <Calendar size={20} />, href: '/dashboard/reuniones' },
  ]

  const navItems = tipoUsuario === 'admin' ? navItemsAdmin : navItemsUsuario

  const handleLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')

    router.push('/')
  }

  return (
    <aside className="h-full w-64 bg-[#7d4f2b] text-white flex flex-col">
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
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2 px-3 py-2 rounded ${
                isActive
                  ? 'bg-white text-[#7d4f2b]'
                  : 'hover:bg-[#5e3c1f]'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Botón cerrar sesión */}
      <div className="px-4 py-6">
        <button
          onClick={handleLogout}
          className="w-full bg-[#5e3c1f] hover:bg-[#4a3118] text-white px-4 py-2 rounded flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
