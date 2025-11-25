'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import { apiFetch } from '@/lib/api'
import type { JwtPayload } from '@/types/auth'
import VistaPerfil from './components/VistaPerfilAdmin'

interface PersonaResponse {
  id: string
  tipoDocumento: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  parentesco: string
  sexo: string
  profesion: string
  escolaridad: string
  direccion: string
  telefono: string
  activo: boolean
  idFamilia: string | null
  parcialidad: { id: number; nombre: string } | null 
}

export default function PerfilPage() {
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'usuario' | null>(null)
  const [persona, setPersona] = useState<PersonaResponse | null>(null)
  const [correo, setCorreo] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [actualizado, setActualizado] = useState(1)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login')
      return
    }

    try {
      const payload = jwtDecode<JwtPayload>(token)
      setTipoUsuario(payload.role)
      setCorreo(payload.email)

      apiFetch<PersonaResponse>(`/personas/${payload.persona_id}`)
        .then((data) => {
          setPersona(data)
          setLoading(false)
        })
        .catch(() => {
          router.replace('/login')
        })
    } catch {
      router.replace('/login')
    }
  }, [router, actualizado])

  const recargarPerfil = () => {
    setActualizado(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        Cargando...
      </div>
    )
  }

  if (!tipoUsuario || !persona) return null

  // Preparar los datos para VistaPerfil
  const perfilData = {
    nombre: persona.nombre,
    apellido: persona.apellido,
    tipoDocumento: persona.tipoDocumento,
    identificacion: persona.id,
    nacimiento: persona.fechaNacimiento,
    sexo: persona.sexo,
    direccion: persona.direccion,
    correo: correo,
    telefono: persona.telefono,
    escolaridad: persona.escolaridad || '',
    profesion: persona.profesion || '',
    parentesco: persona.parentesco || '',
    familia: persona.idFamilia || '',
    parcialidad: persona.parcialidad?.nombre || '',
    rol: tipoUsuario,
  }

  return <VistaPerfil data={perfilData} recargarDatos={recargarPerfil}/>
}