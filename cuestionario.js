/* El cuestionario de nanocréditos: lo que hay que sacarle a Joan para que el
   viernes 11 un asesor nuevo se siente solo frente a un computador y salga
   cobrando.

   Por qué esta página existe aparte de "extraer.html":

   Aquel cuestionario es genérico — sirve para cualquier proceso de cualquier
   empresa, y su salida se convierte sola en curso. Este no. Este pide cosas
   que ningún generador automático sabe convertir: conversaciones de WhatsApp
   reales pegadas del teléfono, el libreto de una llamada, las cinco frases que
   más devuelve el cliente con la respuesta buena y la mala al lado. Eso lo
   redacta una persona leyéndolo, no una plantilla.

   Así que aquí no hay botón de "generar el curso": hay botón de descargar lo
   respondido. Prometer una conversión automática sería exactamente la clase de
   promesa que la interfaz no puede cumplir.

   La otra diferencia es el MODO ESENCIAL. Un cuestionario de 29 preguntas se
   abre, se lee, se cierra y no se responde nunca. Doce sí se responden en una
   sentada de 45 minutos, y con esas doce ya hay curso. El resto queda visible
   para después, no escondido: quien tenga tiempo, sigue. */

(function () {
  'use strict';

  var CLAVE = 'vera.cuestionario.nano';
  var CLAVE_MODO = 'vera.cuestionario.nano.modo';
  var DATOS = window.CUESTIONARIO_NANO || { bloques: [] };

  /* El día en que se sientan los asesores nuevos. Está aquí y no en el HTML
     porque de él sale el contador de días, y un contador que miente es peor
     que no tener contador. Cámbialo cuando cambie la fecha. */
  var DIA_D = new Date(2026, 8, 11); // 11 de septiembre de 2026

  function $(id) { return document.getElementById(id); }

  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}; } catch (e) { return {}; }
  }
  function guardar(datos) {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {}
  }
  function modoEsencial() {
    try { return localStorage.getItem(CLAVE_MODO) !== 'todo'; } catch (e) { return true; }
  }
  function guardarModo(esencial) {
    try { localStorage.setItem(CLAVE_MODO, esencial ? 'esencial' : 'todo'); } catch (e) {}
  }

  function campos() {
    var lista = [];
    DATOS.bloques.forEach(function (b) {
      b.campos.forEach(function (c) { lista.push(c); });
    });
    return lista;
  }

  function respondida(c, datos) {
    return String(datos[c.id] || '').trim().length > 0;
  }

  function escapar(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Los días que faltan ─────────────────────────────────
  function diasQueFaltan() {
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((DIA_D - hoy) / 86400000);
  }

  function pintarPlazo() {
    var d = diasQueFaltan();
    var texto;
    if (d > 1) texto = 'Faltan ' + d + ' días para el viernes 11 de septiembre.';
    else if (d === 1) texto = 'Mañana entran los asesores nuevos.';
    else if (d === 0) texto = 'Hoy entran los asesores nuevos.';
    else texto = 'El 11 de septiembre ya pasó. Este cuestionario sigue sirviendo para el siguiente grupo.';
    $('plazo').textContent = texto;
  }

  // ── El avance ───────────────────────────────────────────
  function pintarAvance() {
    var datos = leer();
    var todas = campos();
    var esenciales = todas.filter(function (c) { return c.minimo; });
    var hechasEsenciales = esenciales.filter(function (c) { return respondida(c, datos); }).length;
    var hechasTodas = todas.filter(function (c) { return respondida(c, datos); }).length;

    var pct = Math.round((hechasEsenciales / esenciales.length) * 100);
    $('avance-barra').style.width = pct + '%';

    if (hechasEsenciales < esenciales.length) {
      $('avance-texto').textContent = hechasEsenciales + ' de ' + esenciales.length +
        ' preguntas esenciales respondidas. Con las ' + esenciales.length + ' ya hay curso.';
    } else {
      $('avance-texto').textContent = 'Las ' + esenciales.length +
        ' esenciales están completas — ya hay curso. Vas en ' + hechasTodas +
        ' de ' + todas.length + ' en total.';
    }
  }

  // ── El formulario ───────────────────────────────────────
  function pintarFormulario() {
    var datos = leer();
    var soloEsencial = modoEsencial();

    $('formulario').innerHTML = DATOS.bloques.map(function (b) {
      var visibles = b.campos.filter(function (c) { return !soloEsencial || c.minimo; });
      var ocultas = b.campos.length - visibles.length;

      /* Un bloque sin ninguna esencial se quedaría invisible y nadie sabría
         que existe. Se muestra el título con el aviso: el modo esencial
         esconde trabajo para después, no lo desaparece. */
      if (!visibles.length) {
        return '<section class="bloque bloque-vacio">' +
          '<h2>' + escapar(b.titulo) + '</h2>' +
          '<p class="ocultas">' + ocultas + ' preguntas, ninguna imprescindible para el viernes. ' +
          'Están en “Ver las 29 preguntas”.</p>' +
          '</section>';
      }

      return '<section class="bloque">' +
        '<h2>' + escapar(b.titulo) + '</h2>' +
        '<p class="para-que">' + escapar(b.paraQue) + '</p>' +
        visibles.map(function (c) {
          var marca = c.minimo
            ? '<span class="etiqueta esencial">esencial</span>'
            : (c.critica ? '<span class="etiqueta critica">sin esto hay que inventar</span>' : '');
          return '<div class="campo' + (respondida(c, datos) ? ' hecha' : '') + '">' +
            '<label for="c-' + c.id + '"><b class="num">' + c.num + '.</b> ' +
              escapar(c.label) + ' ' + marca + '</label>' +
            '<span class="pista">' + escapar(c.pista) + '</span>' +
            '<textarea id="c-' + c.id + '" data-campo="' + c.id + '" spellcheck="false">' +
              escapar(datos[c.id] || '') + '</textarea>' +
            '</div>';
        }).join('') +
        (ocultas ? '<p class="ocultas">' + ocultas + ' pregunta' + (ocultas === 1 ? '' : 's') +
          ' más de este bloque, para cuando haya tiempo.</p>' : '') +
        '</section>';
    }).join('');
  }

  // ── Lo respondido, para pasármelo ───────────────────────
  /* Sale como texto plano y no como JSON a propósito: esto lo va a leer una
     persona, y si algo quedó a medias tiene que verse a simple vista. */
  function exportar() {
    var datos = leer();
    var salida = [
      'CUESTIONARIO DE COBRANZA DE NANOCRÉDITOS — respuestas de Joan',
      'Generado el ' + new Date().toLocaleString('es-CO'),
      ''
    ];
    var faltan = [];

    DATOS.bloques.forEach(function (b) {
      var conRespuesta = b.campos.filter(function (c) { return respondida(c, datos); });
      b.campos.forEach(function (c) {
        if (!respondida(c, datos)) faltan.push(c.num + (c.minimo ? ' (esencial)' : ''));
      });
      if (!conRespuesta.length) return;
      salida.push('══════════════════════════════════════════');
      salida.push(b.titulo);
      salida.push('══════════════════════════════════════════');
      salida.push('');
      conRespuesta.forEach(function (c) {
        salida.push('── ' + c.num + '. ' + c.label);
        salida.push('');
        salida.push(String(datos[c.id]).trim());
        salida.push('');
      });
    });

    if (salida.length <= 3) {
      return 'Todavía no hay nada respondido.';
    }
    if (faltan.length) {
      salida.push('══════════════════════════════════════════');
      salida.push('SIN RESPONDER: ' + faltan.join(', '));
      salida.push('');
      salida.push('Lo que quede sin responder no se inventa: sale marcado en el');
      salida.push('curso como un hueco que alguien tiene que llenar.');
    }
    return salida.join(String.fromCharCode(10));
  }

  function descargar(nombre, contenido) {
    var blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function pintarBotonModo() {
    var esencial = modoEsencial();
    $('btn-modo').textContent = esencial
      ? 'Ver las 29 preguntas'
      : 'Ver solo las 12 esenciales';
    $('nota-modo').textContent = esencial
      ? 'Estás viendo las 12 preguntas con las que ya sale un curso dictable. Unos 45 minutos.'
      : 'Estás viendo el cuestionario completo. Las marcadas “esencial” son las que no pueden faltar.';
  }

  document.addEventListener('DOMContentLoaded', function () {
    pintarPlazo();
    pintarFormulario();
    pintarAvance();
    pintarBotonModo();

    /* Un solo escucha para todo el formulario: se guarda mientras escribe.
       Esto se responde en varias sentadas, y perder lo escrito una vez es la
       forma más rápida de que nadie lo vuelva a abrir. */
    $('formulario').addEventListener('input', function (ev) {
      var campo = ev.target.dataset && ev.target.dataset.campo;
      if (!campo) return;
      var datos = leer();
      datos[campo] = ev.target.value;
      guardar(datos);
      pintarAvance();
      var caja = ev.target.closest('.campo');
      if (caja) caja.classList.toggle('hecha', ev.target.value.trim().length > 0);
    });

    $('btn-modo').addEventListener('click', function () {
      guardarModo(!modoEsencial());
      pintarFormulario();
      pintarBotonModo();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('btn-ver').addEventListener('click', function () {
      $('salida').value = exportar();
      $('salida').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    $('btn-descargar').addEventListener('click', function () {
      var texto = exportar();
      $('salida').value = texto;
      descargar('respuestas-nanocreditos.txt', texto);
    });

    $('btn-copiar').addEventListener('click', function () {
      var texto = exportar();
      $('salida').value = texto;
      var confirmar = function () {
        $('btn-copiar').textContent = '¡Copiado!';
        setTimeout(function () { $('btn-copiar').textContent = 'Copiar todo'; }, 1500);
      };
      var manual = function () {
        $('salida').select();
        try { document.execCommand('copy'); } catch (e) {}
        confirmar();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(confirmar).catch(manual);
      } else {
        manual();
      }
    });
  });
})();
