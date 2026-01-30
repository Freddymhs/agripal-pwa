# Bugs / hallazgos para revisar

- **Bug 1 – Estado del Agua supera la capacidad (101%)**
  - Síntoma: En la tarjeta _Estado del Agua_ aparece algo como `20.2 m³` a la izquierda y `20.0 m³` a la derecha, mostrando `101% de capacidad`.
  - Contexto en que ocurrió:
    1. Existía un Terreno A con estanque, agua cargada y cultivos.
    2. Se creó un Terreno B nuevo.
    3. En el Terreno B se creó un estanque con capacidad de `20 m³`.
    4. Al ir a la vista `💧 Agua` del Terreno B, el panel mostró `20.2 / 20.0 m³ (101%)`.
  - Sospecha técnica: el `nivel_actual_m3` del estanque quedó ligeramente por encima de `capacidad_m3`, probablemente por combinación de:
    - valores por defecto del modal de **Configurar Recarga** (`agua_cargada_litros`, `consumo_manual_lh`, `fecha_ultima_carga`), y
    - diferencias de zona horaria que hacen que `fecha_ultima_carga` quede en el futuro, produciendo un cálculo de agua “negativamente gastada” y empujando `nivel_actual_m3` por encima de la capacidad.

- **Bug 2 – Estanque en home muestra 0% hasta recargar**
  - Síntoma: Después de configurar un estanque y cargar agua desde la ruta `💧 /agua`, el panel de estanques en `/agua` muestra el nivel correcto (100%), pero al volver a la vista principal (home / mapa) el estanque sigue mostrando `0%`. Solo al recargar la página del home se actualiza al porcentaje real.
  - Interpretación: parece un problema de refresco/estado compartido entre la vista `/agua` y la vista del mapa/home (el componente que muestra el porcentaje en el mapa no se entera del cambio hasta que se hace un reload completo de la app).

- **Bug 3 – Acordeón de “Estanques de Agua” permite agregar agua de forma confusa**
  - Síntoma: En `http://localhost:3000/agua` aparece una card “Estanques de Agua”. Al hacer clic sobre la card, se abre un acordeón con un input que permite agregar agua directamente ahí. Esto es confuso/innecesario porque justo encima ya existe el botón principal `+ Registrar Agua`, que abre el modal correcto para registrar entradas.
  - Comentario de UX: El hecho de que la card de “Estanques de Agua” sea clicable y abra un acordeón con otro flujo de ingreso de agua resulta redundante y molesto para el usuario; idealmente debería eliminarse ese input/acordeón y dejar como único flujo de registro el botón `+ Registrar Agua`.

- **Bug 4 – Ícono de configuración del estanque es poco visible/entendible**
  - Síntoma: En `http://localhost:3000/agua`, dentro de la card “Estanques de Agua”, debajo aparece el nombre del estanque con un pequeño ícono de configuración. Ese ícono es muy poco evidente como botón; parece un icono decorativo y no un action principal, a pesar de que abre una configuración clave (simulación de consumo).
  - Problema de UX:
    - No hay ninguna indicación visual clara de que sea un botón importante.
    - No existe alerta o aviso de “no has configurado la simulación / tasa de consumo”, aunque es un dato crítico para la lógica de agua.
    - Podría evaluarse:
      - o bien mostrar esa información/configuración inline en la card (sin modal) si es corta,
      - o mantener el modal, pero con un botón más evidente (texto + icono, etiqueta “Configurar consumo” o similar) y alguna alerta cuando aún no está configurado.

- **Bug 5 – Modal “Configurar Simulación de Consumo” es confuso y posiblemente innecesario**
  - Síntoma: El modal de “Configurar Simulación de Consumo” del estanque pide una tasa en L/h o m³/h, pero:
    - no está conectado con la configuración real de riego (caudal × horas),
    - obliga al usuario a hacer conversiones mentales (de caudal y horas a tasa promedio 24h),
    - y su propósito no es evidente, generando confusión incluso para el creador del sistema.
  - Comentario de producto/UX: Desde la perspectiva del usuario, este simulador parece innecesario y más bien confunde. Podría:
    - eliminarse, apoyándose solo en historial de entradas y consumo por cultivos para estimar agua, o
    - ser re-diseñado por completo para usar datos más naturales (litros/día, horas de riego) y/o conectarse con “Configurar Riego”.

---

## Ideas de mejora / rediseño

- **Idea 1 – Mover el cálculo de “días de agua” al panel de información del home**
  - Mostrar en el panel de información de la vista principal (mapa/home) un resumen automático tipo:
    - “Agua disponible: X m³”
    - “Consumo estimado: Y m³/semana”
    - “Agua para ~Z días”
  - Reutilizar para esto las funciones que ya existen:
    - consumo por plantas/zona (`calcularConsumoZona`, `calcularConsumoTerreno`),
    - y la lógica de “días restantes” usada en la card `Estado del Agua` / `EstanquePanel`.
  - Objetivo: que el usuario vea este valor clave directamente en el panel de información sin tener que abrir el modal de “Configurar Simulación de Consumo”, permitiendo eventualmente eliminar ese modal.

