/* Empaquetar una página de Vera en UN SOLO archivo .html que funcione suelto.

   Por qué existe: el 4 de septiembre de 2026 Joan reportó que desde otro
   computador el enlace de github.io «ni siquiera deja abrir», con el sitio
   respondiendo 200 y público desde aquí. Es decir: la red o la máquina del otro
   lado lo bloquea, y no hay nada que arreglar del lado del servidor.

   Un archivo suelto no depende de ninguna red, de ningún dominio y de ningún
   permiso: se manda por WhatsApp como documento, se abre con doble clic y
   funciona sin internet. Es la única vía que no puede bloquear un filtro
   corporativo.

   Qué hace: mete el CSS y los JS DENTRO del HTML, en el mismo orden en que
   estaban las etiquetas, para no cambiar el orden de ejecución.

   Uso:  node empaquetar.js cuestionario-asesor.html

   Lo que NO hace: minificar ni tocar el código. El archivo pesa unos 55 KB, que
   por WhatsApp es nada, y así lo que se reparte es exactamente lo mismo que
   está publicado — no una variante que haya que volver a revisar. */

'use strict';

var fs = require('fs');
var path = require('path');

function empaquetar(entrada) {
  var dir = path.dirname(entrada);
  var html = fs.readFileSync(entrada, 'utf8');

  var css = 0, js = 0;

  /* Las hojas de estilo. Se conserva el <style> propio de la página, que va
     después: el orden importa porque esos estilos pisan a los de estilo.css. */
  html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
    function (todo, ruta) {
      if (/^https?:/i.test(ruta)) return todo;      // lo externo se deja como está
      var f = path.join(dir, ruta);
      if (!fs.existsSync(f)) return todo;
      css++;
      return '<style>\n/* ── ' + ruta + ' ── */\n' + fs.readFileSync(f, 'utf8') + '\n</style>';
    });

  html = html.replace(/<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi,
    function (todo, ruta) {
      if (/^https?:/i.test(ruta)) return todo;
      var f = path.join(dir, ruta);
      if (!fs.existsSync(f)) return todo;
      js++;
      return '<script>\n/* ── ' + ruta + ' ── */\n' + fs.readFileSync(f, 'utf8') + '\n</script>';
    });

  /* La marca de que esto es la copia suelta. La lee la página para avisar de lo
     que aquí no funciona igual — un archivo abierto con doble clic no es un
     sitio seguro, y algunas cosas del navegador se apagan ahí. */
  html = html.replace('<body>', '<body data-suelto="si">');

  var salida = path.join(dir, path.basename(entrada, '.html') + '-suelto.html');
  fs.writeFileSync(salida, html, 'utf8');

  return {
    salida: salida,
    css: css,
    js: js,
    kb: Math.round(fs.statSync(salida).size / 1024),
    quedanExternos: (html.match(/<(?:link[^>]*rel=["']stylesheet["']|script[^>]*src=)/gi) || []).length
  };
}

var entrada = process.argv[2];
if (!entrada) {
  console.error('uso: node empaquetar.js <archivo.html>');
  process.exit(1);
}
var r = empaquetar(path.resolve(entrada));
console.log('  ' + path.basename(r.salida));
console.log('  ' + r.css + ' hojas de estilo y ' + r.js + ' scripts metidos dentro');
console.log('  ' + r.kb + ' KB');
console.log(r.quedanExternos
  ? '  OJO: quedan ' + r.quedanExternos + ' recursos por fuera — el archivo NO es autónomo'
  : '  no queda nada por fuera: funciona sin internet');
