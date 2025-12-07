import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'

export const metadata = {
  title: 'Comunidad Indígena Quillacinga',
  description: 'Landing page de la comunidad',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
