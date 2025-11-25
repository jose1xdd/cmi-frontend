'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Publicacion {
  id: number
  titulo: string
  contenido: string
  fotos: { id: number }[]
}

interface PublicacionesCarruselProps {
  publicaciones: Publicacion[]
  onEliminar: (id: number) => void
  onEditar: (pub: Publicacion) => void
}

export default function PublicacionesCarrusel({
  publicaciones,
  onEliminar,
  onEditar,
}: PublicacionesCarruselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 10000 })]
  )

  const [imageUrls, setImageUrls] = useState<Record<number, string>>({})

  // Cargar imágenes de publicaciones
  useEffect(() => {
    const loadImages = async () => {
      const urls: Record<number, string> = {}
      for (const pub of publicaciones) {
        if (pub.fotos.length > 0) {
          try {
            const blob = await apiFetch<Blob>(
              `/index/index/${pub.fotos[0].id}`,
              { responseType: 'blob' }
            )
            urls[pub.id] = URL.createObjectURL(blob)
          } catch (err) {
            console.warn('No se pudo cargar foto', pub.id, err)
          }
        }
      }
      setImageUrls(urls)
    }
    if (publicaciones.length > 0) loadImages()
  }, [publicaciones])

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev()
  const scrollNext = () => emblaApi && emblaApi.scrollNext()

  if (publicaciones.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay publicaciones aún.</p>
      </div>
    )
  }

  return (
    <div className="w-full relative mb-4">
      {/* Carrusel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {publicaciones.map((pub) => (
            <div
              key={pub.id}
              className="flex-[0_0_80%] sm:flex-[0_0_33.33%] px-4"
            >
              <div className="bg-white rounded-2xl shadow-md h-[500px] flex flex-col overflow-hidden">
                {/* Imagen */}
                <div className="h-48 relative">
                  {imageUrls[pub.id] ? (
                    <Image
                      src={imageUrls[pub.id]}
                      alt={pub.titulo}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <ImageIcon size={32} />
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-[#2c3e50] mb-2 line-clamp-1">
                    {pub.titulo}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 flex-1 line-clamp-3">
                    {pub.contenido}
                  </p>
                  <div className='flex justify-between'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditar(pub)
                      }}
                      className="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full hover:bg-yellow-200 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEliminar(pub.id)
                      }}
                      className="mt-auto text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 transition-colors self-start"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controles */}
      <div className="absolute flex justify-center items-center left-0 right-0 -bottom-16 mx-auto w-fit">
        <button
          onClick={scrollPrev}
          className="group p-2 flex items-center justify-center border border-solid border-[#7d4f2b] w-12 h-12 rounded-full transition-all duration-500 hover:bg-[#7d4f2b] -translate-x-16"
          aria-label="Anterior"
        >
          <ChevronLeft
            className="text-[#7d4f2b] group-hover:text-white"
            size={20}
          />
        </button>
        <button
          onClick={scrollNext}
          className="group p-2 flex items-center justify-center border border-solid border-[#7d4f2b] w-12 h-12 rounded-full transition-all duration-500 hover:bg-[#7d4f2b] translate-x-16"
          aria-label="Siguiente"
        >
          <ChevronRight
            className="text-[#7d4f2b] group-hover:text-white"
            size={20}
          />
        </button>
      </div>
    </div>
  )
}