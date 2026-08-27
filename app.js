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
  var colaLlegadas = [];        // quienes entran con la sesión ya empezada
  var inicioSesion = 0;
  var terminada = false;        // "Terminar y generar acta": corta las cadenas pendientes
  var actaLista = false;        // el acta se genera una sola vez
  var grupoSesion = '';         // grupo o sede, para que el acta sirva de evidencia
  var sesionGuardada = null;    // el acta recién guardada, para sus constancias
  var actaEnPantalla = null;    // la que se está viendo: de la sesión, rescatada o del historial
  var pausada = false;          // descanso: la sesión se detiene sin cerrar el acta
  var resolverPausa = null;
  var msPausados = 0;           // no se le cobra al acta el tiempo del descanso
  var pausaDesde = 0;
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
    if (p.llamados >= 3) {
      return nombre + ', tercer llamado. Esto queda en el acta para que lo revises con tu supervisor. Sigamos.';
    }
    if (motivo === 'ausente') {
      return 'Veo que ' + nombre + ' ya no está en su puesto. Queda anotado en el acta.';
    }
    if (motivo === 'ojos-cerrados') {
      return nombre + ', te estoy viendo los ojos cerrados. ¡Arriba, que esto se pregunta al final!';
    }
    if (motivo === 'hablando') {
      return nombre + ', te veo conversando. Aquí la que está dictando soy yo — te necesito oyendo, que esto se pregunta al final.';
    }
    if (p.llamados === 2) {
      return nombre + ', segunda vez que te llamo la atención. Necesito que estés aquí conmigo.';
    }
    return nombre + ', ¿me acompañas? Te perdí hace un momento, y esto que sigue es importante.';
  }

  // ── Sesión ──────────────────────────────────────────────
  function iniciarSesion(elegido) {
    modo = elegido;
    grupoSesion = $('txt-grupo').value.trim();
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
      window.Motor.alLlegarTarde = function (p) {
        if (fase === 'modulo' || fase === 'pregunta') colaLlegadas.push(p);
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
      // Si el problema es el micrófono (y no que habló pasito), se dice claro.
      var err = window.Vera.ultimoErrorVoz;
      var frase = (err && err !== 'no-speech')
        ? 'Parece que el micrófono no está disponible en este navegador. Que alguien me escriba el nombre, por favor.'
        : 'No te escuché bien. Que alguien me escriba el nombre con el teclado, por favor.';
      return window.Vera.decir(frase)
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
    if (terminada) return Promise.resolve();
    // Los que llegan tarde se atienden primero y con otro tono: entrar tarde
    // no es una falta que se anote, es alguien a quien hay que registrar.
    if (colaLlegadas.length) {
      var quien = colaLlegadas.shift();
      return window.Vera.decir(
        'Veo que alguien más se nos unió. Bienvenido: en un momento el supervisor registra tu nombre. Sigamos.'
      ).then(function () {
        $('barra-fase').textContent = 'Llegó alguien: toca su ficha (' + quien.nombre + ') para ponerle el nombre.';
        return procesarAlertas();
      });
    }
    if (!colaAlertas.length) return Promise.resolve();
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

  // ── Pausa (el descanso de media sesión) ─────────────────
  function esperarSiPausada() {
    if (!pausada || terminada) return Promise.resolve();
    return new Promise(function (r) { resolverPausa = r; });
  }

  function alternarPausa() {
    if (terminada) return;
    if (!pausada) {
      pausada = true;
      pausaDesde = Date.now();
      window.Vera.callar();
      window.Motor.alertasActivas = false; // en el descanso nadie está "distraído"
      colaAlertas.length = 0;
      $('btn-pausar').textContent = '▶ Continuar';
      $('barra-fase').textContent = 'En pausa — la capacitación está detenida. El acta se conserva.';
      return;
    }
    pausada = false;
    msPausados += Date.now() - pausaDesde;
    $('btn-pausar').textContent = '⏸ Pausar';
    // Borrón al volver: nadie carga con la distracción del descanso.
    window.Motor.presentes().forEach(function (p) {
      p.ema = Math.max(p.ema, 0.9);
      p.bocaHistoria = [];
      p.hablandoDesdeMs = 0;
    });
    if (resolverPausa) { var r = resolverPausa; resolverPausa = null; r(); }
  }

  /* Dice un punto del temario respetando la pausa: si el descanso cae a mitad
     de la frase, al volver se repite el punto entero — es lo que haría un
     capacitador humano, y evita que alguien se pierda medio tema. */
  function decirPunto(texto) {
    return window.Vera.decir(texto, { entreFrases: procesarAlertas })
      .then(procesarAlertas)
      .then(function () {
        if (pausada && !terminada) {
          return esperarSiPausada().then(function () { return decirPunto(texto); });
        }
      });
  }

  function dictado() {
    fase = 'modulo';
    $('btn-pausar').classList.remove('oculto');
    var cadena = Promise.resolve();

    contenido.modulos.forEach(function (m, i) {
      cadena = cadena.then(function () {
        if (terminada) return;
        pintarModulo(m, i);
        // Borrón al arrancar cada módulo: responder la pregunta anterior por
        // voz también mueve la boca y baja la media — ese arrastre no puede
        // producir un llamado inmerecido en los primeros segundos del módulo.
        window.Motor.presentes().forEach(function (p) {
          p.ema = Math.max(p.ema, 0.9);
          p.bocaHistoria = [];
          p.hablandoDesdeMs = 0;
        });
        window.Motor.alertasActivas = true;
        var puntosCadena = Promise.resolve();
        m.puntos.forEach(function (punto, j) {
          puntosCadena = puntosCadena.then(esperarSiPausada).then(function () {
            if (terminada) return;
            window.Motor.marcador('m' + i + 'p' + j);
            var lis = $('diapositiva-puntos').children;
            for (var k = 0; k < lis.length; k++) lis[k].classList.toggle('actual', k === j);
            return decirPunto(punto);
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
      return rondaFinal();
    }).then(function () {
      if (terminada) return;
      return window.Vera.decir(
        'Y con esto terminamos la inducción de hoy. Gracias a todos. ' +
        'El acta queda lista para el supervisor: quién estuvo, cómo estuvo su atención ' +
        'y cómo les fue en las preguntas. Que tengan buen turno.'
      );
    }).then(mostrarActa);
  }

  /* Ronda de cierre: nadie sale sin ser evaluado.
     Durante los módulos la pregunta le cae al distraído — eso es dinámica de
     atención. Pero un acta donde once de doce dicen "no le tocó pregunta" no
     sirve como evidencia de que la gente APRENDIÓ, que es justo lo que una
     empresa necesita demostrar. Aquí cada quien responde al menos una vez,
     repartiendo las preguntas del curso. */
  function rondaFinal() {
    var conPregunta = contenido.modulos
      .map(function (m, i) { return { m: m, i: i }; })
      .filter(function (x) { return x.m.pregunta; });
    if (!conPregunta.length) return Promise.resolve();

    var pendientes = window.Motor.presentes().filter(function (p) { return !p.respuestas.length; });
    if (!pendientes.length) return Promise.resolve();

    fase = 'pregunta';
    var cadena = window.Vera.decir(
      pendientes.length === 1
        ? 'Antes de cerrar, una pregunta para quien todavía no ha respondido.'
        : 'Antes de cerrar, una vuelta rápida: una pregunta para cada uno de los que todavía no han respondido.'
    );

    pendientes.forEach(function (p, idx) {
      cadena = cadena.then(function () {
        if (terminada) return;
        var x = conPregunta[idx % conPregunta.length];
        return hacerPregunta(x.m, x.i, p, 'Ronda final · ' + (idx + 1) + ' de ' + pendientes.length);
      });
    });

    return cadena;
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
      $('respuesta-aviso').textContent = '';
      $('txt-respuesta').value = '';
      $('zona-respuesta').classList.remove('oculto');
      // Primer intento automático por voz; si no funciona, se dice POR QUÉ
      // en pantalla en vez de fallar en silencio, y quedan los botones.
      window.Vera.escuchar(9).then(function (oido) {
        if (resuelto) return;
        if (oido && oido.trim().length > 1) { entregar(oido.trim()); return; }
        // 'aborted' no es un fallo del micrófono: es esta misma app cortando
        // una escucha vieja para arrancar otra. No se le muestra al usuario.
        var err = window.Vera.ultimoErrorVoz;
        if (!window.Vera.modoRapido && err !== 'aborted') {
          $('respuesta-aviso').textContent = window.Vera.explicarErrorVoz(err);
        }
      });
    });
  }

  function hacerPregunta(m, idxModulo, aQuien, rotulo) {
    if (terminada) return Promise.resolve();
    fase = 'pregunta';
    var p = aQuien || elegirInterrogado();
    if (!p) return Promise.resolve();
    p.yaPreguntado = true;
    window.Vera.mirar(p.x);
    $('barra-fase').textContent = rotulo || ('Pregunta del módulo ' + (idxModulo + 1));

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
  var ticksChips = 0;
  function arrancarChips() {
    clearInterval(tickerChips);
    tickerChips = setInterval(function () {
      // Cada 15 s se guarda el borrador: si se cae la pestaña o el computador,
      // el acta de lo alcanzado se puede rescatar al volver a abrir.
      if (++ticksChips % 30 === 0) guardarBorrador();
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
        var etiquetas = { atento: 'atenta/o', distraido: 'distraída/o', 'ojos-cerrados': 'ojos cerrados', hablando: 'conversando', ausente: 'ausente' };
        return '<div class="chip-persona ' + p.estado + '" data-idx="' + i + '" title="' + etiquetas[p.estado] + '">' +
          '<span class="punto"></span>' +
          '<span class="nombre">' + (p.nombre || 'sin registrar') + '</span>' +
          '<span class="barra"><i style="width:' + pct + '%"></i></span>' +
          (p.llamados ? '<span class="llamados">⚠ ' + p.llamados + '</span>' : '') +
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
    window.Vera.detenerEscucha(); // que el micrófono no siga abierto en el acta

    if (!inicioSesion) inicioSesion = Date.now(); // sesión cortada antes del registro
    if (pausada) msPausados += Date.now() - pausaDesde; // se terminó estando en pausa
    $('btn-pausar').classList.add('oculto');
    var duracionMin = Math.max(1, Math.round((Date.now() - inicioSesion - msPausados) / 60000));
    guardarActa(personas, duracionMin);
    pintarActa(sesionGuardada);
    ir('p-acta');
  }

  /* Pinta un acta a partir del registro guardado — no del estado vivo del
     motor. Así el acta de la sesión, la rescatada de una caída y la que se
     reabre desde el historial son literalmente la misma, y ninguna puede
     decir algo distinto de lo que se midió ese día. */
  function pintarActa(acta, aviso) {
    actaEnPantalla = acta;
    var fecha = new Date(acta.fecha);
    $('acta-titulo').textContent = 'Acta — ' + acta.titulo;
    $('acta-datos').textContent = (aviso ? aviso + ' · ' : '') +
      (isNaN(fecha.getTime()) ? '' :
        fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) +
        ' · ' + fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })) +
      ' · duración: ' + acta.duracionMin + ' min · modo: ' +
      (acta.modo === 'camara' ? 'sala real con cámara' : 'demostración simulada') +
      (acta.grupo ? ' · ' + acta.grupo : '');

    var filas = acta.personas.map(function (p) {
      var atencion = typeof p.atencion === 'number' ? p.atencion + '%' : '—';
      // Si Vera anunció "queda anotado", el acta no puede decir "completa";
      // el umbral de 8 s evita acusar por una simple pérdida de rastreo
      // (alguien que se agacha o voltea del todo por un par de segundos).
      var ausente = p.ausenteMs || 0;
      var presencia = ausente > 45000 ? 'se ausentó ~' + Math.max(1, Math.round(ausente / 60000)) + ' min'
                    : ausente > 8000 ? 'se ausentó un momento'
                    : 'completa';
      var marcas = (p.respuestas || []).map(function (r) {
        if (r.veredicto === 'correcta') return '✔';
        if (r.veredicto === 'incorrecta') return '✘';
        if (r.veredicto === 'respondida') return '•'; // respondió, sin calificar
        return '–';
      }).join(' ');
      var ac = window.Historial.aciertos(p);
      var respuestas = (p.respuestas || []).length
        ? marcas + (ac.total > 1 ? ' <b>(' + ac.bien + '/' + ac.total + ')</b>' : '')
        : 'no le tocó pregunta';
      var obs, claseObs;
      // Solo se afirma lo que se midió: el conteo de llamados es un hecho;
      // "volvió a concentrarse" solo si la atención al cierre era alta de verdad.
      if (p.paraSupervisor) { obs = 'Revisar con el supervisor'; claseObs = 'alerta'; }
      else if (p.llamados > 0) {
        obs = 'Se le llamó la atención ' + p.llamados + (p.llamados === 1 ? ' vez' : ' veces');
        if (p.cerroAtenta) obs += ' y volvió a concentrarse';
        claseObs = '';
      }
      // El acta también sabe decir lo bueno: un registro que solo acusa se lee
      // como una lista de castigos, y el asesor la odia con razón.
      else if (typeof p.atencion === 'number' && p.atencion >= 90 && ac.total && ac.bien === ac.total) {
        obs = 'Atenta/o toda la sesión y respondió bien'; claseObs = 'bien';
      }
      else if (typeof p.atencion === 'number' && p.atencion >= 90) { obs = 'Atenta/o toda la sesión'; claseObs = 'bien'; }
      else { obs = 'Sin novedad'; claseObs = 'bien'; }
      // La conversa acumulada durante el dictado se reporta aparte: es el
      // caso "85% de atención pero se la pasó hablando".
      if ((p.conversaMs || 0) > 45000) {
        var minCharla = Math.max(1, Math.round(p.conversaMs / 60000));
        obs = (obs === 'Sin novedad' ? '' : obs + ' · ') + 'Conversó ~' + minCharla + ' min durante el dictado';
        if (claseObs === 'bien') claseObs = '';
      }
      return '<tr>' +
        '<td>' + escaparHtml(p.nombre || 'Sin registrar') + '</td>' +
        '<td>' + presencia + '</td>' +
        '<td>' + atencion + '</td>' +
        '<td>' + (p.llamados || 0) + '</td>' +
        '<td>' + respuestas + '</td>' +
        '<td class="' + claseObs + '">' + escaparHtml(obs) + '</td>' +
        '</tr>';
    });
    $('tabla-acta').querySelector('tbody').innerHTML = filas.join('');
    var leyenda = ' Respuestas: ✔ correcta · ✘ incorrecta · • respondió (sin calificar) · – sin respuesta.';
    $('acta-nota').textContent = (acta.modo === 'camara'
      ? 'La atención se estima por postura de cabeza y apertura de ojos frente a la cámara. ' +
        'Es un indicio, no una medición absoluta: las decisiones sobre el personal las toma ' +
        'una persona, no la plataforma.'
      : 'Sesión de demostración: la atención mostrada proviene de la sala simulada, no de una cámara. ' +
        'En una sala real se estima por postura de cabeza y ojos, y sigue siendo un indicio: ' +
        'las decisiones sobre el personal las toma una persona.') + leyenda;
  }

  function resumenTexto() {
    var acta = actaEnPantalla;
    if (!acta) return '';
    var fecha = new Date(acta.fecha);
    var lineas = ['Acta de capacitación — ' + acta.titulo,
      (isNaN(fecha.getTime()) ? '' : fecha.toLocaleDateString('es-CO')) +
        ' (' + (acta.modo === 'camara' ? 'sala real' : 'demo') + ')' +
        (acta.grupo ? ' · ' + acta.grupo : ''), ''];
    acta.personas.forEach(function (p) {
      var atencion = typeof p.atencion === 'number' ? p.atencion + '%' : '—';
      var ac = window.Historial.aciertos(p);
      var charla = (p.conversaMs || 0) > 45000
        ? ', conversó ~' + Math.max(1, Math.round(p.conversaMs / 60000)) + ' min'
        : '';
      lineas.push('• ' + (p.nombre || 'Sin registrar') + ': atención ' + atencion +
        ', llamados ' + (p.llamados || 0) +
        (ac.total ? ', preguntas ' + ac.bien + '/' + ac.total : '') + charla +
        (p.paraSupervisor ? ' — REVISAR CON SUPERVISOR' : ''));
    });
    lineas.push('', acta.modo === 'camara'
      ? 'Atención estimada por cámara (postura y ojos). Indicio, no medición absoluta.'
      : 'Sesión de demostración: la atención mostrada es simulada.');
    return lineas.join('\n');
  }

  // Retrato del estado actual con forma de acta: lo usan el guardado final y
  // el borrador de rescate, para que el acta rescatada sea idéntica a la real.
  function instantanea(personas, duracionMin) {
    return {
      id: 's' + (inicioSesion || Date.now()),
      fecha: new Date().toISOString(),
      titulo: contenido.titulo,
      modo: modo,
      duracionMin: duracionMin,
      grupo: grupoSesion,
      personas: personas.map(function (p) {
        return {
          nombre: p.nombre,
          atencion: p.nMuestras ? Math.round((p.sumaEma / p.nMuestras) * 100) : null,
          llamados: p.llamados,
          conversaMs: p.hablandoAcumMs || 0,
          ausenteMs: p.ausenteAcumMs || 0,
          // Se guardan para que un acta reabierta diga exactamente lo mismo
          // que dijo el día que se generó, sin recalcular con datos que ya no existen.
          cerroAtenta: !!(p.presente && p.ema > 0.7),
          paraSupervisor: p.paraSupervisor,
          respuestas: p.respuestas
        };
      })
    };
  }

  function guardarBorrador() {
    if (fase !== 'modulo' && fase !== 'pregunta') return;
    var personas = window.Motor.personas().filter(function (p) { return p.nombre; });
    if (!personas.length) return;
    var minutos = Math.max(1, Math.round((Date.now() - inicioSesion - msPausados) / 60000));
    window.Historial.guardarBorrador(instantanea(personas, minutos));
  }

  function guardarActa(personas, duracionMin) {
    sesionGuardada = instantanea(personas, duracionMin);
    window.Historial.guardar(sesionGuardada);
    window.Historial.borrarBorrador(); // la sesión llegó a su acta: ya no hay qué rescatar
  }

  // ── Constancias ─────────────────────────────────────────
  // El papel que la empresa archiva para una auditoría. Se arma con lo que el
  // acta ya midió y NO afirma nada más: dice "asistió", no "aprobó", salvo que
  // de verdad haya respondido preguntas.
  var constanciaSesion = null;
  var constanciaIndice = 0;

  function pintarConstancia() {
    if (!constanciaSesion || !constanciaSesion.personas.length) return;
    var total = constanciaSesion.personas.length;
    if (constanciaIndice < 0) constanciaIndice = total - 1;
    if (constanciaIndice >= total) constanciaIndice = 0;
    var p = constanciaSesion.personas[constanciaIndice];
    var ac = window.Historial.aciertos(p);
    var esDemo = constanciaSesion.modo !== 'camara';

    var datos = [
      { valor: constanciaSesion.duracionMin + ' min', rotulo: 'Duración' },
      { valor: (typeof p.atencion === 'number' ? p.atencion + '%' : '—'), rotulo: 'Atención estimada' }
    ];
    if (ac.total) datos.push({ valor: ac.bien + ' de ' + ac.total, rotulo: 'Preguntas acertadas' });

    var fecha = new Date(constanciaSesion.fecha);
    var fechaTexto = isNaN(fecha.getTime()) ? '' :
      fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

    $('constancia').innerHTML =
      '<div class="c-marca">VERA · CAPACITADORA VIRTUAL</div>' +
      '<h1>Constancia de capacitación</h1>' +
      '<div class="c-linea"></div>' +
      '<div class="c-texto">Se deja constancia de que</div>' +
      '<div class="c-nombre">' + escaparHtml(p.nombre || 'Sin registrar') + '</div>' +
      '<div class="c-texto">asistió a la capacitación</div>' +
      '<div class="c-curso">“' + escaparHtml(constanciaSesion.titulo) + '”' + '</div>' +
      '<div class="c-texto">dictada el ' + fechaTexto +
        (constanciaSesion.grupo ? ' · ' + escaparHtml(constanciaSesion.grupo) : '') + '</div>' +
      '<div class="c-datos">' + datos.map(function (d) {
        return '<div class="c-dato"><div class="valor">' + d.valor + '</div>' +
               '<div class="rotulo">' + d.rotulo + '</div></div>';
      }).join('') + '</div>' +
      '<div class="c-pie">' +
        (esDemo
          ? '<b>SESIÓN DE DEMOSTRACIÓN — no es una constancia válida.</b><br>'
          : '') +
        'Capacitación dictada por Vera, una capacitadora virtual con inteligencia artificial. ' +
        'La atención es un estimado a partir de la postura de la cabeza y los ojos frente a la cámara: ' +
        'es un indicio de participación, no una calificación de desempeño.<br>' +
        'Documento generado automáticamente el ' +
        new Date().toLocaleDateString('es-CO') + ' · asistente ' + (constanciaIndice + 1) + ' de ' + total +
      '</div>';
  }

  function abrirConstancias(sesion) {
    if (!sesion || !sesion.personas.length) return;
    constanciaSesion = sesion;
    constanciaIndice = 0;
    pintarConstancia();
    ir('p-constancia');
  }

  function escaparHtml(texto) {
    return String(texto === null || texto === undefined ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Una capacitación que se cae (recarga, cierre, Windows actualizándose) ya
     no se lleva la asistencia consigo: aquí se ofrece rescatar el acta de lo
     que alcanzó a pasar. No se ofrece "continuar" — reanudar exigiría volver a
     reconocer las caras, y prometerlo sería justo lo que este proyecto no hace. */
  function ofrecerRescate() {
    var borrador = window.Historial.leerBorrador();
    if (!borrador) return;
    var cuando = window.Historial.fechaLegible(borrador.fecha);
    $('rescate-texto').textContent = 'Quedó una capacitación sin cerrar (' + borrador.titulo +
      ', ' + cuando + ', ' + borrador.personas.length +
      (borrador.personas.length === 1 ? ' asistente' : ' asistentes') + ').';
    $('aviso-rescate').classList.remove('oculto');

    $('btn-rescatar').addEventListener('click', function () {
      var acta = window.Historial.leerBorrador();
      if (!acta) return;
      acta.id = 's' + Date.now(); // id propio: es un acta nueva en el historial
      window.Historial.guardar(acta);
      window.Historial.borrarBorrador();
      $('aviso-rescate').classList.add('oculto');
      sesionGuardada = acta;
      fase = 'acta';
      pintarActa(acta, 'ACTA RESCATADA — la sesión se interrumpió');
      ir('p-acta');
    });
    $('btn-descartar-rescate').addEventListener('click', function () {
      window.Historial.borrarBorrador();
      $('aviso-rescate').classList.add('oculto');
    });
  }

  // ── Vista del historial ─────────────────────────────────
  var vistaHistorial = 'personas';

  function pintarHistorial() {
    var filtro = $('txt-buscar').value.toLowerCase().trim();
    var incluirDemos = $('chk-incluir-demos').checked;
    var cuerpo = $('historial-cuerpo');

    if (vistaHistorial === 'personas') {
      var gente = window.Historial.personas(incluirDemos).filter(function (p) {
        return !filtro || p.nombre.toLowerCase().indexOf(filtro) >= 0;
      });
      if (!gente.length) {
        cuerpo.innerHTML = '<div class="vacio-historial">' + (filtro
          ? 'Nadie con ese nombre en el historial.'
          : 'Todavía no hay capacitaciones registradas.<br>' +
            'Las sesiones con cámara quedan aquí al terminar. ' +
            'Marca “Incluir demostraciones” para ver también las de prueba.') + '</div>';
        return;
      }
      cuerpo.innerHTML = gente.map(function (p) {
        return '<div class="registro">' +
          '<div class="registro-cabeza">' +
            '<span class="registro-nombre">' + escaparHtml(p.nombre) + '</span>' +
            '<span class="registro-meta">' + p.cursos + (p.cursos === 1 ? ' capacitación' : ' capacitaciones') +
              (p.atencionMedia !== null ? ' · atención media ' + p.atencionMedia + '%' : '') +
              (p.llamados ? ' · ' + p.llamados + ' llamados' : '') + '</span>' +
          '</div>' +
          '<div class="registro-lista">' + p.sesiones.map(function (s) {
            return '<div class="registro-linea">' +
              '<span><b>' + escaparHtml(s.titulo) + '</b> — ' + window.Historial.fechaLegible(s.fecha) + '</span>' +
              '<span class="registro-acciones">' +
                '<button class="btn btn-mini" data-constancia="' + escaparHtml(s.id) + '" data-persona="' + escaparHtml(s.persona.nombre) + '">Constancia</button>' +
              '</span></div>';
          }).join('') + '</div>' +
          '<div class="registro-linea"><span></span><span class="registro-acciones">' +
            '<button class="btn btn-mini" data-borrar-persona="' + escaparHtml(p.nombre) + '">Borrar sus datos</button>' +
          '</span></div>' +
          '</div>';
      }).join('');
      return;
    }

    var sesiones = window.Historial.listar().filter(function (s) {
      if (!incluirDemos && s.modo !== 'camara') return false;
      if (!filtro) return true;
      return s.titulo.toLowerCase().indexOf(filtro) >= 0 ||
        (s.grupo || '').toLowerCase().indexOf(filtro) >= 0 ||
        s.personas.some(function (p) { return p.nombre.toLowerCase().indexOf(filtro) >= 0; });
    });
    if (!sesiones.length) {
      cuerpo.innerHTML = '<div class="vacio-historial">' + (filtro
        ? 'Ninguna sesión coincide con esa búsqueda.'
        : 'Todavía no hay sesiones registradas.<br>Marca “Incluir demostraciones” para ver las de prueba.') +
        '</div>';
      return;
    }
    cuerpo.innerHTML = sesiones.map(function (s) {
      var medias = s.personas.filter(function (p) { return typeof p.atencion === 'number'; });
      var media = medias.length
        ? Math.round(medias.reduce(function (a, p) { return a + p.atencion; }, 0) / medias.length)
        : null;
      return '<div class="registro">' +
        '<div class="registro-cabeza">' +
          '<span class="registro-nombre">' + escaparHtml(s.titulo) +
            (s.modo !== 'camara' ? ' <span class="etiqueta-demo">demostración</span>' : '') + '</span>' +
          '<span class="registro-meta">' + window.Historial.fechaLegible(s.fecha) + '</span>' +
        '</div>' +
        '<div class="registro-linea">' +
          '<span>' + s.personas.length + (s.personas.length === 1 ? ' asistente' : ' asistentes') +
            ' · ' + s.duracionMin + ' min' +
            (media !== null ? ' · atención media ' + media + '%' : '') +
            (s.grupo ? ' · ' + escaparHtml(s.grupo) : '') + '</span>' +
          '<span class="registro-acciones">' +
            '<button class="btn btn-mini" data-acta="' + escaparHtml(s.id) + '">Ver acta</button>' +
            '<button class="btn btn-mini" data-constancia="' + escaparHtml(s.id) + '">Constancias</button>' +
            '<button class="btn btn-mini" data-borrar-sesion="' + escaparHtml(s.id) + '">Borrar</button>' +
          '</span></div>' +
        '<div class="registro-linea"><span>' + s.personas.map(function (p) {
          return escaparHtml(p.nombre) + (typeof p.atencion === 'number' ? ' (' + p.atencion + '%)' : '');
        }).join(' · ') + '</span></div>' +
        '</div>';
    }).join('');
  }

  // ── Cableado de la interfaz ─────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    pintarResumen();
    ofrecerRescate();

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

    // La prueba del micrófono ANTES de empezar: la primera sesión real de Joan
    // se quedó sin voz y nadie le dijo por qué. Aquí se ve el nivel en vivo y,
    // si falla, la explicación en español de qué arreglar.
    $('btn-probar-mic').addEventListener('click', function () {
      var boton = $('btn-probar-mic');
      var res = $('resultado-mic');
      if (window.Vera.modoRapido) { res.textContent = 'El modo rápido (?rapido=1) no usa audio.'; return; }
      boton.disabled = true; // dos escuchas encimadas se pisan entre sí
      res.textContent = 'Di algo, te escucho unos segundos…';
      window.Vera.escuchar(5, res).then(function (oido) {
        boton.disabled = false;
        res.textContent = oido
          ? '✔ Te escuché: “' + oido + '”. El micrófono funciona.'
          : window.Vera.explicarErrorVoz(window.Vera.ultimoErrorVoz);
      });
    });

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
    $('btn-pausar').addEventListener('click', alternarPausa);

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
      $('respuesta-aviso').textContent = '';
      window.Vera.escuchar(9).then(function (oido) {
        if (oido && resolverRespuesta) { resolverRespuesta(oido.trim()); return; }
        var err = window.Vera.ultimoErrorVoz;
        if (resolverRespuesta && err !== 'aborted') {
          $('respuesta-aviso').textContent = window.Vera.explicarErrorVoz(err);
        }
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

    // ── Constancias de la sesión recién terminada ─────────
    $('btn-constancias').addEventListener('click', function () {
      abrirConstancias(actaEnPantalla);
    });
    $('btn-constancia-siguiente').addEventListener('click', function () {
      constanciaIndice++; pintarConstancia();
    });
    $('btn-constancia-anterior').addEventListener('click', function () {
      constanciaIndice--; pintarConstancia();
    });
    $('btn-imprimir-constancia').addEventListener('click', function () { window.print(); });
    $('btn-cerrar-constancia').addEventListener('click', function () {
      // Vuelve a donde se venía: al acta que se estaba viendo, o al historial.
      ir(constanciaSesion && constanciaSesion === actaEnPantalla ? 'p-acta' : 'p-historial');
    });
    $('btn-volver-historial').addEventListener('click', function () {
      $('btn-volver-historial').classList.add('oculto');
      pintarHistorial();
      ir('p-historial');
    });

    // ── Historial ─────────────────────────────────────────
    $('btn-historial').addEventListener('click', function () {
      pintarHistorial();
      ir('p-historial');
    });
    $('btn-cerrar-historial').addEventListener('click', function () { ir('p-inicio'); });
    $('txt-buscar').addEventListener('input', pintarHistorial);
    $('chk-incluir-demos').addEventListener('change', pintarHistorial);
    document.querySelectorAll('.pestana').forEach(function (boton) {
      boton.addEventListener('click', function () {
        document.querySelectorAll('.pestana').forEach(function (b) { b.classList.remove('activa'); });
        boton.classList.add('activa');
        vistaHistorial = boton.dataset.vista;
        pintarHistorial();
      });
    });

    // Un solo escucha para toda la lista: se repinta entera en cada cambio.
    $('historial-cuerpo').addEventListener('click', function (ev) {
      var boton = ev.target.closest('button');
      if (!boton) return;

      if (boton.dataset.acta) {
        var vista = window.Historial.buscarSesion(boton.dataset.acta);
        if (!vista) return;
        pintarActa(vista, 'Del historial');
        $('btn-volver-historial').classList.remove('oculto');
        ir('p-acta');
        return;
      }
      if (boton.dataset.constancia) {
        var sesion = window.Historial.buscarSesion(boton.dataset.constancia);
        if (!sesion) return;
        abrirConstancias(sesion);
        // Desde la ficha de una persona se abre directamente SU constancia.
        if (boton.dataset.persona) {
          sesion.personas.forEach(function (p, i) {
            if (p.nombre === boton.dataset.persona) { constanciaIndice = i; }
          });
          pintarConstancia();
        }
        return;
      }
      if (boton.dataset.borrarSesion) {
        if (!confirm('¿Borrar esta sesión del historial? No se puede deshacer.')) return;
        window.Historial.borrarSesion(boton.dataset.borrarSesion);
        pintarHistorial();
        return;
      }
      if (boton.dataset.borrarPersona) {
        var quien = boton.dataset.borrarPersona;
        if (!confirm('¿Borrar todos los datos de ' + quien + '? Es su derecho pedirlo (Ley 1581), ' +
                     'y no se puede deshacer.')) return;
        window.Historial.borrarPersona(quien);
        pintarHistorial();
      }
    });

    $('btn-csv').addEventListener('click', function () {
      if (!window.Historial.listar().length) { alert('Todavía no hay capacitaciones que exportar.'); return; }
      window.Historial.descargarCsv(!$('chk-incluir-demos').checked);
    });
    $('btn-respaldo').addEventListener('click', function () {
      if (!window.Historial.listar().length) { alert('Todavía no hay historial que respaldar.'); return; }
      window.Historial.exportarRespaldo();
    });
    $('btn-restaurar').addEventListener('click', function () { $('archivo-respaldo').click(); });
    $('archivo-respaldo').addEventListener('change', function (ev) {
      var archivo = ev.target.files && ev.target.files[0];
      if (!archivo) return;
      var lector = new FileReader();
      lector.onload = function () {
        var r = window.Historial.importarRespaldo(String(lector.result));
        alert(r.ok
          ? 'Respaldo restaurado: ' + r.nuevas + ' sesiones nuevas' +
            (r.repetidas ? ' (' + r.repetidas + ' ya estaban)' : '') + '.'
          : r.error);
        pintarHistorial();
      };
      lector.onerror = function () { alert('No se pudo leer el archivo.'); };
      lector.readAsText(archivo);
      ev.target.value = ''; // permite volver a elegir el mismo archivo
    });
    $('btn-borrar-todo').addEventListener('click', function () {
      if (!confirm('¿Borrar TODO el historial de capacitaciones de este computador? ' +
                   'No se puede deshacer. Si quieres conservarlo, guarda primero un respaldo.')) return;
      window.Historial.borrarTodo();
      pintarHistorial();
    });

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
    $('btn-exportar-cursos').addEventListener('click', function () {
      // Se guarda lo que está en el editor, no lo que hay en memoria: si el
      // usuario acaba de escribir y exporta sin guardar, se llevaría lo viejo.
      window.ContenidoLib.guardarTexto($('txt-contenido').value);
      var blob = new Blob([window.ContenidoLib.exportar()], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = window.Historial.nombreConFecha('vera-cursos', 'json');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
    $('btn-importar-cursos').addEventListener('click', function () { $('archivo-cursos').click(); });
    $('archivo-cursos').addEventListener('change', function (ev) {
      var archivo = ev.target.files && ev.target.files[0];
      if (!archivo) return;
      var lector = new FileReader();
      lector.onload = function () {
        var r = window.ContenidoLib.importar(String(lector.result));
        if (r.ok) {
          $('txt-contenido').value = window.ContenidoLib.obtenerTexto();
          pintarResumen();
          alert('Se importaron ' + r.cambiados + ' cursos.');
        } else {
          alert(r.error);
        }
      };
      lector.onerror = function () { alert('No se pudo leer el archivo.'); };
      lector.readAsText(archivo);
      ev.target.value = '';
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') $('modal-editor').classList.add('oculto');
    });
  });
})();
