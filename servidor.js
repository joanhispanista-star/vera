/* Servidor estático mínimo para Vera.
   Existe porque la cámara y el micrófono solo funcionan en http://localhost
   o https — abrir el index.html con doble clic no da acceso a la cámara.
   Uso: node servidor.js [puerto]   (por defecto 8240) */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const PUERTO = Number(process.argv[2]) || 8240;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  /* Los tres de MediaPipe en vendor/. Sin el tipo correcto el navegador se
     NIEGA a ejecutar un módulo ES ("Failed to fetch dynamically imported
     module") aunque el archivo llegue entero con un 200 — que es justo el
     error que parece un problema de red y no lo es. El .task es el modelo de
     rostros y con octet-stream va bien. */
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.task': 'application/octet-stream'
};

http.createServer(function (peticion, respuesta) {
  let ruta = decodeURIComponent(peticion.url.split('?')[0]);
  if (ruta === '/') ruta = '/index.html';

  const archivo = path.join(RAIZ, path.normalize(ruta));
  // Nada fuera de la carpeta del proyecto.
  if (!archivo.startsWith(RAIZ)) {
    respuesta.writeHead(403);
    respuesta.end('Prohibido');
    return;
  }

  fs.readFile(archivo, function (err, contenido) {
    if (err) {
      respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      respuesta.end('No encontrado: ' + ruta);
      return;
    }
    const tipo = TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream';
    respuesta.writeHead(200, { 'Content-Type': tipo });
    respuesta.end(contenido);
  });
}).listen(PUERTO, function () {
  console.log('Vera atendiendo en http://localhost:' + PUERTO);
  console.log('Cierra esta ventana para apagar el servidor.');
});
