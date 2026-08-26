/* Motor de atención: la parte de Vera que "ve".
   En modo cámara usa MediaPipe Face Landmarker corriendo EN el navegador:
   el video nunca sale del computador (eso es lo que hace defendible el producto
   ante la Ley 1581) y no cuesta un peso por sesión. En modo simulación consume
   la sala dibujada de simulacion.js con la MISMA lógica de estados y alertas,
   así el demo prueba exactamente el código que corre en una sala real. */

(function () {
  'use strict';

  var CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  var MODELO = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

  // Umbrales de "está mirando": salen de probar frente a una cámara real.
  // Con calibración por persona (se toma en el registro, cuando cada uno mira
  // a la cámara para decir su nombre) toleramos más variación individual.
  var UMBRAL_GIRO_SIN_CAL = 0.40;
  var UMBRAL_GIRO = 0.35;
  var UMBRAL_CABECEO = 0.30;
  var OJOS_CERRADOS_MS = 1500;
  var AUSENTE_TRAS_MS = 2500;
  var ALERTA_EMA = 0.45;
  var ENFRIAMIENTO_ALERTA_MS = 45000;
  var ALFA_EMA = 0.08; // a 10 muestras/s, la media reacciona en ~1-2 segundos

  var modo = null;            // 'camara' | 'simulacion'
  var personas = [];
  var siguienteId = 1;
  var temporizador = null;
  var landmarker = null;
  var video = null;
  var overlay = null;
  var ctxOverlay = null;
  var ultimaDeteccion = [];   // caras crudas del último frame, para el registro

  window.Motor = {
    alertasActivas: false,    // la app la enciende solo mientras se dicta un módulo
    bloquearNuevas: false,    // tras el registro, una cara nueva es "Invitado"
    alAlerta: null,           // callback(persona, motivo)

    get modo() { return modo; },
    personas: function () { return personas.slice(); },
    presentes: function () {
      return personas.filter(function (p) { return p.presente; });
    },

    iniciarSimulacion: function (canvasSim) {
      modo = 'simulacion';
      var simPersonas = window.Simulacion.iniciar(canvasSim);
      personas = simPersonas.map(function (p) { return prepararPersona(p); });
      arrancarBucle();
      return { ok: true };
    },

    iniciarCamara: function (videoEl, overlayEl) {
      // Fuera de HTTPS/localhost mediaDevices ni existe y el acceso lanzaría
      // un TypeError síncrono que se saltaría todo el manejo de errores.
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return Promise.resolve({
          ok: false,
          error: 'La cámara solo funciona por HTTPS o abriendo la app en este mismo computador (localhost). Use el modo demostración.'
        });
      }
      modo = 'camara';
      video = videoEl;
      overlay = overlayEl;
      ctxOverlay = overlay.getContext('2d');
      personas = [];

      // Cámara y micrófono se piden JUNTOS: un solo aviso del navegador, y el
      // reconocimiento de voz ya no vuelve a preguntar a mitad del registro.
      // El audio se apaga de inmediato: solo se quería el permiso.
      var restriccionesVideo = { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };
      return navigator.mediaDevices.getUserMedia({ video: restriccionesVideo, audio: true })
        .catch(function (err) {
          // Equipos sin micrófono tumban la petición combinada: se reintenta solo video.
          if (err && (err.name === 'NotFoundError' || err.name === 'OverconstrainedError')) {
            return navigator.mediaDevices.getUserMedia({ video: restriccionesVideo, audio: false });
          }
          throw err;
        })
        .then(function (flujo) {
        flujo.getAudioTracks().forEach(function (t) { t.stop(); });
        video.srcObject = flujo;
        return video.play();
      }).then(function () {
        overlay.width = video.videoWidth || 1280;
        overlay.height = video.videoHeight || 720;
        return cargarLandmarker();
      }).then(function () {
        arrancarBucle();
        return { ok: true };
      }).catch(function (err) {
        detenerTodo();
        return { ok: false, error: mensajeDeError(err) };
      });
    },

    /* Guarda la postura actual como "mirando al frente" de esa persona.
       Se llama en el registro, justo cuando la persona habla con Vera. */
    calibrar: function (persona) {
      if (modo !== 'camara') return;
      if (typeof persona.giroCrudo === 'number') {
        persona.base = { giro: persona.giroCrudo, cabeceo: persona.cabeceoCrudo };
      }
    },

    /* La app confirma que el llamado de atención se dijo en voz alta. */
    registrarLlamado: function (persona) {
      persona.llamados += 1;
      persona.ema = 0.9; // borrón y cuenta nueva: que no se dispare otra vez de inmediato
      persona.ultimaAlertaMs = Date.now();
      if (persona.llamados >= 3) persona.paraSupervisor = true;
      if (modo === 'simulacion') window.Simulacion.alLlamado(persona);
    },

    marcador: function (id) {
      if (modo === 'simulacion') window.Simulacion.marcador(id);
    },

    detener: detenerTodo
  };

  // ── Preparación común ───────────────────────────────────
  function prepararPersona(base) {
    base.nombre = base.nombre || '';
    base.presente = base.presente !== false;
    base.ema = 1;
    base.sumaEma = 0;
    base.nMuestras = 0;
    base.llamados = 0;
    base.paraSupervisor = false;
    base.ultimaAlertaMs = 0;
    base.ausenteDesdeMs = 0;
    base.ausenteAcumMs = 0;
    base.ausenteAvisado = false;
    base.ojosCerradosDesdeMs = 0;
    base.respuestas = [];
    base.yaPreguntado = false;
    base.estado = base.estadoVisual || 'atento';
    return base;
  }

  function arrancarBucle() {
    clearInterval(temporizador);
    var ultimo = Date.now();
    temporizador = setInterval(function () {
      var ahora = Date.now();
      var dt = ahora - ultimo;
      ultimo = ahora;
      if (modo === 'camara') {
        pasoCamara();
      } else if (modo === 'simulacion') {
        window.Simulacion.tick();
        for (var i = 0; i < personas.length; i++) {
          personas[i].estado = personas[i].presente ? personas[i].estadoVisual : 'ausente';
          personas[i].atento = !!personas[i].atentoAhora && personas[i].presente;
        }
      }
      pasoComun(ahora, dt);
    }, 100);
  }

  function pasoComun(ahora, dt) {
    for (var i = 0; i < personas.length; i++) {
      var p = personas[i];

      if (!p.presente) {
        p.ausenteAcumMs += dt;
        p.estado = 'ausente';
        p.atento = false;
      }

      p.ema = p.ema + ALFA_EMA * ((p.atento ? 1 : 0) - p.ema);

      if (p.presente) p.ausenteAvisado = false;

      if (window.Motor.alertasActivas) {
        p.sumaEma += p.ema;
        p.nMuestras += 1;

        var enfriado = (ahora - p.ultimaAlertaMs) > ENFRIAMIENTO_ALERTA_MS;
        // Solo se alerta a quien SIGUE sin atender: si ya volvió a mirar,
        // dejar que la media se recupere sola en vez de regañar tarde.
        if (p.ema < ALERTA_EMA && !p.atento && enfriado && typeof window.Motor.alAlerta === 'function') {
          var motivo = p.estado === 'ausente' ? 'ausente'
                     : p.estado === 'ojos-cerrados' ? 'ojos-cerrados'
                     : 'distraido';
          // La ausencia se anuncia UNA vez por salida: repetir el mismo aviso
          // cada 45 s inflaría los llamados hasta "revisar con supervisor".
          if (motivo === 'ausente' && p.ausenteAvisado) continue;
          if (motivo === 'ausente') p.ausenteAvisado = true;
          p.ultimaAlertaMs = ahora; // se marca ya, para no disparar en ráfaga
          window.Motor.alAlerta(p, motivo);
        }
      }
    }
  }

  // ── Modo cámara ─────────────────────────────────────────
  function cargarLandmarker() {
    return import(CDN + '/vision_bundle.mjs').then(function (vision) {
      return vision.FilesetResolver.forVisionTasks(CDN + '/wasm').then(function (fileset) {
        var crear = function (delegado) {
          return vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODELO, delegate: delegado },
            runningMode: 'VIDEO',
            numFaces: 8,
            outputFaceBlendshapes: true
          });
        };
        // Algunas tarjetas de video viejas fallan con GPU: se reintenta con CPU.
        return crear('GPU').catch(function () { return crear('CPU'); });
      });
    }).then(function (lm) {
      landmarker = lm;
    });
  }

  function pasoCamara() {
    if (!landmarker || !video || video.readyState < 2) return;

    var resultado;
    try {
      resultado = landmarker.detectForVideo(video, performance.now());
    } catch (e) {
      return; // un frame malo no tumba la sesión
    }

    var caras = [];
    var landmarks = resultado.faceLandmarks || [];
    var formas = resultado.faceBlendshapes || [];

    for (var i = 0; i < landmarks.length; i++) {
      var lm = landmarks[i];
      var ojoIzqExt = lm[33], ojoIzqInt = lm[133], ojoDerInt = lm[362], ojoDerExt = lm[263], nariz = lm[1];
      if (!ojoIzqExt || !ojoDerExt || !nariz) continue;

      var iod = Math.hypot(ojoDerExt.x - ojoIzqExt.x, ojoDerExt.y - ojoIzqExt.y) || 0.001;
      var ojosX = (ojoIzqExt.x + ojoIzqInt.x + ojoDerInt.x + ojoDerExt.x) / 4;
      var ojosY = (ojoIzqExt.y + ojoIzqInt.y + ojoDerInt.y + ojoDerExt.y) / 4;

      var minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (var j = 0; j < lm.length; j += 8) { // cada 8 puntos alcanza para la caja
        if (lm[j].x < minX) minX = lm[j].x;
        if (lm[j].x > maxX) maxX = lm[j].x;
        if (lm[j].y < minY) minY = lm[j].y;
        if (lm[j].y > maxY) maxY = lm[j].y;
      }

      var parpadeo = 0;
      var cats = formas[i] && formas[i].categories ? formas[i].categories : [];
      var nCats = 0;
      for (var k = 0; k < cats.length; k++) {
        if (cats[k].categoryName === 'eyeBlinkLeft' || cats[k].categoryName === 'eyeBlinkRight') {
          parpadeo += cats[k].score;
          nCats++;
        }
      }
      if (nCats) parpadeo /= nCats;

      caras.push({
        // El video se ve en espejo; aquí se espeja la coordenada para que
        // "izquierda en pantalla" signifique lo mismo en todos lados.
        cx: 1 - (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        caja: { x: 1 - maxX, y: minY, w: maxX - minX, h: maxY - minY },
        giro: (nariz.x - ojosX) / iod,
        cabeceo: (nariz.y - ojosY) / iod,
        parpadeo: parpadeo
      });
    }
    ultimaDeteccion = caras;

    emparejarCaras(caras);
    dibujarOverlay();
  }

  /* Cada cara detectada se asigna a la persona conocida más cercana. La gente
     sentada casi no se mueve, así que la cercanía entre frames identifica bien. */
  function emparejarCaras(caras) {
    var ahora = Date.now();
    var usadas = {};

    for (var i = 0; i < personas.length; i++) {
      var p = personas[i];
      var mejor = -1, mejorDist = 0.18;
      for (var c = 0; c < caras.length; c++) {
        if (usadas[c]) continue;
        var d = Math.hypot(caras[c].cx - p.x, caras[c].cy - p.y);
        if (d < mejorDist) { mejorDist = d; mejor = c; }
      }
      if (mejor >= 0) {
        usadas[mejor] = true;
        actualizarConCara(p, caras[mejor], ahora);
      } else if (p.presente && !p.perdidaDesde) {
        p.perdidaDesde = ahora;
      } else if (p.presente && ahora - p.perdidaDesde > AUSENTE_TRAS_MS) {
        p.presente = false;
      }
    }

    for (var c2 = 0; c2 < caras.length; c2++) {
      if (usadas[c2]) continue;
      var cara = caras[c2];
      // ¿Volvió alguien que estaba ausente? Se le devuelve su puesto y su nombre.
      var ausente = null, distA = 0.35;
      for (var a = 0; a < personas.length; a++) {
        if (personas[a].presente) continue;
        var da = Math.hypot(cara.cx - personas[a].x, cara.cy - personas[a].y);
        if (da < distA) { distA = da; ausente = personas[a]; }
      }
      // Si hay UN solo ausente, la cara nueva casi seguro es él aunque haya
      // vuelto a sentarse en otro puesto: readoptarlo evita duplicar la fila.
      if (!ausente && window.Motor.bloquearNuevas) {
        var ausentes = personas.filter(function (q) { return !q.presente; });
        if (ausentes.length === 1) ausente = ausentes[0];
      }
      if (ausente) {
        ausente.presente = true;
        actualizarConCara(ausente, cara, ahora);
        continue;
      }
      var numeroNuevo = siguienteId++;
      var nueva = prepararPersona({
        id: 'cam-' + numeroNuevo,
        x: cara.cx, y: cara.cy,
        nombre: window.Motor.bloquearNuevas ? ('Invitado ' + numeroNuevo) : ''
      });
      actualizarConCara(nueva, cara, ahora);
      personas.push(nueva);
    }
  }

  function actualizarConCara(p, cara, ahora) {
    p.perdidaDesde = 0;
    p.presente = true;
    p.x = cara.cx;
    p.y = cara.cy;
    p.caja = cara.caja;
    p.giroCrudo = cara.giro;
    p.cabeceoCrudo = cara.cabeceo;

    var desviado;
    if (p.base) {
      desviado = Math.abs(cara.giro - p.base.giro) > UMBRAL_GIRO ||
                 Math.abs(cara.cabeceo - p.base.cabeceo) > UMBRAL_CABECEO;
    } else {
      desviado = Math.abs(cara.giro) > UMBRAL_GIRO_SIN_CAL;
    }

    var ojosCerrados = cara.parpadeo > 0.55;
    if (ojosCerrados && !p.ojosCerradosDesdeMs) p.ojosCerradosDesdeMs = ahora;
    if (!ojosCerrados) p.ojosCerradosDesdeMs = 0;
    var dormido = p.ojosCerradosDesdeMs && (ahora - p.ojosCerradosDesdeMs > OJOS_CERRADOS_MS);

    p.estado = dormido ? 'ojos-cerrados' : desviado ? 'distraido' : 'atento';
    p.atento = !dormido && !desviado;
  }

  function dibujarOverlay() {
    if (!ctxOverlay) return;
    var W = overlay.width, H = overlay.height;
    ctxOverlay.clearRect(0, 0, W, H);
    var colores = { atento: '#4fc37f', distraido: '#e8b93d', 'ojos-cerrados': '#e8b93d', ausente: '#e05d5d' };

    for (var i = 0; i < personas.length; i++) {
      var p = personas[i];
      if (!p.presente || !p.caja) continue;
      var x = p.caja.x * W, y = p.caja.y * H, w = p.caja.w * W, h = p.caja.h * H;
      ctxOverlay.strokeStyle = colores[p.estado] || '#9db0c9';
      ctxOverlay.lineWidth = 3;
      ctxOverlay.strokeRect(x, y, w, h);
      var etiqueta = p.nombre || 'sin registrar';
      ctxOverlay.font = '600 16px "Segoe UI", sans-serif';
      ctxOverlay.textAlign = 'left';
      var anchoTxt = ctxOverlay.measureText(etiqueta).width;
      ctxOverlay.fillStyle = 'rgba(14,20,32,0.8)';
      ctxOverlay.fillRect(x, y - 24, anchoTxt + 12, 22);
      ctxOverlay.fillStyle = colores[p.estado] || '#e8eef7';
      ctxOverlay.fillText(etiqueta, x + 6, y - 8);
    }
  }

  function mensajeDeError(err) {
    var nombre = err && err.name ? err.name : '';
    if (nombre === 'NotAllowedError') return 'El permiso de cámara fue negado. Autorícelo en el navegador y vuelva a intentar.';
    if (nombre === 'NotFoundError') return 'No se encontró ninguna cámara en este equipo.';
    if (nombre === 'NotReadableError') return 'Otra aplicación tiene la cámara ocupada. Ciérrela y vuelva a intentar.';
    if (err && /import|fetch|network|Failed/i.test(String(err.message || err))) {
      return 'No se pudo descargar el detector de rostros (se necesita internet la primera vez).';
    }
    return 'No se pudo iniciar la cámara: ' + (err && err.message ? err.message : err);
  }

  function detenerTodo() {
    clearInterval(temporizador);
    temporizador = null;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(function (t) { t.stop(); });
      video.srcObject = null;
    }
    modo = null;
  }
})();
