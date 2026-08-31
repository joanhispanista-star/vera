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

  function leer(clave) {
    try { return localStorage.getItem(clave); } catch (e) { return null; }
  }

  function escribir2(clave, valor) {
    try { localStorage.setItem(clave, valor); return true; } catch (e) { return false; }
  }

  function escribir(actas) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(actas));
      return true;
    } catch (e) {
      return false; // cuota llena o almacenamiento bloqueado
    }
  }

  /* Las actas viejas (de antes del historial) no traen id ni todos los campos.
     Se normalizan al leer para que la interfaz no tenga que preguntar por cada uno.

     Y se les fuerza el TIPO, no solo el valor: estos datos pueden venir de un
     respaldo hecho en OTRO computador, es decir de fuera de esta app. Un solo
     campo con el tipo equivocado ("personas":"x", un nombre numérico, un null
     en el arreglo) lanzaba un TypeError dentro de listar(); y como el aviso de
     recertificación se pinta ANTES de cablear la interfaz, eso dejaba la app
     entera muerta desde el arranque siguiente, sin decir por qué y sin manera
     de llegar al historial a borrar el dato que la tumbó. */
  function normalizar(acta, indice) {
    if (!acta || typeof acta !== 'object') acta = {};
    // El arreglo de entrada NO se filtra: listar() y borrarSesion() dependen de
    // que el índice siga siendo el mismo, porque el id de respaldo se arma con él.
    var gente = Array.isArray(acta.personas) ? acta.personas : [];
    return {
      id: String(acta.id || ('s' + indice + '-' + (acta.fecha || ''))),
      fecha: String(acta.fecha || ''),
      titulo: String(acta.titulo || 'Capacitación'),
      modo: acta.modo === 'camara' ? 'camara' : (acta.modo ? String(acta.modo) : 'camara'),
      duracionMin: Number(acta.duracionMin) || 0,
      grupo: String(acta.grupo || ''),
      dictadaPor: String(acta.dictadaPor || ''),
      rescatada: !!acta.rescatada,
      // 'individual' = un asesor solo en su puesto. Las interrupciones de ese
      // formato son un hecho del día de trabajo, no una falta que se le anota.
      formato: acta.formato === 'individual' ? 'individual' : 'grupo',
      interrupciones: Number(acta.interrupciones) || 0,
      // Dónde iba la capacitación, para poder retomarla en vez de repetirla.
      progreso: (acta.progreso && typeof acta.progreso === 'object') ? {
        curso: Number(acta.progreso.curso) || 0,
        tituloCurso: String(acta.progreso.tituloCurso || ''),
        modulo: Number(acta.progreso.modulo) || 0,
        nombre: String(acta.progreso.nombre || ''),
        individual: !!acta.progreso.individual
      } : null,
      msEnEspera: Number(acta.msEnEspera) || 0,
      dudas: Array.isArray(acta.dudas) ? acta.dudas.filter(function (d) {
        return d && typeof d === 'object';
      }).map(function (d) {
        return {
          modulo: Number(d.modulo) || 0,
          tituloModulo: String(d.tituloModulo || 'Módulo'),
          indicePunto: Number(d.indicePunto) || 0,
          texto: String(d.texto || ''),
          veces: Number(d.veces) || 1
        };
      }) : [],
      cobertura: (acta.cobertura && typeof acta.cobertura === 'object') ? {
        modulosDictados: Number(acta.cobertura.modulosDictados) || 0,
        modulosTotal: Number(acta.cobertura.modulosTotal) || 0
      } : null,
      personas: gente.map(function (p) {
        if (!p || typeof p !== 'object') p = {};
        return {
          nombre: String(p.nombre || 'Sin registrar'),
          atencion: typeof p.atencion === 'number' ? p.atencion : null,
          llamados: Number(p.llamados) || 0,
          conversaMs: Number(p.conversaMs) || 0,
          // undefined ≠ 0: las actas guardadas antes de que existiera este dato
          // no saben nada de ausencias, y decir "presencia completa" sería
          // inventarles un hecho a personas reales.
          ausenteMs: typeof p.ausenteMs === 'number' ? p.ausenteMs : null,
          llegoTardeMs: Number(p.llegoTardeMs) || 0,
          // Sin esto, un acta reabierta perdía el "y volvió a concentrarse":
          // decía menos que el día que se generó, y siempre en contra.
          cerroAtenta: !!p.cerroAtenta,
          // La aclaración del asistente es suya: viaja con el acta a donde
          // vaya el acta, o el derecho a ser oído sería solo de la pantalla.
          descargo: String(p.descargo || ''),
          // La nota del examen es lo que decide si la constancia dice APROBADO:
          // tiene que sobrevivir a que el acta se reabra o se restaure.
          examen: (p.examen && typeof p.examen === 'object') ? {
            nota: Number(p.examen.nota) || 0,
            minimo: Number(p.examen.minimo) || 0,
            bien: Number(p.examen.bien) || 0,
            total: Number(p.examen.total) || 0,
            aprobado: !!p.examen.aprobado,
            incompleto: !!p.examen.incompleto,
            intento: Number(p.examen.intento) || 1
          } : null,
          // Un examen empezado y nunca calificado: sus aciertos parciales no
          // pueden leerse como nota en el acta, el CSV ni la constancia.
          examenAbandonado: !!p.examenAbandonado,
          examenPreguntasTotal: Number(p.examenPreguntasTotal) || 0,
          paraSupervisor: !!p.paraSupervisor,
          respuestas: Array.isArray(p.respuestas) ? p.respuestas.filter(function (r) {
            return r && typeof r === 'object';
          }) : []
        };
      })
    };
  }

  /* Nombres que la app pone sola cuando no supo quién era alguien. No son
     identidades: fundir los "Asistente 1" de cinco sesiones distintas en una
     sola ficha crearía una persona que no existe, con constancia y todo. */
  /* Clave de identidad de una persona. Sin quitar tildes ni espacios dobles,
     "José Pérez" y "Jose Perez" son dos asesores distintos en el historial —
     y la evidencia de uno solo queda partida en dos fichas. */
  function clavePersona(nombre) {
    return String(nombre || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

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
    // De un examen interrumpido no salen "aciertos": salen respuestas sueltas
    // de algo que nunca se terminó de medir.
    if (persona.examenAbandonado) return { bien: 0, total: 0, sinCalificar: 0, interrumpido: true };
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
        var clave = clavePersona(p.nombre);
        if (!clave || esNombreGenerico(p.nombre)) return;
        if (!mapa[clave]) {
          mapa[clave] = { nombre: p.nombre.replace(/\s+/g, ' ').trim(),
                          sesiones: [], atencionSuma: 0, atencionN: 0, llamados: 0 };
        }
        // Entre dos formas del mismo nombre gana la que trae tildes: es la que
        // el coordinador escribió en la lista del equipo.
        if (/[áéíóúñÁÉÍÓÚÑ]/.test(p.nombre) && !/[áéíóúñÁÉÍÓÚÑ]/.test(mapa[clave].nombre)) {
          mapa[clave].nombre = p.nombre.replace(/\s+/g, ' ').trim();
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

  /* Vigencia de la capacitación. Es la razón por la que un cliente NO cancela
     a los dos meses: capacita a sus 60 asesores y la plataforma se queda sin
     nada que hacer… hasta que empieza a avisar quién debe recertificarse.
     También es real desde el cumplimiento: una capacitación en Ley 2300 de
     hace tres años no prueba gran cosa ante una auditoría de hoy. */
  var CLAVE_VIGENCIA = 'vera.vigencia-meses';
  var VIGENCIA_POR_DEFECTO = 12;
  var DIAS_AVISO = 30;

  function vigenciaMeses() {
    var v = parseInt(leer(CLAVE_VIGENCIA), 10);
    return (v > 0 && v <= 120) ? v : VIGENCIA_POR_DEFECTO;
  }

  function fijarVigencia(meses) {
    var n = parseInt(meses, 10);
    if (n > 0 && n <= 120) escribir2(CLAVE_VIGENCIA, String(n));
  }

  /* Estado de cada persona en cada curso que tomó: al día, por vencer o
     vencido. Solo cuentan las sesiones reales — una demostración no
     certifica a nadie. */
  function recertificaciones() {
    var meses = vigenciaMeses();
    var ahora = Date.now();
    var ultimas = {}; // clave: persona|curso
    listar().forEach(function (s) {
      if (s.modo !== 'camara') return;
      var cuando = new Date(s.fecha).getTime();
      if (isNaN(cuando)) return;
      s.personas.forEach(function (p) {
        if (esNombreGenerico(p.nombre)) return;
        var clave = clavePersona(p.nombre) + '|' + s.titulo;
        // listar() ya viene de la más reciente a la más vieja, pero no se
        // asume: se compara siempre y se conserva la última de verdad.
        if (!ultimas[clave] || cuando > ultimas[clave].cuando) {
          ultimas[clave] = { nombre: p.nombre, curso: s.titulo, cuando: cuando, id: s.id };
        }
      });
    });

    var msVigencia = meses * 30.44 * 24 * 3600 * 1000;
    return Object.keys(ultimas).map(function (k) {
      var r = ultimas[k];
      var vence = r.cuando + msVigencia;
      var diasRestantes = Math.round((vence - ahora) / (24 * 3600 * 1000));
      return {
        nombre: r.nombre,
        curso: r.curso,
        ultima: new Date(r.cuando).toISOString(),
        diasRestantes: diasRestantes,
        estado: diasRestantes < 0 ? 'vencido' : (diasRestantes <= DIAS_AVISO ? 'por-vencer' : 'al-dia')
      };
    }).sort(function (a, b) { return a.diasRestantes - b.diasRestantes; });
  }

  /* Folio del acta: huella SHA-256 de su contenido, que el navegador calcula
     gratis y sin red (crypto.subtle). Sirve para lo que promete y nada más:
     identificar un acta de forma única y permitir comprobar que el papel
     impreso corresponde al registro guardado. NO es una firma digital ni
     prueba quién la emitió — decir lo contrario sería mentir en un documento
     que puede terminar en una carpeta de personal. */
  function calcularFolio(acta) {
    if (!window.crypto || !crypto.subtle || !window.TextEncoder) {
      return Promise.resolve(null); // fuera de HTTPS/localhost no existe
    }
    // Se firma el CONTENIDO, no el envoltorio: el folio no puede cambiar solo
    // porque el acta se reabra o se le asigne otro id al importarla.
    var esencia = {
      fecha: acta.fecha,
      titulo: acta.titulo,
      modo: acta.modo,
      duracionMin: acta.duracionMin,
      grupo: acta.grupo || '',
      personas: (acta.personas || []).map(function (p) {
        return [p.nombre, p.atencion, p.llamados, p.conversaMs, p.ausenteMs,
                p.paraSupervisor ? 1 : 0, (p.respuestas || []).length];
      })
    };
    var datos = new TextEncoder().encode(JSON.stringify(esencia));
    return crypto.subtle.digest('SHA-256', datos).then(function (buffer) {
      var bytes = new Uint8Array(buffer);
      var hex = '';
      for (var i = 0; i < 6; i++) {
        hex += ('0' + bytes[i].toString(16)).slice(-2);
      }
      return hex.toUpperCase().replace(/(.{4})(?=.)/g, '$1-'); // ABCD-EF12-3456
    }).catch(function () { return null; });
  }

  /* Panorama de dudas por curso. Una duda suelta en un acta es una anécdota;
     el mismo punto pedido en cuatro de cinco sesiones es un diagnóstico: ese
     párrafo está mal escrito. Es lo que convierte a Vera en algo que MEJORA
     la capacitación de la empresa, no solo que la dicta. */
  function panoramaDudas(incluirDemos) {
    var porCurso = {};
    listar().forEach(function (s) {
      if (!incluirDemos && s.modo !== 'camara') return;
      if (!porCurso[s.titulo]) porCurso[s.titulo] = { curso: s.titulo, sesiones: 0, puntos: {} };
      var c = porCurso[s.titulo];
      c.sesiones += 1;
      (s.dudas || []).forEach(function (d) {
        var clave = d.tituloModulo + '|' + d.indicePunto;
        if (!c.puntos[clave]) {
          c.puntos[clave] = { tituloModulo: d.tituloModulo, texto: d.texto, sesiones: 0, veces: 0 };
        }
        c.puntos[clave].sesiones += 1;
        c.puntos[clave].veces += (d.veces || 1);
      });
    });
    return Object.keys(porCurso).map(function (k) {
      var c = porCurso[k];
      return {
        curso: c.curso,
        sesiones: c.sesiones,
        puntos: Object.keys(c.puntos).map(function (j) { return c.puntos[j]; })
          .sort(function (a, b) { return b.sesiones - a.sesiones || b.veces - a.veces; })
      };
    }).filter(function (c) { return c.puntos.length; })
      .sort(function (a, b) { return b.puntos.length - a.puntos.length; });
  }

  /* Lista del equipo. Con seis asesores nuevos al mes y nombres escritos a
     mano, "Juan", "Juan Perez" y "Juanpa" se vuelven tres personas distintas
     en el historial — y la evidencia se fragmenta sola, en silencio, justo
     para el día en que hay que demostrar quién se capacitó. Con la lista
     cargada, el asesor elige su nombre en vez de escribirlo. */
  var CLAVE_NOMINA = 'vera.nomina';

  function nomina() {
    var texto = leer(CLAVE_NOMINA) || '';
    return texto.split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(Boolean)
      // Sin repetidos, respetando el orden en que los escribió el coordinador.
      .filter(function (n, i, arr) {
        return arr.findIndex(function (m) {
          return m.toLowerCase() === n.toLowerCase();
        }) === i;
      });
  }

  function nominaTexto() { return leer(CLAVE_NOMINA) || ''; }

  function guardarNomina(texto) { return escribir2(CLAVE_NOMINA, String(texto || '')); }

  /* Los números del piloto. Sirven para una sola conversación, y es la que
     decide si esto se queda: la del jefe preguntando "¿y esto sí sirvió?".
     La cifra que más pesa no es cuánta gente pasó — es cuántas HORAS de
     capacitación se dictaron sin que un capacitador humano estuviera ahí. */
  function resumenPiloto(desdeIso) {
    var desde = desdeIso ? new Date(desdeIso).getTime() : 0;
    var sesiones = listar().filter(function (s) {
      if (s.modo !== 'camara') return false; // una demostración no capacitó a nadie
      var t = new Date(s.fecha).getTime();
      return !isNaN(t) && t >= desde;
    });

    var gente = {}, minutos = 0, conExamen = 0, aprobados = 0, primerIntento = 0;
    var interrupciones = 0, individuales = 0, interrumpidos = 0;

    sesiones.forEach(function (s) {
      // duracionMin ya viene con la espera y la pausa descontadas: es tiempo
      // en que de verdad hubo capacitación.
      minutos += s.duracionMin || 0;
      interrupciones += s.interrupciones || 0;
      if (s.formato === 'individual') individuales += 1;
      s.personas.forEach(function (p) {
        // Misma clave que el historial: si no, el tablero cuenta como dos
        // personas a quien aparece con tilde en una sesion y sin ella en otra.
        if (!esNombreGenerico(p.nombre)) gente[clavePersona(p.nombre)] = true;
        if (p.examen && p.examen.total) {
          conExamen += 1;
          if (p.examen.aprobado) {
            aprobados += 1;
            if (p.examen.intento === 1) primerIntento += 1;
          }
        } else if (p.examenAbandonado) {
          // Presentó y no terminó: dejarlo fuera del denominador inflaría la
          // tasa de aprobación, que es justo el número que va a una reunión.
          conExamen += 1;
          interrumpidos += 1;
        }
      });
    });

    var personas = Object.keys(gente).length;
    return {
      sesiones: sesiones.length,
      individuales: individuales,
      personas: personas,
      // Horas dictadas sin capacitador humano presente: el argumento entero.
      horas: Math.round((minutos / 60) * 10) / 10,
      minutosPromedio: sesiones.length ? Math.round(minutos / sesiones.length) : 0,
      conExamen: conExamen,
      aprobados: aprobados,
      // Solo se calcula sobre quienes SÍ presentaron examen: sacar un
      // porcentaje sobre todos inflaría el resultado con los que no lo tomaron.
      tasaAprobacion: conExamen ? Math.round((aprobados / conExamen) * 100) : null,
      tasaPrimerIntento: conExamen ? Math.round((primerIntento / conExamen) * 100) : null,
      examenesInterrumpidos: interrumpidos,
      interrupciones: interrupciones
    };
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
                  'Sin calificar', 'Nota del examen (%)', 'Resultado', 'Intento',
                  'Aclaración del asistente', 'Revisar']];
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
          p.examen && p.examen.total ? p.examen.nota : '',
          p.examen && p.examen.total
            ? (p.examen.aprobado ? 'APROBADO' : 'NO APROBADO')
            : (p.examenAbandonado ? 'EXAMEN INTERRUMPIDO — SIN NOTA' : ''),
          p.examen && p.examen.total ? p.examen.intento : '',
          p.descargo,
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
      JSON.stringify({
        version: 1,
        exportado: new Date().toISOString(),
        nomina: nominaTexto(), // sin la lista, el respaldo restaurado deja de reconocer al equipo
        actas: leerCrudo()
      }, null, 1),
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
    // La lista del equipo se restaura solo si aquí no hay una: nunca se pisa
    // la del computador que está recibiendo el respaldo.
    if (typeof datos.nomina === 'string' && datos.nomina.trim() && !nominaTexto().trim()) {
      guardarNomina(datos.nomina);
    }
    if (!escribir(actuales)) return { ok: false, error: 'No se pudo guardar: el almacenamiento está lleno.' };
    return { ok: true, nuevas: nuevas, repetidas: entrantes.length - nuevas };
  }

  // ── Borrado (Ley 1581: el titular puede pedir supresión) ─
  function borrarSesion(id) {
    var quedan = leerCrudo().filter(function (a, i) { return normalizar(a, i).id !== id; });
    return escribir(quedan);
  }

  function borrarPersona(nombre) {
    var clave = clavePersona(nombre);
    var quitar = function (lista) {
      // Datos crudos, no normalizados: aquí también puede llegar basura de un
      // respaldo, y el botón "Borrar sus datos" no puede fallar en silencio.
      if (!Array.isArray(lista)) return [];
      return lista.filter(function (p) {
        return !p || typeof p !== 'object' || clavePersona(p.nombre) !== clave;
      });
    };
    var actas = leerCrudo().filter(function (a) {
      return a && typeof a === 'object'; // una entrada nula tumbaba el borrado
    }).map(function (a) {
      a.personas = quitar(a.personas);
      return a;
    }).filter(function (a) { return a.personas.length > 0; });
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
    vigenciaMeses: vigenciaMeses,
    fijarVigencia: fijarVigencia,
    recertificaciones: recertificaciones,
    panoramaDudas: panoramaDudas,
    resumenPiloto: resumenPiloto,
    nomina: nomina,
    nominaTexto: nominaTexto,
    guardarNomina: guardarNomina,
    calcularFolio: calcularFolio,
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
