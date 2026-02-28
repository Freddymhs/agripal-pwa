"use client";

import { useState } from "react";
import type { ProveedorAgua } from "@/types";
import { generateUUID, formatCLP } from "@/lib/utils";
import { ProveedorForm } from "./proveedor-form";

interface ProveedoresAguaProps {
  proveedores: ProveedorAgua[];
  onChange: (proveedores: ProveedorAgua[]) => void;
}

export function ProveedoresAgua({
  proveedores,
  onChange,
}: ProveedoresAguaProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nuevoProveedor, setNuevoProveedor] = useState(false);
  const [form, setForm] = useState<Partial<ProveedorAgua>>({});

  const handleAdd = () => {
    setForm({});
    setNuevoProveedor(true);
    setEditandoId(null);
  };

  const handleEdit = (proveedor: ProveedorAgua) => {
    setForm(proveedor);
    setEditandoId(proveedor.id);
    setNuevoProveedor(false);
  };

  const handleSave = () => {
    if (!form.nombre?.trim()) return;

    if (nuevoProveedor) {
      const nuevo: ProveedorAgua = {
        id: generateUUID(),
        nombre: form.nombre.trim(),
        telefono: form.telefono,
        precio_m3_clp: form.precio_m3_clp,
        confiabilidad: form.confiabilidad,
        es_principal: form.es_principal,
        notas: form.notas,
      };
      onChange([...proveedores, nuevo]);
    } else if (editandoId) {
      onChange(
        proveedores.map((p) => (p.id === editandoId ? { ...p, ...form } : p)),
      );
    }

    setForm({});
    setNuevoProveedor(false);
    setEditandoId(null);
  };

  const handleDelete = (id: string) => {
    onChange(proveedores.filter((p) => p.id !== id));
  };

  const handleSetPrincipal = (id: string) => {
    onChange(proveedores.map((p) => ({ ...p, es_principal: p.id === id })));
  };

  const handleCancel = () => {
    setForm({});
    setNuevoProveedor(false);
    setEditandoId(null);
  };

  const proveedorPrincipal = proveedores.find((p) => p.es_principal);

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
          <div className="text-xs text-blue-600 font-medium mb-1">
            PROVEEDOR PRINCIPAL
          </div>
          <div className="font-medium text-gray-900">
            {proveedorPrincipal.nombre}
          </div>
          {proveedorPrincipal.telefono && (
            <div className="text-sm text-gray-600">
              {proveedorPrincipal.telefono}
            </div>
          )}
          {proveedorPrincipal.precio_m3_clp && (
            <div className="text-sm text-gray-600">
              {formatCLP(proveedorPrincipal.precio_m3_clp)}/m³
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {proveedores
          .filter((p) => !p.es_principal)
          .map((prov) => (
            <div key={prov.id} className="p-3 border rounded-lg bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{prov.nombre}</div>
                  {prov.telefono && (
                    <div className="text-sm text-gray-600">{prov.telefono}</div>
                  )}
                  {prov.precio_m3_clp && (
                    <div className="text-sm text-gray-600">
                      {formatCLP(prov.precio_m3_clp)}/m³
                    </div>
                  )}
                  {prov.confiabilidad && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        prov.confiabilidad === "alta"
                          ? "bg-green-100 text-green-700"
                          : prov.confiabilidad === "media"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
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
        <ProveedorForm
          form={form}
          isNew={nuevoProveedor}
          onFormChange={setForm}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {proveedores.length === 0 && !nuevoProveedor && (
        <div className="text-center p-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
          No hay proveedores registrados
        </div>
      )}
    </div>
  );
}
