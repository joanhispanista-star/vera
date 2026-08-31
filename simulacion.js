/* La sala simulada: cuatro asistentes dibujados que se comportan como gente real.
   Existe por una razón de negocio: el demo tiene que poderse mostrar en una
   oficina, en un celular o por videollamada SIN reunir a un grupo frente a la
   cámara. Aquí Vera hace su escena completa — incluida la de "tú, el de la
   camisa roja y las gafas" — con personajes que sabemos cómo van vestidos. */

(function () {
  'use strict';

  var lienzo = null;
  var ctx = null;
  var inicio = 0;

  // Cada persona simulada comparte el MISMO objeto que usa el motor de atención:
  // el motor le agrega ema, llamados, etc. y aquí solo se maneja lo visual/actoral.
  var personas = [];

  function crearPersonas() {
    personas = [
      {
        id: 'sim-1', nombre: '', nombreReal: 'Paula',
        descripcion: 'tú, la de la blusa morada',
        x: 0.14, camisa: '#8e5bb5', pelo: '#2e1f16', piel: '#e8b48c',
        peloLargo: true, gafas: false,
        presente: true, atentoAhora: true, estadoVisual: 'atento',
        hablandoHasta: 0, parpadeoHasta: 0, comportamiento: null
      },
      {
        id: 'sim-2', nombre: '', nombreReal: 'Jorge',
        descripcion: 'tú, el de la camisa roja y las gafas',
        x: 0.38, camisa: '#c0392b', pelo: '#1c1c1c', piel: '#c68a5e',
        peloLargo: false, gafas: true,
        presente: true, atentoAhora: true, estadoVisual: 'atento',
        hablandoHasta: 0, parpadeoHasta: 0, comportamiento: null
      },
      {
        id: 'sim-3', nombre: '', nombreReal: 'Andrés',
        descripcion: 'tú, el de la camisa azul',
        x: 0.62, camisa: '#2e6da4', pelo: '#3d2b20', piel: '#f0c39b',
        peloLargo: false, gafas: false,
        presente: true, atentoAhora: true, estadoVisual: 'atento',
        hablandoHasta: 0, parpadeoHasta: 0, comportamiento: null
      },
      {
        id: 'sim-4', nombre: '', nombreReal: 'Milena',
        descripcion: 'tú, la del saco amarillo',
        x: 0.86, camisa: '#d4a017', pelo: '#4a2c17', piel: '#d99e6a',
        peloLargo: true, gafas: false,
        presente: true, atentoAhora: true, estadoVisual: 'atento',
        hablandoHasta: 0, parpadeoHasta: 0, comportamiento: null
      }
    ];
    return personas;
  }

  // ── El guion de la sesión ───────────────────────────────
  // La app avisa por dónde va (módulo/punto) y aquí se disparan los "actos":
  // Jorge saca el celular, Milena se duerme, Andrés se sale de la sala.
  // Así el demo siempre muestra los tres tipos de alerta sin depender del azar.
  var GUION = {
    'm0p1': { quien: 'sim-2', tipo: 'celular', duracion: 18000 },
    'm1p1': { quien: 'sim-4', tipo: 'suenio', duracion: 14000 },
    'm2p0': { quien: 'sim-3', tipo: 'ausente', duracion: 16000 },
    // La conversa la protagoniza Paula: Jorge ya recibió llamado en m0p1 y el
    // enfriamiento de 45 s se tragaría esta alerta en las corridas rápidas.
    'm2p1': { quien: 'sim-1', tipo: 'conversando', duracion: 14000 }
  };

  function aplicarComportamiento(p, tipo, duracion) {
    p.comportamiento = { tipo: tipo, hasta: Date.now() + duracion };
    if (tipo === 'celular') { p.atentoAhora = false; p.estadoVisual = 'distraido'; }
    if (tipo === 'suenio') { p.atentoAhora = false; p.estadoVisual = 'ojos-cerrados'; }
    if (tipo === 'conversando') { p.atentoAhora = false; p.estadoVisual = 'hablando'; }
    if (tipo === 'ausente') { p.atentoAhora = false; p.estadoVisual = 'ausente'; p.presente = false; }
  }

  function terminarComportamiento(p) {
    p.comportamiento = null;
    p.presente = true;
    p.atentoAhora = true;
    p.estadoVisual = 'atento';
  }

  // ── Respuestas actuadas ─────────────────────────────────
  // Jorge (el distraído) responde mal la primera pregunta: eso deja ver en el
  // acta cómo queda una respuesta incorrecta. Los demás contestan bien usando
  // la respuesta modelo del curso, sea cual sea el curso elegido.
  function responder(idxModulo, persona, pregunta) {
    var texto;
    if (persona.nombreReal === 'Jorge' && idxModulo === 0) {
      // Ojo al redactar: la frase de Jorge no puede contener ninguna clave
      // de calificación, o el acta lo marcaría como correcto por accidente.
      texto = 'Eh... ¿me repite la pregunta, profe? Esa sí me corchó.';
    } else if (pregunta && pregunta.respuestaModelo) {
      texto = pregunta.respuestaModelo;
    } else if (pregunta && pregunta.claves.length) {
      texto = 'Yo creo que tiene que ver con: ' + pregunta.claves.join(', ') + '.';
    } else {
      texto = 'Creo que es lo que usted acaba de explicar, profe.';
    }
    return { texto: texto, tardanzaMs: 1600 + Math.random() * 900 };
  }

  // ── Dibujo ──────────────────────────────────────────────
  var ANCHO = 640, ALTO = 360;

  function dibujarPersona(p, t, i) {
    var px = p.x * ANCHO;
    var py = 235 + Math.sin(t / 900 + i * 1.7) * 2; // respiración
    var duerme = p.estadoVisual === 'ojos-cerrados';
    var distraido = p.estadoVisual === 'distraido';
    var conversando = p.estadoVisual === 'hablando';

    // Silla (queda visible aunque la persona se salga)
    ctx.fillStyle = '#233042';
    ctx.fillRect(px - 34, py + 40, 68, 10);
    ctx.fillRect(px - 30, py + 50, 6, 40);
    ctx.fillRect(px + 24, py + 50, 6, 40);

    if (!p.presente) {
      ctx.strokeStyle = 'rgba(224,93,93,0.7)';
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(px - 28, py - 60, 56, 96);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(224,93,93,0.9)';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('salió', px, py - 4);
      return;
    }

    if (duerme) py += 8; // se le cae un poco la cabeza

    // Torso
    ctx.fillStyle = p.camisa;
    ctx.beginPath();
    ctx.moveTo(px - 32, py + 44);
    ctx.quadraticCurveTo(px - 30, py + 2, px, py - 2);
    ctx.quadraticCurveTo(px + 30, py + 2, px + 32, py + 44);
    ctx.closePath();
    ctx.fill();

    // Cabeza
    var cy = py - 28;
    if (distraido) cy += 5; // mirando abajo, al celular
    ctx.fillStyle = p.piel;
    ctx.beginPath();
    ctx.arc(px, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Pelo
    ctx.fillStyle = p.pelo;
    ctx.beginPath();
    ctx.arc(px, cy - 5, 23, Math.PI, 0);
    ctx.fill();
    if (p.peloLargo) {
      ctx.fillRect(px - 23, cy - 5, 7, 30);
      ctx.fillRect(px + 16, cy - 5, 7, 30);
    }

    // Ojos
    var parpadeando = t < p.parpadeoHasta;
    var ojosCerrados = duerme || parpadeando;
    var mirandoAbajo = distraido;
    ctx.strokeStyle = '#1c1c1c';
    ctx.fillStyle = '#1c1c1c';
    if (ojosCerrados) {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 12, cy + 2); ctx.lineTo(px - 4, cy + 2);
      ctx.moveTo(px + 4, cy + 2); ctx.lineTo(px + 12, cy + 2);
      ctx.stroke();
    } else {
      var dy = mirandoAbajo ? 3 : 0;
      var dx = conversando ? -3 : 0; // conversando: mira al vecino, no al frente
      ctx.beginPath();
      ctx.arc(px - 8 + dx, cy + 1 + dy, 2.5, 0, Math.PI * 2);
      ctx.arc(px + 8 + dx, cy + 1 + dy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (Math.random() < 0.005) p.parpadeoHasta = t + 140;

    // Gafas: la seña con la que Vera señala a Jorge en el registro
    if (p.gafas) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 14, cy - 4, 12, 10);
      ctx.strokeRect(px + 2, cy - 4, 12, 10);
      ctx.beginPath();
      ctx.moveTo(px - 2, cy + 1); ctx.lineTo(px + 2, cy + 1);
      ctx.stroke();
    }

    // Boca (abierta si responde a Vera o si está conversando con el vecino)
    if (t < p.hablandoHasta || conversando) {
      ctx.fillStyle = '#8c3a34';
      ctx.beginPath();
      ctx.ellipse(px, cy + 11, 4, 1.5 + Math.abs(Math.sin(t / 130)) * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      if (conversando) {
        // burbuja de charla hacia el vecino
        ctx.fillStyle = 'rgba(232,185,61,0.9)';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('bla bla…', px - 26, cy - 6 + Math.sin(t / 400) * 2);
      }
    } else {
      ctx.strokeStyle = '#8c3a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (duerme) { ctx.ellipse(px, cy + 12, 3, 2, 0, 0, Math.PI * 2); }
      else { ctx.moveTo(px - 5, cy + 11); ctx.quadraticCurveTo(px, cy + (distraido ? 12 : 15), px + 5, cy + 11); }
      ctx.stroke();
    }

    // Celular en la mano
    if (distraido) {
      ctx.fillStyle = '#0a0e14';
      ctx.fillRect(px + 14, py + 8, 12, 20);
      ctx.strokeStyle = '#35c4c8';
      ctx.strokeRect(px + 14, py + 8, 12, 20);
    }

    // Las zetas del que se durmió
    if (duerme) {
      ctx.fillStyle = 'rgba(232,185,61,0.9)';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      var flote = Math.sin(t / 500) * 3;
      ctx.fillText('z', px + 24, cy - 18 + flote);
      ctx.fillText('Z', px + 32, cy - 28 + flote);
    }

    // Nombre sobre la cabeza cuando ya se registró
    if (p.nombre) {
      ctx.fillStyle = 'rgba(232,238,247,0.95)';
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.nombre, px, cy - 34);
    }
  }

  function dibujar(t) {
    if (!ctx) return;
    // Fondo de sala: pared, guarda-escoba y piso.
    ctx.fillStyle = '#1a2434';
    ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.fillStyle = '#141c29';
    ctx.fillRect(0, 300, ANCHO, 60);
    ctx.strokeStyle = '#2b3a52';
    ctx.beginPath();
    ctx.moveTo(0, 300); ctx.lineTo(ANCHO, 300);
    ctx.stroke();
    // Un cartel en la pared, para que se sienta oficina de verdad.
    ctx.fillStyle = '#233042';
    ctx.fillRect(40, 30, 110, 60);
    ctx.fillStyle = '#9db0c9';
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('METAS DEL MES', 95, 55);
    ctx.fillStyle = '#35c4c8';
    ctx.fillRect(60, 65, 70, 6);

    for (var i = 0; i < personas.length; i++) {
      dibujarPersona(personas[i], t, i);
    }
  }

  window.Simulacion = {

    /* soloUno: sala de UNA persona, para ver el modo individual sin cámara.
       Sirve para dos cosas reales: revisar el flujo exacto que va a vivir el
       asesor (registro, dictado, examen con botones, constancia) antes de
       sentarlo, y mostrarlo en una reunión donde no hay a quién capacitar. */
    iniciar: function (canvas, soloUno) {
      lienzo = canvas;
      ctx = lienzo.getContext('2d');
      inicio = Date.now();
      var todas = crearPersonas();
      if (soloUno) {
        personas = [todas[0]];
        personas[0].x = 0.5; // solo en la sala: al centro
        personas[0].descripcion = 'tú, que estás frente a la cámara';
      }
      return personas;
    },

    /* El motor llama esto en cada vuelta: actualiza los "actos" y redibuja. */
    tick: function () {
      var ahora = Date.now();
      for (var i = 0; i < personas.length; i++) {
        var p = personas[i];
        if (p.comportamiento && ahora > p.comportamiento.hasta) {
          terminarComportamiento(p);
        }
      }
      dibujar(ahora);
    },

    /* La app avisa por dónde va el dictado; si el guion tiene un acto aquí, arranca. */
    marcador: function (id) {
      var acto = GUION[id];
      if (!acto) return;
      var p = personas.find(function (q) { return q.id === acto.quien; });
      if (p && !p.comportamiento) aplicarComportamiento(p, acto.tipo, acto.duracion);
    },

    /* Cuando Vera llama la atención, el simulado "se endereza" tras un momento.
       Es la escena que vende: te nombran y vuelves a poner atención. */
    alLlamado: function (persona) {
      setTimeout(function () { terminarComportamiento(persona); }, 1800);
    },

    hablar: function (persona, ms) {
      persona.hablandoHasta = Date.now() + (ms || 1500);
    },

    responder: responder,

    get personas() { return personas; }
  };
})();
