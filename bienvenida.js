/* La entrevista de bienvenida: Vera conoce al asesor antes de enseñarle.

   Para qué sirve, en orden de importancia:
   1. ROMPE EL HIELO. Un asesor nuevo sentado solo frente a un computador, con
      una IA que además lo va a examinar, llega tenso. Cuatro preguntas sobre
      él cambian el tono de toda la sesión: deja de ser un examen y pasa a ser
      una conversación. Y después Vera puede volver sobre lo que contó ("tú que
      vienes de ventas, esto te va a sonar"), que es lo que de verdad genera
      confianza — acordarse.
   2. Le deja al supervisor una ficha de quién entró: de dónde viene, en qué
      tiene experiencia, qué espera del trabajo.

   PERO esto es recolección de datos personales de un empleado, y eso tiene
   reglas (Ley 1581 de 2012). Por eso, de entrada:
   - Se pide autorización ANTES de la primera pregunta, diciendo para qué es y
     quién lo va a ver. Si dice que no, la capacitación sigue igual.
   - Toda pregunta se puede saltar sin dar explicaciones, y Vera lo dice en voz
     alta antes de empezar.
   - No se pregunta nada que no se pueda sostener frente a un abogado laboral:
     nada de salud, religión, política, orientación sexual ni datos de
     terceros. Esos son datos sensibles y su tratamiento tiene reglas duras.
   - El ESTADO CIVIL viene apagado por defecto. Preguntarlo no es ilegal, pero
     es un dato que en una decisión laboral se lee como discriminación, y para
     romper el hielo no aporta nada que no aporten las demás. Si la empresa lo
     quiere, lo enciende a sabiendas. */

(function () {
  'use strict';

  var CLAVE = 'vera.bienvenida.config';

  /* 'activa' decide si se hace hoy. El orden importa: se empieza por lo fácil
     y lo laboral; lo personal viene después, cuando ya hay algo de confianza. */
  var PREGUNTAS = [
    {
      clave: 'de-donde',
      activa: true,
      texto: '¿De qué parte de la ciudad vienes? Te lo pregunto por curiosidad, y porque a veces uno se entera de quién es el que madruga más.',
      rotulo: 'De dónde viene'
    },
    {
      clave: 'antes',
      activa: true,
      texto: '¿A qué te dedicabas antes de entrar aquí?',
      rotulo: 'A qué se dedicaba antes'
    },
    {
      clave: 'experiencia',
      activa: true,
      texto: '¿Has trabajado antes atendiendo clientes, vendiendo o hablando por teléfono? Cuéntame qué hacías.',
      rotulo: 'Experiencia previa'
    },
    {
      clave: 'telefono',
      activa: true,
      texto: 'Y dime una cosa con honestidad: ¿cómo te sientes hablando por teléfono con una persona que no conoces?',
      rotulo: 'Cómo se siente al teléfono'
    },
    {
      clave: 'espera',
      activa: true,
      texto: '¿Qué te gustaría lograr en este trabajo? No hay respuesta correcta: es para saber qué te mueve.',
      rotulo: 'Qué espera del trabajo'
    },
    {
      // Apagada a propósito: ver el comentario de la cabecera.
      clave: 'estado-civil',
      activa: false,
      texto: '¿Cuál es tu estado civil? Si prefieres no decirlo, no pasa nada.',
      rotulo: 'Estado civil'
    }
  ];

  function leerConfig() {
    try {
      var c = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      return (c && typeof c === 'object') ? c : {};
    } catch (e) {
      return {};
    }
  }

  function guardarConfig(config) {
    try { localStorage.setItem(CLAVE, JSON.stringify(config || {})); } catch (e) {}
  }

  /* Las preguntas de hoy: las de fábrica con lo que la empresa haya encendido
     o apagado. Si el bloque entero está apagado, la capacitación arranca
     directo, sin entrevista. */
  function preguntas() {
    var config = leerConfig();
    if (config.desactivado) return [];
    return PREGUNTAS.filter(function (p) {
      return config[p.clave] === undefined ? p.activa : !!config[p.clave];
    }).map(function (p) {
      return { clave: p.clave, texto: p.texto, rotulo: p.rotulo };
    });
  }

  /* Lo que Vera dice antes de la primera pregunta. No es un formulario
     disfrazado de charla: se dice para qué es, quién lo va a ver, y que se
     puede no responder. */
  function textoConsentimiento(nombre) {
    return 'Antes de arrancar quiero conocerte un poco' + (nombre ? ', ' + nombre : '') +
      '. Te voy a hacer unas preguntas cortas sobre ti: no son parte del examen ' +
      'y no afectan tu nota. Lo que respondas queda en un resumen que ve tu supervisor, ' +
      'para que sepa a quién tiene en el equipo. Si alguna no la quieres responder, ' +
      'oprime “Prefiero no decir” y pasamos a la siguiente.';
  }

  /* El resumen para el supervisor: SOLO lo que la persona respondió. Lo que
     saltó no aparece, y nada se rellena ni se interpreta. */
  function resumen(ficha) {
    var f = ficha || {};
    var lineas = [];
    PREGUNTAS.forEach(function (p) {
      var r = f[p.clave];
      if (r && String(r).trim()) lineas.push({ rotulo: p.rotulo, respuesta: String(r).trim() });
    });
    return lineas;
  }

  /* Vera usa después lo que el asesor le contó. Es lo que convierte la
     entrevista en confianza y no en un trámite: acordarse. Solo se usa si de
     verdad respondió algo que encaje. */
  function guiño(ficha) {
    if (!ficha) return '';
    var texto = (String(ficha.experiencia || '') + ' ' + String(ficha.antes || '')).toLowerCase();
    if (/cobran|cartera|mora/.test(texto)) {
      return 'Tú que ya estuviste en cobranza, compara con lo que hacías antes: ';
    }
    if (/venta|vendi|comercial|call|telemercadeo|servicio al cliente|atenci/.test(texto)) {
      return 'Esto tú ya lo has vivido, por lo que me contaste de tu trabajo anterior: ';
    }
    return '';
  }

  window.Bienvenida = {
    preguntas: preguntas,
    textoConsentimiento: textoConsentimiento,
    resumen: resumen,
    guiño: guiño,
    todas: function () { return PREGUNTAS.slice(); },
    leerConfig: leerConfig,
    guardarConfig: guardarConfig
  };
})();
