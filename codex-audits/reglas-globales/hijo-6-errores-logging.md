# Hijo 6 – Errores y Logging

Alcance: manejo de errores, catch vacíos, visibilidad hacia UI.

Hallazgos positivos:
- No hay `catch` vacíos; los errores de DAL/mutaciones se loguean vía `logger` (`ejecutarMutacion`, `cargarDatosTerreno`, `use-sync`).
- `use-sync` propaga errores a estado `error` además de loguearlos, habilitando mostrar feedback en UI si se conecta.

Brechas:
- Errores de carga inicial en `ProjectContext` se registran en consola pero no se exponen a la UI, lo que deja al usuario sin señal en caso de falla de IndexedDB/DAL.
- El logger actual solo imprime a consola (sin nivel configurable ni persistencia). Si se requiere trazabilidad en PWA offline, considerar un backend/cola de reporting o al menos almacenamiento local de últimos errores.
