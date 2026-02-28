import { TarjetaTerreno } from "@/components/terreno/tarjeta-terreno";
import type { Terreno } from "@/types";

interface SeccionTerrenosProps {
  proyectoNombre: string;
  terrenos: (Terreno & { zonasCount: number; plantasCount: number })[];
  loading: boolean;
  editandoTerreno: Terreno | null;
  onCrear: () => void;
  onEdit: (t: Terreno) => void;
  onDelete: (t: Terreno) => void;
  onChangeEditando: (t: Terreno | null) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  onSelectTerreno: (t: Terreno) => void;
}

export function SeccionTerrenos({
  proyectoNombre,
  terrenos,
  loading,
  editandoTerreno,
  onCrear,
  onEdit,
  onDelete,
  onChangeEditando,
  onGuardar,
  onCancelar,
  onSelectTerreno,
}: SeccionTerrenosProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Terrenos de &quot;{proyectoNombre}&quot;
        </h2>
        <button
          onClick={onCrear}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          + Nuevo Terreno
        </button>
      </div>
      {loading ? (
        <div className="text-gray-500">Cargando terrenos...</div>
      ) : terrenos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">Este proyecto no tiene terrenos</p>
          <button
            onClick={onCrear}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Crear primer terreno
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {terrenos.map((terreno) => (
            <TarjetaTerreno
              key={terreno.id}
              terreno={terreno}
              editando={editandoTerreno?.id === terreno.id}
              editandoTerreno={editandoTerreno}
              onEdit={() => onEdit(terreno)}
              onDelete={() => onDelete(terreno)}
              onChangeEditando={(t) => onChangeEditando(t)}
              onGuardar={onGuardar}
              onCancelar={onCancelar}
              onSelectTerreno={() => onSelectTerreno(terreno)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
