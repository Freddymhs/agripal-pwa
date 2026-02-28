# System Prompt / Reglas Agnósticas

Perfecto, te dejo un listado “agnóstico al lenguaje” basado en tu texto original, reorganizado en una estructura tipo “reglas globales” similar a tu ejemplo. Puedes copiar‑pegar esto a un archivo de reglas estándar para tu equipo.

Buenas Prácticas Globales (Agnósticas a Lenguaje)
0. Cuidado y Disciplina
- NO duplicar carpetas, archivos ni bloques de código solo por comodidad.
- NO ejecutar scripts, instaladores o migraciones sin autorización explícita.
- NO usar variables mutables a menos que sea estrictamente necesario; inmutabilidad por defecto.
- NO dejar catch vacíos ni tragar errores sin explicación.
- NO hardcodear números ni cadenas en el código; siempre usar constantes con nombre semántico.

1. Flujo de Trabajo
- Hacer cambios pequeños: máximo 300–400 líneas netas por PR.
- Si el proyecto tiene tests, linter o e2e, su aprobación es obligatoria antes del merge.
- No hacer commits directos a main; todo pasa por branches y PR con revisión.
- Antes de escribir una utilidad, revisar si ya existe en utils/, helpers/, lib/.
- Antes de crear un componente/UI, revisar si hay algo reutilizable en el proyecto.

2. Código Limpio y Organización
- Un archivo = una responsabilidad clara (constantes, lógica de dominio, helpers, hooks, presentación).
- Separar datos estáticos (listas, configuraciones) de la lógica que los consume.
- Extraer lógica repetida en funciones utilitarias (helpers/utils), hooks/use‑cases, componentes/widgets reutilizables.
- Extraer componentes pequeños y evitar archivos muy grandes (> 200–300 líneas).
- Usar barrel exports (index) para imports limpios desde fuera del módulo.
- Preferir imports absolutos sobre relativos cuando el proyecto lo permite.

3. Single Source of Truth (SST)
- Centralizar constantes por dominio en un solo archivo/módulo (constants/).
- Centralizar: query/cache keys; storage keys (localStorage, IndexedDB, SharedPreferences, etc.).
- Modelar conceptos del dominio como enums o constantes tipadas, no como strings sueltos.
- Una sola fuente de verdad por concepto (ej. estados, etapas, tipos, listas).

4. Eliminación de Duplicación (DRY)
- No duplicar funciones utilitarias; antes de crear una, buscar en el proyecto.
- No duplicar constantes ni listas; importar la versión canónica.
- Toda vez que se repite el mismo cálculo en 2–3+ lugares, convertirlo en helper.
- Toda vez que se repite el mismo bloque de UI en múltiples pantallas, convertirlo en componente.

5. Tipado y Seguridad
- Preferir enums/constantes tipadas sobre union types sueltos.
- Evitar any, dynamic, object genérico sin justificación explícita.
- Si se usa un tipo inseguro, documentar por qué con un comentario.
- No pasar objetos sin tipo entre capas; usar interfaces/DTOs/dataclasses explícitos.
- Validar el contrato de tipos con satisfies (TS) o el equivalente del lenguaje cuando sea posible.

6. Nomenclatura
- Nombres alineados al dominio y la región (ej. formatCLP, calcularDensidadPlantas).
- Renombrar funciones/variables cuando su comportamiento cambia y el nombre ya no es correcto.
- Funciones con nombre de intención, no de implementación (filtrarEstanques, no filterByTypeAndConfig).
- Mantener una sola convención consistente por proyecto (campos, variables, funciones, componentes, archivos).

7. Manejo de Estado y Datos
- Preferir estado derivado sobre estado imperativo duplicado.
- Usar computed, useMemo, select, o equivalente para evitar recomputar/duplicar.

Proceso de Auditoría Secuencial (padre/hijos)
- Crear carpeta `audits/reglas-globales/`.
- `padre.md` define alcance (sin tests), reglas a evaluar y decide cuántos hijos necesita (1–n) para cubrir el proyecto; lista a los hijos y su estado.
- La IA genera hijos secuencialmente según lo que observe (no paralelo), asignando nombre/tema para cubrir todo el proyecto sin solaparse.
- Cada hijo reporta hallazgos y brechas respecto a las reglas; no modificar código en esta fase.
