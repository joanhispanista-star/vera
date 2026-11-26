/* Vera: la cara, la voz y los oídos de la capacitadora.
   Todo con APIs del navegador (speechSynthesis y SpeechRecognition): cero costo
   por sesión. En Edge la voz sale con acento colombiano natural (Salome);
   en Chrome funciona con la voz de Google en español. */

(function () {
  'use strict';

  // ?rapido=1 en la URL: Vera "habla" solo con subtítulos, sin audio.
  // Sirve para probar el flujo completo en segundos y para revisar la app sin parlantes.
  var MODO_RAPIDO = new URLSearchParams(location.search).has('rapido');

  var contenedor = null;
  var subtituloEl = null;
  var estadoEl = null;

  var hablando = false;
  var cancelado = false;
  var guardaResume = null;

  // ── La cara ─────────────────────────────────────────────
  /* Vera tiene cara humana desde el 26-nov-2026, a pedido de Joan: el dibujo
     no le daba al asesor la sensación de que alguien le estaba enseñando.
     Es una persona INVENTADA por IA (no existe y no se parece a nadie a
     propósito), animada con dos videos cortos generados de la misma foto:
     uno escuchando y otro hablando. La app pasa de uno a otro cuando la voz
     empieza y termina.

     Lo que NO se hace, a propósito: mover con código la boca de una foto. Esa
     es exactamente la cara "casi humana mal animada" que genera rechazo, y la
     razón por la que antes Vera era un dibujo. Los labios tampoco siguen las
     palabras exactas: eso exige un servicio pago por sesión, y la regla 1 del
     proyecto lo prohíbe. Las palabras las llevan la voz y los subtítulos.

     Como ahora parece una persona, la etiqueta "IA" va SIEMPRE encima del
     video, y va en el HTML, no pintada en la foto, para que nunca se pierda
     al recortar: Vera nunca finge ser humana.

     Los tres archivos viven en persona/ y pesan unos 3 MB. Nada sale a
     internet y la USB sigue funcionando sin conexión. */
  var RETRATO = 'persona/vera.jpg';
  var CLIP_ESCUCHA = 'persona/vera-escucha.mp4';
  var CLIP_HABLA = 'persona/vera-habla.mp4';
  /* El clip de hablar es un bucle de 3,8 s cortado donde dos cuadros casi
     coinciden, para que la repetición no salte. Se entra a él por el cuadro
     más parecido a la cara en reposo (a 2,83 s, medido cuadro por cuadro):
     así el paso de escuchar a hablar no da un brinco. */
  var ENTRADA_HABLA = 2.83;
  /* Entre una frase y la siguiente, o entre dos decir() seguidos, la voz
     calla unos milisegundos. Si la cara volviera a "escuchar" en cada pausa,
     Vera parpadearía entre los dos videos todo el tiempo. */
  var ESPERA_REPOSO = 450;
  var FUNDIDO = 300; // lo que dura el fundido del CSS (.vera-clip)

  // Quien pidió al sistema menos movimiento ve la foto quieta.
  var sinMovimiento = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var cuadro = null;        // el recuadro que se ilumina cuando Vera habla
  var clipEscucha = null;
  var clipHabla = null;
  var caraActual = null;    // 'escucha' | 'habla'
  var temporizadorReposo = null;
  var temporizadorPausa = null;
  var cuadroVisible = true;

  function reproducir(video, desde) {
    if (!video || !cuadroVisible) return;
    try { if (typeof desde === 'number') video.currentTime = desde; } catch (e) {}
    var promesa = video.play();
    // Si el navegador no deja reproducir, queda la foto: no es un error que
    // haya que mostrarle a nadie.
    if (promesa && promesa.catch) promesa.catch(function () {});
  }

  /* Pone la foto y, encima, los dos videos. La foto se ve mientras cargan,
     si fallan o si el equipo pidió menos movimiento: Vera nunca queda como un
     recuadro negro. */
  function armarCara(destino, soloEscucha) {
    var html = '<img class="vera-foto" src="' + RETRATO + '" alt="Vera, la capacitadora virtual. ' +
      'Es una inteligencia artificial, no una persona.">';
    if (!sinMovimiento) {
      html += '<video class="vera-clip escucha visible" src="' + CLIP_ESCUCHA + '" poster="' + RETRATO +
        '" muted loop playsinline preload="auto" aria-hidden="true"></video>';
      if (!soloEscucha) {
        html += '<video class="vera-clip habla" src="' + CLIP_HABLA + '" poster="' + RETRATO +
          '" muted loop playsinline preload="auto" aria-hidden="true"></video>';
      }
    }
    destino.innerHTML = html;
    var videos = destino.querySelectorAll('video');
    for (var i = 0; i < videos.length; i++) {
      // El atributo muted solo no basta: la regla de reproducción automática
      // del navegador mira la propiedad.
      videos[i].muted = true;
      videos[i].addEventListener('error', function (ev) {
        // Sin video (archivo borrado de la USB, códec raro): queda la foto.
        var v = ev.target;
        if (v.parentNode) v.parentNode.removeChild(v);
        if (v === clipEscucha) clipEscucha = null;
        if (v === clipHabla) clipHabla = null;
      });
    }
    return {
      escucha: destino.querySelector('.vera-clip.escucha'),
      habla: destino.querySelector('.vera-clip.habla')
    };
  }

  /* Un video que nadie ve igual se decodifica y gasta procesador. Se pausa
     cuando su pantalla se oculta y se reanuda al volver. */
  function vigilarVisibilidad(elemento, alVerse, alOcultarse) {
    if (!window.IntersectionObserver) return;
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) alVerse(); else alOcultarse();
      });
    }).observe(elemento);
  }

  function ponerCara(estado) {
    if (estado === caraActual) return;
    caraActual = estado;
    if (cuadro) cuadro.classList.toggle('hablando', estado === 'habla');
    clearTimeout(temporizadorPausa);
    if (estado === 'habla') {
      if (!clipHabla) return;
      reproducir(clipHabla, ENTRADA_HABLA);
      clipHabla.classList.add('visible');
      // El de escuchar queda tapado: se pausa cuando termina el fundido.
      temporizadorPausa = setTimeout(function () {
        if (clipEscucha && caraActual === 'habla') clipEscucha.pause();
      }, FUNDIDO + 50);
    } else {
      // Vuelve a escuchar desde el principio, que es la cara en reposo.
      reproducir(clipEscucha, 0);
      if (!clipHabla) return;
      clipHabla.classList.remove('visible');
      temporizadorPausa = setTimeout(function () {
        if (clipHabla && caraActual !== 'habla') clipHabla.pause();
      }, FUNDIDO + 50);
    }
  }

  function moverCara(hablandoAhora) {
    clearTimeout(temporizadorReposo);
    if (hablandoAhora) ponerCara('habla');
    else temporizadorReposo = setTimeout(function () { ponerCara('escucha'); }, ESPERA_REPOSO);
  }

  // ── La voz ──────────────────────────────────────────────
  function elegirVoz() {
    var voces = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!voces.length) return null;
    // Preferencia: colombiana natural de Edge → cualquier es-CO → es-MX/es-US → cualquier español.
    var preferidas = [
      function (v) { return /salome/i.test(v.name); },
      function (v) { return /es-CO/i.test(v.lang) && /natural/i.test(v.name); },
      function (v) { return /es-CO/i.test(v.lang); },
      function (v) { return /natural/i.test(v.name) && /^es/i.test(v.lang); },
      function (v) { return /es[-_](MX|US|419)/i.test(v.lang); },
      function (v) { return /^es/i.test(v.lang); }
    ];
    for (var i = 0; i < preferidas.length; i++) {
      var voz = voces.find(preferidas[i]);
      if (voz) return voz;
    }
    return null;
  }

  // Chrome corta las locuciones largas (~15 s) y además "pausa" la síntesis
  // en segundo plano; por eso: frases cortas + resume() periódico.
  function partirEnFrases(texto) {
    var frases = String(texto).match(/[^.!?…]+[.!?…]*/g) || [String(texto)];
    return frases.map(function (f) { return f.trim(); }).filter(Boolean);
  }

  function decirFrase(frase) {
    return new Promise(function (resolver) {
      if (subtituloEl) subtituloEl.textContent = frase;
      // Se reactiva por frase: un llamado de atención intercalado devuelve la
      // cara a "escuchar" al terminar, y sin esto Vera seguiría hablando
      // con la cara quieta.
      moverCara(true);
      if (MODO_RAPIDO || !window.speechSynthesis) {
        var listoRapido = false;
        var terminarRapido = function () {
          if (listoRapido) return;
          listoRapido = true;
          terminarFraseActual = null;
          resolver();
        };
        terminarFraseActual = terminarRapido;
        setTimeout(terminarRapido, MODO_RAPIDO ? 250 : 900);
        return;
      }
      var u = new SpeechSynthesisUtterance(frase);
      var voz = elegirVoz();
      if (voz) u.voice = voz;
      u.lang = voz ? voz.lang : 'es-CO';
      u.rate = window.Vera && window.Vera.velocidad ? window.Vera.velocidad : 1.0;
      u.pitch = 1.05;
      var listo = false;
      var terminar = function () {
        if (listo) return;
        listo = true;
        terminarFraseActual = null;
        resolver();
      };
      // Se publica DESPUÉS de declararla: con var, arriba todavía es undefined.
      terminarFraseActual = terminar;
      u.onend = terminar;
      u.onerror = terminar;
      // Red de seguridad: si el navegador nunca dispara onend (pasa), no nos colgamos.
      setTimeout(terminar, 1000 + frase.length * 160);
      speechSynthesis.speak(u);
    });
  }

  // ── El oído ─────────────────────────────────────────────
  var Reconocedor = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var reconocimientoActivo = null;
  var ultimoErrorVoz = null;
  var terminarFraseActual = null;  // desbloquea la locución en curso al callar()

  // El reconocimiento falla con códigos crípticos; al usuario se le habla claro.
  function explicarErrorVoz(err) {
    if (err === 'not-allowed' || err === 'service-not-allowed') {
      return 'El navegador tiene bloqueado el micrófono. Toca el candado junto a la dirección, permite el micrófono y recarga.';
    }
    if (err === 'audio-capture') return 'No se encontró micrófono en este equipo.';
    if (err === 'network') return 'El dictado por voz no está disponible en este navegador (le pasa a Edge). En Chrome funciona; el teclado siempre sirve.';
    if (err === 'no-speech') return 'El micrófono está activo pero no se oyó nada. ¿Está seleccionado el micrófono correcto en el navegador?';
    if (err === 'sin-soporte') return 'Este navegador no tiene dictado por voz. Usa Chrome, o responde con el teclado.';
    return 'El micrófono no respondió' + (err ? ' (' + err + ')' : '') + '. El teclado siempre funciona.';
  }

  window.Vera = {

    iniciar: function (contenedorEl, subEl, estEl) {
      contenedor = contenedorEl;
      subtituloEl = subEl;
      estadoEl = estEl;
      cuadro = (contenedor.closest && contenedor.closest('.vera-cuadro')) || contenedor;
      // Cada sesión nueva vuelve a llamar a iniciar(): los videos se arman una
      // sola vez y después solo se devuelve la cara a "escuchar".
      if (!contenedor.querySelector('.vera-foto')) {
        var clips = armarCara(contenedor, false);
        clipEscucha = clips.escucha;
        clipHabla = clips.habla;
        vigilarVisibilidad(cuadro, function () {
          cuadroVisible = true;
          reproducir(caraActual === 'habla' ? clipHabla : clipEscucha);
        }, function () {
          cuadroVisible = false;
          if (clipEscucha) clipEscucha.pause();
          if (clipHabla) clipHabla.pause();
        });
      }
      caraActual = null;
      ponerCara('escucha');
      // El subtítulo de la sesión anterior no puede quedar en la nueva.
      if (subtituloEl) subtituloEl.textContent = '';

      // Las voces cargan asíncronas: pedirlas ya dispara 'voiceschanged'.
      if (window.speechSynthesis) speechSynthesis.getVoices();

      // El truco del resume(): sin esto Chrome enmudece a Vera a mitad de módulo.
      clearInterval(guardaResume);
      guardaResume = setInterval(function () {
        if (window.speechSynthesis && speechSynthesis.speaking && !speechSynthesis.paused) {
          speechSynthesis.resume();
        }
      }, 8000);
    },

    get hablando() { return hablando; },

    /* Dice un texto completo. Entre frase y frase puede ejecutar un callback
       (así la app mete los llamados de atención sin cortar a Vera a media palabra).
       Devuelve una promesa que se resuelve al terminar o al ser cancelada. */
    decir: function (texto, opciones) {
      opciones = opciones || {};
      var frases = partirEnFrases(texto);
      cancelado = false;
      hablando = true;
      // Que está hablando ya lo dicen la cara, el borde iluminado y las ondas;
      // el letrero de estado queda para cuando Vera escucha.
      if (estadoEl) estadoEl.textContent = '';
      moverCara(true);

      var cadena = Promise.resolve();
      frases.forEach(function (frase, idx) {
        cadena = cadena.then(function () {
          if (cancelado) return;
          return decirFrase(frase);
        }).then(function () {
          if (cancelado) return;
          if (opciones.entreFrases && idx < frases.length - 1) {
            return opciones.entreFrases();
          }
        });
      });

      return cadena.then(function () {
        hablando = false;
        moverCara(false);
        if (estadoEl) estadoEl.textContent = '';
      });
    },

    /* Corta lo que Vera esté diciendo. El decir() en curso se resuelve solo. */
    callar: function () {
      cancelado = true;
      if (window.speechSynthesis) speechSynthesis.cancel();
      /* Desbloquear la frase que YA está sonando. Sin esto, callar() solo
         evitaba las frases siguientes: la actual se quedaba esperando su
         propio temporizador, y la cadena que la aguardaba —la que muestra el
         reintento del examen, por ejemplo— no continuaba nunca. Con voz real
         suele salvarlo el onend de speechSynthesis; sin voz, no hay quién. */
      if (terminarFraseActual) {
        var t = terminarFraseActual;
        terminarFraseActual = null;
        t();
      }
      hablando = false;
      moverCara(false);
      if (estadoEl) estadoEl.textContent = '';
    },

    /* Escucha por el micrófono unos segundos y devuelve el texto, o null si
       no se entendió nada. Cuando devuelve null, Vera.ultimoErrorVoz dice POR
       QUÉ (código del navegador) — la primera queja real de Joan fue que el
       micrófono fallaba en silencio. Mientras escucha, muestra un medidor de
       nivel: la prueba visible de que el micrófono sí está capturando.
       La app siempre ofrece teclado: el demo no puede depender del micrófono. */
    escuchar: function (segundos, medidorEl) {
      segundos = segundos || 7;
      var destino = medidorEl || estadoEl;
      ultimoErrorVoz = null;
      return new Promise(function (resolver) {
        if (MODO_RAPIDO) { resolver(null); return; }
        if (!Reconocedor) { ultimoErrorVoz = 'sin-soporte'; resolver(null); return; }

        // Vuelo único: el navegador solo permite un reconocimiento a la vez.
        // Se aborta el anterior (abort, no stop: stop entregaría un resultado
        // tardío que la app auto-enviaría como respuesta a medio hablar).
        if (reconocimientoActivo) {
          try { reconocimientoActivo.abort(); } catch (e) {}
        }
        // Cada escucha lleva su propio error; el global se publica al terminar,
        // para que el 'aborted' de una escucha vieja no tape el error de la nueva.
        var errorLocal = null;

        // Medidor de nivel con Web Audio: independiente del reconocimiento,
        // así se distingue "no capta audio" de "capta pero no entiende".
        var BARRAS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇'];
        var contextoAudio = null, flujoMic = null, temporizadorNivel = null;
        var ContextoAudio = window.AudioContext || window.webkitAudioContext;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && ContextoAudio) {
          navigator.mediaDevices.getUserMedia({ audio: true }).then(function (flujo) {
            if (listo) { flujo.getTracks().forEach(function (t) { t.stop(); }); return; }
            flujoMic = flujo;
            contextoAudio = new ContextoAudio();
            if (contextoAudio.state === 'suspended') contextoAudio.resume();
            var analizador = contextoAudio.createAnalyser();
            analizador.fftSize = 512;
            contextoAudio.createMediaStreamSource(flujo).connect(analizador);
            var datos = new Uint8Array(analizador.frequencyBinCount);
            temporizadorNivel = setInterval(function () {
              analizador.getByteTimeDomainData(datos);
              var pico = 0;
              for (var i = 0; i < datos.length; i++) {
                var d = Math.abs(datos[i] - 128);
                if (d > pico) pico = d;
              }
              var idx = Math.min(BARRAS.length - 1, Math.floor(pico / 14));
              if (destino) destino.textContent = '🎤 escuchando ' + BARRAS[idx];
            }, 120);
          }).catch(function () { /* sin medidor; el reconocimiento dirá su error */ });
        }

        var rec = new Reconocedor();
        reconocimientoActivo = rec;
        rec.lang = 'es-CO';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        var listo = false;
        var temporizadorLimite = null;
        var terminar = function (texto) {
          if (listo) return;
          listo = true;
          ultimoErrorVoz = errorLocal;
          // Solo la escucha vigente suelta la referencia y borra el letrero:
          // una escucha vieja no puede pisar a la que la reemplazó.
          if (reconocimientoActivo === rec) {
            reconocimientoActivo = null;
            if (destino) destino.textContent = '';
          }
          clearTimeout(temporizadorLimite);
          clearInterval(temporizadorNivel);
          if (flujoMic) flujoMic.getTracks().forEach(function (t) { t.stop(); });
          if (contextoAudio) { try { contextoAudio.close(); } catch (e) {} }
          try { rec.stop(); } catch (e) {}
          resolver(texto);
        };
        rec.onresult = function (ev) {
          var t = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : '';
          terminar(t ? t.trim() : null);
        };
        rec.onerror = function (ev) {
          errorLocal = ev && ev.error ? ev.error : 'desconocido';
          terminar(null);
        };
        rec.onend = function () {
          if (!listo && !errorLocal) errorLocal = 'no-speech';
          terminar(null);
        };
        // El conteo arranca cuando el micrófono de verdad empieza a capturar:
        // el diálogo de permiso del navegador no puede comerse los segundos.
        rec.onstart = function () {
          clearTimeout(temporizadorLimite);
          temporizadorLimite = setTimeout(function () {
            if (!errorLocal) errorLocal = 'no-speech';
            terminar(null);
          }, segundos * 1000);
        };
        // Red absoluta por si onstart nunca llega (permiso colgado, etc.).
        temporizadorLimite = setTimeout(function () {
          if (!errorLocal) errorLocal = 'no-speech';
          terminar(null);
        }, (segundos + 25) * 1000);
        if (destino) destino.textContent = '🎤 escuchando…';
        try { rec.start(); } catch (e) { errorLocal = 'desconocido'; terminar(null); }
      });
    },

    get ultimoErrorVoz() { return ultimoErrorVoz; },
    explicarErrorVoz: explicarErrorVoz,

    detenerEscucha: function () {
      // abort y no stop: stop entrega un resultado tardío con el audio parcial
      // y la app lo enviaría como respuesta cuando el usuario ya escribió.
      if (reconocimientoActivo) {
        try { reconocimientoActivo.abort(); } catch (e) {}
      }
    },

    /* Antes movía los ojos del dibujo hacia la persona a la que Vera le
       hablaba (x de 0 a 1; null = al frente). Con una cara de video no hay
       ojos que mover sin deformarla, y una mirada falsa es peor que ninguna:
       quien recibe el llamado ya lo sabe porque Vera dice su nombre. Se deja
       la función para que la app no cambie. */
    mirar: function () {},

    /* La cara de Vera en otra pantalla (la de inicio): foto y video de
       escuchar en bucle, sin voz. */
    retrato: function (destino) {
      if (!destino || destino.querySelector('.vera-foto')) return;
      var clip = armarCara(destino, true).escucha;
      if (!clip) return;
      vigilarVisibilidad(destino, function () {
        var p = clip.play();
        if (p && p.catch) p.catch(function () {});
      }, function () { clip.pause(); });
    },

    get modoRapido() { return MODO_RAPIDO; },

    /* Diagnóstico de la voz, para probarla ANTES de tener el grupo sentado.
       Los dos fallos que tumban un demo: que el equipo no tenga voz en español
       (Vera leería español con acento inglés) o que no haya síntesis de voz
       (Vera quedaría muda, con subtítulos, sin avisar). */
    revisarVoz: function () {
      if (MODO_RAPIDO) {
        return { estado: 'aviso', mensaje: 'El modo rápido (?rapido=1) no reproduce audio.' };
      }
      if (!window.speechSynthesis) {
        return { estado: 'mal', mensaje: 'Este navegador no puede hablar: Vera saldría muda, solo con subtítulos. Use Chrome o Edge.' };
      }
      var voces = speechSynthesis.getVoices();
      if (!voces.length) {
        return { estado: 'aviso', mensaje: 'El navegador todavía no cargó las voces. Espere un momento y vuelva a probar.' };
      }
      var voz = elegirVoz();
      if (!voz) {
        return { estado: 'mal', mensaje: 'No hay ninguna voz en español instalada: Vera leería el español con acento inglés. ' +
          'Instale la voz en español de Windows (Configuración › Hora e idioma › Voz), o abra la app en Edge.' };
      }
      return {
        estado: 'bien',
        voz: voz.name,
        mensaje: 'Voz lista: ' + voz.name + ' (' + voz.lang + ').'
      };
    },

    velocidad: 1
  };

  // La cara de la pantalla de inicio se arma sola: vera.js se carga al final
  // del <body>, así que ese HTML ya existe.
  var retratos = document.querySelectorAll('[data-vera-retrato]');
  for (var r = 0; r < retratos.length; r++) window.Vera.retrato(retratos[r]);
})();
