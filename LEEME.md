# Vera — Capacitadora Virtual

Plataforma que dicta inducciones **sin capacitador humano**: Vera (una IA con
cara y voz) presenta el contenido, ve la sala por la cámara, aprende el nombre
de cada asistente, llama la atención por nombre a quien se distrae, hace
preguntas y entrega un **acta de atención** para el supervisor.

Pensada para empresas con alta rotación (cobranzas, call centers) donde
capacitar al que capacita es un gasto que nunca termina.

## Cómo abrirla

**El link público (funciona siempre, desde cualquier aparato):**
https://joanhispanista-star.github.io/vera/ — publicada en GitHub Pages
(repo público `joanhispanista-star/vera`) desde el 26-ago-2026. Por ser HTTPS,
la cámara y el micrófono funcionan desde cualquier computador o celular.
**Publicar cambios = `git push`** (como Prisma): el sitio se reconstruye solo
en un minuto.

**En este computador, sin internet:** doble clic en **`ABRIR.cmd`**. Eso
levanta el servidor local y abre `http://localhost:8240`. Ese link solo
responde mientras la ventana del servidor esté abierta — ABRIR.cmd es el
interruptor. (El detector de rostros sí necesita internet la primera vez.)

Ojo: cada aparato guarda sus propios cursos editados y sus actas (memoria del
navegador). Lo que se edita en el computador no aparece solo en el celular.

- **Mejor navegador para la VOZ**: Edge (trae la voz colombiana natural
  "Salome" gratis). 
- **Mejor navegador para el MICRÓFONO**: Chrome (el reconocimiento de voz de
  Edge a veces falla). Si el micrófono no responde, no pasa nada: todo lo que
  se responde por voz también se puede escribir con el teclado.
- La primera vez necesita internet: el detector de rostros (MediaPipe, de
  Google, gratuito) se descarga al navegador. El video **nunca** sale del
  computador.

## Los dos modos

1. **Sala real con cámara**: apunta la cámara al grupo (o a ti solo: con una
   persona funciona igual y Vera te habla directo). Al empezar, el navegador
   pide cámara y micrófono en un solo aviso — acéptalos. Vera detecta las
   caras, pide el nombre de cada uno (por voz o teclado), calibra su postura
   de "estoy mirando" y arranca. Si alguien gira la cabeza mucho rato, cierra
   los ojos o se va, Vera lo llama por su nombre.
2. **Modo demostración (sin cámara)**: una sala simulada de 4 personas hace la
   sesión completa — incluido Jorge, el de la camisa roja y las gafas, que saca
   el celular y Vera lo regaña por nombre. **Este es el modo para vender**: se
   puede mostrar en cualquier parte sin reunir gente.

Truco para probar rápido: abrir `http://localhost:8240/?rapido=1` hace que Vera
"hable" solo con subtítulos, sin audio — la sesión entera pasa en un minuto.

Controles durante la sesión: **Saltar ⏭** corta lo que Vera esté diciendo (útil
para llevar el ritmo del demo), **Terminar y generar acta** corta la sesión y
entrega el acta con lo acumulado, y tocar la ficha de una persona permite
corregirle el nombre. En el registro, **"Ya no está / omitir"** salta a quien
se fue antes de decir su nombre.

## Los tres cursos de fábrica

Se eligen con el selector "Curso de hoy" en la pantalla de inicio:

1. **Inducción básica para asesores de cobranza** — la bienvenida, la ley en
   resumen y el método de la llamada. 3 módulos.
2. **Ley 2300 y el marco legal de la cobranza** — horarios y canales de la
   2300, lo prohibido, el reporte a centrales (los 20 días, la permanencia del
   dato) y la Ley 1581 en la llamada. 4 módulos. Los datos legales se
   verificaron contra la SIC y la Superfinanciera el 26-ago-2026.
3. **Persuasión ética para cobrar** — psicología del deudor, manejo de
   objeciones (escuchar-validar-ofrecer), técnicas de cierre (ancla, síes
   pequeños) y la línea roja entre persuadir y acosar. 4 módulos.

Cada curso se edita por aparte con "Editar contenido" (edita el curso
seleccionado); "Restaurar el de fábrica" solo llena el editor, no borra nada
hasta que se oprima Guardar.

## Editar el contenido

Botón "Editar contenido" en la pantalla de inicio. Formato de texto plano:

