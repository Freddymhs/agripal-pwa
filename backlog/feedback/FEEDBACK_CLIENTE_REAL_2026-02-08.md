# Feedback Cliente Real - Entrevista Agricultor Arica

**Fecha**: 2026-02-08
**Participantes**: Marcos (agricultor, padre), Freddy (desarrollador, hijo), Jaime (hermano, interviene brevemente)
**Contexto**: Conversacion informal sobre el terreno agricola en Arica. Marcos tiene un lote de ~75x183m en una parcela compartida por una agrupacion de socios.
**Metodo**: Transcripcion de audio analizada por 4 IAs (Claude Opus, Cursor, otro LLM, Perplexity) + filtro del desarrollador
**Relacion con UX_AUDIT**: Este documento complementa `backlog/UX_AUDIT_USUARIO_REAL.md` (2026-02-05) que documenta bugs y confusiones UX desde la perspectiva de uso de la app. Este documento captura dolores y necesidades del usuario ANTES de usar la app.

**Estructura del documento**:
- **PARTE 1 — EL CLIENTE**: Todo lo que Marcos dijo, siente, necesita y hace. Datos puros de la conversacion.
- **PARTE 2 — ANALISIS Y DESARROLLO**: Lo que nosotros interpretamos, proponemos, priorizamos y encontramos en el codigo.

---

# PARTE 1 — EL CLIENTE

Todo en esta seccion viene directamente de la conversacion con Marcos o se deriva directamente de sus palabras.

---

## 1.1 Perfil del Usuario

### Marcos (agricultor)
- **Experiencia**: Poca experiencia tecnica en agricultura. Aprendiendo sobre la marcha.
- **Situacion**: Miembro de agrupacion de socios con terrenos asignados en zona arida de Arica.
- **Recursos**: Limitados. Cada decision de inversion es critica (10,000+ CLP por planta).
- **Herramientas actuales**: Papel cuadriculado, planos dibujados a mano, mediciones con GPS basico.
- **Actitud**: Cauteloso, metodico, quiere experimentar antes de escalar.
- **Frustracion principal**: La directiva de la agrupacion no provee guia tecnica ni estudios de suelo.
- **Red de consulta**: Hamilton, Martin (socios), la agrupacion en general, familia.
- **Aprendizaje**: Gradual y social — "Yo de poco voy dedicandose. Voy a ir conversando con algunos, y de a poco voy a plantar."
- **Referencia visual**: Puede ver fisicamente las parcelas vecinas desde su terreno ("ya veo una huelta mas arriba, otros antiguos... puedo mirar que planta tienen"). Esto es la base real de la estrategia de "copiar al vecino".

### Citas clave del perfil
> "No voy a arriesgarme a plantar 100 plantas... cada planta esta al minimo 10 lucas"
> "Quisiera hacer estudios con una planta de cada uno, para ver como resulta"
> "Si no tiene un estudio de tierra, es peligroso"
> "Tenis que si o si copiar a tu vecino o gente, lo que veais que les va bien"

---

## 1.2 Contexto Economico y Legal

### La agrupacion
- ~20+ socios con terrenos asignados en zona arida de Arica
- **Costo del cierre perimetral**: ~20,000,000 CLP (veinte millones) — pagado entre todos los socios
  > "En puro cierre, sale mas de 20 millones"
- **Precio de venta de lotes**: ~2,500,000 CLP por lote — pero hay lotes que no se han vendido por falta de confianza
  > "vamos a vender a 2 millones y medio nomas"
- La directiva no provee guia tecnica: no hay plan maestro, no hay agronomo, no hay estudios de suelo
  > "La directiva no es muy buena... nadie apoya"
  > "No tienen una estructura tan buena, le da desconfianza a la gente"
- Quisieron contratar agronomo pero les parecio caro
  > "Ojala que tiene que haber un agronomo que nos pueda orientar que fecha plantar, que planta... Pero luego trajeron un presidente, pero no, pero es recopilante"

### Requisito legal: Bienes Nacionales
> "Bienes Nacionales exige que tenga que estar ocupado el 100% del terreno"

Este es un requisito LEGAL que afecta directamente la planificacion: el agricultor no puede dejar terreno vacio. Debe tener un plan para el 100% de la superficie, aunque sea plantar cobertura vegetal o reservar formalmente como infraestructura.

### Contexto de inversion
- Cada planta cuesta entre $5,000 y $15,000 CLP dependiendo del tipo y tamaño
  > "Cada planta esta al minimo 10 lucas... Depende de la planta"
- La diferencia entre comprar planta establecida vs semilla es enorme en costo y riesgo
  > "Depende si la voy a comprar como grandecito ya, o como semilla nomas"
- 134 plantas a precio promedio = $670,000 - $2,010,000 CLP de riesgo total
  > "En 100 plantas arriesgarse mas de un millon de pesos"

---

## 1.3 Workflow Actual del Usuario (sin la app)

Esto es lo que Marcos hace HOY, paso a paso, para planificar su terreno:

| # | Actividad | Herramienta | Tiempo | Dolor |
|---|-----------|-------------|--------|-------|
| 1 | Medir el terreno con GPS | GPS basico (celular?) | 1 dia | Discrepancia con medidas oficiales (190m vs 183m real) |
| 2 | Dibujar plano en papel cuadriculado (5x5m) | Papel, regla, lapiz | Varias horas | Tedioso, no permite cambios faciles |
| 3 | Distribuir zonas (casa, bodega, estanque, cultivos) | Mental + papel | Varias horas | Sin validacion de si el layout es optimo |
| 4 | Decidir que plantar | Copiar al vecino, preguntar en la agrupacion | Semanas | Sin datos tecnicos, pura intuicion |
| 5 | Contar plantas que caben | Manual (75m / 8m spacing = X) | 30 min | Error-prone, no considera margenes ni pasillos bien |
| 6 | Calcular costo de inversion | Calculadora: N plantas x $X | 10 min | No incluye agua, infraestructura, imprevistos |
| 7 | Preparar terreno (desalinizar) | Regar mucho → esperar → remover sal → repetir | 1-3 meses | Sin tracking, sin saber cuando termina |
| 8 | Plantar (si se atreve) | Manualmente | 1-2 dias | Con miedo, sin saber si el suelo es compatible |

**Observacion critica**: Los pasos 1-6 son EXACTAMENTE lo que AgriPlan ya hace o puede hacer. Los pasos 7-8 son gaps que la app no cubre.

---

## 1.4 Datos Concretos del Terreno

### Dimensiones
| Medida | Valor | Notas |
|--------|-------|-------|
| Ancho (frente) | ~75 m | Medido, confirmado |
| Largo (fondo) | ~183 m | Medido con GPS. Plano dice 190m pero real es 183m |
| Area total | ~13,725 m2 (~1.37 ha) | Calculado |
| Terreno Carolina (hermana) | 75.30 x 183.80 m | Referencia |
| Ancho fondo | ~76 m | Ligeramente mas ancho atras (75 frente, 76 fondo — trapecio leve) |

### Layout planificado (plano en papel, cuadricula 5x5m)
| # | Zona | Tipo | Ubicacion |
|---|------|------|-----------|
| 1 | Casa | Infraestructura | Frente, corrida 5m del borde |
| 2 | Garaje | Infraestructura | Junto a casa |
| 3 | Bodega herramientas | Infraestructura | Junto a garaje |
| 4 | Bodega insumos/productos | Infraestructura | Proxima al acceso |
| 5 | Pozo septico | Infraestructura | Zona media |
| 6 | Estanque de agua | Estanque | Antes de cultivos |
| 7 | Naranjos | Cultivo | Primer tramo de plantacion (~24 plantas) |
| 8 | Higuera | Cultivo | Lado de los tubos (~30 plantas) |
| 9 | Maracuya | Cultivo | Siguiente tramo (~30 plantas) |
| 10-11 | Libre (a definir) | Cultivo | Fondo del terreno (~25+25 plantas) |
| 12 | Acceso principal | Camino | Entrada por Avenida Corica |

### Espaciamiento y plantas
- **Distancia entre plantas**: 8 metros (consenso de la agrupacion; 12m descartado por excesivo)
  > "a ocho metros dijeron, porque de doce metros dicen que es demasiado lejos una planta. Pero ocho metros incluso para mi es galetas y mucho"
