'use client'

import { useState } from 'react'
import type { ProveedorAgua, ConfiabilidadProveedor } from '@/types'
import { generateUUID } from '@/lib/utils'

interface ProveedoresAguaProps {
  proveedores: ProveedorAgua[]
  onChange: (proveedores: ProveedorAgua[]) => void
}

export function ProveedoresAgua({ proveedores, onChange }: ProveedoresAguaProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nuevoProveedor, setNuevoProveedor] = useState(false)

  const [form, setForm] = useState<Partial<ProveedorAgua>>({})

  const handleAdd = () => {
    setForm({})
    setNuevoProveedor(true)
    setEditandoId(null)
  }

  const handleEdit = (proveedor: ProveedorAgua) => {
    setForm(proveedor)
    setEditandoId(proveedor.id)
    setNuevoProveedor(false)
  }

  const handleSave = () => {
    if (!form.nombre?.trim()) return

    if (nuevoProveedor) {
      const nuevo: ProveedorAgua = {
        id: generateUUID(),
        nombre: form.nombre.trim(),
        telefono: form.telefono,
        precio_m3_clp: form.precio_m3_clp,
        confiabilidad: form.confiabilidad,
        es_principal: form.es_principal,
        notas: form.notas,
      }
      onChange([...proveedores, nuevo])
    } else if (editandoId) {
      onChange(proveedores.map(p =>
        p.id === editandoId ? { ...p, ...form } : p
      ))
    }

    setForm({})
    setNuevoProveedor(false)
    setEditandoId(null)
  }

  const handleDelete = (id: string) => {
    onChange(proveedores.filter(p => p.id !== id))
  }

  const handleSetPrincipal = (id: string) => {
    onChange(proveedores.map(p => ({
      ...p,
      es_principal: p.id === id,
    })))
  }

  const handleCancel = () => {
    setForm({})
    setNuevoProveedor(false)
    setEditandoId(null)
  }

  const confiabilidades: { value: ConfiabilidadProveedor; label: string }[] = [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' },
  ]

  const proveedorPrincipal = proveedores.find(p => p.es_principal)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Proveedores de Agua</h3>
        <button
          onClick={handleAdd}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          + Agregar
        </button>
      </div>

      {proveedorPrincipal && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-600 font-medium mb-1">PROVEEDOR PRINCIPAL</div>
          <div className="font-medium text-gray-900">{proveedorPrincipal.nombre}</div>
          {proveedorPrincipal.telefono && (
            <div className="text-sm text-gray-600">{proveedorPrincipal.telefono}</div>
          )}
          {proveedorPrincipal.precio_m3_clp && (
            <div className="text-sm text-gray-600">${proveedorPrincipal.precio_m3_clp.toLocaleString()} CLP/m³</div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {proveedores.filter(p => !p.es_principal).map(prov => (
          <div
            key={prov.id}
            className="p-3 border rounded-lg bg-white"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900">{prov.nombre}</div>
                {prov.telefono && <div className="text-sm text-gray-600">{prov.telefono}</div>}
                {prov.precio_m3_clp && (
                  <div className="text-sm text-gray-600">${prov.precio_m3_clp.toLocaleString()} CLP/m³</div>
                )}
                {prov.confiabilidad && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    prov.confiabilidad === 'alta' ? 'bg-green-100 text-green-700' :
                    prov.confiabilidad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {prov.confiabilidad}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSetPrincipal(prov.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Marcar principal
                </button>
                <button
                  onClick={() => handleEdit(prov)}
                  className="text-xs text-gray-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(prov.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
            {prov.notas && (
              <p className="text-xs text-gray-500 mt-1">{prov.notas}</p>
            )}
          </div>
        ))}
      </div>

      {(nuevoProveedor || editandoId) && (
        <div className="p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
          <h4 className="font-medium text-gray-900 mb-3">
            {nuevoProveedor ? 'Nuevo Proveedor' : 'Editar Proveedor'}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={form.nombre || ''}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre del proveedor"
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono || ''}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-3 py-2 border rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (CLP/m³)</label>
                <input
                  type="number"
                  value={form.precio_m3_clp || ''}
                  onChange={e => setForm({ ...form, precio_m3_clp: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confiabilidad</label>
              <select
                value={form.confiabilidad || ''}
                onChange={e => setForm({ ...form, confiabilidad: e.target.value as ConfiabilidadProveedor || undefined })}
                className="w-full px-3 py-2 border rounded text-gray-900"
              >
                <option value="">Seleccionar...</option>
                {confiabilidades.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={form.notas || ''}
                onChange={e => setForm({ ...form, notas: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {proveedores.length === 0 && !nuevoProveedor && (
        <div className="text-center p-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
          No hay proveedores registrados
        </div>
      )}
    </div>
  )
}
