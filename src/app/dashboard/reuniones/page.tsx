'use client'

import { useEffect, useState } from 'react'
import ReunionesAdmin from './components/ReunionesAdmin'
import ReunionesUsuario from './components/ReunionesUsuario'

export default function ReunionesPage() {
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'usuario' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tipo = localStorage.getItem('tipoUsuario')
    if (tipo === 'admin' || tipo === 'usuario') {
      setTipoUsuario(tipo)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="min-h-[40vh] flex justify-center items-center">Cargando...</div>
  }

  if (!tipoUsuario) return null

  return tipoUsuario === 'admin' ? <ReunionesAdmin /> : <ReunionesUsuario />
}
