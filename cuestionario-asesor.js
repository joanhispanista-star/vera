/* El cuestionario del asesor: la página que llena quien SÍ sabe cobrar.

   Comparte casi todo con cuestionario.js —guardar mientras escribe, exportar en
   texto plano, marcar lo que falta— pero es un archivo aparte por dos razones
   que no son de estilo:

   1. LA CLAVE DE GUARDADO ES OTRA. Si las dos páginas compartieran
      'vera.cuestionario.nano', un asesor llenando la suya en el computador de
      Joan le borraría encima las respuestas de Joan, sin avisar y sin vuelta
      atrás.
   2. EL ENCABEZADO DEL ARCHIVO LLEVA EL NOMBRE DE QUIEN RESPONDE. En
      cuestionario.js está escrito fijo «respuestas de Joan», que sería falso en
      cada archivo que mande un asesor.

   Lo demás que lo separa está en cuestionario-asesor-datos.js.

   Sin modo esencial, a diferencia de la de Joan. Allá esconder 17 preguntas
   ayuda; aquí no: un formulario sin final visible es la causa número uno de que
   lo cierren, así que el contador dice «12» desde el primer segundo. */

(function () {
  'use strict';

  var D = window.CUESTIONARIO_ASESOR;
  var CLAVE = D.clave;

  function $(id) { return document.getElementById(id); }

  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}; } catch (e) { return {}; }
  }
  function guardar(datos) {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {}
  }

  function escapar(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Una respuesta que solo tiene el molde («DÍA QUE VENCE:» y nada debajo) está
     vacía, aunque el textarea tenga texto. Si contara como respondida, el
     contador diría 12 de 12 con el formulario en blanco. */
  function vacia(valor, molde) {
    var v = String(valor || '').replace(/\s+/g, '');
    if (!v) return true;
    if (!molde) return false;
    return v === String(molde).replace(/\s+/g, '');
  }

  function respondida(p, datos) {
    return !vacia(datos[p.id], p.guiada);
  }

  // ── Pintar ──────────────────────────────────────────────
  function pintarFicha() {
    var datos = leer();
    $('ficha').innerHTML = D.ficha.map(function (c) {
      return '<div class="campo-corto">' +
        '<label for="c-' + c.id + '">' + escapar(c.label) + '</label>' +
        '<span class="pista">' + escapar(c.pista) + '</span>' +
        '<input type="text" id="c-' + c.id + '" data-campo="' + c.id + '" ' +
          'value="' + escapar(datos[c.id] || '') + '" autocomplete="off">' +
        '</div>';
    }).join('');
  }

  function pintarPreguntas() {
    var datos = leer();
    $('formulario').innerHTML = D.preguntas.map(function (p) {
      var corte = (p.num === D.corteAntesDe)
        ? '<div class="corte">' + escapar(D.textoCorte) + '</div>' : '';
      var molde = p.guiada
        ? '<div class="molde"><span>Así queda bien:</span><pre>' + escapar(p.guiada) + '</pre>' +
          '<button type="button" class="btn btn-mini usar-molde" data-para="' + p.id + '">Usar este molde</button></div>'
        : '';
      return corte +
        '<div class="campo' + (respondida(p, datos) ? ' hecha' : '') + '" data-campo-de="' + p.id + '">' +
          '<label for="c-' + p.id + '"><b class="num">' + p.num + '.</b> ' + escapar(p.label) + '</label>' +
          '<span class="pista">' + escapar(p.pista) + '</span>' +
          molde +
          '<textarea id="c-' + p.id + '" data-campo="' + p.id + '" spellcheck="false">' +
            escapar(datos[p.id] || '') + '</textarea>' +
        '</div>';
    }).join('');
  }

  function pintarAvance() {
    var datos = leer();
    var hechas = D.preguntas.filter(function (p) { return respondida(p, datos); }).length;
    var total = D.preguntas.length;
    $('avance-barra').style.width = Math.round((hechas / total) * 100) + '%';
    $('avance-texto').textContent = hechas === total
      ? 'Las ' + total + ' respondidas. Ya puedes mandarlas.'
      : 'Vas en ' + hechas + ' de ' + total + '.';
  }

  /* El contador de tamaño. No es un adorno: si lo escrito no cabe en un mensaje
     de WhatsApp hay que saberlo ANTES de terminar, no cuando el mensajero corta
     por su cuenta y nadie se entera de qué se perdió. */
  function pintarTamano() {
    var texto = exportar();
    var n = texto.length;
    var cabe = window.Enviar.cabeEnWhatsApp(texto);
    $('tamano').textContent = cabe
      ? 'Van ' + n.toLocaleString('es-CO') + ' caracteres. Caben en un mensaje de WhatsApp.'
      : 'Van ' + n.toLocaleString('es-CO') + ' caracteres: ya no caben en un mensaje. Mándalo como archivo.';
    $('tamano').classList.toggle('alerta', !cabe);
    $('btn-copiar').disabled = !cabe;
  }

  // ── Exportar ────────────────────────────────────────────
  function exportar() {
    var datos = leer();
    var quien = String(datos.nombre || '').trim();
    var linea = '══════════════════════════════════════════';
    var salida = [
      'CÓMO SE COBRA — lo que contestó ' + (quien || '(sin nombre)'),
      'Enviado el ' + new Date().toLocaleString('es-CO'),
      ''
    ];

    D.ficha.forEach(function (c) {
      if (c.id === 'nombre') return;
      var v = String(datos[c.id] || '').trim();
      if (v) salida.push(c.label + ' ' + v);
    });
    salida.push('');

    var faltan = [];
    D.preguntas.forEach(function (p) {
      if (!respondida(p, datos)) { faltan.push(String(p.num)); return; }
      salida.push(linea);
      salida.push(p.num + '. ' + p.label);
      salida.push(linea);
      salida.push('');
      salida.push(String(datos[p.id]).trim());
      salida.push('');
    });

    if (faltan.length) {
      salida.push(linea);
      salida.push('SIN RESPONDER: ' + faltan.join(', '));
      salida.push('Lo que quedó vacío no se rellena con nada inventado:');
      salida.push('sale marcado en el curso como un hueco.');
    }
    return salida.join(String.fromCharCode(10));
  }

  function nombreDelArchivo() {
    return window.Enviar.nombreArchivo('respuestas', (leer().nombre || ''));
  }

  function avisar(texto, malo) {
    var caja = $('aviso');
    caja.textContent = texto;
    caja.className = 'aviso' + (malo ? ' malo' : ' bueno');
    caja.hidden = false;
  }

  // ── Arranque ────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    pintarFicha();
    pintarPreguntas();
    pintarAvance();
    pintarTamano();

    /* El botón de mandar solo se pinta si este aparato de verdad puede
       compartir un archivo. Se pregunta antes, no al oprimirlo: un botón que
       existe y no funciona es la misma mentira que el «¡Copiado!» falso. */
    if (window.Enviar.puedeCompartirArchivo()) {
      $('btn-mandar').hidden = false;
      $('como-mandar').textContent = 'Oprime «Mandar mis respuestas»: se abre el menú de compartir y ahí escoges WhatsApp y a quién. Mándaselo a la misma persona que te pasó este enlace.';
    } else {
      $('btn-descargar').hidden = false;
      $('como-mandar').textContent = 'Oprime «Descargar el archivo» y adjúntalo por WhatsApp a la misma persona que te pasó este enlace. Si prefieres, «Copiar todo» y lo pegas en el chat.';
    }

    var guardarCampo = function (ev) {
      var campo = ev.target.dataset && ev.target.dataset.campo;
      if (!campo) return;
      var datos = leer();
      datos[campo] = ev.target.value;
      guardar(datos);
      pintarAvance();
      pintarTamano();
      var caja = ev.target.closest('.campo');
      if (caja) {
        var p = D.preguntas.filter(function (x) { return x.id === campo; })[0];
        if (p) caja.classList.toggle('hecha', !vacia(ev.target.value, p.guiada));
      }
    };
    $('formulario').addEventListener('input', guardarCampo);
    $('ficha').addEventListener('input', guardarCampo);

    // El molde se copia a la caja solo si está vacía: nunca pisa lo escrito.
    $('formulario').addEventListener('click', function (ev) {
      if (!ev.target.classList || !ev.target.classList.contains('usar-molde')) return;
      var id = ev.target.dataset.para;
      var p = D.preguntas.filter(function (x) { return x.id === id; })[0];
      var caja = $('c-' + id);
      if (!p || !caja) return;
      if (caja.value.trim()) { caja.focus(); return; }
      caja.value = p.guiada;
      caja.dispatchEvent(new Event('input', { bubbles: true }));
      caja.focus();
    });

    $('btn-mandar').addEventListener('click', function () {
      var texto = exportar();
      window.Enviar.compartirArchivo(nombreDelArchivo(), texto).then(function (r) {
        if (r === 'compartido') avisar('Listo, se abrió el menú para mandarlo. Gracias — con esto se arma el curso.', false);
        else if (r === 'cancelado') avisar('No lo mandaste. Tus respuestas siguen guardadas aquí; puedes volver a intentarlo.', true);
        else avisar('Este aparato no pudo abrir el menú de compartir. Usa «Copiar todo» y pégalo en el chat.', true);
      });
    });

    $('btn-descargar').addEventListener('click', function () {
      window.Enviar.descargar(nombreDelArchivo(), exportar());
      avisar('Se descargó el archivo. Ahora adjúntalo por WhatsApp a quien te pasó el enlace.', false);
    });

    $('btn-copiar').addEventListener('click', function () {
      var texto = exportar();
      $('salida').value = texto;
      $('salida').hidden = false;
      window.Enviar.copiar(texto, $('salida')).then(function (r) {
        if (r === 'copiado') avisar('¡Copiado! Ahora pégalo en el chat de WhatsApp.', false);
        else avisar('No pude copiarlo solo. El texto está seleccionado aquí abajo: mantén el dedo encima y escoge Copiar.', true);
      });
    });

    /* Borrar lo escrito de este aparato. Está porque el asesor tiene derecho a
       que su respuesta no se quede en un computador compartido después de
       mandarla — y porque si no existe el botón, la única forma es no
       responder. */
    $('btn-borrar').addEventListener('click', function () {
      if (!confirm('¿Borrar de este aparato todo lo que escribiste? No se puede deshacer.')) return;
      try { localStorage.removeItem(CLAVE); } catch (e) {}
      pintarFicha();
      pintarPreguntas();
      pintarAvance();
      pintarTamano();
      $('salida').hidden = true;
      avisar('Borrado de este aparato.', false);
    });
  });
})();
