'use client'

import { useEffect, useState } from 'react'
import { Trash, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface Familia {
  id: number
  integrantes: number
}

interface FamiliaResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: Familia[]
}

interface UploadError {
  fila: number
  id: string
  mensaje: string
}

interface UploadResponse {
  status: string
  insertados: number
  total_procesados: number
  errores: UploadError[]
}

export default function FamiliaPage() {
  const router = useRouter()

  const [familias, setFamilias] = useState<Familia[]>([])
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState<Familia | null>(null)
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false)
  const [mostrarModalExito, setMostrarModalExito] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')
  const [loading, setLoading] = useState(false)

  // 📊 paginación
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(1)

  // 📂 carga masiva
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)

  const fetchFamilias = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<FamiliaResponse>(
        `/familias/?page=${page}&page_size=${pageSize}`
      )
      setFamilias(data.items)
      setTotalPages(data.total_pages || 1)
    } catch (error) {
      console.error('Error cargando familias:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFamilias()
  }, [page])

  const confirmarEliminacion = (familia: Familia) => {
    setFamiliaSeleccionada(familia)
    setMostrarModalConfirmacion(true)
  }

  const cancelarEliminacion = () => {
    setFamiliaSeleccionada(null)
    setMostrarModalConfirmacion(false)
  }

  const eliminarFamilia = async () => {
    if (familiaSeleccionada) {
      try {
        const res = await apiFetch<{ estado: string; message: string; data: string }>(
          `/familias/${familiaSeleccionada.id}`,
          { method: 'DELETE' }
        )

        if (res.estado === 'Exitoso') {
          setMensajeExito('La familia ha sido eliminada con éxito')
          setMostrarModalExito(true)
        } else {
          setMensajeExito(res.message || 'Error eliminando familia')
          setMostrarModalExito(true)
        }
      } catch {
        setMensajeExito('Error eliminando familia')
        setMostrarModalExito(true)
      } finally {
        setFamiliaSeleccionada(null)
        setMostrarModalConfirmacion(false)
      }
    }
  }

  const cerrarModalExito = async () => {
    setMostrarModalExito(false)
    await fetchFamilias()
  }

  // 📂 subir excel
  const handleUploadExcel = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await apiFetch<UploadResponse>('/familias/upload-excel', {
        method: 'POST',
        body: formData,
      })
      setUploadResult(res)
      fetchFamilias()
    } catch {
      setUploadResult({
        status: 'error',
        insertados: 0,
        total_procesados: 0,
        errores: [{ fila: 0, id: '-', mensaje: 'Error al subir el archivo' }],
      })
    }
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-[#333]">
        Familias
      </h1>

      {/* Tabla */}
      <div className="overflow-x-auto border rounded">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="min-w-full">
            <thead className="bg-[#7d4f2b] text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-center">ID</th>
                <th className="px-4 py-2 text-center">Número de integrantes</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-6">
                    Cargando...
                  </td>
                </tr>
              ) : familias.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6">
                    No se encontraron familias
                  </td>
                </tr>
              ) : (
                familias.map((familia, index) => (
                  <tr
                    key={familia.id}
                    className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="px-4 py-2 text-center">{familia.id}</td>
                    <td className="px-4 py-2 text-center">{familia.integrantes}</td>
                    <td className="px-4 py-2 flex justify-center">
                      <button
                        onClick={() => confirmarEliminacion(familia)}
                        className="text-[#7d4f2b] hover:text-red-600"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔄 Paginación */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-4 py-2 rounded bg-[#7d4f2b] text-white disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 rounded bg-[#7d4f2b] text-white disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* Botones */}
      <div className="flex justify-end mt-6 gap-3">
        <label className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded flex items-center gap-2 cursor-pointer">
          <Upload size={18} /> Carga masiva (Excel)
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUploadExcel(e.target.files[0])
              }
            }}
          />
        </label>
        <button
          onClick={() => router.push('/dashboard/familias/nuevo')}
          className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded"
        >
          Nueva familia
        </button>
      </div>

      {/* 📂 Modal resultado carga masiva */}
      {uploadResult && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-lg w-full text-center relative">
            <button
              onClick={() => setUploadResult(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-[#7d4f2b]">
              Resultado de la carga masiva
            </h2>

            <p className="text-sm text-gray-700 mb-2">
              <strong>Status:</strong> {uploadResult.status}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Insertados:</strong> {uploadResult.insertados}
            </p>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Total procesados:</strong> {uploadResult.total_procesados}
            </p>

            {uploadResult.errores && uploadResult.errores.length > 0 && (
              <div className="text-left text-sm text-red-700 max-h-40 overflow-y-auto border-t pt-2">
                <p className="font-semibold mb-2">Errores encontrados:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {uploadResult.errores.map((err, idx) => (
                    <li key={idx}>
                      <strong>Fila {err.fila}</strong> (ID: {err.id}): {err.mensaje}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setUploadResult(null)}
                className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación */}
      {mostrarModalConfirmacion && familiaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center relative">
            <p className="text-lg mb-6">
              ¿Está seguro de querer eliminar la familia con ID{' '}
              <strong>{familiaSeleccionada.id}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={eliminarFamilia}
                className="bg-[#7d4f2b] text-white px-5 py-2 rounded hover:bg-[#5e3c1f]"
              >
                Aceptar
              </button>
              <button
                onClick={cancelarEliminacion}
                className="bg-gray-400 text-white px-5 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal éxito / error */}
      {mostrarModalExito && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center relative">
            <p className="text-lg mb-6">{mensajeExito}</p>
            <button
              onClick={cerrarModalExito}
              className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
