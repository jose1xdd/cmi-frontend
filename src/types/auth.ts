export interface LoginRequest {
  email: string
  password: string
}

export type LoginResponse = {
  estado: string
  jwt: string
}

export interface JwtPayload {
  email: string
  persona_id: string
  role: 'admin' | 'usuario'
  exp: number
  iat: number
}
