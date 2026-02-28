"use client";

import { useState, useEffect } from "react";
import type {
  Terreno,
  UbicacionTerreno,
  LegalTerreno,
  DistanciasTerreno,
  ConectividadTerreno,
  InfraestructuraTerreno,
} from "@/types";
import { TabUbicacion } from "@/components/terreno/tab-ubicacion";
import { TabLegal } from "@/components/terreno/tab-legal";
import { TabDistancias } from "@/components/terreno/tab-distancias";
import { TabConectividad } from "@/components/terreno/tab-conectividad";
import { TabInfraestructura } from "@/components/terreno/tab-infraestructura";

type TabId =
  | "ubicacion"
  | "legal"
  | "distancias"
  | "conectividad"
  | "infraestructura";

interface ConfiguracionAvanzadaModalProps {
  terreno: Terreno;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Terreno>) => Promise<void>;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "ubicacion", label: "Ubicación", icon: "📍" },
  { id: "legal", label: "Legal", icon: "📋" },
  { id: "distancias", label: "Distancias", icon: "📏" },
  { id: "conectividad", label: "Conectividad", icon: "📶" },
  { id: "infraestructura", label: "Infraestructura", icon: "🏗️" },
];

export function ConfiguracionAvanzadaModal({
  terreno,
  isOpen,
  onClose,
  onSave,
}: ConfiguracionAvanzadaModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("ubicacion");
  const [saving, setSaving] = useState(false);

  const [ubicacion, setUbicacion] = useState<UbicacionTerreno>(
    terreno.ubicacion || {},
  );
  const [legal, setLegal] = useState<LegalTerreno>(terreno.legal || {});
  const [distancias, setDistancias] = useState<DistanciasTerreno>(
    terreno.distancias || {},
  );
  const [conectividad, setConectividad] = useState<ConectividadTerreno>(
    terreno.conectividad || {},
  );
  const [infraestructura, setInfraestructura] =
    useState<InfraestructuraTerreno>(terreno.infraestructura || {});

  useEffect(() => {
    if (isOpen) {
      setUbicacion(terreno.ubicacion || {});
      setLegal(terreno.legal || {});
      setDistancias(terreno.distancias || {});
      setConectividad(terreno.conectividad || {});
      setInfraestructura(terreno.infraestructura || {});
    }
  }, [isOpen, terreno]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ubicacion,
        legal,
        distancias,
        conectividad,
        infraestructura,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Configuración Avanzada: {terreno.nombre}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex border-b overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "ubicacion" && (
            <TabUbicacion value={ubicacion} onChange={setUbicacion} />
          )}
          {activeTab === "legal" && (
            <TabLegal value={legal} onChange={setLegal} />
          )}
          {activeTab === "distancias" && (
            <TabDistancias value={distancias} onChange={setDistancias} />
          )}
          {activeTab === "conectividad" && (
            <TabConectividad value={conectividad} onChange={setConectividad} />
          )}
          {activeTab === "infraestructura" && (
            <TabInfraestructura
              value={infraestructura}
              onChange={setInfraestructura}
            />
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