- **Plantas estimadas**: ~134 en total (conteo manual: 24 + 30 + 30 + 25 + 25 = 134)
  > "Yo saque como 130 y tanto plantas. 135, pero aca hay fresas que... aca no hay plantas"
- **Margenes**: 5 metros a cada borde del terreno — razon: seguridad ante errores de medicion de limites
  > "Si justo la linea, te llegas ahi que tu linea esta mas aca, tienes que entrarte para alla y decis, sube, ya tengo la casa hecha ahi"
  > "Yo quiero dejar todos 5 aca. Con esta linea por todos lados. Todos costados 5 metros."
- **Pasillos vehiculares**: 10 metros de ancho — razon: logistica de cosecha
  > "Pueden entrar con un vehiculo y dejan las cajas... despues sacan con un vehiculo y llegan a tu bodega"
- **Orientacion casa**: Mirando al sol (sur), inversa al plano original
  > "Yo quiero hacer siempre la casa mirando para el sur"
  > "El hizo para el otro lado, pero yo quiero hacer asi"
- **Puntos cardinales**: Marcos piensa en orientacion solar y maritima
  > "Este esta para el mar, este para el sur, este para el norte"
- **Densificacion futura**: Planea spacing 8m ahora con opcion de intercalar a 4m despues
  > "si algun dia puede poner una planta mas, porque haria 4 metros"
  > "Se dejamos a 12, despues a 6, una planta con la posterior se podria dejar"
- **Layout alternativo considerado**: Camino por el medio del terreno con cultivos a ambos lados — descartado porque el terreno es mas largo que ancho
  > "En el medio, el camino queria poner en el medio... planta para este lado y planta para alla"
- **Cultivos mixtos en zonas**: Marcos considera poner mas de un tipo de cultivo en una zona
  > "Aqui puedo poner dos clases de plantas"
- **Fresas**: Mencionadas aparte del conteo de 134 arboles frutales (cultivo de suelo, no arbol)

### Origen del plano
- Un **topografo** fue contratado por la agrupacion para disenar el layout original
- Martin (socio) y el topografo hicieron las marcaciones y mediciones
- Marcos quiere adaptar ese plano a sus medidas reales (183m vs 190m del plano)
  > "Yo quiero medir realmente alla... quiero sacar la cuenta bien"
- Fotos de mediciones se perdieron
  > "yo le saque foto, pero se me perdio"

---

## 1.5 Arco Emocional de la Conversacion

La conversacion no fue lineal ni tecnica. Tuvo un arco emocional claro:

### Fase 1: Contexto y frustracion (inicio)
Marcos explica la situacion de la agrupacion. Tono de frustracion: la directiva no apoya, no hay estudios, no hay estructura. Se siente solo en su decision de invertir.

### Fase 2: Miedo concreto (centro-inicio)
Al hablar de plantar, el miedo emerge con fuerza. Cada mencion de plantas incluye el costo. "10 lucas cada una", "mas de un millon", "si se mueren los 10". El miedo no es abstracto — es el numero concreto en pesos.
> "Cuando hablas de terrenos grandes, ya es dificil, es peligroso incluso"

### Fase 3: Planificacion como control (centro)
El 60% de la conversacion fue sobre medidas, cuadriculas y layout. Esto NO es un ejercicio tecnico — es un mecanismo de control. Si puede planificar exactamente donde va cada cosa, siente que reduce el riesgo. El papel cuadriculado le da sensacion de control.

### Fase 4: Curiosidad y esperanza (centro-final)
Cuando Freddy menciona la app ("Yo tengo algo como para hacer un plano"), hay un cambio de tono. El padre reconoce que lo que hace en papel podria hacerse digitalmente. Hay interes genuino. No pide verla (es una conversacion informal), pero la semilla queda plantada.

### Fase 5: Estrategia prudente (cierre)
Marcos articula su estrategia: "una planta de cada uno, ver como resulta". Es incremental, prudente, basada en evidencia propia. No confia en datos ajenos — quiere VER con sus plantas si el suelo funciona.

### Insight clave
La app debe acompanar este arco emocional: **reconocer el miedo → dar datos para reducir incertidumbre → permitir experimentacion segura → escalar solo cuando hay evidencia**. NO debe empujar al usuario a plantar 134 plantas de golpe.

---

## 1.6 Dolores Identificados

### DOLOR-01: Sin analisis de suelo ni agua (CRITICO)
**Cita**: "Nadie hizo un estudio de tierra... deberan saber la calidad o las propiedades que tiene la tierra, cosas que son quimicas de la tierra, como tema de boro, de pH"
**Contexto**: La agrupacion planto sin estudios previos. La tierra tiene salinidad visible ("capita de sal"). No conocen pH, boro, conductividad electrica.
**Consenso 4 IAs**: Unanime. Falta checklist pre-inversion.

### DOLOR-02: Proceso de desalinizacion sin tracking (CRITICO)
**Cita**: "Echar agua, agua, agua... un mes tiene que ir echando agua" / "Era solo capita de sal... hay que sacarlo ese sal, sacarlo otra vez agua. Sale otro sal, sacarlo."
**Contexto**: En Arica, la preparacion del terreno requiere ciclos de lavado de sales: regar abundantemente -> esperar que la sal suba -> remover capa de sal -> repetir. Este proceso puede tomar semanas/meses.
**Detalle critico**: La desalinizacion es POR HOYO, no por terreno completo.
> "Ese hoyo, tengo que echar agua en esa tierra. Ese hoyo esta hoyado nomas, yo voy a limpiar, sacarlo por los lados. Y echar agua, agua, agua."
**Caso real de fracaso (Carolina)**: En el terreno de la hermana, plantaron rapido sin preparar:
> "Hacemos un hoyo ese dia rapido nomas... Despues la segunda vez que fuimos, habia como... Estaba brillando. Era solo capita de sal."
La sal volvio. Evidencia concreta de que saltarse la preparacion = perder la planta.
**Consenso 4 IAs**: Unanime. Feature nueva necesaria.

### DOLOR-03: Miedo a perder inversion (CRITICO)
**Cita**: "Si pongo unos 10 de limon y se me mueren los 10" / "Es peligroso, te arriesgas" / "En 100 plantas arriesgarse mas de un millon de pesos"
**Contexto**: Cada planta cuesta 5,000-15,000 CLP. Plantar 134 plantas = 670,000 - 2,010,000 CLP de riesgo. Sin datos de suelo, la probabilidad de perdida es alta.
**Cita adicional**: "En una maceta uno lo piensa asi, no es mucha plata... Pero cuando hablas de terrenos grandes, ya es dificil, es peligroso incluso."
**Consenso 4 IAs**: Unanime. La app calcula pero no comunica el riesgo de forma prominente.

### DOLOR-04: No sabe que plantar ni cuando (ALTO)
**Cita**: "Ojala que tiene que haber un agronomo que nos pueda orientar que fecha plantar, que planta" / "Tenis que si o si copiar a tu vecino"
**Contexto**: La unica estrategia actual es copiar a vecinos exitosos. No hay orientacion profesional. La agrupacion quiso contratar un agronomo pero les parecio caro.
**Referencia de vecinos**: Marcos puede ver fisicamente las parcelas de arriba y nota que tienen guayaba y otros cultivos.
**Consenso 4 IAs**: 3 de 4 lo mencionan.

### DOLOR-05: Planificacion del layout a mano (ALTO)
**Cita**: 60% de la conversacion fue sobre medidas, cuadriculas, espacios, margenes, pasillos.
**Contexto**: Marcos tiene un plano en papel cuadriculado (5x5m) donde distribuye casa, bodegas, estanque, zonas de cultivo. Cuenta plantas a mano. Calcula espacios con regla.
**Consenso 4 IAs**: Unanime.

### DOLOR-06: Falta de estructura en la agrupacion (MEDIO)
**Cita**: "La directiva no es muy buena... nadie apoya" / "No tienen una estructura tan buena, le da desconfianza a la gente"
**Contexto**: La agrupacion no tiene plan maestro, cronograma, ni estudios. Esto genera desconfianza en potenciales compradores de lotes ($2.5M CLP sin respaldo tecnico). El cierre perimetral costo ~$20M CLP entre todos.
**Consenso 4 IAs**: 2 de 4 mencionan proyecto colectivo. Es futuro, no prioritario.

