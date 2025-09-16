'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

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
      {/* Encabezado */}
      <header
        className="relative h-72 w-full bg-cover bg-center"
        style={{ backgroundImage: "url('/quillacinga2.png')" }}
      >
        <div className="absolute inset-0 bg-black/40 z-0" />
        <div className="relative z-10 h-full flex flex-col justify-center items-center">
          {/* Logo */}
          <div className="absolute top-4 left-4">
            <Image
              src="/quillacinga.png"
              alt="Logo Quillacinga"
              width={80}
              height={80}
              className="rounded-full border border-white shadow-md"
            />
          </div>

          {/* Botón Iniciar sesión */}
          <div className="absolute top-4 right-4">
            <Link
              href="/login"
              className="bg-[#7d4f2b] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#5e3c1f] shadow"
            >
              Iniciar sesión
            </Link>
          </div>

          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-xl leading-snug px-4 text-center">
            COMUNIDAD INDÍGENA <br /> QUILLACINGA
          </h1>
        </div>
      </header>

      {/* Contenido principal */}
      <section className="p-8 max-w-6xl mx-auto space-y-12">
        {loading ? (
          <p className="text-center text-gray-500">Cargando publicaciones...</p>
        ) : publicaciones.length === 0 ? (
          <p className="text-center text-gray-400">No hay publicaciones aún.</p>
        ) : (
          publicaciones.map((pub, idx) => {
            const isEven = idx % 2 === 0
            return (
              <div
                key={pub.id}
                className={`rounded shadow-md p-6 md:p-10 flex flex-col md:flex-row gap-6 items-center mt-6 ${
                  isEven
                    ? 'bg-white text-[#7d4f2b]'
                    : 'bg-[#7d4f2b] text-white md:flex-row-reverse'
                }`}
              >
                {/* Imagen */}
                <div className="w-full md:w-[500px] flex justify-center">
                  {pub.fotos && pub.fotos.length > 0 ? (
                    <PublicacionFoto fotoId={pub.fotos[0].id} titulo={pub.titulo} />
                  ) : (
                    <div className="w-full h-[250px] bg-gray-200 rounded flex items-center justify-center text-gray-500">
                      Sin imagen
                    </div>
                  )}
                </div>

                {/* Texto */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">{pub.titulo}</h2>
                  <p className="text-base">{pub.contenido}</p>
                </div>
              </div>
            )
          })
        )}
      </section>
    </main>
  )
}

/* Renderiza la foto desde el backend */
function PublicacionFoto({ fotoId, titulo }: { fotoId: number; titulo: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    const fetchFoto = async () => {
      try {
        const token = localStorage.getItem('token')
        const BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          'http://148.113.175.43:8080/cmi-apigateway'

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
      <div className="w-full h-[250px] bg-gray-200 rounded flex items-center justify-center text-gray-500">
        Cargando imagen...
      </div>
    )

  return (
    <div className="relative w-full md:w-[500px] h-[250px]">
      <Image
        src={src}
        alt={titulo}
        fill
        className="object-cover rounded shadow-lg"
      />
    </div>
  )
}
