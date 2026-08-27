/* Historial de capacitaciones: la memoria de la plataforma.
   Existe por una razón de negocio, no técnica: una empresa no paga por "una IA
   que capacita", paga por PODER DEMOSTRAR que capacitó. Con la Ley 2300 y la
   SIC vigilando, la pregunta que salva de una sanción es "¿quién recibió la
   capacitación de cobranza y cuándo?", y hasta hoy Vera guardaba las actas
   donde nadie podía leerlas.

   Todo vive en localStorage de ESTE aparato: no hay servidor. Por eso el
   respaldo (exportar/importar) no es un lujo — es lo único que evita perder
   el historial si se borran los datos del navegador. */

(function () {
  'use strict';

  var CLAVE = 'vera.actas';

  function leerCrudo() {
    try {
      var datos = JSON.parse(localStorage.getItem(CLAVE) || '[]');
      return Array.isArray(datos) ? datos : [];
    } catch (e) {
      return [];
    }
  }

  function escribir(actas) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(actas));
      return true;
    } catch (e) {
      return false; // cuota llena o almacenamiento bloqueado
    }
  }

  // Las actas viejas (de antes del historial) no traen id ni todos los campos.
  // Se normalizan al leer para que la interfaz no tenga que preguntar por cada uno.
  function normalizar(acta, indice) {
    return {
      id: acta.id || ('s' + indice + '-' + (acta.fecha || '')),
      fecha: acta.fecha || '',
      titulo: acta.titulo || 'Capacitación',
      modo: acta.modo || 'camara',
      duracionMin: acta.duracionMin || 0,
      grupo: acta.grupo || '',
      dictadaPor: acta.dictadaPor || '',
      rescatada: !!acta.rescatada,
      personas: (acta.personas || []).map(function (p) {
        return {
          nombre: p.nombre || 'Sin registrar',
          atencion: typeof p.atencion === 'number' ? p.atencion : null,
          llamados: p.llamados || 0,
          conversaMs: p.conversaMs || 0,
          // undefined ≠ 0: las actas guardadas antes de que existiera este dato
          // no saben nada de ausencias, y decir "presencia completa" sería
          // inventarles un hecho a personas reales.
          ausenteMs: typeof p.ausenteMs === 'number' ? p.ausenteMs : null,
          llegoTardeMs: typeof p.llegoTardeMs === 'number' ? p.llegoTardeMs : 0,
          // Sin esto, un acta reabierta perdía el "y volvió a concentrarse":
          // decía menos que el día que se generó, y siempre en contra.
          cerroAtenta: !!p.cerroAtenta,
          paraSupervisor: !!p.paraSupervisor,
          respuestas: p.respuestas || []
        };
      })
    };
  }

  /* Nombres que la app pone sola cuando no supo quién era alguien. No son
     identidades: fundir los "Asistente 1" de cinco sesiones distintas en una
     sola ficha crearía una persona que no existe, con constancia y todo. */
  function esNombreGenerico(nombre) {
    return /^(asistente|invitado)\s*\d*$/i.test(String(nombre || '').trim()) ||
      /^sin registrar$/i.test(String(nombre || '').trim());
  }

  function listar() {
    return leerCrudo().map(normalizar).sort(function (a, b) {
      return String(b.fecha).localeCompare(String(a.fecha)); // ISO ordena bien como texto
    });
  }

  function fechaLegible(iso) {
    if (!iso) return 'sin fecha';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return 'sin fecha';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  /* Aciertos sobre preguntas CALIFICABLES. Una pregunta escrita sin palabras
     clave no se puede calificar, así que no se castiga… pero tampoco se puede
     contar como acierto: la constancia diría "2 de 2 acertadas" sobre algo que
     nadie evaluó. Se cuentan aparte. */
  function aciertos(persona) {
    var bien = 0, total = 0, sinCalificar = 0;
    (persona.respuestas || []).forEach(function (r) {
      if (r.veredicto === 'correcta') { bien++; total++; }
      else if (r.veredicto === 'incorrecta' || r.veredicto === 'sin-respuesta') { total++; }
      else if (r.veredicto === 'respondida') { sinCalificar++; }
    });
    return { bien: bien, total: total, sinCalificar: sinCalificar };
  }

  /* Personas distintas que han pasado por la plataforma, con su resumen.
     Es lo que responde "¿Juan ya hizo la inducción de la 2300?" — la pregunta
     que hace un supervisor el día que llega una auditoría. Las sesiones de
     demostración se excluyen: no son evidencia de nada. */
  function personas(incluirDemos) {
    var mapa = {};
    listar().forEach(function (sesion) {
      if (!incluirDemos && sesion.modo !== 'camara') return;
      sesion.personas.forEach(function (p) {
        var clave = p.nombre.toLowerCase().trim();
        if (!clave || esNombreGenerico(p.nombre)) return;
        if (!mapa[clave]) {
          mapa[clave] = { nombre: p.nombre, sesiones: [], atencionSuma: 0, atencionN: 0, llamados: 0 };
        }
        var reg = mapa[clave];
        reg.sesiones.push({ id: sesion.id, titulo: sesion.titulo, fecha: sesion.fecha, persona: p });
        if (typeof p.atencion === 'number') { reg.atencionSuma += p.atencion; reg.atencionN++; }
        reg.llamados += p.llamados;
      });
    });
    return Object.keys(mapa).map(function (k) {
      var r = mapa[k];
      return {
        nombre: r.nombre,
        cursos: r.sesiones.length,
        atencionMedia: r.atencionN ? Math.round(r.atencionSuma / r.atencionN) : null,
        llamados: r.llamados,
        sesiones: r.sesiones.sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); })
      };
    }).sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
  }

  // ── Exportar ────────────────────────────────────────────
  function escaparCampo(valor) {
    var texto = String(valor === null || valor === undefined ? '' : valor);
    return '"' + texto.replace(/"/g, '""') + '"';
  }

  /* CSV para Recursos Humanos. Separador ';' y BOM porque el Excel en español
     abre con coma decimal: con ',' todo cae en una sola columna y el cliente
     concluye que "el archivo salió malo". */
  function textoPresencia(p) {
    if (p.ausenteMs === null) return 'sin dato';
    if (p.llegoTardeMs > 0) return 'llegó tarde';
    if (p.ausenteMs > 45000) return 'se ausentó ~' + Math.max(1, Math.round(p.ausenteMs / 60000)) + ' min';
    if (p.ausenteMs > 8000) return 'se ausentó un momento';
    return 'completa';
  }

  function csv(soloReales) {
    var filas = [['Fecha', 'Curso', 'Modo', 'Duración (min)', 'Grupo', 'Asistente', 'Presencia',
                  'Atención (%)', 'Llamados', 'Conversa (min)', 'Aciertos', 'Preguntas calificables',
                  'Sin calificar', 'Revisar']];
    listar().forEach(function (s) {
      if (soloReales && s.modo !== 'camara') return;
      s.personas.forEach(function (p) {
        var ac = aciertos(p);
        filas.push([
          fechaLegible(s.fecha), s.titulo,
          s.modo === 'camara' ? (s.rescatada ? 'sala real (acta rescatada)' : 'sala real') : 'demostración',
          s.duracionMin, s.grupo, p.nombre, textoPresencia(p),
          p.atencion === null ? '' : p.atencion,
          p.llamados,
          p.conversaMs > 45000 ? Math.round(p.conversaMs / 60000) : 0,
          ac.bien, ac.total, ac.sinCalificar,
          p.paraSupervisor ? 'SI' : ''
        ]);
      });
    });
    return '﻿' + filas.map(function (f) {
      return f.map(escaparCampo).join(';');
    }).join('\r\n');
  }

  function descargar(nombreArchivo, contenido, tipo) {
    var blob = new Blob([contenido], { type: tipo || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function nombreConFecha(prefijo, extension) {
    var d = new Date();
    var dosDigitos = function (n) { return (n < 10 ? '0' : '') + n; };
    return prefijo + '-' + d.getFullYear() + dosDigitos(d.getMonth() + 1) + dosDigitos(d.getDate()) + '.' + extension;
  }

  // ── Respaldo: el historial vive solo en este navegador ──
  function exportarRespaldo() {
    descargar(nombreConFecha('vera-respaldo', 'json'),
      JSON.stringify({ version: 1, exportado: new Date().toISOString(), actas: leerCrudo() }, null, 1),
      'application/json;charset=utf-8');
  }

  /* Importar SUMA, nunca reemplaza: el supervisor que restaura un respaldo no
     puede perder las sesiones que dictó después. Se descartan las repetidas
     por id, y las que no traen id se comparan por fecha + título. */
  function importarRespaldo(textoJson) {
    var datos;
    try {
      datos = JSON.parse(textoJson);
    } catch (e) {
      return { ok: false, error: 'El archivo no es un respaldo de Vera.' };
    }
    var entrantes = datos && Array.isArray(datos.actas) ? datos.actas
                  : Array.isArray(datos) ? datos : null;
    if (!entrantes) return { ok: false, error: 'El archivo no tiene actas de Vera.' };

    var actuales = leerCrudo();
    var huella = function (a) { return (a.id || '') + '|' + (a.fecha || '') + '|' + (a.titulo || ''); };
    var vistas = {};
    actuales.forEach(function (a) { vistas[huella(a)] = true; });

    var nuevas = 0;
    entrantes.forEach(function (a) {
      if (!a || typeof a !== 'object') return;
      if (vistas[huella(a)]) return;
      vistas[huella(a)] = true;
      actuales.push(a);
      nuevas++;
    });
    if (!escribir(actuales)) return { ok: false, error: 'No se pudo guardar: el almacenamiento está lleno.' };
    return { ok: true, nuevas: nuevas, repetidas: entrantes.length - nuevas };
  }

  // ── Borrado (Ley 1581: el titular puede pedir supresión) ─
  function borrarSesion(id) {
    var quedan = leerCrudo().filter(function (a, i) { return normalizar(a, i).id !== id; });
    return escribir(quedan);
  }

  function borrarPersona(nombre) {
    var clave = String(nombre).toLowerCase().trim();
    var quitar = function (lista) {
      return (lista || []).filter(function (p) {
        return String(p.nombre || '').toLowerCase().trim() !== clave;
      });
    };
    var actas = leerCrudo().map(function (a) {
      a.personas = quitar(a.personas);
      return a;
    }).filter(function (a) { return (a.personas || []).length > 0; });
    // El borrador es la OTRA copia de datos personales y vive aparte: dejarlo
    // intacto haría falsa la promesa de "borrar sus datos" (Ley 1581).
    try {
      var b = JSON.parse(localStorage.getItem(CLAVE_BORRADOR) || 'null');
      if (b && b.personas) {
        b.personas = quitar(b.personas);
        if (b.personas.length) localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(b));
        else localStorage.removeItem(CLAVE_BORRADOR);
      }
    } catch (e) {}
    return escribir(actas);
  }

  function borrarTodo() {
    try {
      localStorage.removeItem(CLAVE);
      localStorage.removeItem(CLAVE_BORRADOR); // "todo" incluye la sesión a medias
      return true;
    } catch (e) { return false; }
  }

  /* Borrador de la sesión en curso. Una recarga, un cierre de pestaña o una
     actualización de Windows a mitad de una inducción de 40 minutos borraba
     todo: la asistencia, la atención medida y las respuestas. Aquí se guarda
     un borrador cada pocos segundos para poder RESCATAR EL ACTA de lo que
     alcanzó a pasar. No se promete reanudar la capacitación — eso exigiría
     volver a reconocer las caras — solo salvar la evidencia. */
  var CLAVE_BORRADOR = 'vera.sesion-en-curso';
  var VIGENCIA_BORRADOR_MS = 12 * 60 * 60 * 1000;

  function guardarBorrador(acta) {
    try { localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(acta)); } catch (e) {}
  }

  function leerBorrador() {
    try {
      var b = JSON.parse(localStorage.getItem(CLAVE_BORRADOR) || 'null');
      if (!b || !b.fecha || !(b.personas || []).length) return null;
      // Un borrador viejo es basura, no un rescate: nadie retoma el acta de ayer.
      if (Date.now() - new Date(b.fecha).getTime() > VIGENCIA_BORRADOR_MS) {
        borrarBorrador();
        return null;
      }
      return normalizar(b, 0);
    } catch (e) {
      return null;
    }
  }

  function borrarBorrador() {
    try { localStorage.removeItem(CLAVE_BORRADOR); } catch (e) {}
  }

  window.Historial = {
    guardarBorrador: guardarBorrador,
    leerBorrador: leerBorrador,
    borrarBorrador: borrarBorrador,
    guardar: function (acta) {
      var actas = leerCrudo();
      actas.push(acta);
      return escribir(actas);
    },
    listar: listar,
    buscarSesion: function (id) {
      return listar().filter(function (s) { return s.id === id; })[0] || null;
    },
    personas: personas,
    aciertos: aciertos,
    fechaLegible: fechaLegible,
    textoPresencia: textoPresencia,
    esNombreGenerico: esNombreGenerico,
    csv: csv,
    descargarCsv: function (soloReales) {
      descargar(nombreConFecha('vera-capacitaciones', 'csv'), csv(soloReales), 'text/csv;charset=utf-8');
    },
    exportarRespaldo: exportarRespaldo,
    descargarActa: function (acta) {
      descargar(nombreConFecha('vera-acta', 'json'),
        JSON.stringify({ version: 1, exportado: new Date().toISOString(), actas: [acta] }, null, 1),
        'application/json;charset=utf-8');
    },
    importarRespaldo: importarRespaldo,
    borrarSesion: borrarSesion,
    borrarPersona: borrarPersona,
    borrarTodo: borrarTodo,
    nombreConFecha: nombreConFecha
  };
})();