### DOLOR-07: Quiere experimentar antes de escalar (MEDIO)
**Cita**: "Quisiera hacer estudios con una planta de cada uno, para ver como resulta" / "Si luego se me muere ese uno, hay que pensar por que"
**Contexto**: Estrategia prudente: plantar 1-2 plantas de prueba -> si sobreviven 3 meses -> escalar. No quiere arriesgar todo de golpe.
**Consenso 4 IAs**: 3 de 4 lo mencionan. Feature nueva.

---

## 1.7 Gaps en el Catalogo de Cultivos

Marcos menciona cultivos que NO estan en el catalogo actual de Arica:

| Cultivo mencionado | En catalogo? | Accion |
|--------------------|-------------|--------|
| Naranjo | NO | Evaluar agregar. Citrico similar a Limon/Mandarina |
| Higuera | SI | OK |
| Maracuya | SI | OK |
| Limon | SI | OK |
| Guayaba | SI | OK (mencionada como cultivo de vecinos exitosos) |
| Fresa | NO | Mencionada aparte del conteo de arboles. Cultivo de suelo, no arbol. Evaluar agregar. |

---

## 1.8 Insights del Usuario como Persona

1. **El miedo es la emocion dominante**. No es entusiasmo por plantar, es terror a perder dinero. La app debe reconocer esto en su tono y flujo.
2. **Piensa en metros y cuadrados**, no en hectareas. La app habla en ha, el usuario en metros. Considerar mostrar ambas unidades o priorizar metros.
3. **Su referencia son los vecinos**, no papers ni datos. "Copiar al vecino" es la estrategia #1. Puede ver fisicamente las parcelas vecinas y sus cultivos desde su terreno.
4. **Trabaja con papel**. Planos cuadriculados, anotaciones manuales, conteo a mano. La app debe competir con la simplicidad del papel.
5. **Desconfia de la autoridad** (la directiva). Quiere datos propios para tomar decisiones independientes.
6. **Es incremental**. No va a plantar 134 plantas de golpe. Va a plantar 2, ver si sobreviven, y recien escalar. La app debe soportar este flujo.
7. **Su horizonte temporal es largo**. Habla de "algun dia", "con tiempo". No tiene prisa pero quiere empezar bien.
8. **No entiende terminologia tecnica**. ROI, punto de equilibrio, dS/m, Kc — todo esto necesita traduccion a lenguaje simple.
9. **Hay un requisito legal detras**. Bienes Nacionales exige 100% de ocupacion del terreno. La planificacion no es solo deseo — es obligacion.
10. **El dinero es concreto, no abstracto**. No piensa en "inversion" — piensa en "10 lucas por planta". La app debe hablar en pesos chilenos concretos, no en porcentajes ni ratios.
11. **Planifica para el futuro, no solo para hoy**. Deja 8m de spacing pensando en que algun dia podra intercalar a 4m. Deja 5m de margen por si las medidas estan mal. La app debe soportar esta mentalidad de "planificar con margen".
12. **La logistica de cosecha define el layout**. Los pasillos de 10m no son arbitrarios — son para que entre una camioneta a cargar cajas. El ancho de los pasillos depende del metodo de cosecha (mano, carretilla, vehiculo).
13. **Aprende de fracasos propios, no de teoria**. El caso de Carolina (plantaron rapido, la sal volvio) es su referencia emocional. La app debe mostrar consecuencias reales, no solo numeros.
14. **Multiples stakeholders deciden**. No decide solo — consulta a Hamilton, Martin, la agrupacion. El plan debe ser compartible y entendible por gente no-tecnica.
15. **Distingue entre escala de maceta y terreno**. En maceta los errores cuestan poco. En terreno grande, un error es "peligroso". La app debe reflejar esta diferencia de escala.

---

## 1.9 Que le Importa y Que NO (Perspectiva del Cliente)

### Lo que Marcos diria al ver la app por primera vez
1. **"Puedo hacer mi plano aca? Como el de la hoja?"** — Lo PRIMERO que busca es replicar su plano en papel. Si no puede poner la casa, la bodega, el garaje, el estanque y los cultivos en el mapa, la app no le sirve. Le da igual que existan 200 calculos si no puede ver su terreno.
2. **"Y cuantas plantas me caben?"** — Lo SEGUNDO que quiere saber. Conto 134 a mano. Si la app le dice "en esta zona te caben 24 naranjos a 8 metros", Marcos dice "eso es exactamente lo que yo calcule". Momento de confianza.
3. **"Cuanta plata me va a costar?"** — Lo TERCERO. "24 naranjos a $5,000 cada uno = $120,000". Si la app le dice eso, ya supero al papel cuadriculado.
4. **"Esto lo puedo imprimir?"** — Marcos necesita llevarlo a la reunion de la agrupacion, mostrarselo a Hamilton, discutirlo con su familia. Si queda solo en la pantalla del celular, pierde valor social.

### Lo que a Marcos NO le importa (todavia)
- ROI porcentual: "ROI ano 2: 45%" — no entiende que significa
- Kc de cultivo: coeficiente de cultivo suena a lenguaje de agronomo
- Punto de equilibrio en kg: "186 kg para break-even" — no le dice nada
- GDD (grados dia): completamente abstracto
- Scoring de calidad de suelo con puntaje numerico: quiere "bueno/malo/regular", no "72/100"

### Lo que Marcos SI entiende y valora
- **Pesos chilenos**: "$120,000 en naranjos" — eso lo entiende perfecto
- **Metros**: "75 x 183 metros" — su idioma
- **Numero de plantas**: "24 naranjos" — concreto
- **Tiempo**: "en un mes" — sabe lo que significa
- **Semaforo rojo/amarillo/verde**: sabe que verde = seguro, rojo = peligro
- **"Tu vecino planta guayaba y le va bien"** — la validacion social

### User journey predicho
1. Abre la app → crea un proyecto → pone 75 x 183 metros
2. Dibuja la casa en la esquina → dibuja bodega al lado → pone estanque
3. Crea zona "Naranjos" → la app dice "caben 24 plantas" → se emociona
4. Ve el costo total → "$670,000 en plantas" → se asusta un poco
5. Busca "que puedo plantar?" → la app recomienda higuera (facil, tolerante) → se calma
6. Intenta plantar → la app dice "ALTO RIESGO: no tienes datos de suelo" → se detiene
7. Decide: "Voy a plantar UNA higuera de prueba y ver si agarra"
8. En 3 meses: "La higuera esta viva" → planta 5 mas → la app ajusta los calculos
9. Muestra el plano en la reunion de la agrupacion → "Mira, yo tengo esto planificado"

### Frase que definiria la app para Marcos
> "Es como mi hoja cuadriculada, pero me dice cuanto me va a costar y si es seguro."

### Que haria que Marcos DEJE de usar la app
- Si le pide datos que no tiene (CE en dS/m, pH exacto, etc.) como obligatorios
- Si usa terminologia que no entiende sin traduccion
- Si es mas complicada que dibujar en papel
- Si no puede hacer lo basico: poner casa + bodega + zonas de cultivo
- Si los numeros no calzan con lo que el ya sabe (134 plantas ≠ lo que la app dice → pierde confianza)

### Nivel de tolerancia a errores
Marcos compara la app contra su propio calculo manual. Si la app dice "caben 24 naranjos" y el conto 24 en su papel → **confianza total**. Si la app dice 30 y el conto 24 → **desconfianza inmediata**. Los calculos deben ser transparentes y explicados: "24 plantas = (zona 40m x 65m - margenes 5m) / (8m x 8m spacing)".

---
---

# PARTE 2 — ANALISIS Y DESARROLLO

Todo en esta seccion es interpretacion, propuesta o hallazgo tecnico nuestro. No son palabras del cliente.

---

## 2.1 Valor de esta Investigacion

Esta conversacion es la **primera entrevista de usuario real** del proyecto AgriPlan. A diferencia del UX_AUDIT (donde un usuario usa la app), aca se observa a un agricultor **planificando su terreno sin la app** — usando papel, regla, calculadora manual y experiencia de vecinos.

### Que valida
- **La hipotesis del producto es correcta**: El agricultor NECESITA exactamente lo que AgriPlan hace — layout de terreno, calculo de plantas, estimacion de agua, evaluacion de riesgo.
- **El momento de entrada es PRE-plantacion**: Marcos todavia no planto. Esta en fase de "preparar terreno + planificar layout + decidir que plantar". La app asume que el usuario ya tiene plantas. Esto es un gap critico.
- **El miedo a perder dinero es la barrera #1**: No es falta de interes ni tecnofobia. Es terror a invertir $1-2M CLP y perderlo por falta de datos.

