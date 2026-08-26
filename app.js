/* El flujo de la sesión: saludo → registro de nombres → módulos con vigilancia
   de atención → pregunta por módulo → acta para el supervisor.
   Regla de la casa (heredada de Plaza): la pantalla no promete lo que el código
   no cumple. Por eso el acta dice "atención estimada" y aclara cómo se estima. */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function pausa(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function normalizar(s) {
    // Sin tildes y sin puntuaci\u00f3n: "\u00a1No!" debe reconocerse como la clave "no".
    return String(s || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ');
  }

  var contenido = null;
  var modo = null;              // 'camara' | 'simulacion'
  var fase = 'inicio';
  var colaAlertas = [];
  var inicioSesion = 0;
  var terminada = false;        // "Terminar y generar acta": corta las cadenas pendientes
  var actaLista = false;        // el acta se genera una sola vez
  var personaEditando = null;   // cuando se corrige un nombre desde su ficha
  var resolverNombre = null;    // promesa pendiente del registro
  var resolverRespuesta = null; // promesa pendiente de una pregunta
  var tickerChips = null;

  // ── Pantallas ───────────────────────────────────────────
  function ir(idPantalla) {
    document.querySelectorAll('.pantalla').forEach(function (p) { p.classList.remove('activa'); });
    $(idPantalla).classList.add('activa');
  }

  // ── Inicio ──────────────────────────────────────────────
  function pintarResumen() {
    // El selector refleja los títulos reales (por si el cliente los editó).
    var sel = $('sel-curso');
    sel.innerHTML = window.ContenidoLib.listar().map(function (c) {
      return '<option value="' + c.indice + '">' + c.titulo + '</option>';
    }).join('');
    sel.value = String(window.ContenidoLib.indiceActivo());
    contenido = window.ContenidoLib.obtener();
    var preguntas = contenido.modulos.filter(function (m) { return m.pregunta; }).length;
    if (contenido.modulos.length === 0) {
      $('inicio-resumen').innerHTML =
        '⚠ El contenido guardado no tiene módulos con puntos: Vera no tendría nada que dictar. ' +
        'Revíselo en "Editar contenido".';
      $('btn-comenzar').disabled = true;
      return;
    }
    $('btn-comenzar').disabled = false;
    $('inicio-resumen').innerHTML =
      'Contenido cargado: <strong>' + contenido.titulo + '</strong> — ' +
      contenido.modulos.length + ' módulos, ' + preguntas + ' preguntas.';
  }

  // ── Frases de Vera ──────────────────────────────────────
  function saludoPorHora() {
    var h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  }

  // Honestidad: en modo demo NO hay cámara, y Vera no puede afirmar que ve por ella.
  function textoSaludo() {
    var comun = '. Soy Vera, la capacitadora virtual. Sí: soy una inteligencia artificial, ';
    var cierre = 'Hoy vamos a hacer la inducción completa, yo voy a estar pendiente de cada uno, ' +
      'y al final entrego un acta. ';
    if (modo === 'camara') {
      return saludoPorHora() + comun + 'y sí, los estoy viendo por la cámara. ' + cierre +
        'Así que acomódense, guarden el celular, y empecemos por conocernos.';
    }
    return saludoPorHora() + comun + 'y esta es una sala simulada, para mostrar cómo trabajo. ' +
      cierre + 'Empecemos por conocernos.';
  }

  function fraseLlamado(p, motivo) {
    var nombre = p.nombre || 'alguien del grupo';
    if (motivo === 'ausente') {
      return 'Veo que ' + nombre + ' ya no está en su puesto. Queda anotado en el acta.';
    }
    if (motivo === 'ojos-cerrados') {
      return nombre + ', te estoy viendo los ojos cerrados. ¡Arriba, que esto se pregunta al final!';
    }
    if (p.llamados >= 3) {
      return nombre + ', tercer llamado. Esto queda en el acta para que lo revises con tu supervisor. Sigamos.';
    }
    if (p.llamados === 2) {
      return nombre + ', segunda vez que te llamo la atención. Necesito que estés aquí conmigo.';
    }
    return nombre + ', ¿me acompañas? Te perdí hace un momento, y esto que sigue es importante.';
  }

  // ── Sesión ──────────────────────────────────────────────
  function iniciarSesion(elegido) {
    modo = elegido;
    ir('p-sala');
    window.Vera.iniciar($('vera-contenedor'), $('vera-subtitulo'), $('vera-estado'));
    $('barra-fase').textContent = 'Preparando la sala…';

    var arranque;
    if (modo === 'camara') {
      $('video-camara').classList.remove('oculto');
      $('lienzo-overlay').classList.remove('oculto');
      arranque = window.Motor.iniciarCamara($('video-camara'), $('lienzo-overlay'));
    } else {
      $('lienzo-sim').classList.remove('oculto');
      arranque = Promise.resolve(window.Motor.iniciarSimulacion($('lienzo-sim')));
    }

    Promise.resolve(arranque).then(function (r) {
      if (!r || !r.ok) {
        $('barra-fase').textContent = r && r.error ? r.error : 'No se pudo iniciar.';
        $('btn-cambiar-a-demo').classList.remove('oculto');
        return;
      }
      fase = 'deteccion';
      window.Motor.alAlerta = function (p, motivo) {
        var yaEnCola = colaAlertas.some(function (a) { return a.p === p; });
        if (!yaEnCola) colaAlertas.push({ p: p, motivo: motivo });
      };
      arrancarChips();
      $('btn-empezar-registro').classList.remove('oculto');
      window.Vera.decir(textoSaludo()).then(function () {
        if (fase === 'deteccion') {
          $('barra-fase').textContent = modo === 'camara'
            ? 'Cuando estén todos frente a la cámara, oprima el botón.'
            : 'Oprima el botón para empezar el registro.';
        }
      });
    });
  }

  // ── Registro de nombres ─────────────────────────────────
  function descripcionDe(p) {
    if (modo === 'simulacion') return p.descripcion;
    // Capacitación individual: con una sola persona, señalar posiciones sobra.
    if (window.Motor.presentes().length === 1) return 'tú, que estás frente a la cámara';
    if (p.x < 0.36) return 'tú, la persona que veo a la izquierda de la pantalla';
    if (p.x > 0.64) return 'tú, la persona que veo a la derecha de la pantalla';
    return 'tú, la persona que veo en el centro';
  }

  function limpiarNombre(texto) {
    if (!texto) return '';
    var limpio = texto.replace(/^(me llamo|mi nombre es|soy|yo soy)\s+/i, '').trim();
    var palabras = limpio.split(/\s+/).slice(0, 2);
    return palabras.map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }

  function pedirNombreEscrito(etiqueta) {
    return new Promise(function (resolver) {
      // El registro manda: si había una edición de ficha abierta, se descarta.
      // Sin esto, la promesa del registro queda colgada para siempre.
      personaEditando = null;
      $('nombre-para').textContent = etiqueta;
      $('txt-nombre').value = '';
      $('zona-nombre').classList.remove('oculto');
      $('txt-nombre').focus();
      resolverNombre = resolver;
    });
  }

  function obtenerNombre(p, descripcion) {
    if (modo === 'simulacion') {
      window.Simulacion.hablar(p, 1500);
      return pausa(window.Vera.modoRapido ? 400 : 1700).then(function () { return p.nombreReal; });
    }
    return window.Vera.escuchar(7).then(function (oido) {
      var nombre = limpiarNombre(oido);
      if (nombre && nombre.length >= 2) return nombre;
      return window.Vera.decir('No te escuché bien. Que alguien me escriba el nombre con el teclado, por favor.')
        .then(function () {
          // La descripción empieza con "tú, ..." porque Vera la dice de frente;
          // en la etiqueta escrita ese "tú" queda agramatical y se recorta.
          return pedirNombreEscrito('¿Cómo se llama ' + descripcion.replace(/^tú, /, '') + '?');
        });
    });
  }

  function registro() {
    // Si el saludo sigue sonando, se corta: dos cadenas de decir() en paralelo
    // encolan locuciones encimadas y desordenan toda la sesión.
    window.Vera.callar();
    fase = 'registro';
    inicioSesion = Date.now();
    $('btn-empezar-registro').classList.add('oculto');
    $('barra-fase').textContent = 'Registro de asistentes';
    $('diapositiva-titulo').textContent = contenido.titulo;
    $('diapositiva-puntos').innerHTML = '<li class="actual">Presentación de los asistentes</li>';

    var lista = window.Motor.presentes().sort(function (a, b) { return a.x - b.x; });
    var cadena = Promise.resolve();

    lista.forEach(function (p, idx) {
      cadena = cadena.then(function () {
        if (terminada) return;
        var desc = descripcionDe(p);
        window.Vera.mirar(p.x);
        var pregunta = idx === 0
          ? 'A ver… ' + desc + ': ¿cómo te llamas?'
          : 'Ahora ' + desc + ': ¿tu nombre?';
        return window.Vera.decir(pregunta)
          .then(function () { return obtenerNombre(p, desc); })
          .then(function (nombre) {
            if (terminada) return;
            window.Motor.calibrar(p);
            if (!nombre) {
              // Omitido o no entendido: nombre genérico y sin saludo,
              // que a un puesto vacío no se le dice "mucho gusto".
              p.nombre = 'Asistente ' + (idx + 1);
              return;
            }
            p.nombre = nombre;
            return window.Vera.decir('Mucho gusto, ' + p.nombre + '.');
          })
          .then(function () { window.Vera.mirar(null); });
      });
    });

    cadena.then(function () {
      if (terminada) return;
      window.Motor.bloquearNuevas = true;
      return window.Vera.decir(
        'Perfecto, ya nos conocemos. Una cosa antes de empezar: los voy a llamar por su nombre ' +
        'si veo que alguien se me distrae. Empecemos.'
      ).then(dictado);
    });
  }

  // ── Dictado de módulos ──────────────────────────────────
  function procesarAlertas() {
    if (terminada || !colaAlertas.length) return Promise.resolve();
    var alerta = colaAlertas.shift();
    window.Motor.registrarLlamado(alerta.p);
    if (alerta.motivo !== 'ausente') window.Vera.mirar(alerta.p.x);
    return window.Vera.decir(fraseLlamado(alerta.p, alerta.motivo)).then(function () {
      window.Vera.mirar(null);
      return procesarAlertas();
    });
  }

  function pintarModulo(m, idx) {
    $('barra-fase').textContent = 'Módulo ' + (idx + 1) + ' de ' + contenido.modulos.length;
    $('diapositiva-titulo').textContent = m.titulo;
    $('diapositiva-puntos').innerHTML = m.puntos.map(function (pt) {
      return '<li>' + pt + '</li>';
    }).join('');
  }

  function dictado() {
    fase = 'modulo';
    var cadena = Promise.resolve();

    contenido.modulos.forEach(function (m, i) {
      cadena = cadena.then(function () {
        if (terminada) return;
        pintarModulo(m, i);
        window.Motor.alertasActivas = true;
        var puntosCadena = Promise.resolve();
        m.puntos.forEach(function (punto, j) {
          puntosCadena = puntosCadena.then(function () {
            if (terminada) return;
            window.Motor.marcador('m' + i + 'p' + j);
            var lis = $('diapositiva-puntos').children;
            for (var k = 0; k < lis.length; k++) lis[k].classList.toggle('actual', k === j);
            return window.Vera.decir(punto, { entreFrases: procesarAlertas })
              .then(procesarAlertas);
          });
        });
        return puntosCadena;
      }).then(function () {
        window.Motor.alertasActivas = false;
        if (terminada) return;
        if (m.pregunta) return hacerPregunta(m, i);
      });
    });

    cadena.then(function () {
      if (terminada) return;
      return window.Vera.decir(
        'Y con esto terminamos la inducción de hoy. Gracias a todos. ' +
        'El acta queda lista para el supervisor: quién estuvo, cómo estuvo su atención ' +
        'y cómo les fue en las preguntas. Que tengan buen turno.'
      );
    }).then(mostrarActa);
  }

  // ── Preguntas ───────────────────────────────────────────
  function elegirInterrogado() {
    var candidatos = window.Motor.presentes();
    if (!candidatos.length) return null;
    var sinPreguntar = candidatos.filter(function (p) { return !p.yaPreguntado; });
    var grupo = sinPreguntar.length ? sinPreguntar : candidatos;
    // Al de menor atención le cae la pregunta: el truco de todo buen profesor.
    grupo.sort(function (a, b) { return a.ema - b.ema; });
    return grupo[0];
  }

  function evaluarRespuesta(texto, claves) {
    if (!texto) return 'sin-respuesta';
    // Pregunta escrita sin claves: se registra la respuesta sin calificarla —
    // calificar sin criterio marcaría ✘ hasta la respuesta perfecta.
    if (!claves || !claves.length) return 'respondida';
    var plano = ' ' + normalizar(texto) + ' ';
    var acierta = claves.some(function (clave) {
      var c = normalizar(clave);
      // "no" como clave debe ser palabra completa; las demás pueden ir dentro de otra.
      return c.length <= 2 ? plano.indexOf(' ' + c + ' ') >= 0 : plano.indexOf(c) >= 0;
    });
    return acierta ? 'correcta' : 'incorrecta';
  }

  function pedirRespuestaEnVivo(p) {
    return new Promise(function (resolver) {
      var resuelto = false;
      var entregar = function (texto) {
        if (resuelto) return;
        resuelto = true;
        $('zona-respuesta').classList.add('oculto');
        resolverRespuesta = null;
        resolver(texto);
      };
      resolverRespuesta = entregar;
      $('respuesta-para').textContent = 'Responde ' + p.nombre + ' — por voz o con el teclado.';
      $('txt-respuesta').value = '';
      $('zona-respuesta').classList.remove('oculto');
      // Primer intento automático por voz; si no funciona, quedan los botones.
      window.Vera.escuchar(9).then(function (oido) {
        if (oido && oido.trim().length > 1) entregar(oido.trim());
      });
    });
  }

  function hacerPregunta(m, idxModulo) {
    if (terminada) return Promise.resolve();
    fase = 'pregunta';
    var p = elegirInterrogado();
    if (!p) return Promise.resolve();
    p.yaPreguntado = true;
    window.Vera.mirar(p.x);
    $('barra-fase').textContent = 'Pregunta del módulo ' + (idxModulo + 1);

    return window.Vera.decir(p.nombre + ', pregunta para ti: ' + m.pregunta.texto)
      .then(function () {
        if (modo === 'simulacion') {
          var r = window.Simulacion.responder(idxModulo, p, m.pregunta);
          window.Simulacion.hablar(p, 1800);
          $('barra-fase').textContent = p.nombre + ' responde: “' + r.texto + '”';
          return pausa(window.Vera.modoRapido ? 500 : r.tardanzaMs).then(function () { return r.texto; });
        }
        return pedirRespuestaEnVivo(p);
      })
      .then(function (texto) {
        var veredicto = evaluarRespuesta(texto, m.pregunta.claves);
        p.respuestas.push({ modulo: m.titulo, veredicto: veredicto, texto: texto || '' });
        var modelo = m.pregunta.respuestaModelo;
        var reaccion;
        if (veredicto === 'correcta') {
          reaccion = '¡Muy bien, ' + p.nombre + '! Exacto: ' + modelo;
        } else if (veredicto === 'incorrecta') {
          reaccion = 'Gracias por intentarlo, ' + p.nombre + '. La respuesta que buscaba es: ' + modelo;
        } else if (veredicto === 'respondida') {
          reaccion = 'Gracias, ' + p.nombre + '. Queda registrada tu respuesta.' + (modelo ? ' La idea clave: ' + modelo : '');
        } else {
          reaccion = 'Bueno, queda de tarea, ' + p.nombre + '.' + (modelo ? ' La respuesta es: ' + modelo : '');
        }
        return window.Vera.decir(reaccion);
      })
      .then(function () {
        window.Vera.mirar(null);
        fase = 'modulo';
      });
  }

  // ── Fichas laterales ────────────────────────────────────
  var htmlChipsPrevio = '';
  function arrancarChips() {
    clearInterval(tickerChips);
    tickerChips = setInterval(function () {
      var personas = window.Motor.personas();
      if (fase === 'deteccion') {
        var n = window.Motor.presentes().length;
        $('barra-fase').textContent = n === 0
          ? 'No veo a nadie todavía. Ubíquense frente a la cámara.'
          : 'Veo ' + n + (n === 1 ? ' persona' : ' personas') + ' en la sala.';
        $('btn-empezar-registro').disabled = n === 0;
      }
      var html = personas.map(function (p, i) {
        var pct = Math.round(p.ema * 100);
        var etiquetas = { atento: 'atenta/o', distraido: 'distraída/o', 'ojos-cerrados': 'ojos cerrados', ausente: 'ausente' };
        return '<div class="chip-persona ' + p.estado + '" data-idx="' + i + '">' +
          '<span class="punto"></span>' +
          '<span class="nombre">' + (p.nombre || 'sin registrar') + '</span>' +
          '<span class="barra"><i style="width:' + pct + '%"></i></span>' +
          (p.llamados ? '<span class="llamados">⚠ ' + p.llamados + '</span>' : '') +
          '<span class="llamados" title="' + etiquetas[p.estado] + '"></span>' +
          '</div>';
      }).join('');
      // Repintar solo cuando algo cambió: reconstruir los nodos dos veces por
      // segundo se traga los clics que caen entre mousedown y mouseup.
      if (html !== htmlChipsPrevio) {
        htmlChipsPrevio = html;
        $('lista-personas').innerHTML = html;
      }
    }, 500);
  }

  // ── Acta ────────────────────────────────────────────────
  function mostrarActa() {
    if (actaLista) return; // el final normal y el botón de terminar pueden coincidir
    actaLista = true;
    terminada = true;
    fase = 'acta';
    $('zona-nombre').classList.add('oculto');
    $('zona-respuesta').classList.add('oculto');
    clearInterval(tickerChips);
    var personas = window.Motor.personas();
    window.Motor.detener();
    window.Vera.callar();

    if (!inicioSesion) inicioSesion = Date.now(); // sesión cortada antes del registro
    var duracionMin = Math.max(1, Math.round((Date.now() - inicioSesion) / 60000));
    var fecha = new Date();
    $('acta-titulo').textContent = 'Acta — ' + contenido.titulo;
    $('acta-datos').textContent =
      fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ' · ' + fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) +
      ' · duración: ' + duracionMin + ' min · modo: ' +
      (modo === 'camara' ? 'sala real con cámara' : 'demostración simulada');

    var filas = personas.map(function (p) {
      var atencion = p.nMuestras ? Math.round((p.sumaEma / p.nMuestras) * 100) + '%' : '—';
      // Si Vera anunció "queda anotado", el acta no puede decir "completa":
      // una ausencia corta se anota como tal aunque no llegue al minuto.
      var presencia;
      // El umbral de 8 s evita acusar por una simple pérdida de rastreo
      // (alguien que se agacha o voltea del todo por un par de segundos).
      if (p.ausenteAcumMs > 45000) presencia = 'se ausentó ~' + Math.max(1, Math.round(p.ausenteAcumMs / 60000)) + ' min';
      else if (p.ausenteAcumMs > 8000) presencia = 'se ausentó un momento';
      else presencia = 'completa';
      var respuestas = p.respuestas.length
        ? p.respuestas.map(function (r) {
            if (r.veredicto === 'correcta') return '✔';
            if (r.veredicto === 'incorrecta') return '✘';
            if (r.veredicto === 'respondida') return '•'; // respondió, sin calificar
            return '–';
          }).join(' ')
        : 'no le tocó pregunta';
      var obs, claseObs;
      // Solo se afirma lo que el código midió: el conteo de llamados es un hecho;
      // "volvió a concentrarse" solo si la atención final de verdad estaba alta.
      if (p.paraSupervisor) { obs = 'Revisar con el supervisor'; claseObs = 'alerta'; }
      else if (p.llamados > 0) {
        obs = 'Se le llamó la atención ' + p.llamados + (p.llamados === 1 ? ' vez' : ' veces');
        if (p.presente && p.ema > 0.7) obs += ' y volvió a concentrarse';
        claseObs = '';
      }
      else { obs = 'Sin novedad'; claseObs = 'bien'; }
      return '<tr>' +
        '<td>' + (p.nombre || 'Sin registrar') + '</td>' +
        '<td>' + presencia + '</td>' +
        '<td>' + atencion + '</td>' +
        '<td>' + (p.llamados || 0) + '</td>' +
        '<td>' + respuestas + '</td>' +
        '<td class="' + claseObs + '">' + obs + '</td>' +
        '</tr>';
    });
    $('tabla-acta').querySelector('tbody').innerHTML = filas.join('');
    var leyenda = ' Respuestas: ✔ correcta · ✘ incorrecta · • respondió (sin calificar) · – sin respuesta.';
    $('acta-nota').textContent = (modo === 'camara'
      ? 'La atención se estima por postura de cabeza y apertura de ojos frente a la cámara. ' +
        'Es un indicio, no una medición absoluta: las decisiones sobre el personal las toma ' +
        'una persona, no la plataforma.'
      : 'Sesión de demostración: la atención mostrada proviene de la sala simulada, no de una cámara. ' +
        'En una sala real se estima por postura de cabeza y ojos, y sigue siendo un indicio: ' +
        'las decisiones sobre el personal las toma una persona.') + leyenda;
    guardarActa(personas, duracionMin);
    ir('p-acta');
  }

  function resumenTexto() {
    var personas = window.Motor.personas();
    var lineas = ['Acta de capacitación — ' + contenido.titulo,
      new Date().toLocaleDateString('es-CO') + ' (' + (modo === 'camara' ? 'sala real' : 'demo') + ')', ''];
    personas.forEach(function (p) {
      var atencion = p.nMuestras ? Math.round((p.sumaEma / p.nMuestras) * 100) + '%' : '—';
      lineas.push('• ' + (p.nombre || 'Sin registrar') + ': atención ' + atencion +
        ', llamados ' + (p.llamados || 0) +
        (p.paraSupervisor ? ' — REVISAR CON SUPERVISOR' : ''));
    });
    lineas.push('', modo === 'camara'
      ? 'Atención estimada por cámara (postura y ojos). Indicio, no medición absoluta.'
      : 'Sesión de demostración: la atención mostrada es simulada.');
    return lineas.join('\n');
  }

  function guardarActa(personas, duracionMin) {
    try {
      var actas = JSON.parse(localStorage.getItem('vera.actas') || '[]');
      actas.push({
        fecha: new Date().toISOString(),
        titulo: contenido.titulo,
        modo: modo,
        duracionMin: duracionMin,
        personas: personas.map(function (p) {
          return {
            nombre: p.nombre,
            atencion: p.nMuestras ? Math.round((p.sumaEma / p.nMuestras) * 100) : null,
            llamados: p.llamados,
            paraSupervisor: p.paraSupervisor,
            respuestas: p.respuestas
          };
        })
      });
      localStorage.setItem('vera.actas', JSON.stringify(actas));
    } catch (e) { /* sin almacenamiento no hay historial, pero la sesión sigue */ }
  }

  // ── Cableado de la interfaz ─────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    pintarResumen();

    $('btn-comenzar').addEventListener('click', function () { ir('p-consentimiento'); });

    $('sel-curso').addEventListener('change', function (ev) {
      window.ContenidoLib.elegir(parseInt(ev.target.value, 10));
      pintarResumen();
    });

    $('chk-consentimiento').addEventListener('change', function (ev) {
      $('btn-modo-camara').disabled = !ev.target.checked;
      $('btn-modo-sim').disabled = !ev.target.checked;
    });
    $('btn-modo-camara').addEventListener('click', function () { iniciarSesion('camara'); });
    $('btn-modo-sim').addEventListener('click', function () { iniciarSesion('simulacion'); });

    $('btn-empezar-registro').addEventListener('click', function () {
      if (fase === 'deteccion') registro();
    });

    // Salida de emergencia: la cámara falló y la sesión sigue en modo simulado
    $('btn-cambiar-a-demo').addEventListener('click', function () {
      $('btn-cambiar-a-demo').classList.add('oculto');
      $('video-camara').classList.add('oculto');
      $('lienzo-overlay').classList.add('oculto');
      iniciarSesion('simulacion');
    });

    $('btn-saltar').addEventListener('click', function () { window.Vera.callar(); });

    // Cortar la sesión y entregar el acta con lo acumulado: en una empresa
    // real las capacitaciones se interrumpen, y perder lo medido no es opción.
    $('btn-terminar').addEventListener('click', function () {
      if (fase === 'inicio' || fase === 'acta') return;
      terminada = true;
      window.Vera.callar();
      if (resolverNombre) { var rn = resolverNombre; resolverNombre = null; rn(''); }
      if (resolverRespuesta) { var rr = resolverRespuesta; resolverRespuesta = null; rr(null); }
      mostrarActa();
    });

    $('btn-omitir-nombre').addEventListener('click', function () {
      if (resolverNombre) {
        var r = resolverNombre;
        resolverNombre = null;
        $('zona-nombre').classList.add('oculto');
        r('');
        return;
      }
      personaEditando = null;
      $('zona-nombre').classList.add('oculto');
    });

    // Nombre escrito: sirve tanto en el registro como al corregir desde una ficha
    var entregarNombre = function () {
      var nombre = limpiarNombre($('txt-nombre').value);
      if (!nombre) return;
      // El registro pendiente tiene prioridad sobre la edición de fichas:
      // dejarlo esperando congela toda la sesión.
      if (resolverNombre) {
        var r = resolverNombre;
        resolverNombre = null;
        $('zona-nombre').classList.add('oculto');
        r(nombre);
        return;
      }
      if (personaEditando) {
        personaEditando.nombre = nombre;
        personaEditando = null;
        $('zona-nombre').classList.add('oculto');
      }
    };
    $('btn-guardar-nombre').addEventListener('click', entregarNombre);
    $('txt-nombre').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') entregarNombre();
    });

    // Corregir un nombre tocando su ficha
    $('lista-personas').addEventListener('click', function (ev) {
      var chip = ev.target.closest('.chip-persona');
      if (!chip || fase === 'acta') return;
      if (resolverNombre) return; // el registro está esperando un nombre: no interferir
      personaEditando = window.Motor.personas()[Number(chip.dataset.idx)];
      if (!personaEditando) return;
      $('nombre-para').textContent = 'Corregir el nombre de "' + (personaEditando.nombre || 'sin registrar') + '":';
      $('txt-nombre').value = personaEditando.nombre || '';
      $('zona-nombre').classList.remove('oculto');
      $('txt-nombre').focus();
    });

    // Respuestas a preguntas
    var entregarRespuesta = function () {
      var texto = $('txt-respuesta').value.trim();
      if (!texto) return; // el vacío no cuenta como "sin respuesta": para eso hay botón
      window.Vera.detenerEscucha();
      if (resolverRespuesta) resolverRespuesta(texto);
    };
    $('btn-enviar-respuesta').addEventListener('click', entregarRespuesta);
    $('txt-respuesta').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') entregarRespuesta();
    });
    $('btn-responder-voz').addEventListener('click', function () {
      window.Vera.escuchar(9).then(function (oido) {
        if (oido && resolverRespuesta) resolverRespuesta(oido.trim());
      });
    });
    $('btn-sin-respuesta').addEventListener('click', function () {
      window.Vera.detenerEscucha();
      if (resolverRespuesta) resolverRespuesta(null);
    });

    // Sin reconocimiento de voz (Firefox, o ?rapido=1) el botón del micrófono
    // sería un adorno mudo: mejor que no exista.
    if (!(window.SpeechRecognition || window.webkitSpeechRecognition) || window.Vera.modoRapido) {
      $('btn-responder-voz').classList.add('oculto');
    }

    // Acta
    $('btn-imprimir').addEventListener('click', function () { window.print(); });
    $('btn-copiar').addEventListener('click', function () {
      var texto = resumenTexto();
      var confirmar = function () {
        $('btn-copiar').textContent = '¡Copiado!';
        setTimeout(function () { $('btn-copiar').textContent = 'Copiar resumen'; }, 1500);
      };
      // Fuera de localhost/HTTPS no existe navigator.clipboard: cae al método viejo.
      var copiarManual = function () {
        var ta = document.createElement('textarea');
        ta.value = texto;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        confirmar();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(confirmar).catch(copiarManual);
      } else {
        copiarManual();
      }
    });
    $('btn-whatsapp').addEventListener('click', function () {
      window.open('https://wa.me/?text=' + encodeURIComponent(resumenTexto()), '_blank');
    });
    $('btn-nueva-sesion').addEventListener('click', function () { location.reload(); });

    // Editor de contenido
    $('btn-editar-contenido').addEventListener('click', function () {
      $('txt-contenido').value = window.ContenidoLib.obtenerTexto();
      $('modal-editor').classList.remove('oculto');
    });
    $('btn-guardar-contenido').addEventListener('click', function () {
      window.ContenidoLib.guardarTexto($('txt-contenido').value);
      // A mitad de sesión el contenido en uso no se toca: lo guardado
      // aplica desde la próxima capacitación.
      if (fase === 'inicio') pintarResumen();
      $('modal-editor').classList.add('oculto');
    });
    $('btn-restaurar-contenido').addEventListener('click', function () {
      $('txt-contenido').value = window.ContenidoLib.restaurar();
    });
    $('btn-cerrar-editor').addEventListener('click', function () {
      $('modal-editor').classList.add('oculto');
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') $('modal-editor').classList.add('oculto');
    });
  });
})();