```
Título de la capacitación

# Título del módulo
- Punto que Vera lee en voz alta.
- Otro punto.
? ¿La pregunta del módulo? | palabras, clave | La respuesta modelo que Vera dice.
```

El contenido de fábrica es una inducción real para asesores de cobranza
(incluye la Ley 2300 de 2023 — lo que un asesor tiene prohibido hacer).

## Qué es verdad y qué no (honestidad ante el cliente)

- **Verdad**: detección de caras y atención en tiempo real, local y gratis;
  nombres por rostro durante la sesión; llamados por nombre; preguntas con
  evaluación por palabras clave; acta imprimible/WhatsApp.
- **Detecta a quien conversa durante el dictado** por el movimiento de la boca
  en cámara (local, sin audio): baja su atención, Vera lo regaña por nombre y
  el acta reporta los minutos de conversa. Responder una pregunta de Vera NO
  cuenta — solo se mide mientras ella dicta. Nació de la queja real de Joan:
  "85% de atención pero me la pasé hablando".
- **La atención es un ESTIMADO** por postura de cabeza y apertura de ojos.
  El acta lo dice explícitamente. Las decisiones sobre una persona las toma
  un humano, nunca la plataforma.
- **El VIDEO nunca sale del computador; la VOZ puede.** El reconocimiento de
  voz lo hace el navegador y Chrome/Edge pueden procesar ese audio en sus
  servidores. El consentimiento lo dice tal cual, y el teclado siempre está
  disponible como alternativa. No prometer "nada sale a internet" a secas.
- **Todavía NO** (versión pro, cuando haya un cliente pagando): describir la
  ropa de una persona real ("el de la camisa roja") requiere visión por IA en
  la nube; un avatar hiperrealista requiere HeyGen o similar; la voz por
  teléfono requiere Vapi. Todo eso cuesta dólares por mes — no se construye
  antes del primer contrato.

## Si el micrófono no funciona

En la pantalla de consentimiento está el botón **"🎤 Probar el micrófono"**:
muestra el nivel en vivo (las barritas se mueven cuando hablas) y, si algo
falla, la causa en español. Las tres causas típicas:

1. **El navegador lo tiene bloqueado**: toca el candado junto a la dirección,
   permite el micrófono y recarga.
2. **Edge**: su dictado por voz falla con error "network" en muchos equipos.
   Usa Chrome para las sesiones con voz (las voces de Edge son más bonitas,
   pero el oído de Chrome es el confiable).
3. **Micrófono equivocado**: si las barritas no se mueven, el navegador está
   escuchando otro micrófono — se cambia en la configuración del sitio.

Todo lo que se responde por voz se puede responder por teclado: la sesión
nunca se bloquea por el micrófono.

## Lo legal (Colombia)

- **Ley 1581 de 2012 (habeas data)**: los asistentes deben ser informados y
  autorizar el uso de la cámara. La app trae la pantalla de consentimiento y
  no arranca sin marcarla. Punto fuerte para vender: el video se procesa en el
  computador y **no se graba ni se sube a internet**.
- Vera **siempre se presenta como IA** (misma regla que Camila en Cobra-IA).
  El pin "IA" en su saco es deliberado.
- El acta es un **indicio para el supervisor**, no una evaluación laboral
  automática. Ese matiz protege a la empresa cliente.

## Arquitectura (para la próxima sesión de Claude)

Todo es web estándar, sin dependencias ni build:

- `index.html` — las 4 pantallas (inicio, consentimiento, sala, acta) + editor.
- `contenido.js` — el contenido en texto plano editable; parser incluido.
- `vera.js` — avatar SVG animado, voz (speechSynthesis), oído (SpeechRecognition).
- `simulacion.js` — la sala simulada con guion (celular, sueño, ausencia).
- `motor-atencion.js` — MediaPipe Face Landmarker (modo cámara) + la misma
  lógica de estados/alertas para ambos modos. EMA de atención por persona.
- `app.js` — el flujo de la sesión y el acta.
- `servidor.js` + `ABRIR.cmd` — servir por localhost (requisito de cámara).

Decisiones que no se deshacen sin hablarlo:
1. Todo local y gratis en el MVP — cero APIs pagas antes del primer cliente.
2. Vera se presenta como IA, siempre.
3. La interfaz no promete lo que el código no hace.