### Que invalida o cuestiona
- **La unidad "hectarea" no resuena**: Marcos piensa en metros. 75x183m. No en 1.37 ha.
- **Los terminos tecnicos no comunican**: ROI, dS/m, Kc, punto de equilibrio — el usuario no los entiende.
- **Asumir terreno "listo para plantar" es un error**: En Arica, hay meses de preparacion (desalinizacion) antes de poder plantar una sola planta.

### El momento clave
Freddy mostro la app durante la conversacion ("Yo tengo algo como para hacer un plano") y la reaccion fue de interes — el padre reconocio que la herramienta resuelve exactamente lo que el esta haciendo en papel. Este momento confirma que el producto tiene product-market fit con el segmento "agricultor nuevo en zona arida".

---

## 2.2 Observaciones del Desarrollador Durante la Conversacion

Freddy (desarrollador) no solo escucho — tambien participo activamente:

### Lo que Freddy demostro
- Menciono la app: "Yo tengo algo como para hacer un plano" — esto desperto interes en Marcos
- Mostro que el concepto de la app calza exactamente con lo que el padre hace en papel
- No forzo una demo ni intento vender la app — dejo que la conversacion fluyera naturalmente

### Lo que Freddy observo como desarrollador
- El padre NECESITA la app pero no lo sabe todavia — esta haciendo manualmente lo que la app automatiza
- La barrera de entrada actual es demasiado alta: la app no tiene wizard, no guia al usuario nuevo
- El padre piensa en METROS no en HECTAREAS — la app habla un idioma que el usuario no entiende
- El concepto de "zona" en la app calza 100% con como el padre organiza su terreno en papel
- Las medidas del terreno (75x183m) son datos reales que se podrian usar como caso de prueba

### Datos utiles para testing
El terreno de Marcos es un **caso de prueba real perfecto**:
- Terreno: 75 x 183 m (13,725 m2)
- 12 zonas con tipos mixtos (infraestructura + cultivo + estanque)
- 134 plantas estimadas a 8m de spacing
- Margenes 5m por lado, pasillos 10m
- Cultivos: Naranjo, Higuera, Maracuya
- Suelo: salinidad visible, sin analisis formal

---

## 2.3 Features Identificados

### 2.3.1 No existen en la app

#### FEAT-F01: Wizard de inicio "Estoy empezando"
**Prioridad**: CRITICA
**Descripcion**: Flujo guiado paso a paso para usuarios nuevos con terreno vacio.
**Flujo propuesto**:
1. Crear proyecto y terreno (dimensiones)
2. Dividir en zonas (infraestructura + cultivo + estanque)
3. Registrar analisis de suelo/agua (o marcar como "pendiente")
4. Checklist "Es seguro invertir?" (semaforo rojo/amarillo/verde basado en datos disponibles)
5. Recomendar cultivos viables
6. Estimar plantas, costos y agua necesaria
7. Plantar (solo si paso 4 esta verde o amarillo con advertencia)
**Justificacion**: Sin esto, el usuario abre la app y no sabe por donde empezar. Marcos esta haciendo todo esto en papel.

#### FEAT-F02: Tipos de zona de infraestructura → CORREGIDO: YA EXISTEN EN CODIGO
**Prioridad**: BAJA (ya implementado en backend, solo verificar UI)
**Estado real**: Los tipos `casa`, `bodega`, `camino`, `decoracion`, `otro` YA EXISTEN en `TipoZona` con colores definidos en `COLORES_ZONA`. Ver CORRECCION-01 en §2.9.
**Lo que falta verificar**: Que la UI de creacion de zona permita seleccionar todos estos tipos, y que el mapa los renderice correctamente con sus colores.
**Impacto**: El trabajo es MUCHO menor al estimado. No es feature nueva, es verificacion de UI existente.

#### FEAT-F03: Tracking de desalinizacion / preparacion de terreno
**Prioridad**: ALTA
**Descripcion**: Registro de ciclos de lavado de sales con fechas, volumenes de agua usados, y lecturas de salinidad (si disponibles).
**Datos a trackear**:
- Fecha del lavado
- Volumen de agua usado (m3)
- Observacion visual (sal visible si/no, color, textura)
- Lectura de salinidad (dS/m) si tiene instrumento
- Estado: en_proceso | listo_para_plantar
**Justificacion**: En Arica, la preparacion de terreno ES la primera etapa. Puede tomar 1-3 meses. La app ignora completamente esta fase.

#### FEAT-F04: Calendario visual de siembra
**Prioridad**: ALTA
**Descripcion**: Vista mensual que muestre que cultivos se pueden plantar en el mes actual.
**Datos existentes**: `calendario.meses_siembra` en cada cultivo del catalogo (12 cultivos).
**UI propuesta**: Calendario 12 meses con barras de color por cultivo. Mes actual resaltado. Al clickear cultivo, ver detalles + "Agregar a zona".
**Justificacion**: "Que fecha plantar" fue pregunta directa sin respuesta en la conversacion.

#### FEAT-F05: Modo piloto / experimental
**Prioridad**: MEDIA
**Descripcion**: Marcar plantas o zonas como "experimento". Trackear supervivencia. No incluir en calculos de produccion hasta confirmar viabilidad.
**Mecanica**:
- Zona o planta marcada como `modo: 'piloto'`
- Dashboard de piloto: "2/3 plantas sobrevivieron 90 dias -> recomendacion: escalar"
- No afecta calculos de ROI/produccion del terreno general
**Justificacion**: Estrategia de inversion prudente que el agricultor ya usa intuitivamente.

#### FEAT-F06: Vista de riesgo / inversion pre-plantacion
**Prioridad**: MEDIA
**Descripcion**: Panel que muestre claramente ANTES de plantar: cuanto dinero se va a invertir, que datos faltan, cual es el nivel de riesgo.
**Contenido**:
- Costo total plantas: N plantas x $X = $TOTAL
- Costo agua anual estimado: $Y
- Inversion total primer ano: $Z
- Datos faltantes: [suelo no analizado, agua no analizada]
- Nivel de riesgo: ALTO (sin datos) / MEDIO (datos parciales) / BAJO (datos completos)
**Justificacion**: El miedo a perder plata fue el tema dominante de la conversacion.

#### FEAT-F07: Export / print del plan del terreno
**Prioridad**: BAJA
**Descripcion**: Generar PDF o imagen del mapa del terreno con zonas, cultivos, plantas, y datos resumidos.
**Uso**: Llevar a reuniones de la agrupacion, mostrar a agronomos, compartir con socios, presentar ante Bienes Nacionales.
**Justificacion**: El ecosistema del usuario es gente que trabaja con papel. Ademas, el requisito legal de Bienes Nacionales se beneficia de documentacion formal del uso del terreno. Un topografo hizo el plano original — el usuario valora outputs de aspecto profesional.

#### FEAT-F12: Calculador de tradeoff de spacing
**Prioridad**: ALTA
**Descripcion**: Al elegir espaciado de plantas, mostrar comparacion de escenarios lado a lado.
**Ejemplo**: "A 8m: 134 plantas ($670k). A 6m: 238 plantas ($1.19M). A 12m: 60 plantas ($300k)"
**Datos a mostrar por escenario**: Num plantas, costo total, agua anual estimada, area cultivable vs pasillo
**Justificacion**: El spacing es LA decision mas debatida en la conversacion. 8m vs 12m vs "algo intermedio".

#### FEAT-F13: Planificacion de densificacion futura
**Prioridad**: BAJA
**Descripcion**: Al elegir spacing de 8m, mostrar donde podrian ir plantas futuras a 4m (intercaladas).
**Mecanica**: En el mapa, mostrar posiciones futuras en color tenue (ghost plants). No cuentan en calculos de agua/ROI actuales.
**Justificacion**: Estrategia real de agricultores: empezar con espaciado amplio, densificar cuando haya confianza y capital.

### 2.3.2 Existen pero no llegan al usuario

#### FEAT-F08: Estimador de plantas por zona (surfacear)
**Estado**: El calculo `numPlantas = area_m2 / espaciado^2` existe internamente.
**Problema**: No se muestra prominentemente al seleccionar zona + cultivo. El usuario lo calcula a mano (conto 134 plantas en papel).
**Solucion**: Al seleccionar zona de cultivo y elegir cultivo, mostrar inmediatamente: "En esta zona de X x Y metros caben N plantas de [cultivo] a Z metros de distancia. Costo: $TOTAL."

