/* "Sacar el proceso": la herramienta que convierte lo que sabe una persona en
   un curso que Vera puede dictar.

   Nació de una respuesta concreta del primer cliente: los SOP de cobranza y
   los procesos del ADMIN "solo están en la cabeza de alguien". Ese es el
   verdadero cuello de botella — no el software. Mientras el proceso no esté
   escrito, ni Vera ni un capacitador humano pueden enseñarlo bien, y cada vez
   que esa persona se va, la empresa vuelve a empezar de cero.

   Las preguntas no son genéricas: son las que un instructor experimentado le
   haría al que sabe, en el orden en que se necesitan para formar a alguien.
   Y el resultado se marca como BORRADOR a propósito: lo escribe quien sabe
   hacer el trabajo, no quien sabe enseñarlo, así que hay que revisarlo antes
   de ponérselo a un asesor nuevo. */

(function () {
  'use strict';

  var CLAVE = 'vera.extraccion';

  /* Cada pregunta produce una parte del curso. 'tipo' dice cómo se convierte:
       intro   → un punto suelto del módulo
       lista   → cada línea de la respuesta se vuelve un punto
       pasos   → cada línea se vuelve un punto numerado ("Paso 1: …")
       riesgo  → punto que Vera dice como advertencia */
  var BLOQUES = [
    {
      titulo: 'El trabajo, en una frase',
      paraQue: 'Un asesor nuevo llega sin saber qué se espera de él. Esto es lo primero que Vera le dice.',
      modulo: 'Qué hace un asesor de cobranza aquí',
      campos: [
        { id: 'que-hace', tipo: 'intro',
          label: '¿Qué hace exactamente un asesor de cobranza en un día normal?',
          pista: 'Cuéntalo como se lo contarías a un primo que nunca ha trabajado en esto.' },
        { id: 'buen-dia', tipo: 'intro',
          label: '¿Cómo se ve un buen día de trabajo? ¿Y uno malo?',
          pista: 'Números concretos si los hay: llamadas, acuerdos, recuperación.' },
        { id: 'espera-jefe', tipo: 'lista',
          label: '¿Qué esperas de un asesor en su primera semana? (una cosa por línea)',
          pista: 'Lo mínimo que debe saber hacer solo al terminar la inducción.' }
      ]
    },
    {
      titulo: 'El sistema: cómo entra y qué ve',
      paraQue: 'Enseñar una herramienta es enseñar dónde se hace clic. Sin esto, el asesor la aprende a los tropezones.',
      modulo: 'El sistema por dentro',
      campos: [
        { id: 'sistema-nombre', tipo: 'intro',
          label: '¿Cómo se llama el sistema donde trabaja el asesor y para qué sirve?',
          pista: 'Si son varios (sistema, WhatsApp, marcador, Excel), nómbralos todos y di para qué es cada uno.' },
        { id: 'sistema-entrar', tipo: 'pasos',
          label: '¿Cómo entra al sistema? (un paso por línea)',
          pista: 'Desde abrir el programa hasta quedar listo para trabajar. Incluye usuario, clave, permisos.' },
        { id: 'sistema-primero', tipo: 'intro',
          label: 'Al entrar, ¿qué es lo primero que ve y qué debe mirar ahí?',
          pista: 'La pantalla de inicio: qué significan los números o las listas que aparecen.' },
        { id: 'sistema-partes', tipo: 'lista',
          label: '¿Cuáles son las secciones o pestañas que SÍ usa a diario? (una por línea)',
          pista: 'Nombre de la sección y para qué la usa. Deja fuera lo que no le toca.' }
      ]
    },
    {
      titulo: 'A quién llama hoy',
      paraQue: 'La pregunta que un asesor nuevo hace el primer día y que nadie le responde completa.',
      modulo: 'La cartera: a quién se le cobra hoy',
      campos: [
        { id: 'cartera-asigna', tipo: 'intro',
          label: '¿Cómo sabe el asesor a quién tiene que llamar hoy?',
          pista: '¿Se le asigna? ¿La busca? ¿Sale en una lista? ¿Quién la arma?' },
        { id: 'cartera-prioriza', tipo: 'lista',
          label: '¿En qué orden debe llamar? ¿Qué cuentas van primero? (una regla por línea)',
          pista: 'Por días de mora, por monto, por promesa incumplida… lo que se use de verdad.' },
        { id: 'cartera-estados', tipo: 'lista',
          label: 'Los estados o categorías de una cuenta: nómbralos y explica cada uno (uno por línea)',
          pista: 'Formato sugerido: NOMBRE DEL ESTADO — qué significa y qué se hace con esa cuenta. Esto es lo que más se equivoca la gente nueva.' }
      ]
    },
    {
      titulo: 'La llamada',
      paraQue: 'El SOP de verdad. Lo que separa a un asesor que recupera de uno que quema clientes.',
      modulo: 'Cómo se hace la llamada',
      campos: [
        { id: 'llamada-pasos', tipo: 'pasos',
          label: 'Los pasos de una llamada bien hecha, en orden (uno por línea)',
          pista: 'Desde que marca hasta que cuelga. Incluye qué dice al saludar y cómo confirma con quién habla.' },
        { id: 'llamada-objeciones', tipo: 'lista',
          label: 'Las tres excusas más comunes y qué se responde a cada una (una por línea)',
          pista: 'Formato: "Cuando dicen X, se responde Y". Esto vale oro y casi nunca está escrito.' },
        { id: 'llamada-cierre', tipo: 'intro',
          label: '¿Cómo se cierra un acuerdo para que el cliente sí cumpla?',
          pista: 'Qué se repite, qué se confirma, qué se le manda después.' }
      ]
    },
    {
      titulo: 'Después de colgar: el registro',
      paraQue: 'Una gestión que no queda bien registrada es una gestión perdida — y en una auditoría, una que nunca existió.',
      modulo: 'Registrar la gestión',
      campos: [
        { id: 'registro-pasos', tipo: 'pasos',
          label: '¿Qué hace en el sistema apenas cuelga? (un paso por línea)',
          pista: 'Dónde entra, qué campos llena, qué escoge, qué guarda.' },
        { id: 'registro-tipificacion', tipo: 'lista',
          label: '¿Cómo se tipifica el resultado de la llamada? (una opción por línea)',
          pista: 'Formato: OPCIÓN — cuándo se usa. Ej.: "No contesta", "Promesa de pago", "Se niega a pagar".' },
        { id: 'registro-promesa', tipo: 'pasos',
          label: 'Si el cliente promete pagar, ¿qué se registra y cómo? (un paso por línea)',
          pista: 'Fecha, monto, dónde queda, quién le hace seguimiento.' }
      ]
    },
    {
      titulo: 'Lo que sale caro',
      paraQue: 'Los errores que un asesor nuevo comete y que cuestan plata, clientes o una sanción.',
      modulo: 'Errores que salen caros',
      campos: [
        { id: 'errores-tipicos', tipo: 'riesgo',
          label: '¿Qué errores comete SIEMPRE la gente nueva en sus primeras semanas? (uno por línea)',
          pista: 'Los de verdad, los que te toca corregir cada vez que entra alguien.' },
        { id: 'errores-prohibido', tipo: 'riesgo',
          label: '¿Qué NO puede hacer nunca, ni tocar, en el sistema? (uno por línea)',
          pista: 'Botones que no se oprimen, campos que no se cambian, cosas que solo hace un supervisor.' },
        { id: 'errores-escalar', tipo: 'intro',
          label: '¿En qué casos debe dejar de gestionar y pasarle el caso a alguien más?',
          pista: 'Cliente que amenaza, abogado de por medio, error del sistema, cliente que ya pagó…' }
      ]
    },
    {
      titulo: 'Cómo lo miden',
      paraQue: 'Un asesor que entiende cómo se calcula su resultado trabaja distinto desde el primer día.',
      modulo: 'Cómo se mide tu trabajo',
      campos: [
        { id: 'medicion-metas', tipo: 'lista',
          label: '¿Qué se le mide a un asesor? (una cosa por línea)',
          pista: 'Formato: INDICADOR — cómo se calcula y cuál es la meta.' },
        { id: 'medicion-pago', tipo: 'intro',
          label: '¿Cómo se le paga? ¿De qué depende su comisión?',
          pista: 'En palabras simples, sin fórmulas si no hacen falta.' }
      ]
    }
  ];

  function $(id) { return document.getElementById(id); }

  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) { return {}; }
  }
  function guardar(datos) {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {}
  }

  function totalCampos() {
    return BLOQUES.reduce(function (n, b) { return n + b.campos.length; }, 0);
  }

  function pintarAvance() {
    var datos = leer();
    var hechas = Object.keys(datos).filter(function (k) {
      return String(datos[k] || '').trim().length > 0;
    }).length;
    var total = totalCampos();
    $('avance-texto').textContent = hechas + ' de ' + total + ' respondidas' +
      (hechas === total ? ' — completo' : '');
    $('avance-barra').style.width = Math.round((hechas / total) * 100) + '%';
  }

  function escapar(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function pintarFormulario() {
    var datos = leer();
    $('formulario').innerHTML = BLOQUES.map(function (b) {
      return '<div class="bloque"><h2>' + b.titulo + '</h2>' +
        '<p class="para-que">' + b.paraQue + '</p>' +
        b.campos.map(function (c) {
          return '<div class="campo">' +
            '<label for="c-' + c.id + '">' + c.label + '</label>' +
            '<span class="pista">' + c.pista + '</span>' +
            '<textarea id="c-' + c.id + '" data-campo="' + c.id + '">' +
              escapar(datos[c.id] || '') + '</textarea>' +
            '</div>';
        }).join('') + '</div>';
    }).join('');
  }

  // ── Del formulario al curso ─────────────────────────────
  function lineas(texto) {
    return String(texto || '').split(/\r?\n/)
      .map(function (l) {
        // Se quitan las viñetas y la numeración que la gente escribe por
        // costumbre ("1. ", "- ", "• "), pero NO un número que sea parte de la
        // frase: "30 días de mora" perdía el 30 y quedaba "días de mora".
        return l.trim().replace(/^\s*(?:[-•*]+\s*|\d{1,2}\s*[.)]\s+)/, '').trim();
      })
      .filter(Boolean);
  }

  function frase(texto) {
    var t = String(texto || '').trim().replace(/\s+/g, ' ');
    if (!t) return '';
    // Vera lo va a LEER en voz alta: una línea sin punto final suena cortada.
    if (!/[.!?…]$/.test(t)) t += '.';
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function generar() {
    var datos = leer();
    var salida = ['Procesos y SOP de cobranza (BORRADOR — revisar antes de dictar)', ''];
    var vacios = [];

    BLOQUES.forEach(function (b) {
      var puntos = [];
      var pasoN = 0; // corrido por MÓDULO: dos campos de pasos seguidos no reinician en 1
      b.campos.forEach(function (c) {
        var valor = String(datos[c.id] || '').trim();
        if (!valor) { vacios.push(c.label); return; }
        if (c.tipo === 'lista' || c.tipo === 'riesgo') {
          lineas(valor).forEach(function (l) {
            puntos.push(c.tipo === 'riesgo' ? 'Ojo con esto: ' + frase(l) : frase(l));
          });
        } else if (c.tipo === 'pasos') {
          lineas(valor).forEach(function (l) {
            pasoN += 1;
            puntos.push('Paso ' + pasoN + ': ' + frase(l));
          });
        } else {
          puntos.push(frase(valor));
        }
      });
      if (!puntos.length) return;
      salida.push('# ' + b.modulo);
      puntos.forEach(function (p) { salida.push('- ' + p); });
      salida.push('');
    });

    if (salida.length <= 2) {
      return 'Todavía no hay nada respondido. Contesta al menos una pregunta y vuelve a generar.';
    }

    /* Las advertencias van como COMENTARIOS, no como módulo. El parser de
       contenido.js ignora las líneas que no empiezan por #, -, ?, *, + o x,
       así que estas se ven en el editor y no las dice nadie. Antes eran un
       módulo de verdad, y Vera terminaba leyéndole al asesor "borrar este
       módulo al terminar". */
    salida.push('');
    salida.push('>> ANTES DE USAR ESTE CURSO (estas líneas no las dice Vera):');
    salida.push('>> 1. Léelo completo en voz alta. Si algo suena raro dicho, reescríbelo.');
    salida.push('>> 2. Faltan las preguntas del examen. Agrégalas con el formato de opción');
    salida.push('>>    múltiple, que es el único que Vera puede calificar:');
    salida.push('>>       * ¿La pregunta?');
    salida.push('>>       + La correcta | por qué es la correcta');
    salida.push('>>       x Una incorrecta | por qué está mal');
    salida.push('>> 3. Sin al menos una pregunta así, el curso no tiene examen ni nota.');
    if (vacios.length) {
      salida.push('>> 4. Quedaron ' + vacios.length + ' preguntas sin responder: ' +
        vacios.slice(0, 5).join('; ') + (vacios.length > 5 ? '; y otras más.' : '.'));
    }
    return salida.join('\n');
  }

  function descargar(nombre, contenido) {
    var blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  document.addEventListener('DOMContentLoaded', function () {
    pintarFormulario();
    pintarAvance();

    // Un solo escucha para todos los campos: se guarda mientras se escribe,
    // porque esto se responde en varias sentadas y perder lo escrito sería la
    // forma más rápida de que nadie lo vuelva a intentar.
    $('formulario').addEventListener('input', function (ev) {
      var campo = ev.target.dataset && ev.target.dataset.campo;
      if (!campo) return;
      var datos = leer();
      datos[campo] = ev.target.value;
      guardar(datos);
      pintarAvance();
    });

    $('btn-generar').addEventListener('click', function () {
      $('salida').value = generar();
    });

    $('btn-copiar-curso').addEventListener('click', function () {
      var texto = $('salida').value || generar();
      $('salida').value = texto;
      var confirmar = function () {
        $('btn-copiar-curso').textContent = '¡Copiado!';
        setTimeout(function () { $('btn-copiar-curso').textContent = 'Copiar'; }, 1500);
      };
      var manual = function () {
        $('salida').select();
        try { document.execCommand('copy'); } catch (e) {}
        confirmar();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(confirmar).catch(manual);
      } else {
        manual();
      }
    });

    $('btn-descargar').addEventListener('click', function () {
      var texto = $('salida').value || generar();
      $('salida').value = texto;
      descargar('curso-borrador.txt', texto);
    });

    $('btn-limpiar').addEventListener('click', function () {
      if (!confirm('¿Borrar todo lo que has escrito aquí? No se puede deshacer.')) return;
      try { localStorage.removeItem(CLAVE); } catch (e) {}
      pintarFormulario();
      pintarAvance();
      $('salida').value = '';
    });
  });
})();
