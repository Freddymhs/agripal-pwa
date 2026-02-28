"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProyectos } from "@/hooks/use-proyectos";
import { useTerrenos } from "@/hooks/use-terrenos";
import { zonasDAL, plantasDAL } from "@/lib/dal";
import { CrearProyectoModal } from "@/components/terreno/crear-proyecto-modal";
import { CrearTerrenoModal } from "@/components/terreno/crear-terreno-modal";
import { ConfirmarEliminacionModal } from "@/components/terreno/confirmar-eliminacion-modal";
import { SeccionProyectos } from "@/components/terreno/seccion-proyectos";
import { SeccionTerrenos } from "@/components/terreno/seccion-terrenos";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { ROUTES } from "@/lib/constants/routes";
import type { Proyecto, Terreno, UUID } from "@/types";

interface TerrenoConConteo extends Terreno {
  zonasCount: number;
  plantasCount: number;
}

export default function TerrenosPage() {
  const router = useRouter();
  const {
    proyectos,
    loading: loadingProyectos,
    crearProyecto,
    editarProyecto,
    eliminarProyecto,
    contarContenido: contarContenidoProyecto,
  } = useProyectos();
  const [proyectoSeleccionado, setProyectoSeleccionado] =
    useState<Proyecto | null>(null);
  const {
    terrenos,
    loading: loadingTerrenos,
    crearTerreno,
    editarTerreno,
    eliminarTerreno,
    contarContenido: contarContenidoTerreno,
    refetch: refetchTerrenos,
  } = useTerrenos(proyectoSeleccionado?.id ?? null);

  const [terrenosConConteo, setTerrenosConConteo] = useState<
    TerrenoConConteo[]
  >([]);
  const [showCrearProyecto, setShowCrearProyecto] = useState(false);
  const [showCrearTerreno, setShowCrearTerreno] = useState(false);
  const [editandoProyecto, setEditandoProyecto] = useState<Proyecto | null>(
    null,
  );
  const [editandoTerreno, setEditandoTerreno] = useState<Terreno | null>(null);

  const [eliminando, setEliminando] = useState<{
    tipo: "proyecto" | "terreno";
    id: UUID;
    nombre: string;
    contenido: {
      terrenos?: number;
      zonas: number;
      plantas: number;
      cultivos?: number;
    };
  } | null>(null);

  useEffect(() => {
    if (proyectos.length > 0 && !proyectoSeleccionado) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-selecciona el primer proyecto al cargar
      setProyectoSeleccionado(proyectos[0]);
    }
  }, [proyectos, proyectoSeleccionado]);

  const cargarConteos = useCallback(async () => {
    if (terrenos.length === 0) {
      setTerrenosConConteo([]);
      return;
    }
    const conConteo = await Promise.all(
      terrenos.map(async (terreno) => {
        const zonas = await zonasDAL.getByTerrenoId(terreno.id);
        const zonaIds = zonas.map((z) => z.id);
        const plantasCount =
          zonaIds.length > 0 ? await plantasDAL.countByZonaIds(zonaIds) : 0;
        return { ...terreno, zonasCount: zonas.length, plantasCount };
      }),
    );
    setTerrenosConConteo(conConteo);
  }, [terrenos]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cargarConteos es estable vía useCallback y captura deps transitivamente
    cargarConteos();
  }, [cargarConteos]);

  const handleCrearProyecto = async (data: {
    nombre: string;
    ubicacion: string;
  }) => {
    const nuevo = await crearProyecto(data);
    setProyectoSeleccionado(nuevo);
    localStorage.setItem(STORAGE_KEYS.PROYECTO, nuevo.id);
    setShowCrearProyecto(false);
  };

  const handleCrearTerreno = async (data: {
    nombre: string;
    ancho_m: number;
    alto_m: number;
  }) => {
    if (!proyectoSeleccionado) return;
    const nuevoTerreno = await crearTerreno({
      proyecto_id: proyectoSeleccionado.id,
      ...data,
    });
    localStorage.setItem(STORAGE_KEYS.TERRENO, nuevoTerreno.id);
    localStorage.setItem(STORAGE_KEYS.PROYECTO, nuevoTerreno.proyecto_id);
    setShowCrearTerreno(false);
    router.push(ROUTES.HOME);
  };

  const handleEliminarProyecto = async (proyecto: Proyecto) => {
    const contenido = await contarContenidoProyecto(proyecto.id);
    setEliminando({
      tipo: "proyecto",
      id: proyecto.id,
      nombre: proyecto.nombre,
      contenido,
    });
  };

  const handleEliminarTerreno = async (terreno: Terreno) => {
    const contenido = await contarContenidoTerreno(terreno.id);
    setEliminando({
      tipo: "terreno",
      id: terreno.id,
      nombre: terreno.nombre,
      contenido,
    });
  };

  const confirmarEliminacion = async () => {
    if (!eliminando) return;
    if (eliminando.tipo === "proyecto") {
      await eliminarProyecto(eliminando.id);
      if (proyectoSeleccionado?.id === eliminando.id)
        setProyectoSeleccionado(
          proyectos.find((p) => p.id !== eliminando.id) ?? null,
        );
    } else {
      await eliminarTerreno(eliminando.id);
    }
    setEliminando(null);
  };

  const handleSelectTerreno = (terreno: Terreno) => {
    localStorage.setItem(STORAGE_KEYS.TERRENO, terreno.id);
    localStorage.setItem(STORAGE_KEYS.PROYECTO, terreno.proyecto_id);
  };

  const handleGuardarProyecto = async () => {
    if (!editandoProyecto) return;
    await editarProyecto(editandoProyecto.id, {
      nombre: editandoProyecto.nombre,
      ubicacion_referencia: editandoProyecto.ubicacion_referencia,
    });
    setEditandoProyecto(null);
  };

  const handleGuardarTerreno = async () => {
    if (!editandoTerreno) return;
    const result = await editarTerreno(editandoTerreno.id, {
      nombre: editandoTerreno.nombre,
      ancho_m: editandoTerreno.ancho_m,
      alto_m: editandoTerreno.alto_m,
    });
    if (!result.error) {
      setEditandoTerreno(null);
      await refetchTerrenos();
    }
  };

  if (loadingProyectos) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando proyectos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.HOME}
              className="text-gray-500 hover:text-gray-700"
            >
              Volver al Mapa
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              Gestion de Terrenos
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <SeccionProyectos
          proyectos={proyectos}
          proyectoSeleccionado={proyectoSeleccionado}
          editandoProyecto={editandoProyecto}
          onSelect={setProyectoSeleccionado}
          onCrear={() => setShowCrearProyecto(true)}
          onEdit={setEditandoProyecto}
          onDelete={handleEliminarProyecto}
          onChangeEditando={setEditandoProyecto}
          onGuardar={handleGuardarProyecto}
          onCancelar={() => setEditandoProyecto(null)}
        />

        {proyectoSeleccionado && (
          <SeccionTerrenos
            proyectoNombre={proyectoSeleccionado.nombre}
            terrenos={terrenosConConteo}
            loading={loadingTerrenos}
            editandoTerreno={editandoTerreno}
            onCrear={() => setShowCrearTerreno(true)}
            onEdit={setEditandoTerreno}
            onDelete={handleEliminarTerreno}
            onChangeEditando={setEditandoTerreno}
            onGuardar={handleGuardarTerreno}
            onCancelar={() => setEditandoTerreno(null)}
            onSelectTerreno={handleSelectTerreno}
          />
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
  );
}