#### FEAT-F09: Recomendacion de cultivos (mejor comunicacion)
**Estado**: El motor de recomendacion existe (`filtrarCultivosViables`, `rankearCultivosViables`, `calcScoreCalidad`).
**Problema**: Esta enterrado en `/agua/planificador` tab "viabilidad". El usuario no lo encuentra o no entiende que existe.
**Solucion**: Hacer accesible desde el flujo principal: "No sabes que plantar? -> Ver recomendaciones".

#### FEAT-F10: Costo real por planta (recien corregido)
**Estado**: `precio_planta_clp` fue agregado a los 12 cultivos del catalogo el 2026-02-08.
**Valores**: Tuna $500, Higuera $3,500, Pitahaya $2,000, Guayaba $2,500, Datil $15,000, Maracuya $1,500, Uva $3,000, Limon $5,000, Mandarina $5,000, Arandano $4,000, Lucuma $6,000, Zapote $5,000.
**Problema previo**: Usaba `(precio_kg_min + precio_kg_max) / 2 * 0.5` como proxy (precio de cosecha como proxy de planta).

#### FEAT-F11: Spacing auto en grilla (ya funciona)
**Estado**: La grilla de plantacion usa `espaciado_recomendado_m` del catalogo automaticamente.
**Nota**: Una IA sugirio "al elegir Naranjo, el grid se ajuste a la distancia optima" — esto YA FUNCIONA. El grid usa el espaciado del cultivo seleccionado.

---

## 2.4 Ideas Nuevas — Pensando Como el Agricultor

Estas ideas surgen de ponerse en los zapatos de Marcos: un agricultor que escucha que existe una app que planifica terrenos, y piensa "que mas me gustaria que hiciera?"

### IDEA-01: Simulador de escala — "Empiezo con 10 o con 134?"
**Razonamiento del agricultor**: "No voy a plantar 134 de golpe. Quiero ver cuanto me sale empezar con 10, con 30, con 50. Y cuanto gano con cada escala."
**Que resuelve**: Es diferente a FEAT-F12 (spacing). Aca el spacing es fijo (8m), lo que cambia es CUANTAS posiciones planto. El agricultor quiere ver:
- 10 plantas (solo naranjos, zona 7): Costo $50k, agua $X/mes, primera cosecha en Y meses
- 50 plantas (naranjos + higueras): Costo $225k, agua $X/mes
- 134 plantas (todo el terreno): Costo $670k+, agua $X/mes
**Conexion con DOLOR-03**: Reduce el miedo. Muestra que puede empezar chico y escalar.
**Conexion con DOLOR-07**: Formaliza la estrategia incremental que ya usa intuitivamente.

### IDEA-02: Calendario de tareas mes a mes — "Que hago esta semana?"
**Razonamiento del agricultor**: "El proyecto me abruma. Son 134 hoyos, meses de preparacion, despues plantar, despues regar... necesito que alguien me diga: ESTA semana hace ESTO."
**Que resuelve**: El proyecto es enorme. Sin desglose temporal, paraliza. La app deberia generar:
- Feb semana 1: Medir terreno definitivo, marcar limites
- Feb semana 2-3: Cavar hoyos zona 7 (24 hoyos)
- Mar-Abr: Desalinizar zona 7 (ciclos de lavado)
- May: Plantar naranjos zona 7
- May semana 2: Cavar hoyos zona 8
- Jun-Jul: Desalinizar zona 8
- Ago: Plantar higueras zona 8
**Formato**: No un Gantt chart complejo — una lista simple "esta semana / proxima semana / este mes".
**Diferencia con FEAT-F04 (calendario siembra)**: FEAT-F04 dice CUANDO plantar. Esta idea dice QUE HACER, paso a paso, incluyendo preparacion de terreno, logistica, compras.

### IDEA-03: Lista de compras generada del plan
**Razonamiento del agricultor**: "Ya planifique todo. Ahora, que tengo que ir a comprar? Necesito una lista que pueda llevar al vivero."
**Que genera**: Basado en el plan completo del terreno, la app genera:
```
LISTA DE COMPRAS - Terreno Marcos (75x183m)
Plantas:
  - 24 Naranjos (planta grande)     @ $5,000 = $120,000
  - 30 Higueras                     @ $3,500 = $105,000
  - 30 Maracuya                     @ $1,500 = $45,000
  - 50 Por definir                  → pendiente
                                    Subtotal: $270,000

Riego:
  - Tuberia goteo: ~850 metros      → cotizar
  - Goteros: 104 unidades           → cotizar
  - Conectores/llaves               → cotizar

Suelo:
  - Analisis INIA (1 muestra)       ~ $75,000
  - Compost/enmienda (si necesario) → post-analisis

TOTAL ESTIMADO: $345,000 + riego + imprevistos
```
**Justificacion**: El plan queda en la app, pero la COMPRA pasa en el mundo real. Conectar el plan digital con la accion fisica (ir al vivero con una lista).

### IDEA-04: Dimensionamiento de estanque — "De cuanto tiene que ser mi estanque?"
**Razonamiento del agricultor**: "Voy a poner un estanque. Pero de cuanto? 5,000 litros? 10,000? 50,000? Cuantos dias de agua me da cada tamano?"
**Que calcula**: Basado en las plantas planificadas y su consumo:
- 104 plantas activas consumen ~X m3/semana
- Con estanque de 5,000L: alcanza para Y dias
- Con estanque de 10,000L: alcanza para Z dias
- Recomendacion: minimo W litros para sobrevivir 2 semanas sin recarga
**Conexion**: El estanque YA existe como zona en la app. Esta idea es conectar la CAPACIDAD del estanque con la DEMANDA real de las plantas planificadas.
**Datos existentes**: `agua_m3_ha_ano` de cada cultivo + area de zonas + num plantas. La logica de calculo existe, falta el output "tu estanque debe ser de X litros minimo".

### IDEA-05: Costo del agua de preparacion (antes de plantar)
**Complementa a FEAT-F03** (tracking desalinizacion): FEAT-F03 es el LOG de lavados, IDEA-05 es la PROYECCION de cuanto cuesta.
**Razonamiento del agricultor**: "Tengo que echar agua, agua, agua un mes entero para lavar la sal. Cuanta agua es eso? Cuanto me va a costar ANTES de poner una sola planta?"
**Que calcula**: Agua necesaria para desalinizar N hoyos:
- Cada hoyo necesita ~200-500 litros por ciclo de lavado (estimacion)
- Con 3-5 ciclos de lavado por hoyo
- 134 hoyos x 400L x 4 ciclos = ~214 m3 de agua solo para preparar
- A $X/m3 = costo de preparacion: $Y
**Por que importa**: El agricultor sabe que la preparacion necesita agua, pero no cuanta ni cuanto le va a costar. Este costo es INVISIBLE en todos los calculos actuales. La app muestra agua de riego pero no agua de preparacion.
**Nota**: Los volumenes por hoyo son estimaciones y dependen del tipo de suelo. La app podria empezar con valores default para "suelo salino Arica" y permitir ajustar.

### IDEA-06: El costo de NO saber — Argumento financiero para el analisis de suelo
**Complementa a FEAT-F06** (vista riesgo/inversion): FEAT-F06 es el panel general de riesgo, IDEA-06 es el argumento concreto "$75k de analisis vs $90k de plantas muertas" dentro de ese panel.
**Razonamiento del agricultor**: "El analisis INIA cuesta $75,000. Es caro. Pero si NO lo hago y pierdo 20 plantas..."
**Que muestra**: Un panel simple:
```
SIN ANALISIS DE SUELO:
  Si plantas 30 naranjos ($150,000) y la salinidad es alta:
  Riesgo mortalidad: 30-60%
  Perdida potencial: $45,000 - $90,000

CON ANALISIS DE SUELO ($75,000):
  Sabes antes de plantar si el suelo es compatible
  Si no es compatible, cambias a cultivo tolerante (perdida: $0)
  Si es compatible, plantas con confianza (riesgo mortalidad: <10%)

CONCLUSION: Gastar $75k en analisis puede ahorrarte $90k+ en plantas muertas
```
**Conexion con DOLOR-01 y DOLOR-03**: Convierte el miedo abstracto en un calculo concreto. No le dice "el suelo importa" — le dice "no analizar el suelo te puede costar $90k".

