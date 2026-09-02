/* Las preguntas que responde un ASESOR con experiencia, no el dueño.

   Salen de las 29 del cuestionario de Joan, pero no son las mismas: están
   reescritas de arriba abajo, y tres cosas cambiaron a propósito.

   1. HABLAN EN SEGUNDA PERSONA Y EN SU IDIOMA. «¿Qué le escribes tú el día que
      se le vence?» en vez de «pégame las plantillas vigentes». Un asesor de
      cobranza no está acostumbrado a escribir, trabaja por metas y va a llenar
      esto entre gestión y gestión: una pregunta larga y culta se contesta
      «normal» y esa respuesta contamina el curso, porque la vacía se ve y la
      floja se cuela como si fuera dato.

   2. NADIE CONFIESA NADA. Las del cuestionario de Joan piden expresamente lo
      incómodo («escríbelo aunque suene mal»). Está bien cuando lo escribe el
      dueño de la empresa. Firmado por un empleado, ese mismo párrafo es la
      descripción de un procedimiento que infringe el artículo 4 de la Ley 2300
      — y descrito como procedimiento, no como desliz, que es justo lo que
      destruye la defensa de «fue un asesor por su cuenta». Así que aquí se
      pregunta por la PANTALLA, por la REGLA y por el ERROR DEL QUE ENTRA, que
      es además como mejor lo cuenta un veterano. Si alguna vez se vuelve a
      meter una pregunta en primera persona («¿qué hiciste tú?»), el campo del
      nombre tiene que salir en el mismo movimiento.

   3. NO SE PIDEN DATOS DE CLIENTES NI CAPTURAS. Detrás de una captura del
      desplegable de tipificaciones va la cuenta que estuviera abierta, y una
      conversación no se anonimiza de verdad: el nombre va dentro del mensaje,
      el monto y la fecha identifican la cuenta, y el enlace de pago lleva
      token. Se pide la PLANTILLA (la que tiene {nombre}), no el chat.

   Doce campos, no veintinueve. El tope no es de tiempo sino de calidad: pasadas
   una docena de preguntas abiertas el asesor no abandona — empieza a contestar
   por salir del paso. Lo que se cayó no se pierde: es la segunda tanda.

   'guiada' es el formato que se le muestra dentro de la caja. Cinco preguntas
   piden una estructura interna (BIEN/MAL, una línea por campo, SÍ/NO al lado) y
   sin el molde delante esa estructura no llega nunca: llega un párrafo, y de un
   párrafo no salen preguntas de examen. */

