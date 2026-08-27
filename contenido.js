/* Contenido de la capacitación: tres cursos de fábrica, editables en la app.
   Regla heredada de la Academia: el contenido no se inventa. Los datos legales
   de estos cursos (horarios de la Ley 2300, los 20 días del reporte, la
   permanencia del dato negativo) se verificaron contra la SIC, la
   Superfinanciera y el texto de las leyes el 26-ago-2026. Si una ley cambia,
   se corrige aquí o en el editor — nunca se deja texto viejo dictándose. */

(function () {
  'use strict';

  var CLAVE_CURSO_ACTIVO = 'vera.curso.activo';
  var CLAVE_VIEJA = 'vera.contenido.texto'; // donde guardaba la primera versión

  // Formato del texto:
  //   línea 1        → título del curso
  //   # Título       → empieza un módulo
  //   - texto        → punto que Vera lee en voz alta
  //   ? pregunta | claves separadas por coma | respuesta modelo
  var TEXTO_INDUCCION = [
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

  var TEXTO_LEY = [
    'Ley 2300 y el marco legal de la cobranza',
    '',
    '# La Ley 2300: las reglas del contacto',
    '- La Ley 2300 de 2023 regula cómo se cobra en Colombia. Aplica a bancos, fintech y a las empresas de cobranza que trabajan para ellos: si usted cobra, esta ley es su manual de tránsito.',
    '- El deudor elige el canal: si pide que no lo llamen y que le escriban, se respeta. Insistir por un canal que el cliente prohibió no es persistencia: es una infracción.',
    '- Los horarios son de día: de lunes a viernes de siete de la mañana a siete de la noche, y los sábados de ocho de la mañana a tres de la tarde. Domingos y festivos no se cobra. Y la frecuencia también está limitada: máximo un contacto de cobranza al día.',
    '? ¿Qué pasa si el deudor pide que solo lo contacten por escrito? | canal, respeta, escrito, elige | Se respeta: el deudor elige el canal, y saltárselo es una infracción a la Ley 2300.',
    '',
    '# Lo prohibido: la lista que no se negocia',
    '- La deuda solo se habla con el titular, el codeudor o el avalista. Llamar a las referencias, a la familia o al jefe para presionar es ilegal, así sea solo para dejar razón.',
    '- Prohibido amenazar, humillar o mentir: nada de embargos inventados, nada de hacerse pasar por juzgado o fiscalía, nada de listas públicas de morosos.',
    '- El acoso también está prohibido: llamar sin descanso no cobra más rápido, y sí convierte una gestión legal en una sanción de la Superintendencia.',
    '? ¿Podemos dejarle razón al jefe del deudor para que le recuerde la deuda? | no, prohibido, titular, terceros | No: divulgar la deuda a terceros está prohibido. Solo se habla con el titular, el codeudor o el avalista.',
    '',
    '# Habeas data financiero: el reporte a centrales',
    '- Antes de reportar negativamente a un cliente en las centrales de riesgo hay que avisarle con al menos veinte días calendario, para que pueda pagar o discutir la deuda. Reportar sin avisar tumba el reporte y expone a la empresa.',
    '- El dato negativo no es eterno: permanece el doble del tiempo de la mora, con tope de cuatro años desde el pago. Decir que quedará reportado de por vida es mentira, y las mentiras en cobranza se sancionan.',
    '- El reporte se menciona como dato cierto, nunca como amenaza: su obligación está próxima a reporte y por ley debo avisarle. Esa frase informa; cualquier cosa más ya es presión ilegal.',
    '? ¿Con cuánta anticipación hay que avisar antes de un reporte negativo? | veinte, 20 | Con al menos veinte días calendario, para que el cliente pueda pagar o discutir la deuda antes del reporte.',
    '',
    '# Datos personales: la Ley 1581 en cada llamada',
    '- Antes de mencionar la deuda, confirme con quién habla. Si contesta otra persona, la deuda no existe: se pide al titular o se devuelve la llamada, y se cuelga.',
    '- Los datos del cliente son para cobrar su deuda y nada más: compartirlos, venderlos o usarlos para otra cosa viola el habeas data.',
    '- Toda gestión queda registrada: qué se dijo, cuándo y por qué canal. Ese registro es la defensa de la empresa el día que un cliente reclame ante la Superintendencia.',
    '? Contesta la esposa del titular y pregunta de parte de quién llaman. ¿Qué se le dice de la deuda? | nada, no, titular, devuelvo | Nada: se pide hablar con el titular o se dice que se devuelve la llamada. La deuda no existe para terceros.'
  ].join('\n');

  var TEXTO_PERSUASION = [
    'Persuasión ética para cobrar',
    '',
    '# La psicología del que debe',
    '- El que está en mora casi nunca es un estafador: es alguien asustado que evita el tema por vergüenza. Su primera reacción es defenderse; la segunda, si usted lo permite, es negociar.',
    '- La herramienta más rentable es el tono: calmado, sin juicio, de persona a persona. El cliente que no se siente atacado se queda en la línea, y el que se queda en la línea llega a acuerdos.',
    '- Escuche y nombre lo que oye: entiendo, quedó sin trabajo y esto lo tiene estresado. Nombrar la emoción del otro la desarma; ignorarla la agranda.',
    '? ¿Cuál es la primera reacción típica de un cliente en mora, y qué hacemos con ella? | defensa, defenderse, vergüenza, miedo, escuchar | Defenderse, por vergüenza o miedo. Se le baja la defensa escuchando sin juzgar, no discutiendo.',
    '',
    '# Objeciones: escuchar, validar, ofrecer',
    '- Paso uno: escuchar la objeción completa sin interrumpir. El que interrumpe confirma que no le importa; el que escucha se gana el derecho a proponer.',
    '- Paso dos: validar sin regalar la deuda. Entiendo, la situación está dura no es lo mismo que no se preocupe: se valida la emoción, no el no pago.',
    '- Paso tres: ofrecer siempre dos opciones concretas: ¿le queda mejor abonar el quince o pagar completo el treinta? El que elige entre dos opciones ya decidió pagar; solo está eligiendo cómo.',
    '? Un cliente dice que no tiene plata. Después de escuchar y validar, ¿cuál es el tercer paso? | opciones, dos, ofrecer, fechas | Ofrecer dos opciones concretas de pago: quien elige entre dos fechas ya decidió pagar.',
    '',
    '# El cierre: de la charla al compromiso',
    '- Ancle alto: proponga primero el pago total. Frente a ese ancla, el abono parcial se siente alcanzable y el cliente lo acepta con alivio.',
    '- Consiga síes pequeños antes del sí grande: ¿me confirma que este sigue siendo su número?, ¿le sirve el recibo por WhatsApp? El que ya dijo sí dos veces dice sí la tercera.',
    '- Todo cierre se repite en voz alta y en concreto: entonces quedamos en cincuenta mil el viernes quince por la aplicación, ¿correcto? Compromiso que no se repite y se confirma, no existe.',
    '? ¿Por qué se propone primero el pago total aunque sepamos que el cliente abonará menos? | ancla, anclar, parcial, alcanzable | Es el ancla: comparado con el total, el abono parcial se siente alcanzable y se acepta más fácil.',
    '',
    '# La línea roja: persuadir no es presionar',
    '- La urgencia se usa solo si es cierta: el descuento autorizado vence el viernes persuade; mañana lo embargan, si no es verdad, es ilegal y destruye la confianza que cobra.',
    '- Repetir llamadas hasta cansar no es persuasión: es acoso, y la Ley 2300 lo sanciona. Una llamada bien hecha logra lo que diez llamadas de presión no logran.',
    '- La prueba final de toda técnica: ¿funcionaría si el cliente la conociera? El ancla y las dos opciones pasan la prueba; la mentira y la vergüenza no. Lo que no pasa la prueba, no se usa.',
    '? Decirle al cliente que mañana pasa a jurídica, sin ser cierto: ¿se puede? | no, mentira, ilegal, falsa | No: la urgencia falsa es mentira, es sancionable y quema la relación. La urgencia solo se usa cuando es cierta.'
  ].join('\n');

  var CURSOS = [
    { clave: 'induccion', texto: TEXTO_INDUCCION },
    { clave: 'ley2300', texto: TEXTO_LEY },
    { clave: 'persuasion', texto: TEXTO_PERSUASION }
  ];

  // Convierte el texto plano a la estructura que usa la app.
  function analizarTexto(texto) {
    var lineas = String(texto || '').split('\n');
    var contenido = { titulo: '', modulos: [] };
    var moduloActual = null;

    for (var i = 0; i < lineas.length; i++) {
      var linea = lineas[i].trim();
      if (!linea) continue;

      if (linea.charAt(0) === '#') {
        moduloActual = { titulo: linea.slice(1).trim(), puntos: [], preguntas: [], pregunta: null };
        contenido.modulos.push(moduloActual);
      } else if (linea.charAt(0) === '-' && moduloActual) {
        moduloActual.puntos.push(linea.slice(1).trim());
      } else if (linea.charAt(0) === '?' && moduloActual) {
        var partes = linea.slice(1).split('|');
        // Varias preguntas por módulo se acumulan. Antes la asignación directa
        // pisaba la anterior: un cliente que escribía tres perdía dos, en
        // silencio y sin manera de notarlo hasta el día de la capacitación.
        moduloActual.preguntas.push({
          texto: (partes[0] || '').trim(),
          claves: (partes[1] || '').split(',').map(function (c) { return c.trim(); }).filter(Boolean),
          respuestaModelo: (partes[2] || '').trim()
        });
        moduloActual.pregunta = moduloActual.preguntas[0]; // alias del primero
      } else if (!contenido.titulo) {
        contenido.titulo = linea;
      }
    }

    if (!contenido.titulo) contenido.titulo = 'Capacitación';
    // Módulos sin puntos no sirven para dictar: se descartan en silencio.
    contenido.modulos = contenido.modulos.filter(function (m) { return m.puntos.length > 0; });
    return contenido;
  }

  /* Cuánto dura la capacitación. Es lo primero que pregunta un jefe de
     operación antes de sacar asesores del piso, y hoy no había forma de
     saberlo. La velocidad (13 caracteres por segundo) es la de la voz del
     navegador a ritmo normal, medida sobre los cursos de fábrica. */
  function estimarMinutos(contenido, nPersonas) {
    var caracteres = 0, preguntas = 0;
    contenido.modulos.forEach(function (m) {
      m.puntos.forEach(function (p) { caracteres += p.length; });
      preguntas += (m.preguntas || []).length;
    });
    var segundos = caracteres / 13;        // el dictado
    segundos += preguntas * 45;            // preguntar, esperar y comentar
    segundos += 40;                        // saludo y despedida
    segundos += (nPersonas || 0) * 15;     // registro de nombres
    return Math.max(1, Math.round(segundos / 60));
  }

  function leer(clave) {
    try { return localStorage.getItem(clave); } catch (e) { return null; }
  }
  function escribir(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento, queda en memoria */ }
  }

  function indiceActivo() {
    var i = parseInt(leer(CLAVE_CURSO_ACTIVO), 10);
    return (i >= 0 && i < CURSOS.length) ? i : 0;
  }

  function textoDe(indice) {
    var curso = CURSOS[indice];
    var editado = leer('vera.contenido.' + curso.clave);
    // Lo que se editó en la versión de un solo curso era la inducción.
    if (!editado && curso.clave === 'induccion') editado = leer(CLAVE_VIEJA);
    return editado || curso.texto;
  }

  window.ContenidoLib = {
    listar: function () {
      return CURSOS.map(function (c, i) {
        return { indice: i, titulo: analizarTexto(textoDe(i)).titulo };
      });
    },
    indiceActivo: indiceActivo,
    claveActiva: function () { return CURSOS[indiceActivo()].clave; },
    elegir: function (indice) { escribir(CLAVE_CURSO_ACTIVO, String(indice)); },
    obtener: function () { return analizarTexto(textoDe(indiceActivo())); },
    obtenerTexto: function () { return textoDe(indiceActivo()); },
    guardarTexto: function (texto) {
      escribir('vera.contenido.' + CURSOS[indiceActivo()].clave, texto);
    },
    // Sin efectos: devuelve el texto de fábrica y ya. Borrar lo guardado del
    // cliente solo puede pasar cuando él oprime Guardar — "Cerrar sin guardar"
    // tiene que poder deshacer una restauración oprimida por curiosidad.
    restaurar: function () {
      return CURSOS[indiceActivo()].texto;
    },
    analizarTexto: analizarTexto,
    estimarMinutos: estimarMinutos,

    /* Los cursos editados viven en el localStorage de UN aparato. Sin esto, un
       cliente que arma su inducción en el computador de la sala no puede
       usarla en otro, y tendría que volver a escribirla. */
    exportar: function () {
      var paquete = { version: 1, exportado: new Date().toISOString(), cursos: {} };
      CURSOS.forEach(function (c, i) { paquete.cursos[c.clave] = textoDe(i); });
      return JSON.stringify(paquete, null, 1);
    },
    importar: function (textoJson) {
      var datos;
      try { datos = JSON.parse(textoJson); } catch (e) {
        return { ok: false, error: 'El archivo no es un paquete de cursos de Vera.' };
      }
      if (!datos || !datos.cursos) return { ok: false, error: 'El archivo no tiene cursos de Vera.' };
      var cambiados = 0;
      CURSOS.forEach(function (c) {
        var texto = datos.cursos[c.clave];
        if (typeof texto === 'string' && texto.trim()) {
          escribir('vera.contenido.' + c.clave, texto);
          cambiados++;
        }
      });
      return cambiados
        ? { ok: true, cambiados: cambiados }
        : { ok: false, error: 'El archivo no traía ningún curso reconocible.' };
    }
  };
})();