### IDEA-07: Linea de tiempo financiera — "Cuando empiezo a ganar plata?"
**Razonamiento del agricultor**: "No me importa el ROI. Me importa: en que mes dejo de solo gastar y empiezo a ganar? Cuantos meses tengo que aguantar?"
**Que muestra**: Grafico simple mes a mes:
```
Mes 1-2:  Preparacion terreno   -$50,000 (agua prep)
Mes 3:    Compra plantas        -$270,000
Mes 4-12: Solo agua riego       -$15,000/mes
Mes 13-18: Primeros frutos      +$30,000/mes
Mes 19+:  Produccion estable    +$80,000/mes
---------------------------------------
Punto de equilibrio: Mes 22 (recuperas toda la inversion)
```
**Diferencia con ROI existente**: El ROI actual muestra "ROI ano 2: 45%". Marcos no entiende eso. Esta idea le dice: "Mes 22 empiezas a ganar. Antes de eso, gastas $X en total." Pesos y meses, no porcentajes.
**Datos existentes**: `calcularROI()` ya tiene proyeccion a 4 anos. Solo falta presentarlo como timeline mensual en vez de tabla anual.

---

## 2.5 Validacion Cruzada de Sugerencias (4 IAs)

### Sugerencias correctas (validadas contra el codebase)

| Sugerencia | Fuente | Validacion |
|------------|--------|------------|
| Wizard de inicio guiado | Cursor, Claude Opus | CORRECTO. No existe flujo de onboarding. El usuario se pierde. |
| Tipos de zona infraestructura | Claude Opus | PARCIAL. Las 4 IAs dijeron que faltaban pero los tipos YA EXISTEN en TipoZona (casa, bodega, camino, decoracion, otro). El gap real es verificar que la UI permita seleccionarlos. Ver CORRECCION-01 en §2.9. |
| Tracking desalinizacion | Todas (4/4) | CORRECTO. Feature completamente ausente. Critico para Arica. |
| Calendario de siembra visual | Claude Opus | CORRECTO. Datos existen en catalogo pero no hay UI. |
| Modo piloto/experimental | Cursor, Claude Opus | CORRECTO. No existe concepto de experimentacion vs produccion. |
| Resumen exportable/imprimible | Cursor, Claude Opus | CORRECTO. Ecosistema del usuario es papel. |
| Checklist pre-inversion | Cursor, Claude Opus, LLM #2 | CORRECTO. No hay semaforo de "es seguro invertir?". |
| Grid dinamico basado en spacing | LLM #2 | YA EXISTE parcialmente. La grilla usa espaciado del catalogo. Pero no hay herramienta de "regla" visual. |

### Sugerencias parcialmente correctas

| Sugerencia | Fuente | Validacion |
|------------|--------|------------|
| "Modo proyecto colectivo" | Cursor | PARCIAL. Valida la necesidad pero fuera de scope actual. Documentar como futuro. |
| "Si el 20% de tus plantas podrian morir" | LLM #2 | PARCIAL. `factorSuelo` calcula reduccion de produccion pero no mortalidad de plantas. Son metricas diferentes. |
| "Herramienta de Regla" en el mapa | LLM #2 | PARCIAL. Util pero no prioritario. El mapa ya muestra dimensiones de zona. |

### Sugerencias que requieren cuidado

| Sugerencia | Fuente | Validacion |
|------------|--------|------------|
| "Modo Preparacion de Terreno con calculo de agua para lavar suelo" | LLM #2 | CUIDADO. Calcular agua de lavado requiere datos de suelo (textura, profundidad, CE) que el usuario probablemente no tiene. Mejor empezar con tracking simple (log de lavados) sin pretender calcular volumenes exactos. |
| "Tu app no es solo software, es un asesor que reemplaza al agronomo" | LLM #2 | CUIDADO. La app NO reemplaza un agronomo. Complementa y da estructura, pero decisiones criticas (tratamiento de suelo, eleccion de portainjerto, manejo fitosanitario) requieren profesional. No sobrevender las capacidades. |

---

## 2.6 Mapa de Features Existentes vs Necesidades del Usuario

```
TERRENO VACIO ────────────────────────────────────────── PRODUCCION
    │                                                          │
    ├─ Medir terreno          [EXISTE parcial - GPS en config]
    ├─ Crear zonas            [EXISTE - tipos definidos, verificar UI]
    ├─ Layout infraestructura [EXISTE tipos - verificar renderizado]
    ├─ Comparar layouts       [NO EXISTE - camino al medio vs lado]
    ├─ Analisis suelo         [EXISTE inputs - falta checklist]
    ├─  → Argumento $$        [NO EXISTE - costo de NO analizar]    IDEA-06
    ├─ Analisis agua          [EXISTE]
    ├─ Desalinizacion         [NO EXISTE - por hoyo]
    ├─  → Costo agua prep     [NO EXISTE - agua ANTES de plantar]   IDEA-05
    ├─ Que plantar?           [EXISTE motor - falta calendario]
    ├─ Cuantas plantas?       [EXISTE calculo - falta visibilidad]
    ├─ Comparar spacings      [NO EXISTE - 6m vs 8m vs 12m]        FEAT-F12
    ├─ Cuantas? 10 o 134?     [NO EXISTE - simulador de escala]    IDEA-01
    ├─ Cuanto cuesta?         [EXISTE ROI - falta pre-inversion]
    ├─  → Lista de compras    [NO EXISTE - output accionable]       IDEA-03
    ├─  → Dimensionar tanque  [NO EXISTE - tamano estanque]         IDEA-04
    ├─ Cuando gano plata?     [NO EXISTE - timeline en pesos]       IDEA-07
    ├─ Que hago esta semana?  [NO EXISTE - calendario tareas]       IDEA-02
    ├─ Experimentar           [NO EXISTE]
    ├─ Plantar                [EXISTE - grilla + manual]
    ├─ Densificar despues     [NO EXISTE - ghost plants]
    ├─ Regar                  [EXISTE]
    ├─ Monitorear             [EXISTE parcial]
    ├─ Cosechar               [NO EXISTE tracking]
    └─ Vender                 [NO EXISTE]
```

---

## 2.7 Priorizacion Sugerida para Desarrollo

### Tier 1 - Desbloquean el uso basico (el usuario puede representar su terreno completo)
1. **FEAT-F02**: Verificar UI tipos de zona infraestructura (los tipos YA EXISTEN en codigo — solo verificar que la UI los expone y el mapa los renderiza)
2. **FEAT-F08**: Surfacear estimador de plantas (reutiliza calculo existente)
3. **FEAT-F12**: Calculador tradeoff de spacing (decision mas debatida en la conversacion)
4. **FEAT-F04**: Calendario de siembra visual (reutiliza datos existentes)

### Tier 2 - Reducen el miedo y dan confianza
5. **FEAT-F06 + IDEA-06**: Vista riesgo/inversion pre-plantacion + costo de NO analizar suelo (se complementan: FEAT-F06 es el panel general, IDEA-06 es el argumento financiero concreto dentro de ese panel)
6. **IDEA-01**: Simulador de escala — "empiezo con 10 o con 134?"
7. **IDEA-07**: Timeline financiera en pesos — "cuando empiezo a ganar?"
8. **FEAT-F01**: Wizard de inicio (mas complejo, requiere diseno UX)
9. **FEAT-F09**: Recomendaciones mas accesibles

### Tier 3 - Features nuevas para el flujo de Arica
10. **FEAT-F03 + IDEA-05**: Tracking desalinizacion + costo agua de preparacion (se complementan: FEAT-F03 es el tracking por hoyo, IDEA-05 es el calculo de cuanta agua/plata cuesta la preparacion)
11. **FEAT-F05**: Modo piloto/experimental

### Tier 4 - Outputs accionables
12. **IDEA-03**: Lista de compras generada del plan (conecta plan digital → accion fisica)
13. **FEAT-F07**: Export/print
14. **IDEA-04**: Dimensionamiento de estanque (cuanto necesito?)

### Tier 5 - Futuro
15. **FEAT-F13**: Densificacion futura (ghost plants)
16. **IDEA-02**: Calendario de tareas semanal (que hago esta semana?)
17. Cultivos adicionales (Naranjo, Fresa)
18. Proyecto colectivo / multi-usuario

