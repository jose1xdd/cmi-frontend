'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { ChevronRight, ImageIcon, User } from 'lucide-react'

interface Foto {
  id: number
}

interface Publicacion {
  id: number
  titulo: string
  contenido: string
  fotos: Foto[]
}

interface PublicacionesResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: Publicacion[]
}

export default function Home() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPublicaciones = async () => {
    try {
      const data = await apiFetch<PublicacionesResponse>(
        `/index/index?page=1&page_size=10`
      )
      setPublicaciones(data.items)
    } catch (error) {
      console.error('Error cargando publicaciones', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPublicaciones()
  }, [])


    return (
      <main className="min-h-screen bg-[#f9f9f9]">
        {/* Hero */}
        <header 
          className="relative w-full min-h-[85vh] md:h-[90vh] bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('/fondocomunidad.jpg')",
            backgroundAttachment: 'fixed' // efecto parallax sutil
          }}
        >
          {/* Overlay con degradado */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-0" />

          {/* Logo y login*/}
          <div className="relative z-10 flex justify-between items-start p-6 md:p-10">
            <div className="animate-fade-in-up">
              <Image
                src="/quillacinga.png"
                alt="Logo Quillacinga"
                width={120}
                height={120}
                className="rounded-full border-4 border-[#e6c7a0]/30 shadow-2xl"
              />
            </div>
            <Link
              href="/login"
              className="relative overflow-hidden bg-[#7d4f2b] text-white px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-[#5e3c1f] shadow-lg transition-all duration-300 transform hover:scale-105 group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center gap-1">
                <User size={18} />
                Iniciar sesión
              </span>
            </Link>
          </div>

          {/* Título principal */}
          <div className="absolute bottom-12 left-8 md:left-16 z-10 max-w-3xl animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-12 bg-[#e6c7a0] rounded-full"></div>
              <span className="text-lg font-medium text-[#e6c7a0] tracking-wider">COMUNIDAD ANCESTRAL</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight max-w-2xl">
              <span className="block">COMUNIDAD INDÍGENA</span>
              <span className="text-[#e6c7a0] mt-1 inline-block">QUILLACINGA</span>
            </h1>
            <p className="text-xl mt-4 text-gray-200 max-w-2xl">
              Preservando nuestras raíces, construyendo el futuro con identidad y dignidad
            </p>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#7d4f2b]/90 to-transparent z-0"></div>
        </header>

        {/* Contenido principal */}
        <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto space-y-16">
        {publicaciones.map((pub, idx) => {
          const isEven = idx % 2 === 0
          return (
            <div
              key={pub.id}
              className={`group rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-3xl 
            md:max-h-[500px] ${
                isEven 
                  ? 'bg-gradient-to-br from-white to-[#f8f5f0] text-[#7d4f2b]'
                  : 'bg-gradient-to-br from-[#7d4f2b] to-[#5a3a23] text-white'
              }`}
            >
              <div className={`flex flex-col md:flex-row ${isEven ? '' : 'md:flex-row-reverse'} items-start`}>
                {/* Imagen con efecto hover */}
                <div className="w-full md:w-1/2 relative h-60 sm:h-72 md:h-[700px]">
                  {pub.fotos && pub.fotos.length > 0 ? (
                    <div className="h-60 sm:h-72 md:h-[500px] w-full overflow-hidden rounded-xl">
                      <div className="relative h-full w-full">
                        <PublicacionFoto 
                          fotoId={pub.fotos[0].id} 
                          titulo={pub.titulo} 
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-4 left-4 text-white text-lg font-semibold">
                            {pub.titulo}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#a88668] to-[#7d4f2b] flex items-center justify-center rounded-xl">
                      <div className="text-center px-6">
                        <ImageIcon size={48} className="text-white/70 mx-auto mb-2" />
                        <p className="text-white/90 font-medium">Imagen no disponible</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contenido con más espacio y jerarquía */}
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-2 h-8 rounded-full ${isEven ? 'bg-[#7d4f2b]' : 'bg-[#e6c7a0]'}`}></div>
                    <span className={`font-medium ${isEven ? 'text-[#7d4f2b]/70' : 'text-white/80'}`}>
                      NOTICIA DESTACADA
                    </span>
                  </div>
                  <h2 className={`text-2xl md:text-4xl font-bold mb-6 leading-tight ${
                    isEven ? 'text-[#5a3a23]' : 'text-[#e6c7a0]'
                  }`}>
                    {pub.titulo}
                  </h2>
                  <p className={`text-base mb-8 leading-relaxed ${
                    isEven ? 'text-gray-700' : 'text-gray-100'
                  }`}>
                    {pub.contenido}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </section>
      </main>
    )
  }

/* Renderiza la foto desde el backend */
function PublicacionFoto({ 
  fotoId, 
  titulo,
  className = "object-cover rounded-xl" 
}: { 
  fotoId: number; 
  titulo: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    const fetchFoto = async () => {
      try {
        const token = localStorage.getItem('token')
        const BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          'https://backend-quillacinga.ddns.net/cmi-apigateway'

        const res = await fetch(`${BASE_URL}/index/index/${fotoId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: 'image/*',
          },
        })
        if (!res.ok) throw new Error('Error al cargar imagen')

        const blob = await res.blob()
        setSrc(URL.createObjectURL(blob))
      } catch (err) {
        console.error('Error cargando foto', err)
      }
    }

    fetchFoto()
  }, [fotoId])

  if (!src)
    return (
      <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
        <ImageIcon size={32} className="text-gray-400" />
      </div>
    )

  return (
    <Image
      src={src}
      alt={titulo}
      fill
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={false}
    />
  )
}