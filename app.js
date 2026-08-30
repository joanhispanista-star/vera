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
  var autoestudio = false;      // un asesor solo frente al computador (el caso real del cliente)
  var miNombre = '';            // se escribe al inicio en autoestudio, no se pregunta por voz
  var intentoExamen = 0;
  var enEspera = false;         // el asesor se levantó del puesto (no es falta)
  var esperaDesde = 0;
  var vacioDesde = 0;
  var interrupciones = 0;
  var msEnEspera = 0;
  var resolverEspera = null;
  var moduloDeArranque = 0;     // al retomar un curso a medias
  var resultadoExamen = null;
  var examenEnCurso = false;    // examen empezado y todavía SIN calificar
  var examinado = null;         // a quién se le está tomando
  var examenPreguntasTotal = 0; // cuántas traía el examen que se interrumpió
  var resolverOpcion = null;
  var sesionGuardada = null;    // el acta recién guardada, para sus constancias
  var actaEnPantalla = null;    // la que se está viendo: de la sesión, rescatada o del historial
  var dudas = [];               // puntos que el grupo pidió repetir ("No entendí")
  var dictado_ = { modulos: 0, puntos: 0 };  // lo que Vera alcanzó a dictar de verdad
  var puntoEnCurso = null;      // { modulo, tituloModulo, indicePunto, texto }
  var repetirPedido = false;    // el grupo pidió repetir el punto que suena
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
  /* Con lista del equipo cargada, el asesor ELIGE su nombre; sin lista, lo
     escribe. Elegir evita que el historial de una misma persona se parta en
     varias fichas por una tilde o un apodo. */
  function pintarSelectorNombre() {
    var lista = window.Historial.nomina();
    var sel = $('sel-mi-nombre');
    var txt = $('txt-mi-nombre');
    if (!lista.length) {
      sel.classList.add('oculto');
      txt.classList.remove('oculto');
      return;
    }
    sel.innerHTML = '<option value="">— elige tu nombre —</option>' +
      lista.map(function (n) {
        return '<option value="' + escaparHtml(n) + '">' + escaparHtml(n) + '</option>';
      }).join('') +
      '<option value="__otro__">No estoy en la lista</option>';
    sel.classList.remove('oculto');
    txt.classList.add('oculto');
    txt.value = '';
  }

  function nombreElegido() {
    var sel = $('sel-mi-nombre');
    if (!sel.classList.contains('oculto') && sel.value && sel.value !== '__otro__') return sel.value;
    return $('txt-mi-nombre').value.trim();
  }

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
    var minutos = window.ContenidoLib.estimarMinutos(contenido, 0);
    var examen = window.Examen ? window.Examen.armar(contenido) : { preguntas: [] };
    /* Sin preguntas de opción múltiple no hay examen, y por lo tanto tampoco
       constancia de aprobación. Le pasa a quien editó un curso antes de que
       existiera ese formato: su copia guardada se conserva (no se le pisa lo
       que escribió) pero se queda sin las preguntas nuevas — y sin este aviso
       lo descubriría el día de la capacitación, sin saber por qué. */
    var avisoExamen = examen.preguntas.length
      ? 'Examen final: <strong>' + examen.preguntas.length + ' preguntas</strong>, ' +
        'y se aprueba con ' + Math.ceil((window.Examen.notaMinima() / 100) * examen.preguntas.length) +
        ' aciertos.'
      : '<span style="color:var(--ambar)">⚠ Este curso no tiene preguntas de opción múltiple, ' +
        'así que no puede haber examen ni constancia de aprobación. Si es un curso de fábrica que ' +
        'usted editó, abra “Editar contenido” y oprima “Restaurar el de fábrica” para recuperar ' +
        'las preguntas.</span>';
    $('inicio-resumen').innerHTML =
      'Contenido cargado: <strong>' + contenido.titulo + '</strong> — ' +
      contenido.modulos.length + ' módulos, ' + preguntas + ' preguntas.<br>' +
      'Duración estimada: <strong>~' + minutos + ' minutos</strong>, más unos 15 segundos por asistente ' +
      'para el registro de nombres.<br>' + avisoExamen;
  }

  // ── Frases de Vera ──────────────────────────────────────
  function saludoPorHora() {
    var h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  }

  // Honestidad: en modo demo NO hay cámara, y Vera no puede afirmar que ve por ella.
  function textoSaludo() {
    var comun = '. Soy Vera, la capacitadora virtual. Sí: soy una inteligencia artificial, ';
    if (modo !== 'camara') {
      return saludoPorHora() + comun + 'y esta es una sala simulada, para mostrar cómo trabajo. ' +
        'Hoy vamos a hacer la inducción completa, yo voy a estar pendiente de cada uno, ' +
        'y al final entrego un acta. Empecemos por conocernos.';
    }
    // Con rotación alta, media sala real es UNA persona un martes cualquiera:
    // decirle "acomódense, guarden el celular" delata que se le habla a un grupo.
    if (autoestudio) {
      // El asesor ya escribió su nombre: no se le pregunta, se le llama por él
      // desde el primer segundo. Y se le dice de entrada que hay examen: nadie
      // debe enterarse al final de que su constancia dependía de una nota.
      return saludoPorHora() + ', ' + miNombre + comun +
        'y sí, te estoy viendo por la cámara mientras hacemos esto. ' +
        'Vamos a hacer tu capacitación completa, y al final te voy a hacer un examen: ' +
        'si lo pasas, queda tu constancia. Ponte cómodo, guarda el celular, y arrancamos.';
    }
    if (window.Motor.presentes().length === 1) {
      return saludoPorHora() + comun + 'y sí, te estoy viendo por la cámara. ' +
        'Hoy vamos a hacer tu inducción completa, voy a estar pendiente de ti, ' +
        'y al final queda tu constancia. Así que ponte cómodo, guarda el celular, ' +
        'y empecemos por conocernos.';
    }
    return saludoPorHora() + comun + 'y sí, los estoy viendo por la cámara. ' +
      'Hoy vamos a hacer la inducción completa, yo voy a estar pendiente de cada uno, ' +
      'y al final entrego un acta. Así que acomódense, guarden el celular, y empecemos por conocernos.';
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
    // Si quedó un rescate sin resolver, se archiva ANTES de empezar: a los 15 s
    // de la sesión nueva el borrador se sobrescribiría y esa evidencia se
    // perdería en silencio, que es justo lo que el rescate existe para evitar.
    var pendiente = window.Historial.leerBorrador();
    if (pendiente) {
      pendiente.id = 's' + Date.now();
      pendiente.rescatada = true;
      if (window.Historial.guardar(pendiente)) window.Historial.borrarBorrador();
      $('aviso-rescate').classList.add('oculto');
    }
    autoestudio = (elegido === 'solo');
    modo = autoestudio ? 'camara' : elegido;
    miNombre = autoestudio ? nombreElegido() : '';
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
      // En el puesto, irse o hablar puede ser el trabajo (una llamada real).
      window.Motor.sinAlertaAusencia = autoestudio;
      window.Motor.unaSolaPersona = autoestudio;
      window.Motor.alLlegarTarde = function (p) {
        // Queda registrado el momento: sin esto su acta y su constancia
        // afirmarían presencia completa en una sesión a la que llegó al final.
        p.llegoTardeMs = Date.now() - (inicioSesion || Date.now());
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

    // Autoestudio: no hay a quién presentar. El nombre ya se escribió y se le
    // asigna a la única cara detectada; pedirlo por voz sería una ceremonia
    // inútil que además falla si el micrófono no sirve.
    if (autoestudio) {
      $('btn-empezar-registro').classList.add('oculto');
      $('barra-fase').textContent = 'Capacitación individual';
      $('diapositiva-titulo').textContent = contenido.titulo;
      $('diapositiva-puntos').innerHTML = '';
      var yo = window.Motor.presentes()[0];
      if (yo) {
        yo.nombre = miNombre || 'Asistente';
        window.Motor.calibrar(yo);
      }
      window.Motor.bloquearNuevas = true;
      var retoma = moduloDeArranque > 0 && moduloDeArranque < contenido.modulos.length;
      window.Vera.decir(retoma
        ? 'Retomamos donde quedamos, ' + (miNombre || '') + '. Vamos por el módulo ' +
          (moduloDeArranque + 1) + ': ' + contenido.modulos[moduloDeArranque].titulo + '.'
        : 'Perfecto, ' + (miNombre || 'empecemos') + '. Si en algún momento no entiendes algo, ' +
          'oprime el botón de “No entendí” y lo repito las veces que haga falta. Arrancamos.'
      ).then(function () { dictado(retoma ? moduloDeArranque : 0); });
      return;
    }
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
        'Veo que alguien más se nos unió. Bienvenida o bienvenido: en un momento el supervisor registra tu nombre. Sigamos.'
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
    if (terminada) return Promise.resolve();
    if (pausada) return new Promise(function (r) { resolverPausa = r; });
    if (enEspera) return new Promise(function (r) { resolverEspera = r; });
    return Promise.resolve();
  }

  /* El asesor se levantó del puesto. En una sala eso sería una ausencia que se
     anota; en su puesto de trabajo, levantarse porque lo llamó el jefe o
     porque entró una llamada ES el trabajo. Así que Vera no regaña: espera,
     congela el reloj y al volver repite el punto. El acta lo cuenta como
     interrupción, sin la palabra "llamado" y sin escalar a supervisor. */
  function entrarEnEspera() {
    if (enEspera || terminada) return;
    enEspera = true;
    esperaDesde = Date.now();
    interrupciones += 1;
    window.Vera.callar();
    window.Vera.detenerEscucha();
    window.Motor.esperar();
    $('barra-fase').textContent = 'Te espero. La cámara sigue encendida solo para saber cuándo vuelves — ' +
      'no se está midiendo nada, y esto no cuenta en tu contra.';
  }

  function salirDeEspera() {
    if (!enEspera) return;
    enEspera = false;
    msEnEspera += Date.now() - esperaDesde;
    window.Motor.dejarDeEsperar();
    // Borrón: la distracción de la interrupción no es del asesor.
    window.Motor.presentes().forEach(function (p) {
      p.ema = Math.max(p.ema, 0.9);
      p.bocaHistoria = [];
      p.hablandoDesdeMs = 0;
    });
    if (fase === 'modulo') window.Motor.alertasActivas = true;
    repetirPedido = true; // al volver se repite el punto entero
    window.Vera.decir('Volviste, ' + (miNombre || 'sigamos') + '. Te repito el punto.');
    if (resolverEspera) { var r = resolverEspera; resolverEspera = null; r(); }
  }

  function alternarPausa() {
    if (terminada) return;
    if (!pausada) {
      pausada = true;
      pausaDesde = Date.now();
      window.Vera.callar();
      window.Vera.detenerEscucha();
      window.Motor.pausar(); // apaga la cámara y congela toda medición
      colaAlertas.length = 0;
      colaLlegadas.length = 0;
      $('btn-pausar').textContent = '▶ Continuar';
      $('barra-fase').textContent = modo === 'camara'
        ? 'En descanso — la cámara está apagada y no se está midiendo nada. El acta se conserva.'
        : 'En descanso — la capacitación está detenida. El acta se conserva.';
      return;
    }
    $('btn-pausar').disabled = true;
    window.Motor.reanudar().then(function (r) {
      $('btn-pausar').disabled = false;
      if (!r.ok) {
        // La cámara no volvió: se dice y se deja seguir en pausa, en vez de
        // continuar a ciegas fingiendo que se está midiendo.
        window.Motor.enPausa = true;
        $('barra-fase').textContent = 'No se pudo volver a encender la cámara: ' + r.error;
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
      // Pausar apagó la vigilancia; si volvemos a mitad de un módulo hay que
      // reencenderla, o Vera se queda muda ante las distracciones que siguen.
      if (fase === 'modulo') window.Motor.alertasActivas = true;
      if (resolverPausa) { var res = resolverPausa; resolverPausa = null; res(); }
    });
  }

  /* "No entendí": lo más valioso que Vera puede recoger y que ningún
     capacitador humano entrega. Nadie levanta la mano delante del jefe, así
     que el botón lo oprime el supervisor (o el propio asistente al pasar) y
     NO se asocia a ninguna persona: es una duda del grupo, no una falta de
     alguien. Vera repite el punto en el acto, y el acta le dice al gerente
     QUÉ PARTE DE SU CONTENIDO no se entiende — sesión tras sesión. */
  function marcarDuda() {
    if (!puntoEnCurso || terminada) return;
    var yaMarcado = dudas.some(function (d) {
      return d.modulo === puntoEnCurso.modulo && d.indicePunto === puntoEnCurso.indicePunto;
    });
    if (yaMarcado) {
      var previo = dudas.filter(function (d) {
        return d.modulo === puntoEnCurso.modulo && d.indicePunto === puntoEnCurso.indicePunto;
      })[0];
      previo.veces += 1;
    } else {
      dudas.push({
        modulo: puntoEnCurso.modulo,
        tituloModulo: puntoEnCurso.tituloModulo,
        indicePunto: puntoEnCurso.indicePunto,
        texto: puntoEnCurso.texto,
        veces: 1
      });
    }
    repetirPedido = true;
    $('barra-fase').textContent = 'Anotado: Vera repite este punto. Queda en el acta como duda del grupo.';
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
        // Alguien pidió que se repitiera: se repite entero, como haría
        // cualquier profesor, y sin señalar a quien preguntó.
        if (repetirPedido && !terminada) {
          repetirPedido = false;
          return window.Vera.decir('Claro, lo repito.')
            .then(function () { return decirPunto(texto); });
        }
      });
  }

  function dictado(desdeModulo) {
    fase = 'modulo';
    $('btn-pausar').classList.remove('oculto');
    $('btn-duda').classList.remove('oculto');
    var arranque = desdeModulo || 0;
    var cadena = Promise.resolve();

    contenido.modulos.forEach(function (m, i) {
      // Los módulos ya vistos se saltan, pero SÍ cuentan como dictados: el
      // asesor los escuchó, aunque haya sido ayer.
      if (i < arranque) { dictado_.modulos = Math.max(dictado_.modulos, i + 1); return; }
      cadena = cadena.then(function () {
        if (terminada) return;
        dictado_.modulos = i + 1;
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
            // Se anota qué se alcanzó a dictar: un acta de sesión cortada no
            // puede dar a entender que se vio el curso completo.
            puntoEnCurso = { modulo: i, tituloModulo: m.titulo, indicePunto: j, texto: punto };
            dictado_.puntos += 1;
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
      // En autoestudio manda el examen: es lo que decide si el asesor puede
      // salir al teléfono. La ronda final (repartir preguntas entre quienes no
      // respondieron) es para grupos, y aquí no tendría sentido.
      return autoestudio ? rondaExamen() : rondaFinal();
    }).then(function () {
      if (terminada) return;
      return rondaDescargos();
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
    // Todas las preguntas de todos los módulos, para repartirlas sin repetir
    // mientras alcancen (un módulo puede tener varias).
    var conPregunta = [];
    contenido.modulos.forEach(function (m, i) {
      (m.preguntas || []).forEach(function (q) { conPregunta.push({ m: m, i: i, q: q }); });
    });
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
        return hacerPregunta(x.m, x.i, p, 'Ronda final · ' + (idx + 1) + ' de ' + pendientes.length, x.q);
      });
    });

    return cadena;
  }

  /* El examen final del autoestudio. Todas las preguntas calificables del
     curso, en orden variado; si no alcanza la nota mínima, Vera dice qué
     repasar y se puede reintentar. Nadie sale con constancia de aprobación
     sin haberla ganado: es el punto entero del producto para este cliente. */
  function rondaExamen() {
    /* Al asesor que se registró, no a "la primera cara presente": si alguien
       pasa por detrás en el momento equivocado, presentes()[0] puede ser otra
       persona y el examen —con su constancia— se le atribuiría a quien no lo
       presentó. */
    var todas = window.Motor.personas();
    var quien = null;
    if (miNombre) {
      quien = todas.filter(function (p) { return p.nombre === miNombre; })[0] || null;
    }
    if (!quien) quien = window.Motor.presentes()[0] || todas[0];
    if (!quien) return Promise.resolve();

    var armado = window.Examen.armar(contenido);
    if (!armado.preguntas.length) {
      // Sin preguntas calificables no hay examen que valga: se dice, en vez de
      // fingir una evaluación o aprobar a alguien por defecto.
      resultadoExamen = null;
      return window.Vera.decir(
        'Este curso todavía no tiene preguntas con respuesta para calificar, así que hoy no ' +
        'te puedo tomar examen. Queda la constancia de que hiciste la capacitación, sin nota.'
      );
    }

    intentoExamen += 1;
    fase = 'examen';
    quien.respuestas = []; // el examen se califica solo con este intento
    $('btn-duda').classList.add('oculto'); // en el examen no se repite el contenido

    /* Desde aquí y hasta que calificar() entregue la nota hay un examen
       ABIERTO. Si la sesión se corta en medio, p.examen no alcanza a existir
       —mostrarActa() corre síncrono y el .then de abajo es un microtask que
       llega tarde— pero p.respuestas ya trae los aciertos parciales. Sin esta
       marca el acta los pinta como resultado completo ("2 de 2") y la
       constancia sale con "Preguntas acertadas", sin decir en ninguna parte
       que hubo examen y se abandonó. No se detecta con `fase`: hacerPregunta()
       la cambia a 'pregunta' y a 'modulo' entre pregunta y pregunta. */
    examenEnCurso = true;
    examinado = quien;
    examenPreguntasTotal = armado.preguntas.length;

    var cadena = window.Vera.decir(
      (intentoExamen === 1
        ? window.Examen.fraseAnuncio(quien.nombre, armado.preguntas.length)
        : 'Vamos con el intento número ' + intentoExamen + '. Con calma, ' + quien.nombre + '.') +
      ' Elige la respuesta tocando el botón.'
    );

    armado.preguntas.forEach(function (item, idx) {
      cadena = cadena.then(esperarSiPausada).then(function () {
        if (terminada) return;
        $('diapositiva-titulo').textContent = 'Examen final';
        $('diapositiva-puntos').innerHTML = '<li class="actual">Pregunta ' + (idx + 1) +
          ' de ' + armado.preguntas.length + '</li>';
        return hacerPregunta({ titulo: item.tituloModulo, pregunta: item.pregunta },
          item.modulo, quien, 'Examen · ' + (idx + 1) + ' de ' + armado.preguntas.length,
          item.pregunta, true);
      });
    });

    return cadena.then(function () {
      // Si se cortó, la marca examenAbandonado ya viajó en la instantánea:
      // aquí no hay nada que salvar y calificar a medias sería inventar.
      if (terminada) return;
      var res = window.Examen.calificar(quien.respuestas.map(function (r, i) {
        return { veredicto: r.veredicto, tituloModulo: armado.preguntas[i] ? armado.preguntas[i].tituloModulo : '' };
      }));
      resultadoExamen = res;
      resultadoExamen.intento = intentoExamen;
      res.intento = intentoExamen;
      quien.examen = res;
      examenEnCurso = false; // ya hay nota: el examen dejó de estar abierto
      return window.Vera.decir(window.Examen.fraseResultado(quien.nombre, res, intentoExamen))
        .then(function () {
          if (terminada || res.aprobado || intentoExamen >= window.Examen.maxIntentos) return;
          return ofrecerReintento(res);
        });
    });
  }

  /* Repaso dirigido: se vuelven a dictar SOLO los módulos que falló. Decirle
     "repasa el módulo 3" y ponerlo a examen otra vez no enseña nada; volver a
     explicárselo sí. Es exactamente lo que haría un buen capacitador y lo que
     el actual no alcanza a hacer con cada persona. */
  function redictarModulos(titulos) {
    var aRepasar = [];
    contenido.modulos.forEach(function (m, i) {
      if (titulos.indexOf(m.titulo) >= 0) aRepasar.push({ m: m, i: i });
    });
    if (!aRepasar.length) return Promise.resolve();

    fase = 'modulo';
    window.Motor.alertasActivas = true;
    $('btn-duda').classList.remove('oculto');
    var cadena = window.Vera.decir(
      'Repasamos ' + (aRepasar.length === 1 ? 'el módulo' : 'los módulos') +
      ' donde se te complicó. Con calma, que para eso estamos.'
    );

    aRepasar.forEach(function (x) {
      cadena = cadena.then(esperarSiPausada).then(function () {
        if (terminada) return;
        pintarModulo(x.m, x.i);
        var puntos = Promise.resolve();
        x.m.puntos.forEach(function (punto, j) {
          puntos = puntos.then(esperarSiPausada).then(function () {
            if (terminada) return;
            var lis = $('diapositiva-puntos').children;
            for (var k = 0; k < lis.length; k++) lis[k].classList.toggle('actual', k === j);
            puntoEnCurso = { modulo: x.i, tituloModulo: x.m.titulo, indicePunto: j, texto: punto };
            return decirPunto(punto);
          });
        });
        return puntos;
      });
    });

    return cadena.then(function () {
      window.Motor.alertasActivas = false;
      $('btn-duda').classList.add('oculto');
    });
  }

  /* Reintento: se le pregunta, no se le impone. Quien acaba de perder un examen
     tiene derecho a decir "hoy no". */
  function ofrecerReintento(res) {
    return new Promise(function (resolver) {
      var resuelto = false;
      var cerrar = function (repetir) {
        if (resuelto) return;
        resuelto = true;
        $('zona-reintento').classList.add('oculto');
        if (!repetir) { resolver(); return; }
        // Repasar primero, examinar después.
        resolver(redictarModulos(res.modulosARepasar).then(function () {
          if (terminada) return;
          return rondaExamen();
        }));
      };
      $('reintento-texto').textContent = 'Sacaste ' + res.nota + '% y el mínimo es ' + res.minimo +
        '%. Intento ' + intentoExamen + ' de ' + window.Examen.maxIntentos + '.' +
        (res.modulosARepasar.length
          ? ' Vera te vuelve a explicar: ' + res.modulosARepasar.join(', ') + '.'
          : '');
      $('btn-reintentar').textContent = res.modulosARepasar.length
        ? 'Repasar esos módulos y volver a intentar'
        : 'Volver a intentar';
      $('zona-reintento').classList.remove('oculto');
      $('btn-reintentar').onclick = function () { cerrar(true); };
      $('btn-no-reintentar').onclick = function () { cerrar(false); };
    });
  }

  /* Descargos: el acta dice "se le llamó la atención 2 veces" sobre alguien
     que nunca fue oído — y a lo mejor estaba tomando apuntes o se le cayó el
     esfero. El Código Sustantivo del Trabajo exige oír al trabajador antes de
     sancionarlo, y esta acta puede terminar en una carpeta de personal. Así
     que a quien quedó señalado se le pregunta, por su nombre, si quiere dejar
     una aclaración. Decir "prefiero no decir nada" es una respuesta válida y
     no cuenta en contra. */
  function rondaDescargos() {
    var señalados = window.Motor.presentes().filter(function (p) {
      return p.llamados > 0 || p.paraSupervisor || p.hablandoAcumMs > 45000;
    });
    if (!señalados.length) return Promise.resolve();

    fase = 'descargos';
    var cadena = window.Vera.decir(
      'Una última cosa, y es de justicia. A algunos les llamé la atención durante la sesión. ' +
      'Puede que tuvieran una buena razón y yo no la conozca: si quieren dejar una aclaración ' +
      'escrita en el acta, este es el momento.'
    );

    señalados.forEach(function (p, idx) {
      cadena = cadena.then(esperarSiPausada).then(function () {
        if (terminada) return;
        window.Vera.mirar(p.x);
        $('barra-fase').textContent = 'Descargos · ' + (idx + 1) + ' de ' + señalados.length;
        return window.Vera.decir(
          p.nombre + ', te llamé la atención ' + p.llamados +
          (p.llamados === 1 ? ' vez' : ' veces') + '. ¿Quieres aclarar algo para el acta?'
        ).then(function () {
          if (terminada) return null;
          if (modo === 'simulacion') {
            // En el demo, uno se defiende: es la escena que le muestra al
            // cliente que el acta no condena sin oír.
            var texto = idx === 0 ? 'Estaba anotando en el cuaderno lo que usted explicaba.' : null;
            if (texto) window.Simulacion.hablar(p, 1800);
            $('barra-fase').textContent = texto
              ? p.nombre + ' aclara: “' + texto + '”'
              : p.nombre + ' prefiere no decir nada.';
            return pausa(window.Vera.modoRapido ? 400 : 1600).then(function () { return texto; });
          }
          return pedirDescargo(p);
        }).then(function (texto) {
          if (terminada) return;
          if (texto && texto.trim()) {
            p.descargo = texto.trim();
            return window.Vera.decir('Queda anotado en el acta, ' + p.nombre + '. Gracias.');
          }
          return window.Vera.decir('Está bien, ' + p.nombre + '. No pasa nada.');
        }).then(function () { window.Vera.mirar(null); });
      });
    });

    return cadena;
  }

  /* Muestra las opciones y espera el clic. Devuelve el índice elegido, o -1 si
     la sesión se cortó. Sin micrófono: en un piso de cobranzas el micrófono
     abierto captaría las llamadas reales de los asesores de al lado. */
  function pedirOpcion(persona, q) {
    return new Promise(function (resolver) {
      var resuelto = false;
      var entregar = function (idx) {
        if (resuelto) return;
        resuelto = true;
        $('zona-opciones').classList.add('oculto');
        resolverOpcion = null;
        resolver(idx);
      };
      resolverOpcion = entregar;
      $('opciones-pregunta').textContent = persona.nombre + ', elige una respuesta:';
      $('opciones-lista').innerHTML = q.opciones.map(function (o, i) {
        return '<button class="opcion" data-op="' + i + '">' + escaparHtml(o.texto) + '</button>';
      }).join('');
      $('zona-opciones').classList.remove('oculto');
    });
  }

  function pedirDescargo(p) {
    return new Promise(function (resolver) {
      var resuelto = false;
      var entregar = function (texto) {
        if (resuelto) return;
        resuelto = true;
        $('zona-respuesta').classList.add('oculto');
        resolverRespuesta = null;
        window.Vera.detenerEscucha();
        resolver(texto);
      };
      resolverRespuesta = entregar;
      $('respuesta-para').textContent = 'Aclaración de ' + p.nombre + ' (opcional) — por voz o con el teclado.';
      $('respuesta-aviso').textContent = '';
      $('txt-respuesta').value = '';
      $('zona-respuesta').classList.remove('oculto');
      // En el puesto no se abre el micrófono solo (ver pedirRespuestaEnVivo).
      if (autoestudio) { $('txt-respuesta').focus(); return; }
      window.Vera.escuchar(9).then(function (oido) {
        if (resuelto) return;
        if (oido && oido.trim().length > 1) { entregar(oido.trim()); return; }
        var err = window.Vera.ultimoErrorVoz;
        if (!window.Vera.modoRapido && err !== 'aborted') {
          $('respuesta-aviso').textContent = window.Vera.explicarErrorVoz(err);
        }
      });
    });
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
      $('respuesta-para').textContent = autoestudio
        ? 'Responde con el teclado, ' + p.nombre + ' — o toca el micrófono si prefieres hablar.'
        : 'Responde ' + p.nombre + ' — por voz o con el teclado.';
      $('respuesta-aviso').textContent = '';
      $('txt-respuesta').value = '';
      $('zona-respuesta').classList.remove('oculto');
      /* En un puesto de cobranzas NO se abre el micrófono solo: captaría las
         llamadas reales de los asesores de al lado, y ese audio SÍ sale del
         computador (el reconocimiento del navegador lo procesa en servidores
         de Google o Microsoft). Serían datos de deudores de terceros saliendo
         de la empresa por una capacitación. Aquí el teclado es el camino
         principal; el micrófono, solo si el asesor lo pide con el botón. */
      if (autoestudio) { $('txt-respuesta').focus(); return; }
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

  function hacerPregunta(m, idxModulo, aQuien, rotulo, cual, esExamen) {
    if (terminada) return Promise.resolve();
    fase = 'pregunta';
    var q = cual || m.pregunta;
    if (!q) return Promise.resolve();
    var p = aQuien || elegirInterrogado();
    if (!p) return Promise.resolve();
    p.yaPreguntado = true;
    window.Vera.mirar(p.x);
    $('barra-fase').textContent = rotulo || ('Pregunta del módulo ' + (idxModulo + 1));

    // El descanso también vale en medio de una pregunta: sin esta espera, la
    // sesión seguía corriendo sola durante la pausa y podía llegar al acta.
    return esperarSiPausada()
      .then(function () {
        if (terminada) return null;
        return window.Vera.decir(p.nombre + ', pregunta para ti: ' + q.texto);
      })
      .then(function () {
        if (terminada) return null;
        // Pregunta de opción múltiple: se responde con botones, sin micrófono
        // y sin ambigüedad de calificación.
        if (q.tipo === 'opciones') {
          // Se barajan también fuera del examen: si en la práctica la correcta
          // siempre es la primera, se aprende la posición y no el contenido.
          if (!q.barajada) {
            for (var z = q.opciones.length - 1; z > 0; z--) {
              var w = Math.floor(Math.random() * (z + 1));
              var aux = q.opciones[z]; q.opciones[z] = q.opciones[w]; q.opciones[w] = aux;
            }
            q.barajada = true;
          }
          if (modo === 'simulacion') {
            // En el demo se elige una opción (la correcta salvo Jorge, que falla
            // la primera) para que la escena se vea completa.
            var elegida = q.opciones.findIndex(function (o) { return o.correcta; });
            if (p.nombreReal === 'Jorge' && idxModulo === 0) {
              elegida = q.opciones.findIndex(function (o) { return !o.correcta; });
            }
            $('barra-fase').textContent = p.nombre + ' elige: “' + q.opciones[elegida].texto + '”';
            return pausa(window.Vera.modoRapido ? 400 : 1500).then(function () { return elegida; });
          }
          return pedirOpcion(p, q);
        }
        if (modo === 'simulacion') {
          var r = window.Simulacion.responder(idxModulo, p, q);
          window.Simulacion.hablar(p, 1800);
          $('barra-fase').textContent = p.nombre + ' responde: “' + r.texto + '”';
          return pausa(window.Vera.modoRapido ? 500 : r.tardanzaMs).then(function () { return r.texto; });
        }
        return pedirRespuestaEnVivo(p);
      })
      .then(function (texto) {
        // Si el supervisor cortó la sesión mientras se esperaba la respuesta,
        // el acta ya se guardó: añadirle una respuesta aquí crearía un acta en
        // pantalla distinta de la archivada.
        if (terminada) return null;
        if (q.tipo === 'opciones') {
          var idx = typeof texto === 'number' ? texto : -1;
          var op = idx >= 0 ? q.opciones[idx] : null;
          var vd = !op ? 'sin-respuesta' : (op.correcta ? 'correcta' : 'incorrecta');
          p.respuestas.push({ modulo: m.titulo, pregunta: q.texto, veredicto: vd,
                              texto: op ? op.texto : '' });
          if (esExamen) {
            // En examen no se corrige sobre la marcha: se sabría la respuesta
            // buena para el reintento.
            return window.Vera.decir(op ? 'Anotado. Sigamos.' : 'Sin respuesta. Sigamos.');
          }
          var explica = op && op.porQue ? ' ' + op.porQue : '';
          return window.Vera.decir(!op
            ? 'No respondiste esta, ' + p.nombre + '. Sigamos.'
            : (op.correcta ? '¡Correcto, ' + p.nombre + '!' + explica
                           : 'Esa no es, ' + p.nombre + '.' + explica));
        }
        var veredicto = evaluarRespuesta(texto, q.claves);
        // Se guarda la pregunta, no solo el módulo: sin esto, "qué pregunta
        // falla todo el mundo" no se puede computar nunca, ni hacia atrás.
        p.respuestas.push({ modulo: m.titulo, pregunta: q.texto, veredicto: veredicto, texto: texto || '' });
        var modelo = q.respuestaModelo;
        var reaccion;
        // En examen NO se corrige sobre la marcha: decir la respuesta buena
        // regalaría las de un reintento, y el asesor merece saber su nota
        // completa antes de que se la expliquen.
        if (esExamen) {
          reaccion = veredicto === 'sin-respuesta'
            ? 'Sin respuesta. Sigamos.'
            : 'Anotado. Sigamos.';
        } else if (veredicto === 'correcta') {
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
        if (!terminada) fase = 'modulo';
        // Quien llegó durante una pregunta o la ronda final se anuncia aquí:
        // la cola solo se vaciaba entre puntos de módulo, así que en la ronda
        // final un rezagado quedaba mudo y sin nombre hasta el acta.
        return procesarAlertas();
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

      // Autoestudio: si el puesto queda vacío, Vera espera en vez de dictarle
      // a una silla. Seis segundos de margen para no reaccionar a que alguien
      // se agache a recoger algo.
      if (autoestudio && !pausada && !terminada &&
          (fase === 'modulo' || fase === 'pregunta' || fase === 'examen' || fase === 'descargos')) {
        var hayAlguien = window.Motor.presentes().length > 0;
        if (!hayAlguien) {
          if (!vacioDesde) vacioDesde = Date.now();
          else if (!enEspera && Date.now() - vacioDesde > 6000) entrarEnEspera();
        } else {
          vacioDesde = 0;
          if (enEspera) salirDeEspera();
        }
      }
      var personas = window.Motor.personas();
      if (fase === 'deteccion') {
        var n = window.Motor.presentes().length;
        $('barra-fase').textContent = n === 0
          ? 'No veo a nadie todavía. Ubíquense frente a la cámara.'
          : 'Veo ' + n + (n === 1 ? ' persona' : ' personas') + ' en la sala.' +
            (window.Motor.salaLlena
              ? ' ⚠ Es el máximo que alcanzo a seguir a la vez (' + window.Motor.tope +
                '): si hay más gente, no quedará en el acta.'
              : '');
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
    // Caras detectadas que nunca recibieron nombre (alguien que pasó por
    // detrás, un reflejo, un afiche) no son asistentes: no van al acta ni
    // pueden recibir constancia. Si NADIE se registró, se conservan todas
    // para no entregar un acta vacía sin explicación.
    var todas = window.Motor.personas();
    var conNombre = todas.filter(function (p) { return p.nombre; });
    var personas = conNombre.length ? conNombre : todas;
    window.Motor.detener();
    window.Vera.callar();
    window.Vera.detenerEscucha(); // que el micrófono no siga abierto en el acta

    if (!inicioSesion) inicioSesion = Date.now(); // sesión cortada antes del registro
    if (pausada) msPausados += Date.now() - pausaDesde; // se terminó estando en pausa
    $('btn-pausar').classList.add('oculto');
    $('btn-duda').classList.add('oculto');
    var duracionMin = Math.max(1, Math.round((Date.now() - inicioSesion - msPausados) / 60000));
    // Una sesión cortada antes de que llegara alguien no es evidencia de nada
    // y solo ensuciaría el historial con filas vacías.
    if (!personas.length) {
      $('acta-titulo').textContent = 'Sesión sin asistentes';
      $('acta-datos').textContent = 'La sesión se cerró antes de registrar a alguien: no se guardó nada en el historial.';
      $('tabla-acta').querySelector('tbody').innerHTML = '';
      $('acta-nota').textContent = '';
      actaEnPantalla = null;
      window.Historial.borrarBorrador();
      ir('p-acta');
      return;
    }
    var guardada = guardarActa(personas, duracionMin);
    pintarActa(sesionGuardada);
    $('aviso-acta').classList.toggle('oculto', guardada);
    ir('p-acta');
  }

  /* Pinta un acta a partir del registro guardado — no del estado vivo del
     motor. Así el acta de la sesión, la rescatada de una caída y la que se
     reabre desde el historial son literalmente la misma, y ninguna puede
     decir algo distinto de lo que se midió ese día. */
  function pintarActa(acta, aviso) {
    actaEnPantalla = acta;
    // "No se pudo guardar" es un hecho de UN acta, no un letrero pegado a la
    // pantalla: sin este borrón, un acta bien guardada del historial saldría
    // con la advertencia de otra.
    $('aviso-acta').classList.add('oculto');
    var fecha = new Date(acta.fecha);
    $('acta-titulo').textContent = 'Acta — ' + acta.titulo;
    // La marca de rescatada viaja en el acta: se ve igual el día que se
    // rescató y cualquier día que se reabra desde el historial.
    if (acta.rescatada) aviso = 'ACTA RESCATADA — la sesión se interrumpió' + (aviso ? ' · ' + aviso : '');
    $('acta-datos').textContent = (aviso ? aviso + ' · ' : '') +
      (isNaN(fecha.getTime()) ? '' :
        fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) +
        ' · ' + fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })) +
      ' · duración: ' + acta.duracionMin + ' min · modo: ' +
      (acta.modo === 'camara' ? 'sala real con cámara' : 'demostración simulada') +
      (acta.grupo ? ' · ' + acta.grupo : '');

    var filas = acta.personas.map(function (p) {
      var atencion = typeof p.atencion === 'number' ? p.atencion + '%' : '—';
      var presencia = window.Historial.textoPresencia(p);
      var marcas = (p.respuestas || []).map(function (r) {
        if (r.veredicto === 'correcta') return '✔';
        if (r.veredicto === 'incorrecta') return '✘';
        if (r.veredicto === 'respondida') return '•'; // respondió, sin calificar
        return '–';
      }).join(' ');
      var ac = window.Historial.aciertos(p);
      var respuestas = p.examen && p.examen.total
        ? '<b>' + p.examen.bien + '/' + p.examen.total + '</b> (' + p.examen.nota + '%) ' +
          (p.examen.aprobado ? '✔ aprobó' : '✘ no aprobó') +
          (p.examen.intento > 1 ? ' · intento ' + p.examen.intento : '')
        : p.examenAbandonado
          ? '<b>examen interrumpido — sin nota</b>' +
            (p.examenPreguntasTotal
              ? ' (respondió ' + (p.respuestas || []).length + ' de ' + p.examenPreguntasTotal + ')'
              : '')
        : ((p.respuestas || []).length
            ? marcas + (ac.total > 1 ? ' <b>(' + ac.bien + '/' + ac.total + ')</b>' : '')
            : 'no le tocó pregunta');
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
      // La aclaración del asistente va en la misma casilla que la observación
      // que la motivó: quien lee el acta ve la acusación y la respuesta juntas.
      if (p.descargo) {
        obs += ' · <i>Aclara: “' + escaparHtml(p.descargo) + '”</i>';
      }
      return '<tr>' +
        '<td>' + escaparHtml(p.nombre || 'Sin registrar') + '</td>' +
        '<td>' + presencia + '</td>' +
        '<td>' + atencion + '</td>' +
        '<td>' + (p.llamados || 0) + '</td>' +
        '<td>' + respuestas + '</td>' +
        '<td class="' + claseObs + '">' + obs + '</td>' +
        '</tr>';
    });
    $('tabla-acta').querySelector('tbody').innerHTML = filas.join('');
    // Lo que de verdad se alcanzó a dictar. Un acta de sesión cortada no puede
    // dar a entender que el grupo vio el curso completo.
    var cob = acta.cobertura;
    if (cob && cob.modulosTotal && cob.modulosDictados < cob.modulosTotal) {
      $('acta-datos').textContent += ' · se dictaron ' + cob.modulosDictados +
        ' de ' + cob.modulosTotal + ' módulos';
    }

    /* Las interrupciones del puesto se cuentan como HECHO del día de trabajo,
       nunca como falta: en cobranza, levantarse porque entró una llamada es
       hacer el trabajo. Por eso no llevan la palabra "llamado" ni escalan a
       "Revisar con el supervisor". */
    if (acta.formato === 'individual' && acta.interrupciones) {
      var minEspera = Math.round((acta.msEnEspera || 0) / 60000);
      $('acta-datos').textContent += ' · ' + acta.interrupciones +
        (acta.interrupciones === 1 ? ' interrupción' : ' interrupciones') +
        (minEspera >= 1 ? ' (~' + minEspera + ' min de espera, no medidos)' : '');
    }

    // Las dudas del grupo: el dato que ningún capacitador humano entrega.
    var lasDudas = acta.dudas || [];
    if (lasDudas.length) {
      $('acta-dudas').innerHTML = '<h3>Lo que el grupo pidió repetir</h3><ul>' +
        lasDudas.map(function (d) {
          return '<li><b>' + escaparHtml(d.tituloModulo) + '</b> — “' +
            escaparHtml(String(d.texto).slice(0, 120)) +
            (String(d.texto).length > 120 ? '…' : '') + '”' +
            (d.veces > 1 ? ' (' + d.veces + ' veces)' : '') + '</li>';
        }).join('') + '</ul>' +
        '<div class="pie-dudas">Son dudas del grupo, sin nombres: nadie queda señalado por preguntar. ' +
        'Si un punto se repite sesión tras sesión, el problema no es la gente — es cómo está escrito.</div>';
      $('acta-dudas').classList.remove('oculto');
    } else {
      $('acta-dudas').classList.add('oculto');
    }

    // El folio se calcula asíncrono: se añade cuando llegue, y si el navegador
    // no puede calcularlo (fuera de HTTPS) simplemente no se promete ninguno.
    window.Historial.calcularFolio(acta).then(function (folio) {
      if (folio && actaEnPantalla === acta) {
        $('acta-datos').textContent += ' · folio ' + folio;
        acta.folio = folio;
      }
    });

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
        (p.examen && p.examen.total
          ? ', examen ' + p.examen.nota + '% ' + (p.examen.aprobado ? 'APROBADO' : 'NO APROBADO')
          : p.examenAbandonado ? ', examen interrumpido (sin nota)'
          : (ac.total ? ', preguntas ' + ac.bien + '/' + ac.total : '')) + charla +
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
      dudas: dudas.slice(),
      interrupciones: interrupciones,
      msEnEspera: msEnEspera,
      formato: autoestudio ? 'individual' : 'grupo',
      cobertura: { modulosDictados: dictado_.modulos, modulosTotal: contenido.modulos.length },
      personas: personas.map(function (p) {
        return {
          nombre: p.nombre,
          atencion: p.nMuestras ? Math.round((p.sumaEma / p.nMuestras) * 100) : null,
          llamados: p.llamados,
          conversaMs: p.hablandoAcumMs || 0,
          ausenteMs: p.ausenteAcumMs || 0,
          llegoTardeMs: p.llegoTardeMs || 0,
          // Se guardan para que un acta reabierta diga exactamente lo mismo
          // que dijo el día que se generó, sin recalcular con datos que ya no existen.
          cerroAtenta: !!(p.presente && p.ema > 0.7),
          descargo: p.descargo || '',
          examen: p.examen || null,
          // Examen empezado y nunca calificado: los aciertos parciales NO son
          // una nota, y sin esta marca lo parecerían en los cuatro caminos.
          examenAbandonado: !!(examenEnCurso && p === examinado),
          examenPreguntasTotal: (examenEnCurso && p === examinado) ? examenPreguntasTotal : 0,
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
    // Si estamos EN pausa, el descanso corrido todavía no está en msPausados:
    // sin sumarlo, el acta rescatada cobraría el café como capacitación.
    var pausaCorrida = pausada ? (Date.now() - pausaDesde) : 0;
    var minutos = Math.max(1, Math.round((Date.now() - inicioSesion - msPausados - pausaCorrida) / 60000));
    var borrador = instantanea(personas, minutos);
    borrador.rescatada = true; // si se recupera, el acta nace marcada
    // Dónde iba: un curso de 40 minutos se interrumpe de verdad (una reunión,
    // el turno que empieza), y volver a empezar de cero es la forma más rápida
    // de que el asesor no lo termine nunca.
    borrador.progreso = {
      curso: window.ContenidoLib.indiceActivo(),
      tituloCurso: contenido.titulo,
      modulo: puntoEnCurso ? puntoEnCurso.modulo : 0,
      nombre: miNombre,
      individual: autoestudio
    };
    window.Historial.guardarBorrador(borrador);
  }

  function guardarActa(personas, duracionMin) {
    sesionGuardada = instantanea(personas, duracionMin);
    // Si el almacenamiento está lleno, el acta se perdería EN SILENCIO — y la
    // promesa del producto es que al final queda la evidencia. El borrador NO
    // se borra, que es el otro salvavidas; quien pinta decide qué avisar.
    var guardada = window.Historial.guardar(sesionGuardada);
    if (guardada) window.Historial.borrarBorrador();
    return guardada;
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
    // La nota del examen manda sobre el conteo suelto de preguntas.
    if (p.examen && p.examen.total) {
      datos.push({ valor: p.examen.nota + '%',
                   rotulo: 'Nota (' + p.examen.bien + ' de ' + p.examen.total + ')' });
      datos.push({ valor: p.examen.aprobado ? 'APROBADO' : 'NO APROBADO', rotulo: 'Resultado' });
    } else if (p.examenAbandonado) {
      // Ni nota ni aciertos: el examen no llegó a terminarse.
      datos.push({ valor: 'SIN NOTA', rotulo: 'El examen se interrumpió' });
    } else {
      // "Acertadas" solo sobre las preguntas que de verdad se pudieron calificar.
      if (ac.total) datos.push({ valor: ac.bien + ' de ' + ac.total, rotulo: 'Preguntas acertadas' });
      if (ac.sinCalificar) datos.push({ valor: String(ac.sinCalificar), rotulo: 'Respondidas sin calificar' });
    }

    var fecha = new Date(constanciaSesion.fecha);
    var fechaTexto = isNaN(fecha.getTime()) ? '' :
      fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

    $('constancia').innerHTML =
      // Una constancia de demostración tiene que gritarlo, no susurrarlo en el
      // pie: impresa y suelta, se confundiría con una real.
      (esDemo ? '<div class="c-sello-demo">DEMOSTRACIÓN · SIN VALIDEZ</div>' : '') +
      (constanciaSesion.rescatada
        ? '<div class="c-sello-demo c-sello-aviso">SESIÓN INTERRUMPIDA · ACTA RESCATADA</div>' : '') +
      // Quien no aprobó NO recibe un papel que parezca diploma: recibe una
      // constancia de asistencia, que es lo único cierto.
      (p.examenAbandonado
        ? '<div class="c-sello-demo c-sello-aviso">EXAMEN INTERRUMPIDO — CONSTANCIA DE ASISTENCIA</div>'
        : (p.examen && p.examen.total && !p.examen.aprobado
          ? '<div class="c-sello-demo c-sello-aviso">NO APROBÓ EL EXAMEN — CONSTANCIA DE ASISTENCIA</div>'
          : '')) +
      '<div class="c-marca">VERA · CAPACITADORA VIRTUAL</div>' +
      '<h1>' + ((p.examenAbandonado || (p.examen && p.examen.total && !p.examen.aprobado))
        ? 'Constancia de asistencia' : 'Constancia de capacitación') + '</h1>' +
      '<div class="c-linea"></div>' +
      '<div class="c-texto">Se deja constancia de que</div>' +
      '<div class="c-nombre">' + escaparHtml(p.nombre || 'Sin registrar') + '</div>' +
      '<div class="c-texto">' + (p.examen && p.examen.total
        ? (p.examen.aprobado ? 'asistió y APROBÓ la capacitación' : 'asistió a la capacitación')
        : 'asistió a la capacitación') + '</div>' +
      '<div class="c-curso">“' + escaparHtml(constanciaSesion.titulo) + '”' + '</div>' +
      '<div class="c-texto">dictada el ' + fechaTexto +
        (constanciaSesion.grupo ? ' · ' + escaparHtml(constanciaSesion.grupo) : '') + '</div>' +
      // No se puede certificar una sesión entera a quien entró a la mitad.
      (p.llegoTardeMs > 60000
        ? '<div class="c-texto"><b>Se incorporó ~' + Math.round(p.llegoTardeMs / 60000) +
          ' min después de iniciada la sesión.</b></div>'
        : '') +
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
        (constanciaSesion.folio
          ? '<br>Folio del acta: <b>' + constanciaSesion.folio + '</b> — identifica esta acta y permite ' +
            'comprobar que corresponde al registro guardado. No es una firma digital.'
          : '') +
      '</div>';
  }

  function abrirConstancias(sesion) {
    if (!sesion || !sesion.personas.length) return;
    constanciaSesion = sesion;
    constanciaIndice = 0;
    pintarConstancia();
    if (!sesion.folio) {
      window.Historial.calcularFolio(sesion).then(function (folio) {
        if (!folio) return;
        sesion.folio = folio;
        if (constanciaSesion === sesion) pintarConstancia();
      });
    }
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

    /* Continuar donde iba: retomar es lo que hace posible un curso de 40
       minutos en un piso de cobranzas, donde la sesión se interrumpe de
       verdad. Solo se ofrece cuando el borrador trae progreso individual: en
       grupo no tiene sentido "retomar" con otra gente en la sala. */
    var prog = borrador.progreso;
    if (prog && prog.individual && prog.modulo > 0) {
      $('btn-continuar').classList.remove('oculto');
      $('rescate-texto').textContent = (prog.nombre ? prog.nombre + ', quedó' : 'Quedó') +
        ' a medias la capacitación “' + prog.tituloCurso + '” (' + cuando +
        '), en el módulo ' + (prog.modulo + 1) + '.';
      $('btn-continuar').addEventListener('click', function () {
        // El acta a medias se archiva antes de empezar la nueva: es evidencia
        // de lo que sí se alcanzó, y el borrador se va a sobrescribir.
        var previa = window.Historial.leerBorrador();
        if (previa) {
          previa.id = 's' + Date.now();
          previa.rescatada = true;
          if (window.Historial.guardar(previa)) window.Historial.borrarBorrador();
        }
        $('aviso-rescate').classList.add('oculto');
        window.ContenidoLib.elegir(prog.curso);
        pintarResumen();
        $('txt-mi-nombre').value = prog.nombre || '';
        moduloDeArranque = prog.modulo;
        ir('p-consentimiento');
      });
    }

    $('btn-rescatar').addEventListener('click', function () {
      var acta = window.Historial.leerBorrador();
      if (!acta) return;
      acta.id = 's' + Date.now(); // id propio: es un acta nueva en el historial
      acta.rescatada = true;      // la marca viaja con el acta, no solo en pantalla
      // El borrador es la ÚNICA copia de esta acta: su sesión ya se cayó una
      // vez. Si el historial no la admite, borrarlo la perdería para siempre.
      // Se conserva, se muestra igual y se ofrece descargarla.
      var guardada = window.Historial.guardar(acta);
      if (guardada) {
        window.Historial.borrarBorrador();
        $('aviso-rescate').classList.add('oculto');
      }
      sesionGuardada = acta;
      fase = 'acta';
      pintarActa(acta, guardada ? null : 'NO quedó guardada en el historial');
      $('aviso-acta').classList.toggle('oculto', guardada);
      ir('p-acta');
    });
    $('btn-descartar-rescate').addEventListener('click', function () {
      window.Historial.borrarBorrador();
      $('aviso-rescate').classList.add('oculto');
    });
  }

  /* Lo primero que ve el supervisor al abrir la app: a quién se le venció la
     capacitación. Sin esto la plataforma se queda muda después de capacitar a
     todo el mundo, que es justo cuando el cliente se pregunta para qué paga. */
  function pintarAvisoRecertificacion() {
    var pendientes = window.Historial.recertificaciones().filter(function (r) {
      return r.estado !== 'al-dia';
    });
    if (!pendientes.length) {
      $('aviso-recertificar').classList.add('oculto');
      return;
    }
    var vencidas = pendientes.filter(function (r) { return r.estado === 'vencido'; }).length;
    var porVencer = pendientes.length - vencidas;
    var partes = [];
    if (vencidas) partes.push(vencidas + (vencidas === 1 ? ' capacitación vencida' : ' capacitaciones vencidas'));
    if (porVencer) partes.push(porVencer + (porVencer === 1 ? ' por vencer' : ' por vencer'));
    $('recertificar-texto').textContent = '⏰ Hay ' + partes.join(' y ') +
      ' (vigencia: ' + window.Historial.vigenciaMeses() + ' meses).';
    $('aviso-recertificar').classList.remove('oculto');
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
            var sesionCompleta = window.Historial.buscarSesion(s.id);
            var etiqueta = sesionCompleta && sesionCompleta.modo !== 'camara'
              ? ' <span class="etiqueta-demo">demostración</span>' : '';
            return '<div class="registro-linea">' +
              '<span><b>' + escaparHtml(s.titulo) + '</b>' + etiqueta +
              ' — ' + window.Historial.fechaLegible(s.fecha) + '</span>' +
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

    if (vistaHistorial === 'resultados') {
      var r = window.Historial.resumenPiloto();
      if (!r.sesiones) {
        cuerpo.innerHTML = '<div class="vacio-historial">Todavía no hay capacitaciones reales.<br>' +
          'Aquí van a salir los números del piloto: cuánta gente pasó, cuántas horas se dictaron ' +
          'y cómo les fue en el examen. Las demostraciones no cuentan.</div>';
        return;
      }
      var cifras = [
        { valor: r.personas, rotulo: r.personas === 1 ? 'persona capacitada' : 'personas capacitadas' },
        { valor: r.horas + ' h', rotulo: 'dictadas sin capacitador humano presente', destacada: true },
        { valor: r.sesiones, rotulo: (r.sesiones === 1 ? 'sesión' : 'sesiones') +
            (r.individuales ? ' (' + r.individuales + ' individuales)' : '') },
        { valor: r.minutosPromedio + ' min', rotulo: 'dura en promedio una capacitación' }
      ];
      if (r.conExamen) {
        cifras.push({ valor: r.tasaAprobacion + '%', rotulo: 'aprobó el examen (' + r.aprobados +
          ' de ' + r.conExamen + ' que lo presentaron)', destacada: true });
        cifras.push({ valor: r.tasaPrimerIntento + '%', rotulo: 'aprobó al primer intento' });
      }
      cuerpo.innerHTML = '<div class="cifras">' + cifras.map(function (c) {
        return '<div class="cifra' + (c.destacada ? ' destacada' : '') + '">' +
          '<div class="valor">' + c.valor + '</div>' +
          '<div class="rotulo">' + c.rotulo + '</div></div>';
      }).join('') + '</div>' +
      '<p class="letra-menuda">' +
        'Las horas dictadas son el número que responde “¿esto sirvió?”: es tiempo de ' +
        'capacitación entregado sin que un capacitador estuviera ahí. ' +
        (r.conExamen
          ? 'La aprobación se calcula solo sobre quienes presentaron examen — sacarla sobre todos la inflaría. '
          : 'Todavía nadie ha presentado examen: por eso no hay tasa de aprobación. ') +
        (r.interrupciones ? 'Hubo ' + r.interrupciones + ' interrupciones de puesto, que no son faltas. ' : '') +
        'Para llevar esto a una reunión, exporta el CSV: trae el detalle por persona.' +
      '</p>';
      return;
    }

    if (vistaHistorial === 'dudas') {
      var panorama = window.Historial.panoramaDudas(incluirDemos).filter(function (c) {
        return !filtro || c.curso.toLowerCase().indexOf(filtro) >= 0;
      });
      if (!panorama.length) {
        cuerpo.innerHTML = '<div class="vacio-historial">' + (filtro
          ? 'Ningún curso coincide con esa búsqueda.'
          : 'Todavía nadie ha pedido repetir nada.<br>' +
            'Durante la capacitación, el botón “🙋 No entendí” anota el punto ' +
            'sin nombres. Aquí se ve qué partes del contenido se piden más.') + '</div>';
        return;
      }
      cuerpo.innerHTML = panorama.map(function (c) {
        return '<div class="registro">' +
          '<div class="registro-cabeza">' +
            '<span class="registro-nombre">' + escaparHtml(c.curso) + '</span>' +
            '<span class="registro-meta">' + c.sesiones +
              (c.sesiones === 1 ? ' sesión dictada' : ' sesiones dictadas') + '</span>' +
          '</div>' +
          '<div class="registro-lista">' + c.puntos.map(function (pt) {
            var proporcion = pt.sesiones + ' de ' + c.sesiones;
            var alerta = c.sesiones >= 2 && pt.sesiones >= Math.ceil(c.sesiones / 2);
            return '<div class="registro-linea">' +
              '<span><b>' + escaparHtml(pt.tituloModulo) + '</b> — “' +
                escaparHtml(String(pt.texto).slice(0, 110)) +
                (String(pt.texto).length > 110 ? '…' : '') + '”</span>' +
              '<span class="etiqueta-demo' + (alerta ? ' etiqueta-por-vencer' : '') + '">' +
                'pedido en ' + proporcion + '</span>' +
              '</div>';
          }).join('') + '</div>' +
          '</div>';
      }).join('') +
      '<p class="letra-menuda">Un punto que se pide en la mitad de las sesiones o más no es problema de la gente: ' +
      'está mal explicado. Vale la pena reescribirlo en “Editar contenido”.</p>';
      return;
    }

    if (vistaHistorial === 'vigencia') {
      var meses = window.Historial.vigenciaMeses();
      var lista = window.Historial.recertificaciones().filter(function (r) {
        return !filtro || r.nombre.toLowerCase().indexOf(filtro) >= 0 ||
          r.curso.toLowerCase().indexOf(filtro) >= 0;
      });
      var encabezado = '<div class="fila-buscar"><label class="chk-inline">' +
        'Una capacitación vale por <input type="number" id="txt-vigencia" min="1" max="120" value="' + meses +
        '" style="width:70px"> meses</label>' +
        '<span class="registro-meta">Se cuenta desde la última vez que cada persona tomó ese curso. ' +
        'Solo cuentan las sesiones con cámara.</span></div>';
      if (!lista.length) {
        cuerpo.innerHTML = encabezado + '<div class="vacio-historial">' + (filtro
          ? 'Nadie coincide con esa búsqueda.'
          : 'Todavía no hay capacitaciones reales registradas.<br>' +
            'Las sesiones con cámara aparecen aquí con su fecha de vencimiento.') + '</div>';
        return;
      }
      var rotulo = { 'vencido': 'VENCIDA', 'por-vencer': 'POR VENCER', 'al-dia': 'al día' };
      cuerpo.innerHTML = encabezado + lista.map(function (r) {
        var cuando = r.diasRestantes < 0
          ? 'venció hace ' + Math.abs(r.diasRestantes) + (Math.abs(r.diasRestantes) === 1 ? ' día' : ' días')
          : 'vence en ' + r.diasRestantes + (r.diasRestantes === 1 ? ' día' : ' días');
        return '<div class="registro">' +
          '<div class="registro-cabeza">' +
            '<span class="registro-nombre">' + escaparHtml(r.nombre) +
              ' <span class="etiqueta-demo etiqueta-' + r.estado + '">' + rotulo[r.estado] + '</span></span>' +
            '<span class="registro-meta">' + cuando + '</span>' +
          '</div>' +
          '<div class="registro-linea"><span>' + escaparHtml(r.curso) +
            ' — última vez el ' + window.Historial.fechaLegible(r.ultima) + '</span></div>' +
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
    /* Los tres pintados de arranque corren ANTES del cableado. Si uno lanza,
       el resto del handler no se ejecuta y la app queda sin UN SOLO escucha:
       ningún botón responde y no hay forma de llegar al historial a borrar el
       dato que la tumbó. Y el dato puede venir de fuera (un respaldo hecho en
       otro computador), así que cada pintado falla por su cuenta. */
    try {
      pintarSelectorNombre();
    } catch (e) { /* sin lista se escribe el nombre a mano */ }
    try {
      pintarResumen();
    } catch (e) {
      $('inicio-resumen').textContent =
        'No se pudo leer el contenido guardado. Revíselo en “Editar contenido”.';
      $('btn-comenzar').disabled = true;
    }
    try {
      ofrecerRescate();
    } catch (e) {
      $('aviso-rescate').classList.add('oculto');
    }
    try {
      pintarAvisoRecertificacion();
    } catch (e) {
      // Si el historial no se pudo leer, no se puede afirmar "hay N vencidas":
      // se dice lo que pasa y se quita el botón que no llevaría a ninguna parte.
      $('recertificar-texto').textContent =
        '⚠ No se pudo leer el historial de este navegador: puede estar dañado o venir de ' +
        'un respaldo con datos extraños. Ábralo en “Historial y constancias”; si sigue ' +
        'igual, restaure un respaldo bueno.';
      $('btn-ver-recertificar').classList.add('oculto');
      $('aviso-recertificar').classList.remove('oculto');
    }

    $('btn-comenzar').addEventListener('click', function () { ir('p-consentimiento'); });

    $('sel-curso').addEventListener('change', function (ev) {
      window.ContenidoLib.elegir(parseInt(ev.target.value, 10));
      pintarResumen();
    });

    $('chk-consentimiento').addEventListener('change', function (ev) {
      $('btn-modo-camara').disabled = !ev.target.checked;
      $('btn-modo-sim').disabled = !ev.target.checked;
      $('btn-modo-solo').disabled = !ev.target.checked;
    });
    $('btn-volver-inicio').addEventListener('click', function () { ir('p-inicio'); });

    // El modo autoestudio exige el nombre: la constancia es de alguien.
    $('btn-modo-solo').addEventListener('click', function () {
      if (!nombreElegido()) {
        var sel = $('sel-mi-nombre');
        var usandoLista = !sel.classList.contains('oculto');
        (usandoLista ? sel : $('txt-mi-nombre')).focus();
        $('resultado-voz').textContent = usandoLista
          ? 'Elige tu nombre de la lista para poder emitir tu constancia.'
          : 'Escribe tu nombre para poder emitir tu constancia.';
        return;
      }
      iniciarSesion('solo');
    });

    // "No estoy en la lista": se permite escribirlo, pero se avisa — un nombre
    // fuera de la lista crea una ficha nueva en el historial.
    $('sel-mi-nombre').addEventListener('change', function (ev) {
      if (ev.target.value === '__otro__') {
        $('txt-mi-nombre').classList.remove('oculto');
        $('txt-mi-nombre').focus();
        $('resultado-voz').textContent = 'Escríbelo completo, igual que aparece en la nómina: ' +
          'si lo escribes distinto, tus capacitaciones quedan en dos fichas separadas.';
      } else {
        $('txt-mi-nombre').classList.add('oculto');
        $('resultado-voz').textContent = '';
      }
    });
    $('txt-mi-nombre').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && !$('btn-modo-solo').disabled) $('btn-modo-solo').click();
    });
    $('btn-modo-camara').addEventListener('click', function () { iniciarSesion('camara'); });
    $('btn-modo-sim').addEventListener('click', function () { iniciarSesion('simulacion'); });

    /* Probar la voz antes de tener el grupo sentado. Es la falla que tumba un
       demo delante del cliente: sin voz en español Vera lee con acento inglés,
       y sin síntesis queda muda con subtítulos — hoy, sin avisar. */
    $('btn-probar-voz').addEventListener('click', function () {
      var res = $('resultado-voz');
      var d = window.Vera.revisarVoz();
      res.textContent = d.mensaje;
      res.style.color = d.estado === 'mal' ? 'var(--rojo)'
                      : d.estado === 'bien' ? 'var(--verde)' : 'var(--ambar)';
      if (d.estado === 'bien') {
        window.Vera.decir('Hola, soy Vera. Si me escuchan bien al fondo de la sala, ya podemos empezar.');
      }
    });

    var velocidadGuardada = null;
    try { velocidadGuardada = localStorage.getItem('vera.velocidad'); } catch (e) {}
    if (velocidadGuardada) {
      window.Vera.velocidad = parseFloat(velocidadGuardada);
      $('sel-velocidad').value = velocidadGuardada;
    }
    $('sel-velocidad').addEventListener('change', function (ev) {
      window.Vera.velocidad = parseFloat(ev.target.value);
      try { localStorage.setItem('vera.velocidad', ev.target.value); } catch (e) {}
      window.Vera.callar();
      window.Vera.decir('Esta es mi velocidad de voz.');
    });

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
    $('opciones-lista').addEventListener('click', function (ev) {
      var boton = ev.target.closest('[data-op]');
      if (!boton || !resolverOpcion) return;
      boton.classList.add('elegida');
      // Se deshabilitan todas: un segundo clic cambiaría la respuesta después
      // de haberla entregado.
      $('opciones-lista').querySelectorAll('button').forEach(function (b) { b.disabled = true; });
      var r = resolverOpcion;
      resolverOpcion = null;
      r(parseInt(boton.dataset.op, 10));
    });
    $('btn-duda').addEventListener('click', marcarDuda);

    // Proyectar la pantalla en la sala no puede significar exhibir el
    // porcentaje de atención de cada quien delante de sus compañeros.
    $('btn-tablero').addEventListener('click', function () {
      var sala = document.querySelector('.sala');
      var oculto = sala.classList.toggle('sin-tablero');
      $('btn-tablero').textContent = oculto ? '👁 Mostrar tablero' : '🙈 Ocultar tablero';
    });

    // Cortar la sesión y entregar el acta con lo acumulado: en una empresa
    // real las capacitaciones se interrumpen, y perder lo medido no es opción.
    $('btn-terminar').addEventListener('click', function () {
      if (fase === 'inicio' || fase === 'acta') return;
      terminada = true;
      window.Vera.callar();
      if (resolverNombre) { var rn = resolverNombre; resolverNombre = null; rn(''); }
      if (resolverRespuesta) { var rr = resolverRespuesta; resolverRespuesta = null; rr(null); }
      if (resolverOpcion) { var ro = resolverOpcion; resolverOpcion = null; ro(-1); }
      $('zona-opciones').classList.add('oculto');
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
    $('btn-descargar-acta').addEventListener('click', function () {
      if (actaEnPantalla) window.Historial.descargarActa(actaEnPantalla);
    });
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
    $('btn-cerrar-historial').addEventListener('click', function () {
      pintarAvisoRecertificacion(); // pudo cambiar la vigencia estando adentro
      ir('p-inicio');
    });
    $('btn-ver-recertificar').addEventListener('click', function () {
      vistaHistorial = 'vigencia';
      document.querySelectorAll('.pestana').forEach(function (b) {
        b.classList.toggle('activa', b.dataset.vista === 'vigencia');
      });
      pintarHistorial();
      ir('p-historial');
    });
    $('txt-buscar').addEventListener('input', pintarHistorial);
    // El campo de vigencia se recrea en cada repintado: se escucha por delegación.
    $('historial-cuerpo').addEventListener('change', function (ev) {
      if (ev.target && ev.target.id === 'txt-vigencia') {
        window.Historial.fijarVigencia(ev.target.value);
        pintarHistorial();
        pintarAvisoRecertificacion();
      }
    });
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

    $('txt-nomina').value = window.Historial.nominaTexto();
    $('btn-guardar-nomina').addEventListener('click', function () {
      window.Historial.guardarNomina($('txt-nomina').value);
      pintarSelectorNombre();
      var n = window.Historial.nomina().length;
      $('btn-guardar-nomina').textContent = n
        ? 'Guardada: ' + n + (n === 1 ? ' persona' : ' personas')
        : 'Lista vacía: se escribirá el nombre a mano';
      setTimeout(function () { $('btn-guardar-nomina').textContent = 'Guardar la lista'; }, 2500);
    });

    $('btn-csv').addEventListener('click', function () {
      var soloReales = !$('chk-incluir-demos').checked;
      // Se cuenta lo que SE VA A EXPORTAR, no todo: con el historial lleno de
      // demostraciones se descargaba un archivo con solo los encabezados.
      var cuantas = window.Historial.listar().filter(function (s) {
        return !soloReales || s.modo === 'camara';
      }).length;
      if (!cuantas) {
        alert(soloReales
          ? 'No hay capacitaciones reales que exportar. Marque "Incluir demostraciones" si quiere exportar las de prueba.'
          : 'Todavía no hay capacitaciones que exportar.');
        return;
      }
      window.Historial.descargarCsv(soloReales);
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
          ? 'Respaldo restaurado: ' + r.nuevas + (r.nuevas === 1 ? ' sesión nueva' : ' sesiones nuevas') +
            (r.repetidas ? ' (' + r.repetidas + (r.repetidas === 1 ? ' ya estaba' : ' ya estaban') + ')' : '') + '.'
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
      // Exportar NO guarda: sería un "Guardar" encubierto que dejaría sin
      // efecto a "Cerrar sin guardar". Lo que está en el editor se incluye en
      // el archivo, pero no se escribe en el almacenamiento.
      var paquete = JSON.parse(window.ContenidoLib.exportar());
      paquete.cursos[window.ContenidoLib.claveActiva()] = $('txt-contenido').value;
      var blob = new Blob([JSON.stringify(paquete, null, 1)], { type: 'application/json;charset=utf-8' });
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
          alert(r.cambiados === 1 ? 'Se importó 1 curso.' : 'Se importaron ' + r.cambiados + ' cursos.');
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