---

## 2.8 Relacion con Backlog Existente

| Feature nuevo | Fase existente relacionada |
|---------------|--------------------------|
| FEAT-F01 (Wizard) | FASE_11B_AGUA_UX_SEGMENTACION.md (mencionaba segmentacion por experiencia) |
| FEAT-F02 (Zonas infra) | FASE_3_ZONAS.md (TipoZona YA tiene los tipos — verificar UI) |
| FEAT-F03 (Desalinizacion) | FASE_5C_SUELO.md + FASE_8_AGUA.md (nuevo modulo) |
| FEAT-F04 (Calendario) | FASE_7_CATALOGO.md (datos existen, falta UI) |
| FEAT-F05 (Piloto) | FASE_4_PLANTAS.md (ampliar modelo de planta) |
| FEAT-F06 (Riesgo) | FASE_11C_dashboard_planificador (ampliar dashboard) |
| FEAT-F08 (Plantas visible) | FASE_3_ZONAS.md + FASE_4_PLANTAS.md |
| FEAT-F12 (Spacing tradeoff) | FASE_4_PLANTAS.md (nuevo calculo comparativo) |
| FEAT-F13 (Densificacion) | FASE_4_PLANTAS.md (ghost plants en mapa) |
| IDEA-01 (Simulador escala) | FASE_11C_dashboard_planificador (extension de ROI) |
| IDEA-02 (Calendario tareas) | backlog/futuro/calendario-tareas.md (ya documentado como futuro) |
| IDEA-03 (Lista compras) | Nuevo — no tiene fase existente |
| IDEA-04 (Dimensionar tanque) | FASE_8A_ESTANQUES.md (extension logica) |
| IDEA-05 (Agua preparacion) | FASE_5C_SUELO.md + **FEAT-F03** (complemento: F03 es el log, IDEA-05 es la proyeccion de costo) |
| IDEA-06 (Costo ignorancia) | **FEAT-F06** (complemento: F06 es el panel general, IDEA-06 es el argumento financiero concreto) |
| IDEA-07 (Timeline financiera) | FASE_11C/04_modulo_economia.md (presentacion alternativa del ROI) |

---

## 2.9 Auditoria Tecnica — Perspectiva del Desarrollador

Revision del codebase contra la transcripcion. Que tiene la app realmente? Que falta?

### CORRECCIONES al documento (cosas que dijimos que NO existen pero SI existen)

#### CORRECCION-01: Los tipos de zona de infraestructura YA EXISTEN
**Lo que dijimos**: "Solo existen 'cultivo' y 'estanque'. Faltan 4+ tipos."
**Realidad en el codigo** (`src/types/index.ts:231`):
```typescript
export type TipoZona = 'cultivo' | 'bodega' | 'casa' | 'camino' | 'decoracion' | 'estanque' | 'otro'
```
Los tipos `bodega`, `casa`, `camino`, `decoracion` y `otro` YA EXISTEN. Los colores tambien estan definidos (`COLORES_ZONA`). El backend esta listo.
**Impacto en FEAT-F02**: Cambia de "feature nueva" a "verificar que la UI expone estos tipos correctamente y que el mapa los renderiza bien". El trabajo es MUCHO menor de lo estimado.

#### CORRECCION-02: El porcentaje de terreno planificado YA EXISTE
**Lo que dijimos**: Falta una vista "porcentaje de terreno planificado".
**Realidad en el codigo**:
- `project-context.tsx:269-271`: Calcula `area_usada_m2`, `area_libre_m2`, `porcentaje_uso`
- `terreno-dashboard.tsx:15-16`: Muestra `XX%` y `YYY / ZZZ m²`
- `map-info-bar.tsx:54-56`: Muestra `XX% uso` y `YYY m² usados`
- `pixi-mapa-terreno-inner.tsx:836-840`: Muestra "Usada: Xm2" y "Libre: Ym2"
**Impacto**: Esta feature ya esta implementada y funcional. No necesita desarrollo nuevo. Quizas necesita mejor visibilidad o un mensaje tipo "Te falta planificar el 42% de tu terreno (Bienes Nacionales exige 100%)."

#### CORRECCION-03: EstadoZona 'en_preparacion' ya esta definido
**Lo que dijimos**: "No hay concepto de preparacion de terreno."
**Realidad**: `EstadoZona = 'activa' | 'vacia' | 'en_preparacion'` existe en types. PERO solo esta definido — no se usa en ninguna logica ni UI. Es un placeholder listo para implementar.
**Impacto en FEAT-F03**: El estado ya existe en el modelo. Solo falta la UI para tracking de lavados y la logica de transicion `en_preparacion → activa`.

#### CORRECCION-04: Zonas SI soportan multiples cultivos
**Lo que pensabamos**: Una zona = un cultivo.
**Realidad**: La `Zona` NO tiene campo `cultivo_id`. Los cultivos se asignan via `Planta.tipo_cultivo_id`. Esto significa que una zona PUEDE tener plantas de diferentes tipos de cultivo (cultivo mixto). El modelo de datos ya lo permite.
**Impacto**: El usuario dijo "Aqui puedo poner dos clases de plantas". La app YA lo soporta a nivel de datos. Verificar si la UI lo facilita o lo dificulta.

### GAPS TECNICOS NUEVOS (cosas que realmente faltan en el codigo)

#### GAP-DEV-01: El grid de plantacion NO tiene margenes configurables
**Problema**: Marcos quiere 5m de margen en todos los bordes. Dice: "Las plantas tienen que quedar para alla. Las plantas que tengan el terreno libre, 5." El grid actual (`grid-automatico-modal.tsx`) planta desde la esquina 0,0 de la zona sin offset.
**Impacto**: Las plantas se colocan justo en el borde de la zona. Si la zona tiene 5m de margen respecto al terreno, las plantas quedan a 5m del limite. Pero si el usuario quiere margen DENTRO de la zona (5m del borde de zona), no es posible.
**Solucion**: Agregar parametro `margen_m` al grid automatico que desplace la primera planta X metros desde cada borde de la zona.

#### GAP-DEV-02: No hay distincion planta grande vs semilla
**Problema**: "Depende si la voy a comprar como grandecito ya, o como semilla nomas." El modelo `Planta` no tiene campo para tipo de adquisicion (semilla, plantula, planta establecida). El `precio_planta_clp` en el catalogo es un precio unico.
**Impacto**: El costo de inversion cambia drasticamente. Una semilla de limon puede costar $500, una planta establecida $5,000. La supervivencia tambien cambia: semilla ~50-60%, planta establecida ~85-95%.
**Solucion futura**: Agregar `tipo_adquisicion: 'semilla' | 'plantula' | 'establecida'` a Planta, y `precio_semilla_clp`, `precio_plantula_clp` al catalogo.

#### GAP-DEV-03: Fotos solo en cosechas, no en plantas/zonas/terreno
**Problema**: "Yo le saque foto, pero se me perdio." El usuario toma fotos de mediciones, del estado del terreno, de la sal. Pero `foto_url` solo existe en el tipo `Cosecha` (line 463).
**Impacto**: No se puede documentar visualmente el progreso de preparacion del terreno, el estado de hoyos, ni las mediciones fisicas.
**Solucion futura**: Agregar `fotos?: string[]` a Planta, Zona y Terreno.

#### GAP-DEV-04: Terreno no tiene orientacion (puntos cardinales)
**Problema**: "Yo quiero hacer siempre la casa mirando para el sur" / "Este esta para el mar, este para el sur, este para el norte." La orientacion solar importa para ubicar la casa, para saber que zonas reciben mas sol, para decidir donde plantar cultivos que necesitan sombra parcial.
**Estado**: El tipo `Terreno` no tiene campo de orientacion ni de norte. El mapa no tiene indicador de puntos cardinales.
**Solucion futura**: Agregar `orientacion_norte_grados?: number` al Terreno (0 = norte arriba, 90 = este arriba, etc.) y mostrar brujula en el mapa.

#### GAP-DEV-05: Terreno asume forma perfectamente rectangular
**Problema**: El terreno de Marcos es 75m de frente y 76m de fondo — no es un rectangulo perfecto, es un trapecio. El modelo `Terreno` solo tiene `ancho_m` y `alto_m`, que define un rectangulo exacto.
**Impacto**: En la practica, la diferencia es de 1m (75 vs 76), lo cual es menor. Pero en terrenos mas irregulares esto seria un problema mayor. Para el MVP, el rectangulo es aceptable.
**Solucion futura**: Soportar poligonos (lista de vertices) ademas de rectangulos.