window.CUESTIONARIO_ASESOR = {
  clave: 'vera.cuestionario.asesor',

  ficha: [
    { id: 'nombre', label: 'Tu nombre',
      pista: 'Va aquí para poder volver a preguntarte si algo no me queda claro, y para darte el crédito en el curso que salga de esto. Lo lee quien te mandó el enlace; no va a tu hoja de vida ni a ninguna evaluación.',
      corto: true },
    { id: 'donde', label: '¿En qué app cobras y en qué cartera estás?',
      pista: 'Como lo dirías tú: «BilleTecla, M0 PP». Si manejas varias, la de más peso.',
      corto: true },
    { id: 'cuanto', label: '¿Hace cuánto estás en esto?',
      pista: 'Aunque sea aproximado: «8 meses aquí, y antes 1 año en otra».',
      corto: true }
  ],

  preguntas: [
    {
      id: 'a01', num: 1, origen: 4, esencial: true,
      label: '¿Qué le escribes a un cliente el día que se le vence, cuando ya lleva tres días, y el último antes de que la cuenta salga de tus manos?',
      pista: 'Pega la plantilla, no la conversación: la que dice {nombre} y {monto}, con sus emojis y sus mayúsculas. Sin nombres ni números de clientes de verdad. Si tienes uno tuyo, distinto al oficial, ponlo también.',
      guiada: 'DÍA QUE VENCE:\n\nA LOS 3 DÍAS:\n\nEL ÚLTIMO:\n'
    },
    {
      id: 'a02', num: 2, origen: 5, esencial: true,
      label: '«Ya pagué», «me quedé sin trabajo», «la otra semana le pago», «estoy pagando otras apps primero». ¿Qué le contestas a cada una?',
      pista: 'Con tus palabras, como se lo escribes de verdad. Entre comillas. Si a alguna le tienes dos versiones según el cliente, ponlas.',
      guiada: 'YA PAGUÉ →\n\nME QUEDÉ SIN TRABAJO →\n\nLA OTRA SEMANA LE PAGO →\n\nESTOY PAGANDO OTRAS APPS →\n'
    },
    {
      id: 'a03', num: 3, origen: 5, esencial: true,
      label: 'Esas mismas cuatro, pero al revés: ¿qué contesta el que va entrando y por eso pierde la cuenta?',
      pista: 'Esta es la que más sirve de todo el formulario: con ella se arman las preguntas del examen. La respuesta equivocada que de verdad escribiría un novato enseña diez veces más que una inventada.',
      guiada: 'YA PAGUÉ → el nuevo contesta:\n\nME QUEDÉ SIN TRABAJO → el nuevo contesta:\n\nLA OTRA SEMANA → el nuevo contesta:\n\nOTRAS APPS → el nuevo contesta:\n'
    },
    {
      id: 'a04', num: 4, origen: 6, esencial: true,
      label: 'Ese cliente le debe a otras tres apps y la plata no alcanza para todas. ¿Qué hace que te pague a ti primero?',
      pista: 'Dos listas cortas. Esto no está en ningún manual y es lo más propio de cobrar nanocréditos: el que entra cree que compite con la desidia del cliente, y compite con otras tres apps por el mismo billete.',
      guiada: 'LO QUE SÍ FUNCIONA:\n-\n-\n\nLO QUE SUENA LÓGICO Y NO SIRVE:\n-\n-\n'
    },
    {
      id: 'a05', num: 5, origen: 10, esencial: true,
      label: 'Abres tu lista del día. ¿Por cuáles arrancas, y a cuáles no les gastas ni un minuto?',
      pista: 'Numerado, como órdenes: «1º las que prometieron pagar hoy. 2º las que alguna vez contestaron. Nunca: las de número equivocado». Es lo que más le falta al que entra, y hoy no está escrito en ninguna parte.',
      guiada: '1º\n2º\n3º\n\nNUNCA:\n'
    },
    {
      id: 'a06', num: 6, origen: 9, esencial: true,
      label: '¿Qué tienes abierto mientras trabajas? Nómbralo todo, hasta el grupo de WhatsApp y el chip de la empresa.',
      pista: 'Uno por línea: «el ADMIN — ahí veo las cuentas». Ponle una estrella a la pantalla donde se ve lo que debe el cliente, que es la que el nuevo no encuentra el primer día. Nunca escribas una clave aquí.',
      guiada: '-\n-\n-\n'
    },
    {
      id: 'a07', num: 7, origen: 2, esencial: true,
      label: '¿Qué palabras del trabajo NO entiende alguien que llega el primer día?',
      pista: 'Con la traducción al lado, incluidas las que tú ya ni oyes: «tipificar — ponerle el resultado a la gestión escogiendo de una lista». Vera las va a LEER en voz alta, y una palabra que no se entendió se lleva por delante los diez minutos siguientes.',
      guiada: 'M0 —\naltura de mora —\ntipificar —\nPDP —\ngestión —\n'
    },
    {
      id: 'a08', num: 8, origen: 17, esencial: true,
      label: 'Al cerrar una gestión escoges una opción de una lista y escribes un comentario. ¿Cuáles son todas las opciones de esa lista?',
      pista: 'Escríbelas en texto, no en captura de pantalla (en la captura sale la cuenta que tengas abierta detrás). Y márcanos las dos que el que entra siempre escoge mal.',
      guiada: '-\n-\n-\n\nLAS QUE EL NUEVO ESCOGE MAL:\n'
    },
    {
      id: 'a09', num: 9, origen: 19, esencial: true,
      label: 'En la ficha de una cuenta salen varios teléfonos y contactos. Escribe cada uno como se llama en la pantalla y marca al lado: SÍ se le puede escribir, o NO se toca nunca.',
      pista: 'Como se lo dirías al que entra el viernes: «Celular titular — SÍ. Referencia personal — NO». Solo la lista y el SÍ/NO; no hace falta contar ningún caso. Ponle una estrella al que creas que el nuevo va a confundir.',
      guiada: 'Celular titular — SÍ\n... — \n... — \n'
    },
    {
      id: 'a10', num: 10, origen: 22, esencial: false,
      label: 'Un cliente dice «no me vuelva a escribir». ¿Hay hoy en el sistema un lugar donde eso quede anotado y lo vea quien reciba la cuenta mañana?',
      pista: 'Con un sí, un no o un «no sé» basta. Si no lo hay, dinos qué se usa en su lugar (una etiqueta, una hoja aparte, avisarle al coordinador). No hace falta contar ningún caso concreto.',
      guiada: ''
    },
    {
      id: 'a11', num: 11, origen: 24, esencial: false,
      label: 'El cliente nombra abogado, tutela, o dice que va a poner la queja. ¿Qué se hace: se le contesta, a quién se le avisa y por dónde?',
      pista: 'Una línea por caso. Si de alguno no sabes a quién se le pasa, escribe «no sé»: esa es justo la que hay que dejar clara en el curso, porque en esos casos cada respuesta de más empeora el asunto.',
      guiada: 'ABOGADO:\nTUTELA:\nQUEJA / SIC:\n'
    },
    {
      id: 'a12', num: 12, origen: 27, esencial: false,
      label: '¿Qué error comete siempre el que va entrando? ¿Y qué le vas a ver hacer que haya que frenarle el primer día?',
      pista: 'Concretos, del que entra y no de nadie en particular: «manda el mismo mensaje cinco veces seguidas y el cliente lo bloquea» enseña; «le falta empatía» no enseña nada.',
      guiada: '-\n-\n-\n'
    }
  ],

  /* El aviso va encima de la 9 y no al principio. Las cuatro últimas son las
     delicadas — a qué número sí y a cuál no, el «no me escriba», el abogado —
     y preguntadas de segundas producen la respuesta del manual. Preguntadas
     cuando ya lleva veinte líneas escritas y nadie lo ha regañado, producen la
     verdad. */
  corteAntesDe: 9,
  textoCorte: 'Vas por la 8 de 12. Con lo que llevas ya se puede armar el curso. Las cuatro que siguen son las que evitan que al que entre lo sancionen — y que después te toque a ti arreglarlo.'
};
