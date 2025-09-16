'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import PerfilAdmin from './components/PerfilAdmin'
import PerfilUsuario from './components/PerfilUsuario'
import { apiFetch } from '@/lib/api'
import type { JwtPayload } from '@/types/auth'

// Respuesta real del backend
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
  const [correo, setCorreo] = useState<string>('') // el correo viene del claim
  const [loading, setLoading] = useState(true)
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
  }, [router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        Cargando...
      </div>
    )
  }

  if (!tipoUsuario || !persona) return null

  if (tipoUsuario === 'admin') {
    return (
      <PerfilAdmin
        data={{
          nombre: persona.nombre,
          apellido: persona.apellido,
          tipoDocumento: persona.tipoDocumento,
          identificacion: persona.id,
          nacimiento: persona.fechaNacimiento,
          sexo: persona.sexo,
          direccion: persona.direccion,
          correo: correo,
          telefono: persona.telefono,
          escolaridad: persona.escolaridad,
          profesion: persona.profesion,
          parentesco: persona.parentesco,
          integrantes: '0',
          familia: persona.idFamilia ? String(persona.idFamilia) : '', 
          parcialidad: persona.parcialidad ? String(persona.parcialidad.id) : '',
        }}
      />
    )
  }

  return (
    <PerfilUsuario
      data={{
        nombre: persona.nombre,
        apellido: persona.apellido,
        tipoDocumento: persona.tipoDocumento,
        identificacion: persona.id,
        nacimiento: persona.fechaNacimiento,
        sexo: persona.sexo,
        direccion: persona.direccion,
        correo: correo,
        telefono: persona.telefono,
      }}
    />
  )
}
