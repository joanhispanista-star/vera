/* Contenido de la capacitación.
   El contenido vive en un formato de texto plano que Joan o el cliente pueden
   editar sin saber programar (ver el editor en la app). Aquí está el de fábrica:
   una inducción real para asesores de cobranza, porque ese es el primer cliente
   al que se le va a mostrar la plataforma. */

(function () {
  'use strict';

  var CLAVE_LOCAL = 'vera.contenido.texto';

  // Formato del texto:
  //   línea 1        → título de la capacitación
  //   # Título       → empieza un módulo
  //   - texto        → punto que Vera lee en voz alta
  //   ? pregunta | claves separadas por coma | respuesta modelo
  var TEXTO_DE_FABRICA = [
    'Inducción básica para asesores de cobranza',
    '',
    '# Bienvenida: qué es cobrar bien',
    '- En esta empresa cobrar no es pelear: es lograr acuerdos. Un buen asesor recupera la plata y deja al cliente dispuesto a volver a contestar el teléfono.',
    '- Tu herramienta principal es la escucha. El cliente que se siente escuchado negocia; el que se siente atacado cuelga y bloquea el número.',
    '- Cada llamada tiene un objetivo concreto: salir con una promesa de pago con fecha y monto, o con un dato nuevo que acerque el acuerdo.',
    '? ¿Con qué objetivo concreto debe terminar toda llamada? | promesa, fecha, monto, acuerdo | Salir con una promesa de pago con fecha y monto, o al menos con un dato nuevo que acerque el acuerdo.',
    '',
    '# La ley: lo que un asesor nunca puede hacer',
    '- La Ley 2300 de 2023 protege al deudor: solo se le contacta en los horarios permitidos y por los canales que la ley y el cliente permiten. Saltarse eso expone a la empresa a sanciones de la Superintendencia.',
    '- Prohibido contactar a las referencias personales o a la familia para presionar un pago. La deuda es del titular y de nadie más.',
    '- Prohibido amenazar, humillar o mentir: nada de hacerse pasar por juzgados ni inventar embargos. Un solo audio de esos puede costar una sanción y la reputación de la empresa.',
    '? ¿Podemos llamar a las referencias personales del cliente para presionar el pago? | no, prohibido, titular | No: la Ley 2300 lo prohíbe. La deuda solo se trata con el titular o con quien él autorice.',
    '',
    '# La llamada: el método de la casa',
    '- Saluda, identifícate con tu nombre y el de la empresa, y confirma con quién estás hablando. Sin titular confirmado no se menciona la deuda: eso es protección de datos.',
    '- Escucha la objeción sin interrumpir y valídala: entiendo, la situación está dura. Después ofrece opciones concretas: fecha próxima, pago parcial o plan de pagos.',
    '- Cierra en concreto: repite el acuerdo con fecha y monto, despídete con respeto y registra todo en el sistema apenas cuelgues.',
    '? Antes de mencionar la deuda, ¿qué hay que confirmar siempre? | titular, identidad, confirmar, con quién | Que estamos hablando con el titular: sin confirmar la identidad no se menciona la deuda.'
  ].join('\n');

  // Convierte el texto plano a la estructura que usa la app.
  function analizarTexto(texto) {
    var lineas = String(texto || '').split('\n');
    var contenido = { titulo: '', modulos: [] };
    var moduloActual = null;

    for (var i = 0; i < lineas.length; i++) {
      var linea = lineas[i].trim();
      if (!linea) continue;

      if (linea.charAt(0) === '#') {
        moduloActual = { titulo: linea.slice(1).trim(), puntos: [], pregunta: null };
        contenido.modulos.push(moduloActual);
      } else if (linea.charAt(0) === '-' && moduloActual) {
        moduloActual.puntos.push(linea.slice(1).trim());
      } else if (linea.charAt(0) === '?' && moduloActual) {
        var partes = linea.slice(1).split('|');
        moduloActual.pregunta = {
          texto: (partes[0] || '').trim(),
          claves: (partes[1] || '').split(',').map(function (c) { return c.trim(); }).filter(Boolean),
          respuestaModelo: (partes[2] || '').trim()
        };
      } else if (!contenido.titulo) {
        contenido.titulo = linea;
      }
    }

    if (!contenido.titulo) contenido.titulo = 'Capacitación';
    // Módulos sin puntos no sirven para dictar: se descartan en silencio.
    contenido.modulos = contenido.modulos.filter(function (m) { return m.puntos.length > 0; });
    return contenido;
  }

  function obtenerTexto() {
    try {
      return localStorage.getItem(CLAVE_LOCAL) || TEXTO_DE_FABRICA;
    } catch (e) {
      return TEXTO_DE_FABRICA;
    }
  }

  window.ContenidoLib = {
    obtener: function () { return analizarTexto(obtenerTexto()); },
    obtenerTexto: obtenerTexto,
    guardarTexto: function (texto) {
      try { localStorage.setItem(CLAVE_LOCAL, texto); } catch (e) { /* sin almacenamiento, se usa en memoria */ }
    },
    // Sin efectos: devuelve el texto de fábrica y ya. Borrar lo guardado del
    // cliente solo puede pasar cuando él oprime Guardar — "Cerrar sin guardar"
    // tiene que poder deshacer una restauración oprimida por curiosidad.
    restaurar: function () {
      return TEXTO_DE_FABRICA;
    },
    analizarTexto: analizarTexto
  };
})();
