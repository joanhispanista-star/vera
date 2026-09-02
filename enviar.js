/* Cómo salen las respuestas del aparato de quien las escribió.

   Vera no tiene servidor: lo que alguien escribe en un cuestionario vive en el
   localStorage de SU navegador y no llega a nadie hasta que él mismo lo manda.
   Ese último paso es donde se pierde el trabajo, así que aquí está todo junto
   y con una regla por encima de las demás:

       UN BOTÓN NUNCA DICE QUE HIZO ALGO QUE NO HIZO.

   Nace de un fallo real que estaba en cuestionario.js: el respaldo de copiar
   ignoraba lo que devolvía execCommand y ponía «¡Copiado!» pasara lo que
   pasara. En iPhone, .select() no selecciona un textarea, la copia falla y el
   botón mentía; el asesor pegaba un mensaje vacío en el chat convencido de que
   acababa de mandar veinte minutos de trabajo. Un fallo silencioso con
   confirmación falsa es peor que no tener el botón.

   Por eso cada función de aquí devuelve qué pasó de verdad, y quien la llama
   tiene que pintar el resultado real.

   Lo que se descartó, con el número en la mano:
   - wa.me con el texto precargado: WhatsApp trunca alrededor de los ~1.000
     caracteres y el formulario vacío ya son 11.000 codificados. Falla abriendo
     el chat con el cuadro a medias y sin avisar. Es exactamente lo que esta
     regla prohíbe.
   - mailto: con el cuerpo dentro: el shell de Windows corta cerca de 2.048.
   - Subirlo a algún lado: son datos de la operación de un tercero; no salen de
     los aparatos de quien los escribió salvo por su propia mano. */

(function () {
  'use strict';

  /* El tope de un mensaje de WhatsApp son 65.536 caracteres. Se corta antes
     para que el aviso lo demos nosotros y no el mensajero: si WhatsApp recorta
     por su cuenta, nadie se entera de qué se perdió. */
  var TOPE_WHATSAPP = 60000;

  function archivoDe(nombre, texto) {
    return new File([texto], nombre, { type: 'text/plain' });
  }

  /* ¿Puede este aparato mandar el archivo por el menú de compartir? Se pregunta
     ANTES de pintar el botón, no al oprimirlo: un botón que existe y no
     funciona es la misma mentira de siempre. En un computador de escritorio
     casi nunca se puede, y ahí manda el de descargar. */
  function puedeCompartirArchivo() {
    try {
      if (!navigator.share || !navigator.canShare || typeof File !== 'function') return false;
      return navigator.canShare({ files: [archivoDe('prueba.txt', 'x')] });
    } catch (e) {
      return false;
    }
  }

  /* Abre el menú de compartir del sistema con el archivo adjunto. El usuario
     escoge ahí a quién se lo manda — el código no elige por él ni sabe si
     terminó mandándolo.

     Devuelve una promesa con: 'compartido' | 'cancelado' | 'no-se-pudo'.
     Cancelar NO es un error: es alguien que se arrepintió, y decirle
     «no se pudo» sería mentirle al revés. */
  function compartirArchivo(nombre, texto) {
    return new Promise(function (resolver) {
      if (!puedeCompartirArchivo()) { resolver('no-se-pudo'); return; }
      navigator.share({ files: [archivoDe(nombre, texto)], title: nombre })
        .then(function () { resolver('compartido'); })
        .catch(function (e) {
          resolver(e && e.name === 'AbortError' ? 'cancelado' : 'no-se-pudo');
        });
    });
  }

  /* Copiar al portapapeles diciendo la verdad sobre si se copió.

     Devuelve una promesa con 'copiado' o 'no-se-pudo'. En el segundo caso el
     texto queda SELECCIONADO en la caja, porque la salida honesta es decirle a
     la persona que lo copie con el dedo, no fingir que ya está hecho.

     navigator.clipboard solo existe en https (o localhost). En un http pelado
     no está, y por eso el respaldo tiene que funcionar de verdad. */
  function copiar(texto, caja) {
    return new Promise(function (resolver) {
      var respaldo = function () {
        try {
          if (!caja) { resolver('no-se-pudo'); return; }
          caja.focus();
          caja.select();
          // iOS ignora .select() en un textarea; esto sí le funciona.
          if (caja.setSelectionRange) caja.setSelectionRange(0, texto.length);
          // El valor de retorno es justo lo que el código viejo tiraba a la basura.
          resolver(document.execCommand('copy') ? 'copiado' : 'no-se-pudo');
        } catch (e) {
          resolver('no-se-pudo');
        }
      };
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        navigator.clipboard.writeText(texto)
          .then(function () { resolver('copiado'); })
          .catch(respaldo);
      } else {
        respaldo();
      }
    });
  }

  function descargar(nombre, texto) {
    var url = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* Para el contador que se ve mientras escribe. Que sepa antes de terminar si
     lo suyo va a caber en un mensaje, y no cuando ya no hay vuelta atrás. */
  function cabeEnWhatsApp(texto) {
    return String(texto || '').length <= TOPE_WHATSAPP;
  }

  /* Un nombre de archivo con el de la persona dentro: si tres asesores mandan
     el suyo, no llegan tres archivos llamados igual. Se limpia porque Android
     e iOS rechazan varios de estos caracteres y el guardado falla sin decir
     por qué. */
  function nombreArchivo(base, quien) {
    var limpio = String(quien || '').trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // sin tildes
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      .toLowerCase();
    return base + (limpio ? '-' + limpio : '') + '.txt';
  }

  window.Enviar = {
    puedeCompartirArchivo: puedeCompartirArchivo,
    compartirArchivo: compartirArchivo,
    copiar: copiar,
    descargar: descargar,
    cabeEnWhatsApp: cabeEnWhatsApp,
    nombreArchivo: nombreArchivo,
    TOPE_WHATSAPP: TOPE_WHATSAPP
  };
})();