#### GAP-DEV-06: Unidades mixtas en la UI (ha vs m2)
**Problema**: El terreno y las zonas muestran `m²`. Pero el catalogo de cultivos usa `agua_m3_ha_ano` (hectareas). El usuario piensa en metros, no en hectareas. Hay conversion interna, pero en la UI aparecen ambas unidades.
**Estado**: `resumen-terreno.tsx` muestra m². `catalogo-list.tsx` muestra m³/ha/ano. `guia/page.tsx` menciona "0.5 ha".
**Impacto UX**: Confusion. El usuario ve "3,000-5,000 m³/ha/ano" y no entiende cuanto agua necesitan SUS 24 naranjos. Deberia ver "Tus 24 naranjos necesitan ~X m³/mes".

---

## 2.10 Perspectiva del Product Owner

### Segmentacion de usuario validada
La conversacion confirma un segmento ESPECIFICO que la app debe servir:
**"Agricultor nuevo en zona arida con terreno vacio"**
- No tiene experiencia
- No tiene datos de suelo
- No tiene agronomo
- Tiene miedo a invertir
- Trabaja con papel
- Piensa en metros y pesos chilenos

Este es un segmento diferente al "agricultor experimentado que quiere optimizar". El MVP debe elegir UNO. Esta conversacion dice claramente: **el primer usuario es el novato asustado**.

### Jobs-to-be-done del usuario
Desde la perspectiva JTBD, Marcos NO quiere "planificar un terreno". Sus jobs reales son:

1. **"Quiero sentirme seguro de que no voy a perder mi plata"** — EMOCIONAL, es el job principal
2. **"Quiero saber exactamente que hacer y en que orden"** — FUNCIONAL, reducir incertidumbre
3. **"Quiero poder mostrar mi plan a otros (agrupacion, familia)"** — SOCIAL, ganar credibilidad
4. **"Quiero empezar chico y escalar solo si funciona"** — FUNCIONAL, control de riesgo

### Metricas de exito del PO
Si el PO midiera exito con este usuario:
- **Activacion**: El usuario crea un terreno con dimensiones reales y al menos 3 zonas → "Hizo lo que hacia en papel"
- **Engagement**: El usuario vuelve al menos 1x/semana a revisar o modificar su plan
- **Valor entregado**: El usuario identifica al menos 1 dato que no tenia antes (costo total plantas, agua necesaria, cultivo recomendado)
- **Retencion**: El usuario registra su primera planta real (transicion de "planificando" a "haciendo")

### Re-priorizacion del PO
El PO priorizaria diferente al desarrollador. La logica del PO es: **que feature genera activacion MAS RAPIDO con MENOS esfuerzo?**

| # | Feature | Esfuerzo | Impacto activacion | Decision PO |
|---|---------|----------|-------------------|-------------|
| 1 | CORRECCION-01: Verificar UI tipos zona | BAJO | ALTO — usuario puede representar su terreno completo | HACER PRIMERO |
| 2 | FEAT-F08: Surfacear estimador plantas | BAJO | ALTO — "en esta zona caben 24 naranjos a $120k" | HACER PRIMERO |
| 3 | GAP-DEV-06: Mostrar consumo agua por planta, no por ha | MEDIO | ALTO — usuario entiende SU costo | HACER |
| 4 | IDEA-07: Timeline pesos mes a mes | MEDIO | ALTO — "mes 22 empiezo a ganar" | HACER |
| 5 | FEAT-F01: Wizard | ALTO | ALTISIMO pero requiere diseno UX | PLANIFICAR, no rushear |
| 6 | FEAT-F03: Tracking desalinizacion | ALTO | MEDIO — solo si el usuario esta en fase de prep | DESPUES |

### Riesgo de producto que el PO identificaria
"La app tiene features de calculo avanzado (ROI, Kc, scoring, fenologia, GDD) pero el usuario basico no entiende ni necesita nada de eso todavia. Hay riesgo de que el usuario abra la app, se sienta abrumado, y vuelva a su papel cuadriculado. **La simplicidad del papel es la competencia real.**"

---

## 2.11 Perspectiva del Agronomo Profesional

### Sobre la conversacion
1. **El enfoque de desalinizacion POR HOYO es correcto pero incompleto**: En suelos salinos de Arica, el lavado por hoyo funciona para preparacion puntual. Pero hay que considerar que el agua de lavado puede re-salinizar zonas adyacentes si no hay drenaje adecuado. La app deberia preguntar: "Tu terreno tiene drenaje?" antes de sugerir volumenes de lavado.

2. **El spacing de 8m es razonable pero depende del cultivo**:
   - Naranjos: 6-8m entre plantas, 6-7m entre hileras. 8m esta bien.
   - Higuera: 8-10m (copa grande). 8m puede ser justo en arbol adulto.
   - Maracuya: 3-5m (trepadora). 8m es excesivo — desperdicia terreno.
   - **La app DEBERIA advertir cuando el spacing elegido no coincide con el recomendado del catalogo.** El `espaciado_recomendado_m` existe en el catalogo pero el usuario puede ignorarlo.

3. **"Copiar al vecino" es una estrategia valida**: En agronomia, el exito de cultivos cercanos es un indicador real de viabilidad (misma zona agroecologica, mismo microclima, similar suelo). La app podria formalizar esto: "Cultivos exitosos en tu zona: guayaba, higuera (basado en datos regionales)."

4. **La falta de analisis de suelo es un riesgo REAL, no exagerado**: El padre tiene razon. En Arica, los niveles de boro pueden ser toxicos (>2 ppm) para citricos sensibles. Plantar limon sin conocer el boro es arriesgado. La app DEBERIA bloquear la plantacion de cultivos sensibles si no hay datos de suelo, con un mensaje explicativo.

### Sobre los calculos de la app
5. **Kc por etapa de crecimiento es correcto pero simplificado**: La app usa Kc fijos por etapa. En la realidad, Kc varia con la cobertura del suelo, la densidad de plantacion, y el metodo de riego. Para un MVP esto es aceptable, pero deberia indicarse como "estimacion" no como dato exacto.

6. **El factor de suelo afecta produccion pero tambien supervivencia**: `factorSuelo` en `calidad.ts` reduce la produccion en kg. Pero suelos malos no solo producen menos — **matan plantas**. La app deberia distinguir entre "reduccion de rendimiento" y "riesgo de mortalidad". Un suelo con CE > 8 dS/m no solo baja produccion — mata la mayoria de frutales.

7. **Los meses de siembra del catalogo son correctos para Arica**: La zona arida de Arica tiene ventana de siembra mas amplia que el resto de Chile por sus temperaturas estables. Pero la app deberia considerar la EPOCA DE CALOR para siembra de frutales: evitar plantar en enero-febrero (estres termico + salinidad concentrada por evaporacion). Mejor: marzo-mayo o agosto-octubre.

### Recomendaciones agronomicas para la app
8. **Agregar concepto de "aptitud frutal por zona"**: No todas las zonas del terreno son iguales. Las zonas mas bajas (con acumulacion de sales) son peores. Las cercanas al estanque tendran mas humedad residual. La app podria sugerir "mejor zona para plantar" basandose en posicion relativa dentro del terreno.

9. **La lista de cultivos deberia incluir indicador de dificultad**: Para un agricultor novato:
   - FACIL: Higuera (tolerante a sal, resistente a sequia), Tuna (nativa, extremadamente resistente)
   - MEDIO: Guayaba, Maracuya (tolerantes pero necesitan agua regular)
   - DIFICIL: Limon, Mandarina, Arandano (sensibles a boro y salinidad)
   - La app tiene `tolerancia_salinidad` y `tolerancia_boro` pero no las traduce a un "nivel de dificultad" entendible.

10. **La recomendacion de "primero analiza suelo" deberia ser un GATE, no un consejo**: En la logica actual, el usuario puede plantar sin datos de suelo. Desde la perspectiva agronomica, esto deberia ser un bloqueo suave: "No recomendamos plantar [cultivo sensible] sin analisis de suelo. Tu riesgo estimado es ALTO. Quieres continuar de todas formas?" Con una advertencia clara, no un bloqueo total.
