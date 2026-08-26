# Vera — Capacitadora Virtual

Plataforma que dicta inducciones **sin capacitador humano**: Vera (una IA con
cara y voz) presenta el contenido, ve la sala por la cámara, aprende el nombre
de cada asistente, llama la atención por nombre a quien se distrae, hace
preguntas y entrega un **acta de atención** para el supervisor.

Pensada para empresas con alta rotación (cobranzas, call centers) donde
capacitar al que capacita es un gasto que nunca termina.

## Cómo abrirla

Doble clic en **`ABRIR.cmd`**. Eso levanta el servidor local y abre
`http://localhost:8240` en el navegador. La cámara y el micrófono solo
funcionan por localhost — por eso no basta con abrir el `index.html` a secas.

- **Mejor navegador para la VOZ**: Edge (trae la voz colombiana natural
  "Salome" gratis). 
- **Mejor navegador para el MICRÓFONO**: Chrome (el reconocimiento de voz de
  Edge a veces falla). Si el micrófono no responde, no pasa nada: todo lo que
  se responde por voz también se puede escribir con el teclado.
- La primera vez necesita internet: el detector de rostros (MediaPipe, de
  Google, gratuito) se descarga al navegador. El video **nunca** sale del
  computador.

## Los dos modos

1. **Sala real con cámara**: apunta la cámara al grupo. Vera detecta las caras,
   pide el nombre de cada uno (por voz o teclado), calibra su postura de
   "estoy mirando" y arranca. Si alguien gira la cabeza mucho rato, cierra los
   ojos o se va, Vera lo llama por su nombre.
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
- **La atención es un ESTIMADO** por postura de cabeza y apertura de ojos.
  El acta lo dice explícitamente. Las decisiones sobre una persona las toma
  un humano, nunca la plataforma.
- **Todavía NO** (versión pro, cuando haya un cliente pagando): describir la
  ropa de una persona real ("el de la camisa roja") requiere visión por IA en
  la nube; un avatar hiperrealista requiere HeyGen o similar; la voz por
  teléfono requiere Vapi. Todo eso cuesta dólares por mes — no se construye
  antes del primer contrato.

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
