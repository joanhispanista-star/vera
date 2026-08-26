# Capacitadora (Vera) — reglas para sesiones de Claude

Plataforma de capacitación sin capacitador humano. El contexto completo está en
`LEEME.md` — léelo primero.

## Reglas de este proyecto

1. **Cero costo por sesión en el MVP.** Nada de APIs pagas (visión en la nube,
   HeyGen, Vapi) hasta que exista un cliente pagando. Es la regla del Contador:
   primero el cliente, después la plataforma pro.
2. **Vera se presenta como IA, siempre.** Misma decisión que Camila en
   Cobra-IA; no se rediscute.
3. **Honestidad en la interfaz**: el acta dice "atención estimada" y explica
   cómo se estima. Ningún texto promete lo que el código no hace.
4. **El video nunca sale del computador.** Es el argumento legal (Ley 1581) y
   de venta. Cualquier función que suba video o fotos se discute antes.
5. **Todo en español**: código, comentarios, commits, interfaz.
6. Web estándar sin build ni dependencias: archivos sueltos servidos por
   `servidor.js` (puerto 8240). Se prueba con `ABRIR.cmd` o con la entrada
   `capacitadora` del launch.json de PLAZA. `?rapido=1` salta el audio.
