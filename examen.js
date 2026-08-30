/* Examen final: la diferencia entre "escuchó la capacitación" y "sabe hacer
   el trabajo".

   Existe por el caso real que definió al primer cliente: un área de cobranzas
   donde quien capacita no logra dejar bien formados a los asesores. Vera no
   compite contra un buen capacitador — compite contra una capacitación mala.
   Entonces no basta con dictar: hay que poder demostrar que el asesor quedó
   en condiciones de trabajar, y quien no llegue a la nota mínima no puede
   salir con una constancia que diga lo contrario.

   La calificación es por palabras clave, igual que las preguntas de módulo:
   sin LLM y sin costo. Eso obliga a una regla de honestidad — una pregunta sin
   palabras clave NO se puede calificar, así que no entra al examen en vez de
   contarse como acierto regalado. */

(function () {
  'use strict';

  var CLAVE_NOTA = 'vera.nota-minima';
  var NOTA_POR_DEFECTO = 80;
  var MAX_INTENTOS = 3;

  function notaMinima() {
    try {
      var n = parseInt(localStorage.getItem(CLAVE_NOTA), 10);
      return (n >= 50 && n <= 100) ? n : NOTA_POR_DEFECTO;
    } catch (e) {
      return NOTA_POR_DEFECTO;
    }
  }

  function fijarNotaMinima(n) {
    var v = parseInt(n, 10);
    if (v >= 50 && v <= 100) {
      try { localStorage.setItem(CLAVE_NOTA, String(v)); } catch (e) {}
    }
  }

  /* Arma el examen con las preguntas CALIFICABLES del curso.

     Solo entran las de OPCIÓN MÚLTIPLE. Las preguntas abiertas se califican
     buscando palabras clave dentro de la respuesta, y eso no aguanta una
     decisión con consecuencias laborales: "no sé… ¿veinte días?" contaría como
     acierto, y una respuesta perfecta con otras palabras contaría como error.
     Sirven para mantener despierto al grupo durante el dictado; no para
     decidir si alguien sale al teléfono a cobrarle a un cliente. */
  function armar(contenido) {
    var preguntas = [];
    var abiertasFuera = 0;
    (contenido.modulos || []).forEach(function (m, i) {
      (m.preguntas || []).forEach(function (q) {
        if (q.tipo !== 'opciones' || !q.opciones || !q.opciones.length) { abiertasFuera++; return; }
        if (!q.opciones.some(function (o) { return o.correcta; })) { abiertasFuera++; return; }
        // Las opciones también se barajan: si siempre la primera es la buena,
        // el examen se aprueba por costumbre y no por saber.
        var ops = q.opciones.slice();
        for (var z = ops.length - 1; z > 0; z--) {
          var w = Math.floor(Math.random() * (z + 1));
          var aux = ops[z]; ops[z] = ops[w]; ops[w] = aux;
        }
        preguntas.push({
          modulo: i, tituloModulo: m.titulo,
          pregunta: { tipo: 'opciones', texto: q.texto, opciones: ops }
        });
      });
    });
    // Orden variado para que dos asesores seguidos no se pasen las respuestas
    // en el mismo orden; el contenido es el mismo, solo cambia la secuencia.
    for (var k = preguntas.length - 1; k > 0; k--) {
      var j = Math.floor(Math.random() * (k + 1));
      var tmp = preguntas[k]; preguntas[k] = preguntas[j]; preguntas[j] = tmp;
    }
    return { preguntas: preguntas, abiertasFuera: abiertasFuera };
  }

  /* Resultado del examen a partir de las respuestas ya calificadas.
     Devuelve además QUÉ módulos falló, que es lo único que hace útil un
     "no aprobó": decirle exactamente qué tiene que repasar. */
  function calificar(respuestas) {
    var bien = 0;
    var falladosPorModulo = {};
    respuestas.forEach(function (r) {
      if (r.veredicto === 'correcta') {
        bien++;
      } else {
        var t = r.tituloModulo || 'Módulo';
        falladosPorModulo[t] = (falladosPorModulo[t] || 0) + 1;
      }
    });
    var total = respuestas.length;
    var nota = total ? Math.round((bien / total) * 100) : 0;
    var minimo = notaMinima();
    /* El mínimo se guarda en porcentaje, pero un examen se vive en preguntas:
       con 4 preguntas y 80%, "puedes fallar" es mentira — hay que acertarlas
       todas. Se calcula cuántos aciertos hacen falta de verdad, para poder
       decírselo al asesor en los términos en que él lo va a experimentar. */
    var minimoAciertos = total ? Math.ceil((minimo / 100) * total) : 0;
    return {
      bien: bien,
      total: total,
      nota: nota,
      minimo: minimo,
      minimoAciertos: minimoAciertos,
      puedeFallar: Math.max(0, total - minimoAciertos),
      aprobado: total > 0 && bien >= minimoAciertos,
      // Los que más se fallaron van primero: es el orden en que conviene repasar.
      modulosARepasar: Object.keys(falladosPorModulo).sort(function (a, b) {
        return falladosPorModulo[b] - falladosPorModulo[a];
      })
    };
  }

  /* Lo que Vera dice al entregar la nota. Aprobar se celebra; no aprobar se
     dice sin humillar y con la instrucción concreta de qué repasar: el asesor
     nuevo ya llega asustado, y un examen que lo trate mal no enseña nada. */
  /* Cómo se le anuncia el examen: en preguntas, no en porcentaje. "Necesitas
     80%" no le dice a nadie cuántas puede fallar; "de 6, tienes que acertar 5"
     sí — y cuando el mínimo exige perfección, hay que decirlo con esas
     palabras en vez de dejar que lo descubra al final. */
  function fraseAnuncio(nombre, total) {
    var minAciertos = Math.ceil((notaMinima() / 100) * total);
    var puedeFallar = Math.max(0, total - minAciertos);
    if (puedeFallar === 0) {
      return 'Llegó el examen, ' + nombre + '. Son ' + total +
        (total === 1 ? ' pregunta' : ' preguntas') + ', y para aprobar hay que responderlas ' +
        'todas bien: no puedes fallar ninguna.';
    }
    return 'Llegó el examen, ' + nombre + '. Son ' + total + ' preguntas y necesitas acertar ' +
      'al menos ' + minAciertos + ': puedes fallar ' + puedeFallar +
      (puedeFallar === 1 ? '.' : '.');
  }

  function fraseResultado(nombre, resultado, intento) {
    if (resultado.aprobado) {
      return '¡Felicitaciones, ' + nombre + '! Acertaste ' + resultado.bien + ' de ' +
        resultado.total + ', o sea ' + resultado.nota + ' por ciento. ' +
        'Quedas aprobado y tu constancia queda lista.';
    }
    var faltaron = resultado.minimoAciertos - resultado.bien;
    var repaso = resultado.modulosARepasar.length
      ? ' Te recomiendo repasar sobre todo: ' + resultado.modulosARepasar.slice(0, 2).join(', ') + '.'
      : '';
    if (intento >= MAX_INTENTOS) {
      return nombre + ', acertaste ' + resultado.bien + ' de ' + resultado.total +
        ' y necesitabas ' + resultado.minimoAciertos + '.' + repaso +
        ' Ya hiciste los intentos de hoy, así que esto queda en el acta para que lo revises ' +
        'con tu supervisor y volvamos otro día. No es un castigo: es que todavía no estás listo ' +
        'para el teléfono, y soltarte así sería peor.';
    }
    return nombre + ', acertaste ' + resultado.bien + ' de ' + resultado.total +
      ' y necesitabas ' + resultado.minimoAciertos +
      (faltaron === 1 ? ': te faltó una.' : '.') + repaso +
      ' Tranquilo, esto pasa. Repasamos y lo volvemos a intentar.';
  }

  window.Examen = {
    armar: armar,
    calificar: calificar,
    fraseResultado: fraseResultado,
    fraseAnuncio: fraseAnuncio,
    notaMinima: notaMinima,
    fijarNotaMinima: fijarNotaMinima,
    get maxIntentos() { return MAX_INTENTOS; }
  };
})();
