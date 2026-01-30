'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProyectos } from '@/hooks/use-proyectos'
import { useTerrenos } from '@/hooks/use-terrenos'
import { zonasDAL, plantasDAL } from '@/lib/dal'
import { formatArea } from '@/lib/utils'
import { CrearProyectoModal } from '@/components/terreno/crear-proyecto-modal'
import { CrearTerrenoModal } from '@/components/terreno/crear-terreno-modal'
import { ConfirmarEliminacionModal } from '@/components/terreno/confirmar-eliminacion-modal'
import type { Proyecto, Terreno, UUID } from '@/types'

interface TerrenoConConteo extends Terreno {
  zonasCount: number
  plantasCount: number
}

const STORAGE_KEY_TERRENO = 'agriplan_terreno_actual'
const STORAGE_KEY_PROYECTO = 'agriplan_proyecto_actual'

export default function TerrenosPage() {
  const router = useRouter()
  const { proyectos, loading: loadingProyectos, crearProyecto, editarProyecto, eliminarProyecto, contarContenido: contarContenidoProyecto } = useProyectos()
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null)
  const { terrenos, loading: loadingTerrenos, crearTerreno, editarTerreno, eliminarTerreno, contarContenido: contarContenidoTerreno, refetch: refetchTerrenos } = useTerrenos(proyectoSeleccionado?.id ?? null)

  const [terrenosConConteo, setTerrenosConConteo] = useState<TerrenoConConteo[]>([])

  const [showCrearProyecto, setShowCrearProyecto] = useState(false)
  const [showCrearTerreno, setShowCrearTerreno] = useState(false)
  const [editandoProyecto, setEditandoProyecto] = useState<Proyecto | null>(null)
  const [editandoTerreno, setEditandoTerreno] = useState<Terreno | null>(null)

  const [eliminando, setEliminando] = useState<{
    tipo: 'proyecto' | 'terreno'
    id: UUID
    nombre: string
    contenido: { terrenos?: number; zonas: number; plantas: number; cultivos?: number }
  } | null>(null)

  useEffect(() => {
    if (proyectos.length > 0 && !proyectoSeleccionado) {
      setProyectoSeleccionado(proyectos[0])
    }
  }, [proyectos, proyectoSeleccionado])

  const cargarConteos = useCallback(async () => {
    if (terrenos.length === 0) {
      setTerrenosConConteo([])
      return
    }

    const conConteo = await Promise.all(
      terrenos.map(async (terreno) => {
        const zonas = await zonasDAL.getByTerrenoId(terreno.id)
        const zonaIds = zonas.map(z => z.id)
        let plantasCount = 0
        if (zonaIds.length > 0) {
          plantasCount = await plantasDAL.countByZonaIds(zonaIds)
        }
        return {
          ...terreno,
          zonasCount: zonas.length,
          plantasCount,
        }
      })
    )
    setTerrenosConConteo(conConteo)
  }, [terrenos])

  useEffect(() => {
    cargarConteos()
  }, [cargarConteos])

  const handleCrearProyecto = async (data: { nombre: string; ubicacion: string }) => {
    const nuevo = await crearProyecto(data)
    setProyectoSeleccionado(nuevo)
    localStorage.setItem(STORAGE_KEY_PROYECTO, nuevo.id)
    setShowCrearProyecto(false)
  }

  const handleCrearTerreno = async (data: { nombre: string; ancho_m: number; alto_m: number }) => {
    if (!proyectoSeleccionado) return
    const nuevoTerreno = await crearTerreno({
      proyecto_id: proyectoSeleccionado.id,
      ...data,
    })

    localStorage.setItem(STORAGE_KEY_TERRENO, nuevoTerreno.id)
    localStorage.setItem(STORAGE_KEY_PROYECTO, nuevoTerreno.proyecto_id)

    setShowCrearTerreno(false)
    router.push('/')
  }

  const handleEliminarProyecto = async (proyecto: Proyecto) => {
    const contenido = await contarContenidoProyecto(proyecto.id)
    setEliminando({
      tipo: 'proyecto',
      id: proyecto.id,
      nombre: proyecto.nombre,
      contenido,
    })
  }

  const handleEliminarTerreno = async (terreno: Terreno) => {
    const contenido = await contarContenidoTerreno(terreno.id)
    setEliminando({
      tipo: 'terreno',
      id: terreno.id,
      nombre: terreno.nombre,
      contenido,
    })
  }

  const confirmarEliminacion = async () => {
    if (!eliminando) return

    if (eliminando.tipo === 'proyecto') {
      await eliminarProyecto(eliminando.id)
      if (proyectoSeleccionado?.id === eliminando.id) {
        setProyectoSeleccionado(proyectos.find(p => p.id !== eliminando.id) ?? null)
      }
    } else {
      await eliminarTerreno(eliminando.id)
    }
    setEliminando(null)
  }

  const handleSelectTerreno = (terreno: Terreno) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TERRENO, terreno.id)
      localStorage.setItem(STORAGE_KEY_PROYECTO, terreno.proyecto_id)
    }
  }

  const handleGuardarProyecto = async () => {
    if (!editandoProyecto) return
    await editarProyecto(editandoProyecto.id, {
      nombre: editandoProyecto.nombre,
      ubicacion_referencia: editandoProyecto.ubicacion_referencia,
    })
    setEditandoProyecto(null)
  }

  const handleGuardarTerreno = async () => {
    if (!editandoTerreno) return
    const result = await editarTerreno(editandoTerreno.id, {
      nombre: editandoTerreno.nombre,
      ancho_m: editandoTerreno.ancho_m,
      alto_m: editandoTerreno.alto_m,
    })
    if (!result.error) {
      setEditandoTerreno(null)
      await refetchTerrenos()
    }
  }

  if (loadingProyectos) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando proyectos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              ← Volver al Mapa
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Gestión de Terrenos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Proyectos</h2>
            <button
              onClick={() => setShowCrearProyecto(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              + Nuevo Proyecto
            </button>
          </div>

          {proyectos.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">No tienes proyectos todavía</p>
              <button
                onClick={() => setShowCrearProyecto(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Crear mi primer proyecto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proyectos.map((proyecto) => (
                <div
                  key={proyecto.id}
                  onClick={() => setProyectoSeleccionado(proyecto)}
                  className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    proyectoSeleccionado?.id === proyecto.id
                      ? 'border-green-500 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {editandoProyecto?.id === proyecto.id ? (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editandoProyecto.nombre}
                        onChange={(e) => setEditandoProyecto({ ...editandoProyecto, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="Nombre del proyecto"
                      />
                      <input
                        type="text"
                        value={editandoProyecto.ubicacion_referencia || ''}
                        onChange={(e) => setEditandoProyecto({ ...editandoProyecto, ubicacion_referencia: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="Ubicación"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleGuardarProyecto}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditandoProyecto(null)}
                          className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{proyecto.nombre}</h3>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditandoProyecto(proyecto)
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEliminarProyecto(proyecto)
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{proyecto.ubicacion_referencia || 'Sin ubicación'}</p>
                      {proyectoSeleccionado?.id === proyecto.id && (
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Seleccionado
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {proyectoSeleccionado && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Terrenos de "{proyectoSeleccionado.nombre}"
              </h2>
              <button
                onClick={() => setShowCrearTerreno(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                + Nuevo Terreno
              </button>
            </div>

            {loadingTerrenos ? (
              <div className="text-gray-500">Cargando terrenos...</div>
            ) : terrenosConConteo.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-500 mb-4">Este proyecto no tiene terrenos</p>
                <button
                  onClick={() => setShowCrearTerreno(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Crear primer terreno
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {terrenosConConteo.map((terreno) => (
                  <div
                    key={terreno.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-24 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
                      <div
                        className="bg-green-500/30 border-2 border-green-600 rounded"
                        style={{
                          width: `${Math.min(80, terreno.ancho_m * 2)}px`,
                          height: `${Math.min(60, terreno.alto_m * 2)}px`,
                        }}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-green-700 bg-white/80 px-2 py-0.5 rounded">
                        {terreno.ancho_m}m × {terreno.alto_m}m
                      </div>
                    </div>

                    <div className="p-4">
                      {editandoTerreno?.id === terreno.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editandoTerreno.nombre}
                            onChange={(e) => setEditandoTerreno({ ...editandoTerreno, nombre: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="Nombre"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500">Ancho (m)</label>
                              <input
                                type="number"
                                value={editandoTerreno.ancho_m}
                                onChange={(e) => setEditandoTerreno({ ...editandoTerreno, ancho_m: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                min={1}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Alto (m)</label>
                              <input
                                type="number"
                                value={editandoTerreno.alto_m}
                                onChange={(e) => setEditandoTerreno({ ...editandoTerreno, alto_m: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                min={1}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleGuardarTerreno}
                              className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditandoTerreno(null)}
                              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{terreno.nombre}</h3>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditandoTerreno(terreno)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleEliminarTerreno(terreno)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 space-y-1 mb-3">
                            <p>Área: {formatArea(terreno.area_m2)}</p>
                            <p>Zonas: {terreno.zonasCount} · Plantas: {terreno.plantasCount}</p>
                          </div>

                          <Link
                            href="/"
                            onClick={() => handleSelectTerreno(terreno)}
                            className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Ver en Mapa →
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {showCrearProyecto && (
        <CrearProyectoModal
          onCreated={handleCrearProyecto}
          onCancel={() => setShowCrearProyecto(false)}
        />
      )}

      {showCrearTerreno && proyectoSeleccionado && (
        <CrearTerrenoModal
          proyectoId={proyectoSeleccionado.id}
          proyectoNombre={proyectoSeleccionado.nombre}
          onCreated={handleCrearTerreno}
          onCancel={() => setShowCrearTerreno(false)}
        />
      )}

      {eliminando && (
        <ConfirmarEliminacionModal
          tipo={eliminando.tipo}
          nombre={eliminando.nombre}
          contenido={eliminando.contenido}
          onConfirm={confirmarEliminacion}
          onCancel={() => setEliminando(null)}
        />
      )}
    </div>
  )
}
