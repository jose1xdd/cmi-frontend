export interface Reunion {
  id: number
  titulo: string
  fecha: string
  horaInicio: string
  horaFinal: string
  ubicacion: string
  estado?: "programada" | "enCurso" | "completada" | "cancelada"
  asistentes?: number
  codigo?: string
  descripcion?: string
}

export interface ReunionesResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: Reunion[]
}

export interface ReunionesTabsProps {
  reuniones: Reunion[]
  onVer: (id: number) => void
  onGestionar: (id: number) => void
  onCompletar: (id: number) => void
  onCancelar: (id: number) => void
}

export interface Asistente {
  documento: string
  nombre: string
  apellido: string
  presente: boolean
}

export interface ModalGestionReunionProps {
  open: boolean
  reunion: Reunion | null
  onClose: () => void
  onUpdate: (reunion: Reunion) => void
  onCloseMeeting: () => void
}