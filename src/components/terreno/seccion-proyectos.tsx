import { TarjetaProyecto } from '@/components/terreno/tarjeta-proyecto'
import type { Proyecto } from '@/types'

interface SeccionProyectosProps {
  proyectos: Proyecto[]
  proyectoSeleccionado: Proyecto | null
  editandoProyecto: Proyecto | null
  onSelect: (p: Proyecto) => void
  onCrear: () => void
  onEdit: (p: Proyecto) => void
  onDelete: (p: Proyecto) => void
  onChangeEditando: (p: Proyecto | null) => void
  onGuardar: () => void
  onCancelar: () => void
}

export function SeccionProyectos({
  proyectos, proyectoSeleccionado, editandoProyecto,
  onSelect, onCrear, onEdit, onDelete, onChangeEditando, onGuardar, onCancelar,
}: SeccionProyectosProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Proyectos</h2>
        <button onClick={onCrear} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
          + Nuevo Proyecto
        </button>
      </div>
      {proyectos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">No tienes proyectos todavia</p>
          <button onClick={onCrear} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Crear mi primer proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyectos.map((proyecto) => (
            <TarjetaProyecto
              key={proyecto.id}
              proyecto={proyecto}
              seleccionado={proyectoSeleccionado?.id === proyecto.id}
              editando={editandoProyecto?.id === proyecto.id}
              editandoProyecto={editandoProyecto}
              onSelect={() => onSelect(proyecto)}
              onEdit={() => onEdit(proyecto)}
              onDelete={() => onDelete(proyecto)}
              onChangeEditando={(p) => onChangeEditando(p)}
              onGuardar={onGuardar}
              onCancelar={onCancelar}
            />
          ))}
        </div>
      )}
    </section>
  )
}
