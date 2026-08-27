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
  var temporizadorBoca = null;
  var temporizadorParpadeo = null;
  var guardaResume = null;

  // ── El avatar ───────────────────────────────────────────
  // Dibujo plano y amable a propósito: una cara "casi humana" mal animada
  // genera rechazo; un personaje claro y bien animado genera confianza.
  // El pin "IA" en el saco es deliberado: Vera nunca finge ser una persona.
  var SVG = [
    '<svg viewBox="0 0 200 210" xmlns="http://www.w3.org/2000/svg" aria-label="Vera, capacitadora virtual">',
    '  <circle cx="100" cy="95" r="82" fill="#22314a"/>',
    '  <!-- pelo de fondo -->',
    '  <path d="M42 92 Q38 28 100 26 Q162 28 158 92 L158 132 Q150 112 142 108 L58 108 Q50 112 42 132 Z" fill="#3d2b20"/>',
    '  <!-- cuello y saco -->',
    '  <rect x="88" y="140" width="24" height="22" fill="#e8b48c"/>',
    '  <path d="M40 210 Q40 168 76 158 L100 170 L124 158 Q160 168 160 210 Z" fill="#155e63"/>',
    '  <path d="M92 160 L100 170 L108 160 L100 156 Z" fill="#eef4f8"/>',
    '  <!-- pin IA: Vera no finge ser humana -->',
    '  <circle cx="130" cy="182" r="10" fill="#0c3d40"/>',
    '  <text x="130" y="186" font-size="9" font-weight="bold" fill="#35c4c8" text-anchor="middle" font-family="Segoe UI, sans-serif">IA</text>',
    '  <!-- cara -->',
    '  <ellipse cx="100" cy="98" rx="46" ry="52" fill="#f0c39b"/>',
    '  <!-- fleco -->',
    '  <path d="M54 92 Q52 40 100 38 Q148 40 146 92 Q140 62 118 58 Q124 74 116 72 Q96 60 74 70 Q60 76 54 92 Z" fill="#4a3427"/>',
    '  <!-- cejas -->',
    '  <path d="M66 82 Q76 76 88 80" stroke="#3d2b20" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
    '  <path d="M112 80 Q124 76 134 82" stroke="#3d2b20" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
    '  <!-- ojos -->',
    '  <g id="vera-ojo-izq">',
    '    <ellipse cx="78" cy="94" rx="9" ry="7" fill="#fff"/>',
    '    <circle id="vera-iris-izq" cx="78" cy="94" r="4.2" fill="#4a3427"/>',
    '    <rect id="vera-parpado-izq" x="68" y="83" width="20" height="0" rx="4" fill="#f0c39b"/>',
    '  </g>',
    '  <g id="vera-ojo-der">',
    '    <ellipse cx="122" cy="94" rx="9" ry="7" fill="#fff"/>',
    '    <circle id="vera-iris-der" cx="122" cy="94" r="4.2" fill="#4a3427"/>',
    '    <rect id="vera-parpado-der" x="112" y="83" width="20" height="0" rx="4" fill="#f0c39b"/>',
    '  </g>',
    '  <!-- nariz -->',
    '  <path d="M100 100 Q97 110 100 113 Q103 112 103 110" stroke="#d9a677" stroke-width="2" fill="none" stroke-linecap="round"/>',
    '  <!-- boca: sonrisa en reposo, elipse animada al hablar -->',
    '  <path id="vera-sonrisa" d="M84 128 Q100 138 116 128" stroke="#b3574f" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
    '  <ellipse id="vera-boca-abierta" cx="100" cy="130" rx="11" ry="2" fill="#8c3a34" style="display:none"/>',
    '  <!-- aretes -->',
    '  <circle cx="54" cy="106" r="3" fill="#35c4c8"/>',
    '  <circle cx="146" cy="106" r="3" fill="#35c4c8"/>',
    '</svg>'
  ].join('\n');

  function el(id) { return contenedor ? contenedor.querySelector('#' + id) : null; }

  // ── Parpadeo y boca ─────────────────────────────────────
  function parpadear() {
    var pi = el('vera-parpado-izq');
    var pd = el('vera-parpado-der');
    if (!pi || !pd) return;
    pi.setAttribute('height', '15');
    pd.setAttribute('height', '15');
    setTimeout(function () {
      pi.setAttribute('height', '0');
      pd.setAttribute('height', '0');
    }, 140);
  }

  function animarBoca(activa) {
    var sonrisa = el('vera-sonrisa');
    var boca = el('vera-boca-abierta');
    if (!sonrisa || !boca) return;
    clearInterval(temporizadorBoca);
    if (activa) {
      sonrisa.style.display = 'none';
      boca.style.display = '';
      temporizadorBoca = setInterval(function () {
        boca.setAttribute('ry', String(1.5 + Math.random() * 6));
        boca.setAttribute('rx', String(8 + Math.random() * 5));
      }, 90);
    } else {
      sonrisa.style.display = '';
      boca.style.display = 'none';
    }
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
      // Se reactiva por frase: un llamado de atención intercalado apaga la boca
      // al terminar, y sin esto Vera seguiría hablando con la boca quieta.
      animarBoca(true);
      if (MODO_RAPIDO || !window.speechSynthesis) {
        setTimeout(resolver, MODO_RAPIDO ? 250 : 900);
        return;
      }
      var u = new SpeechSynthesisUtterance(frase);
      var voz = elegirVoz();
      if (voz) u.voice = voz;
      u.lang = voz ? voz.lang : 'es-CO';
      u.rate = 1.0;
      u.pitch = 1.05;
      var listo = false;
      var terminar = function () {
        if (listo) return;
        listo = true;
        resolver();
      };
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
      contenedor.innerHTML = SVG;

      clearInterval(temporizadorParpadeo);
      temporizadorParpadeo = setInterval(function () {
        if (Math.random() < 0.5) parpadear();
      }, 2600);

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
      if (estadoEl) estadoEl.textContent = '● hablando';
      animarBoca(true);

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
        animarBoca(false);
        if (estadoEl) estadoEl.textContent = '';
      });
    },

    /* Corta lo que Vera esté diciendo. El decir() en curso se resuelve solo. */
    callar: function () {
      cancelado = true;
      if (window.speechSynthesis) speechSynthesis.cancel();
      hablando = false;
      animarBoca(false);
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

    /* Mueve la mirada de Vera hacia una posición horizontal de la sala.
       x va de 0 (izquierda de la pantalla) a 1 (derecha); null = al frente. */
    mirar: function (x) {
      var desplazamiento = 0;
      if (typeof x === 'number') {
        desplazamiento = Math.max(-1, Math.min(1, (x - 0.5) * 2)) * 3;
      }
      var ii = el('vera-iris-izq');
      var id = el('vera-iris-der');
      if (ii) ii.setAttribute('cx', String(78 + desplazamiento));
      if (id) id.setAttribute('cx', String(122 + desplazamiento));
    },

    get modoRapido() { return MODO_RAPIDO; }
  };
})();
