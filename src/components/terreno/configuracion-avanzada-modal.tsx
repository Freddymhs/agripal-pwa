'use client'

import { useState, useEffect } from 'react'
import type {
  Terreno,
  UbicacionTerreno,
  LegalTerreno,
  DistanciasTerreno,
  ConectividadTerreno,
  InfraestructuraTerreno
} from '@/types'

type TabId = 'ubicacion' | 'legal' | 'distancias' | 'conectividad' | 'infraestructura'

interface ConfiguracionAvanzadaModalProps {
  terreno: Terreno
  isOpen: boolean
  onClose: () => void
  onSave: (updates: Partial<Terreno>) => Promise<void>
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'ubicacion', label: 'Ubicación', icon: '📍' },
  { id: 'legal', label: 'Legal', icon: '📋' },
  { id: 'distancias', label: 'Distancias', icon: '📏' },
  { id: 'conectividad', label: 'Conectividad', icon: '📶' },
  { id: 'infraestructura', label: 'Infraestructura', icon: '🏗️' },
]

export function ConfiguracionAvanzadaModal({
  terreno,
  isOpen,
  onClose,
  onSave,
}: ConfiguracionAvanzadaModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ubicacion')
  const [saving, setSaving] = useState(false)

  const [ubicacion, setUbicacion] = useState<UbicacionTerreno>(terreno.ubicacion || {})
  const [legal, setLegal] = useState<LegalTerreno>(terreno.legal || {})
  const [distancias, setDistancias] = useState<DistanciasTerreno>(terreno.distancias || {})
  const [conectividad, setConectividad] = useState<ConectividadTerreno>(terreno.conectividad || {})
  const [infraestructura, setInfraestructura] = useState<InfraestructuraTerreno>(terreno.infraestructura || {})

  useEffect(() => {
    if (isOpen) {
      setUbicacion(terreno.ubicacion || {})
      setLegal(terreno.legal || {})
      setDistancias(terreno.distancias || {})
      setConectividad(terreno.conectividad || {})
      setInfraestructura(terreno.infraestructura || {})
    }
  }, [isOpen, terreno])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        ubicacion,
        legal,
        distancias,
        conectividad,
        infraestructura,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'ubicacion' && (
            <TabUbicacion value={ubicacion} onChange={setUbicacion} />
          )}
          {activeTab === 'legal' && (
            <TabLegal value={legal} onChange={setLegal} />
          )}
          {activeTab === 'distancias' && (
            <TabDistancias value={distancias} onChange={setDistancias} />
          )}
          {activeTab === 'conectividad' && (
            <TabConectividad value={conectividad} onChange={setConectividad} />
          )}
          {activeTab === 'infraestructura' && (
            <TabInfraestructura value={infraestructura} onChange={setInfraestructura} />
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
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TabUbicacion({
  value,
  onChange,
}: {
  value: UbicacionTerreno
  onChange: (v: UbicacionTerreno) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Ubicación Geográfica</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
          <input
            type="text"
            value={value.region || ''}
            onChange={e => onChange({ ...value, region: e.target.value })}
            placeholder="Arica y Parinacota"
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
          <input
            type="text"
            value={value.comuna || ''}
            onChange={e => onChange({ ...value, comuna: e.target.value })}
            placeholder="Arica"
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección o Referencia</label>
        <input
          type="text"
          value={value.direccion || ''}
          onChange={e => onChange({ ...value, direccion: e.target.value })}
          placeholder="Km 12 Valle de Azapa"
          className="w-full px-3 py-2 border rounded text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Coordenadas GPS</label>
        <input
          type="text"
          value={value.coordenadas || ''}
          onChange={e => onChange({ ...value, coordenadas: e.target.value })}
          placeholder="-18.36386, -70.02931"
          className="w-full px-3 py-2 border rounded text-gray-900"
        />
        <p className="text-xs text-gray-500 mt-1">Formato: latitud, longitud</p>
      </div>
    </div>
  )
}

function TabLegal({
  value,
  onChange,
}: {
  value: LegalTerreno
  onChange: (v: LegalTerreno) => void
}) {
  const tiposPropiedad = [
    { value: 'propio', label: 'Propio' },
    { value: 'arriendo', label: 'Arriendo' },
    { value: 'comodato', label: 'Comodato' },
    { value: 'sucesion', label: 'Sucesión' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Propiedad</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Propiedad</label>
            <select
              value={value.tipo_propiedad || ''}
              onChange={e => onChange({ ...value, tipo_propiedad: e.target.value as LegalTerreno['tipo_propiedad'] })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            >
              <option value="">Seleccionar...</option>
              {tiposPropiedad.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol SII</label>
            <input
              type="text"
              value={value.rol_sii || ''}
              onChange={e => onChange({ ...value, rol_sii: e.target.value })}
              placeholder="1234-5678"
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.titulo_saneado || false}
              onChange={e => onChange({ ...value, titulo_saneado: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Título saneado</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.contribuciones_al_dia || false}
              onChange={e => onChange({ ...value, contribuciones_al_dia: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Contribuciones al día</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Registro Agrícola</h3>
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-3">
          <p className="text-sm text-yellow-800">
            <strong>Inscripción SAG:</strong> OBLIGATORIA para vender productos agrícolas
          </p>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.registro_agricola?.inscripcion_sag || false}
              onChange={e => onChange({
                ...value,
                registro_agricola: { ...value.registro_agricola, inscripcion_sag: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Inscripción SAG</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.registro_agricola?.registro_indap || false}
              onChange={e => onChange({
                ...value,
                registro_agricola: { ...value.registro_agricola, registro_indap: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Registro INDAP (para subsidios)</span>
          </label>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">RUT Agrícola</label>
            <input
              type="text"
              value={value.registro_agricola?.rut_agricola || ''}
              onChange={e => onChange({
                ...value,
                registro_agricola: { ...value.registro_agricola, rut_agricola: e.target.value }
              })}
              placeholder="12.345.678-9"
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Derechos de Agua</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.derechos_agua?.tiene_derechos_dga || false}
              onChange={e => onChange({
                ...value,
                derechos_agua: { ...value.derechos_agua, tiene_derechos_dga: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Tiene derechos DGA</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.derechos_agua?.inscripcion_junta_vigilancia || false}
              onChange={e => onChange({
                ...value,
                derechos_agua: { ...value.derechos_agua, inscripcion_junta_vigilancia: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Inscripción Junta de Vigilancia</span>
          </label>
          {value.derechos_agua?.tiene_derechos_dga && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Litros por segundo</label>
              <input
                type="number"
                step="0.1"
                value={value.derechos_agua?.litros_por_segundo || ''}
                onChange={e => onChange({
                  ...value,
                  derechos_agua: { ...value.derechos_agua, litros_por_segundo: parseFloat(e.target.value) || undefined }
                })}
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Permisos</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.permisos?.permiso_edificacion || false}
              onChange={e => onChange({
                ...value,
                permisos: { ...value.permisos, permiso_edificacion: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Permiso edificación</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.permisos?.resolucion_sanitaria || false}
              onChange={e => onChange({
                ...value,
                permisos: { ...value.permisos, resolucion_sanitaria: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Resolución sanitaria</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.permisos?.declaracion_sii || false}
              onChange={e => onChange({
                ...value,
                permisos: { ...value.permisos, declaracion_sii: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Declaración SII</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.permisos?.patente_municipal || false}
              onChange={e => onChange({
                ...value,
                permisos: { ...value.permisos, patente_municipal: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Patente municipal</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Seguros</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.seguros?.seguro_agricola || false}
              onChange={e => onChange({
                ...value,
                seguros: { ...value.seguros, seguro_agricola: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Seguro agrícola</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.seguros?.seguro_incendio || false}
              onChange={e => onChange({
                ...value,
                seguros: { ...value.seguros, seguro_incendio: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Seguro incendio</span>
          </label>
          {(value.seguros?.seguro_agricola || value.seguros?.seguro_incendio) && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo anual (CLP)</label>
              <input
                type="number"
                value={value.seguros?.costo_anual_clp || ''}
                onChange={e => onChange({
                  ...value,
                  seguros: { ...value.seguros, costo_anual_clp: parseInt(e.target.value) || undefined }
                })}
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabDistancias({
  value,
  onChange,
}: {
  value: DistanciasTerreno
  onChange: (v: DistanciasTerreno) => void
}) {
  const campos = [
    { key: 'pueblo_cercano_km', label: 'Pueblo más cercano' },
    { key: 'ciudad_principal_km', label: 'Ciudad principal' },
    { key: 'hospital_km', label: 'Hospital/Centro de salud' },
    { key: 'ferreteria_agricola_km', label: 'Ferretería agrícola' },
    { key: 'mercado_mayorista_km', label: 'Mercado mayorista' },
  ] as const

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Distancias a Servicios (km)</h3>
      <p className="text-sm text-gray-500">Distancia aproximada en kilómetros desde el terreno</p>

      <div className="space-y-3">
        {campos.map(campo => (
          <div key={campo.key} className="flex items-center gap-4">
            <label className="w-48 text-sm text-gray-700">{campo.label}</label>
            <input
              type="number"
              step="0.1"
              value={value[campo.key] ?? ''}
              onChange={e => onChange({ ...value, [campo.key]: parseFloat(e.target.value) || undefined })}
              placeholder="km"
              className="w-24 px-3 py-2 border rounded text-gray-900"
            />
            <span className="text-sm text-gray-500">km</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabConectividad({
  value,
  onChange,
}: {
  value: ConectividadTerreno
  onChange: (v: ConectividadTerreno) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Conectividad</h3>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Señal Celular</h4>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={value.señal_celular || false}
              onChange={e => onChange({ ...value, señal_celular: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Hay señal celular</span>
          </label>

          {value.señal_celular && (
            <div className="grid grid-cols-2 gap-3 ml-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Operador</label>
                <input
                  type="text"
                  value={value.operador_celular || ''}
                  onChange={e => onChange({ ...value, operador_celular: e.target.value })}
                  placeholder="Entel, Movistar, etc."
                  className="w-full px-3 py-2 border rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Calidad</label>
                <select
                  value={value.calidad_señal || ''}
                  onChange={e => onChange({ ...value, calidad_señal: e.target.value as ConectividadTerreno['calidad_señal'] })}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                >
                  <option value="">Seleccionar...</option>
                  <option value="buena">Buena</option>
                  <option value="regular">Regular</option>
                  <option value="mala">Mala</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Internet</h4>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={value.internet_disponible || false}
              onChange={e => onChange({ ...value, internet_disponible: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Internet disponible</span>
          </label>

          {value.internet_disponible && (
            <div className="ml-6">
              <label className="block text-sm text-gray-600 mb-1">Tipo de conexión</label>
              <select
                value={value.tipo_internet || ''}
                onChange={e => onChange({ ...value, tipo_internet: e.target.value as ConectividadTerreno['tipo_internet'] })}
                className="w-full px-3 py-2 border rounded text-gray-900"
              >
                <option value="">Seleccionar...</option>
                <option value="fibra">Fibra óptica</option>
                <option value="4g">4G/LTE</option>
                <option value="satelital">Satelital</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabInfraestructura({
  value,
  onChange,
}: {
  value: InfraestructuraTerreno
  onChange: (v: InfraestructuraTerreno) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Infraestructura Existente</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de acceso</label>
          <select
            value={value.acceso || ''}
            onChange={e => onChange({ ...value, acceso: e.target.value as InfraestructuraTerreno['acceso'] })}
            className="w-full px-3 py-2 border rounded text-gray-900"
          >
            <option value="">Seleccionar...</option>
            <option value="pavimentado">Pavimentado</option>
            <option value="ripio">Ripio</option>
            <option value="tierra">Tierra</option>
            <option value="inexistente">Sin acceso vehicular</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado del cerco</label>
          <select
            value={value.cerco || ''}
            onChange={e => onChange({ ...value, cerco: e.target.value as InfraestructuraTerreno['cerco'] })}
            className="w-full px-3 py-2 border rounded text-gray-900"
          >
            <option value="">Seleccionar...</option>
            <option value="completo">Completo</option>
            <option value="parcial">Parcial</option>
            <option value="sin_cerco">Sin cerco</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.electricidad || false}
            onChange={e => onChange({ ...value, electricidad: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Electricidad disponible</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.agua_potable || false}
            onChange={e => onChange({ ...value, agua_potable: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Agua potable</span>
        </label>
      </div>
    </div>
  )
}

