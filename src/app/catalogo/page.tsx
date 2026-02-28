"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageLayout } from "@/components/layout";
import { CatalogoList } from "@/components/catalogo/catalogo-list";
import { CultivoForm } from "@/components/catalogo/cultivo-form";
import { useProyectos } from "@/hooks/use-proyectos";
import { useCatalogo } from "@/hooks/use-catalogo";
import { TECNICAS_MEJORA } from "@/lib/data/tecnicas-mejora";
import { formatCLP } from "@/lib/utils";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { ROUTES } from "@/lib/constants/routes";
import type { CatalogoCultivo, Proyecto } from "@/types";

export default function CatalogoPage() {
  const [proyectoActual, setProyectoActual] = useState<Proyecto | null>(null);
  const [cultivoEditando, setCultivoEditando] =
    useState<CatalogoCultivo | null>(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const proyectosHook = useProyectos();
  const catalogoHook = useCatalogo(proyectoActual?.id || null);

  useEffect(() => {
    if (!proyectosHook.loading && proyectosHook.proyectos.length > 0) {
      const savedId = localStorage.getItem(STORAGE_KEYS.PROYECTO);
      if (savedId) {
        const proyecto = proyectosHook.proyectos.find((p) => p.id === savedId);
        if (proyecto) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- restaura proyecto guardado al cargar
          setProyectoActual(proyecto);
          return;
        }
      }

      setProyectoActual(proyectosHook.proyectos[0]);
    }
  }, [proyectosHook.loading, proyectosHook.proyectos]);

  const handleGuardar = async (data: Partial<CatalogoCultivo>) => {
    if (cultivoEditando) {
      await catalogoHook.actualizarCultivo(cultivoEditando.id, data);
    } else {
      await catalogoHook.agregarCultivo(
        data as Omit<
          CatalogoCultivo,
          "id" | "proyecto_id" | "created_at" | "updated_at"
        >,
      );
    }
    setCultivoEditando(null);
    setShowNuevo(false);
  };

  const handleEliminar = async (id: string) => {
    if (confirmDelete === id) {
      await catalogoHook.eliminarCultivo(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const cultivosMostrar = catalogoHook.cultivos;

  if (proyectosHook.loading) {
    return (
      <PageLayout headerColor="green">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!proyectoActual) {
    return (
      <PageLayout headerColor="green">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No hay proyecto seleccionado</p>
            <Link href={ROUTES.HOME} className="text-green-600 hover:underline">
              Volver al inicio
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      headerColor="green"
      headerActions={
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm">Proyecto:</span>
          <select
            value={proyectoActual.id}
            onChange={(e) => {
              const p = proyectosHook.proyectos.find(
                (p) => p.id === e.target.value,
              );
              if (p) {
                setProyectoActual(p);
                localStorage.setItem(STORAGE_KEYS.PROYECTO, p.id);
              }
            }}
            className="bg-green-700 text-white px-3 py-1 rounded text-sm border-0"
          >
            {proyectosHook.proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-auto p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">
                {cultivosMostrar.length} cultivo(s) disponibles
              </p>
            </div>
            <button
              onClick={() => {
                setCultivoEditando(null);
                setShowNuevo(true);
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              + Agregar Cultivo
            </button>
          </div>

          {catalogoHook.loading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando catálogo...
            </div>
          ) : (
            <CatalogoList
              cultivos={cultivosMostrar}
              onEditar={(cultivo) => {
                setCultivoEditando(cultivo);
                setShowNuevo(false);
              }}
              onEliminar={handleEliminar}
            />
          )}

          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              Técnicas de Mejora
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {TECNICAS_MEJORA.map((t) => (
                <div key={t.id} className="bg-white border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm text-gray-900">
                      {t.nombre}
                    </h3>
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      {t.categoria}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{t.efecto}</p>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>Dosis: {t.dosis}</div>
                    <div>Frecuencia: {t.frecuencia}</div>
                    <div>
                      Costo: {formatCLP(t.costo_aplicacion_clp)}/aplicación
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 italic">
                    {t.evidencia}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {confirmDelete && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg">
              Click de nuevo para confirmar eliminación
            </div>
          )}
        </main>

        {(showNuevo || cultivoEditando) && (
          <aside className="w-80 bg-white border-l border-gray-200 overflow-hidden">
            <CultivoForm
              cultivo={cultivoEditando || undefined}
              onGuardar={handleGuardar}
              onCancelar={() => {
                setCultivoEditando(null);
                setShowNuevo(false);
              }}
            />
          </aside>
        )}
      </div>
    </PageLayout>
  );
}
