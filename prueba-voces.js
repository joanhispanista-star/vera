/* Prueba del choque de voces de Vera.

   El fallo que caza (corregido el 26-nov-2026 en vera.js): callar() seguido
   de un decir() en el MISMO instante — es lo que pasa al oprimir "Empezar"
   con Vera todavía saludando. Con una sola marca de "cortado" compartida, el
   decir() nuevo la apagaba antes de que el viejo la leyera, y el saludo
   seguía sonando frase por frase, revuelto con el texto nuevo.

   Uso, con el servidor corriendo (node servidor.js):
     node prueba-voces.js [dirección]     (por defecto http://localhost:8240)

   Abre un Edge oculto y MUDO con un perfil temporal propio, y al terminar
   cierra solo ese Edge (lo busca por el nombre del perfil): nunca toca el
   Edge de quien la corre. Debe imprimir tres BIEN; si algo falla, sale con
   código 1. */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:8240';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PUERTO = 9335;
const PERFIL = path.join(os.tmpdir(), 'vera-perfil-voces');
const PS1 = path.join(os.tmpdir(), 'vera-cerrar-edge-voces.ps1');
fs.writeFileSync(PS1, "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | " +
  "Where-Object { $_.CommandLine -like '*vera-perfil-voces*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }\n");
const cerrar = () => { try { execSync('powershell -NoProfile -ExecutionPolicy Bypass -File "' + PS1 + '"', { stdio: 'ignore' }); } catch (e) {} };

cerrar();
spawn(EDGE, ['--headless=new', '--mute-audio', '--remote-debugging-port=' + PUERTO, '--user-data-dir=' + PERFIL, 'about:blank'], { stdio: 'ignore' });

const esperar = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0;
const pend = new Map();
const cdp = (m, p) => new Promise((ok, mal) => {
  const i = ++id;
  pend.set(i, r => r.error ? mal(new Error(r.error.message)) : ok(r.result));
  ws.send(JSON.stringify({ id: i, method: m, params: p || {} }));
});
const js = async e => {
  const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result.value;
};

(async () => {
  let url;
  for (let i = 0; i < 80 && !url; i++) {
    try {
      const l = await (await fetch('http://127.0.0.1:' + PUERTO + '/json/list')).json();
      const p = l.find(t => t.type === 'page');
      if (p) url = p.webSocketDebuggerUrl;
    } catch (e) {}
    if (!url) await esperar(250);
  }
  if (!url) throw new Error('Edge no abrió el puerto de depuración');
  ws = new WebSocket(url);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  });
  await cdp('Page.enable');
  // ?rapido=1: sin audio y con frases cortas; el orden de los subtítulos es
  // el mismo que el de la voz, y eso es lo que se mide.
  await cdp('Page.navigate', { url: BASE + '/?rapido=1' });
  await esperar(2500);
  const r = await js(`(async () => {
    const sub = document.getElementById('vera-subtitulo');
    Vera.iniciar(document.getElementById('vera-contenedor'), sub, document.getElementById('vera-estado'));
    const dichas = [];
    new MutationObserver(() => { const t = sub.textContent; if (t && dichas[dichas.length - 1] !== t) dichas.push(t); })
      .observe(sub, { childList: true, characterData: true, subtree: true });
    // 1) El choque: un saludo largo, cortado a la mitad por un texto nuevo
    Vera.decir('Saludo uno. Saludo dos. Saludo tres. Saludo cuatro. Saludo cinco.');
    await new Promise(r => setTimeout(r, 380));
    Vera.callar();
    await Vera.decir('Nuevo uno. Nuevo dos. Nuevo tres.');
    await new Promise(r => setTimeout(r, 1200));
    const choque = dichas.slice();
    // 2) Un llamado por nombre intercalado entre frases: el punto debe
    //    seguir completo (el llamado no es un corte)
    dichas.length = 0;
    await Vera.decir('Punto uno. Punto dos. Punto tres.', { entreFrases: () => dichas.length === 1 ? Vera.decir('Llamado a Jorge.') : null });
    await new Promise(r => setTimeout(r, 300));
    const intercalado = dichas.slice();
    // 3) La cara: al terminar todo, vuelve al video de escuchar
    await new Promise(r => setTimeout(r, 700));
    const hablando = document.getElementById('vera-contenedor').closest('.vera-cuadro').classList.contains('hablando');
    return { choque, intercalado, caraHablandoAlFinal: hablando };
  })()`);
  console.log(JSON.stringify(r, null, 1));

  let fallas = 0;
  const saludoTrasNuevo = r.choque.slice(r.choque.indexOf('Nuevo uno.')).filter(t => /^Saludo/.test(t));
  if (r.choque.indexOf('Nuevo uno.') < 0) { fallas++; console.log('FALLA: el texto nuevo nunca sonó'); }
  else if (saludoTrasNuevo.length) { fallas++; console.log('FALLA: el saludo cortado siguió hablando: ' + saludoTrasNuevo.join(' | ')); }
  else console.log('BIEN: nada del saludo después del texto nuevo');
  const okInter = JSON.stringify(r.intercalado) === JSON.stringify(['Punto uno.', 'Llamado a Jorge.', 'Punto dos.', 'Punto tres.']);
  if (okInter) console.log('BIEN: el llamado intercalado no corta el punto');
  else { fallas++; console.log('FALLA: intercalado = ' + JSON.stringify(r.intercalado)); }
  if (r.caraHablandoAlFinal) { fallas++; console.log('FALLA: la cara sigue hablando'); }
  else console.log('BIEN: la cara volvió a escuchar');

  ws.close(); cerrar(); process.exit(fallas ? 1 : 0);
})().catch(e => { console.error('FALLÓ:', e.message); cerrar(); process.exit(1); });
