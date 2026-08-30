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
  //   ? pregunta | claves separadas por coma | respuesta modelo   (abierta)
  //   * pregunta de opción múltiple
  //   + opción correcta | por qué        (una o más por pregunta)
  //   x opción incorrecta | por qué
  var TEXTO_INDUCCION = [
    'Inducción básica para asesores de cobranza',
    '',
    '# Bienvenida: qué es cobrar bien',
    '- En esta empresa cobrar no es pelear: es lograr acuerdos. Un buen asesor recupera la plata y deja al cliente dispuesto a volver a contestar el teléfono.',
    '- Tu herramienta principal es la escucha. El cliente que se siente escuchado negocia; el que se siente atacado cuelga y bloquea el número.',
    '- Cada llamada tiene un objetivo concreto: salir con una promesa de pago con fecha y monto, o con un dato nuevo que acerque el acuerdo.',
    '? ¿Con qué objetivo concreto debe terminar toda llamada? | promesa, fecha, monto, acuerdo | Salir con una promesa de pago con fecha y monto, o al menos con un dato nuevo que acerque el acuerdo.',
    '* ¿Con qué debe terminar idealmente una llamada de cobranza?',
    '+ Con una promesa de pago con fecha y monto concretos. | Eso es un acuerdo: se puede registrar, agendar y hacer seguimiento.',
    'x Con el cliente entendiendo que debe mucho. | Que entienda no recupera plata: lo que recupera es un compromiso con fecha.',
    'x Con la mayor cantidad de llamadas hechas en el turno. | El volumen sin acuerdos no baja la mora y quema la base de clientes.',
    '',
    '# La ley: lo que un asesor nunca puede hacer',
    '- La Ley 2300 de 2023 protege al deudor: solo se le contacta en los horarios permitidos y por los canales que la ley y el cliente permiten. Saltarse eso expone a la empresa a sanciones de la Superintendencia.',
    '- Prohibido contactar a las referencias personales o a la familia para presionar un pago. La deuda es del titular y de nadie más.',
    '- Prohibido amenazar, humillar o mentir: nada de hacerse pasar por juzgados ni inventar embargos. Un solo audio de esos puede costar una sanción y la reputación de la empresa.',
    '? ¿Podemos llamar a las referencias personales del cliente para presionar el pago? | no, prohibido, titular | No: la Ley 2300 lo prohíbe. La deuda solo se trata con el titular o con quien él autorice.',
    '* Un cliente no contesta hace tres días. Su hermana sí contesta. ¿Qué se hace?',
    '+ No se le menciona la deuda: se pide que el titular devuelva la llamada. | La deuda solo se trata con el titular, el codeudor o el avalista.',
    'x Se le explica la deuda para que le avise. | Divulgar la deuda a un tercero está prohibido por la Ley 2300 y expone a sanción.',
    'x Se le deja el monto y la fecha límite. | Es la misma infracción: el monto también es información de la deuda.',
    '',
    '# La llamada: el método de la casa',
    '- Saluda, identifícate con tu nombre y el de la empresa, y confirma con quién estás hablando. Sin titular confirmado no se menciona la deuda: eso es protección de datos.',
    '- Escucha la objeción sin interrumpir y valídala: entiendo, la situación está dura. Después ofrece opciones concretas: fecha próxima, pago parcial o plan de pagos.',
    '- Cierra en concreto: repite el acuerdo con fecha y monto, despídete con respeto y registra todo en el sistema apenas cuelgues.',
    '? Antes de mencionar la deuda, ¿qué hay que confirmar siempre? | titular, identidad, confirmar, con quién | Que estamos hablando con el titular: sin confirmar la identidad no se menciona la deuda.',
    '* ¿Qué es lo primero que se hace apenas contesta la llamada?',
    '+ Saludar, identificarse con nombre y empresa, y confirmar con quién se habla. | Sin titular confirmado no se puede mencionar la deuda.',
    'x Preguntar cuándo va a pagar. | Todavía no se sabe si quien contestó es el titular.',
    'x Leer el monto de la deuda para que reaccione. | Es divulgación a un posible tercero: infracción de datos personales.'
  ].join('\n');

  var TEXTO_LEY = [
    'Ley 2300 y el marco legal de la cobranza',
    '',
    '# La Ley 2300: las reglas del contacto',
    '- La Ley 2300 de 2023 regula cómo se cobra en Colombia. Aplica a bancos, fintech y a las empresas de cobranza que trabajan para ellos: si usted cobra, esta ley es su manual de tránsito.',
    '- El deudor elige el canal: si pide que no lo llamen y que le escriban, se respeta. Insistir por un canal que el cliente prohibió no es persistencia: es una infracción.',
    '- Los horarios son de día: de lunes a viernes de siete de la mañana a siete de la noche, y los sábados de ocho de la mañana a tres de la tarde. Domingos y festivos no se cobra. Y la frecuencia también está limitada: máximo un contacto de cobranza al día.',
    '? ¿Qué pasa si el deudor pide que solo lo contacten por escrito? | canal, respeta, escrito, elige | Se respeta: el deudor elige el canal, y saltárselo es una infracción a la Ley 2300.',
    '* ¿En cuál de estos momentos SÍ se puede llamar a cobrar?',
    '+ Un martes a las diez de la mañana. | Entre semana el horario permitido va de 7 de la mañana a 7 de la noche.',
    'x Un domingo a las tres de la tarde. | Domingos y festivos no se hace gestión de cobranza.',
    'x Un sábado a las cinco de la tarde. | Los sábados el horario termina a las 3 de la tarde.',
    'x Un miércoles a las ocho de la noche. | Pasadas las 7 de la noche ya no se puede contactar.',
    '',
    '# Lo prohibido: la lista que no se negocia',
    '- La deuda solo se habla con el titular, el codeudor o el avalista. Llamar a las referencias, a la familia o al jefe para presionar es ilegal, así sea solo para dejar razón.',
    '- Prohibido amenazar, humillar o mentir: nada de embargos inventados, nada de hacerse pasar por juzgado o fiscalía, nada de listas públicas de morosos.',
    '- El acoso también está prohibido: llamar sin descanso no cobra más rápido, y sí convierte una gestión legal en una sanción de la Superintendencia.',
    '? ¿Podemos dejarle razón al jefe del deudor para que le recuerde la deuda? | no, prohibido, titular, terceros | No: divulgar la deuda a terceros está prohibido. Solo se habla con el titular, el codeudor o el avalista.',
    '* ¿Cuál de estas frases NO se puede decir en una llamada?',
    '+ Si no paga hoy, mañana le embargan el sueldo. | Es una amenaza y además falsa: inventar embargos se sanciona.',
    'x Su obligación está próxima a reporte y por ley debo avisarle. | Es información cierta y obligatoria: informar no es amenazar.',
    'x Entiendo que la situación está dura; miremos qué alcanza a abonar. | Validar la situación y ofrecer opciones es el método correcto.',
    '',
    '# Habeas data financiero: el reporte a centrales',
    '- Antes de reportar negativamente a un cliente en las centrales de riesgo hay que avisarle con al menos veinte días calendario, para que pueda pagar o discutir la deuda. Reportar sin avisar tumba el reporte y expone a la empresa.',
    '- El dato negativo no es eterno: permanece el doble del tiempo de la mora, con tope de cuatro años desde el pago. Decir que quedará reportado de por vida es mentira, y las mentiras en cobranza se sancionan.',
    '- El reporte se menciona como dato cierto, nunca como amenaza: su obligación está próxima a reporte y por ley debo avisarle. Esa frase informa; cualquier cosa más ya es presión ilegal.',
    '? ¿Con cuánta anticipación hay que avisar antes de un reporte negativo? | veinte, 20 | Con al menos veinte días calendario, para que el cliente pueda pagar o discutir la deuda antes del reporte.',
    '* ¿Con cuánta anticipación hay que avisarle al cliente antes de reportarlo a centrales?',
    '+ Al menos veinte días calendario. | Es el plazo del habeas data financiero para que pueda pagar o discutir la deuda.',
    'x Cinco días hábiles. | Ese plazo no existe: son veinte días calendario.',
    'x No hay que avisar, el reporte es automático. | Reportar sin avisar tumba el reporte y expone a la empresa.',
    '',
    '# Datos personales: la Ley 1581 en cada llamada',
    '- Antes de mencionar la deuda, confirme con quién habla. Si contesta otra persona, la deuda no existe: se pide al titular o se devuelve la llamada, y se cuelga.',
    '- Los datos del cliente son para cobrar su deuda y nada más: compartirlos, venderlos o usarlos para otra cosa viola el habeas data.',
    '- Toda gestión queda registrada: qué se dijo, cuándo y por qué canal. Ese registro es la defensa de la empresa el día que un cliente reclame ante la Superintendencia.',
    '? Contesta la esposa del titular y pregunta de parte de quién llaman. ¿Qué se le dice de la deuda? | nada, no, titular, devuelvo | Nada: se pide hablar con el titular o se dice que se devuelve la llamada. La deuda no existe para terceros.',
    '* ¿Cuánto tiempo permanece un dato negativo en las centrales de riesgo?',
    '+ El doble del tiempo que duró la mora, con tope de cuatro años desde el pago. | Decirle al cliente que queda reportado de por vida es mentira, y mentir se sanciona.',
    'x De por vida, hasta que pague. | Es falso y es la mentira más común en cobranza mal hecha.',
    'x Un año exacto en todos los casos. | El plazo depende de cuánto duró la mora.'
  ].join('\n');

  var TEXTO_PERSUASION = [
    'Persuasión ética para cobrar',
    '',
    '# La psicología del que debe',
    '- El que está en mora casi nunca es un estafador: es alguien asustado que evita el tema por vergüenza. Su primera reacción es defenderse; la segunda, si usted lo permite, es negociar.',
    '- La herramienta más rentable es el tono: calmado, sin juicio, de persona a persona. El cliente que no se siente atacado se queda en la línea, y el que se queda en la línea llega a acuerdos.',
    '- Escuche y nombre lo que oye: entiendo, quedó sin trabajo y esto lo tiene estresado. Nombrar la emoción del otro la desarma; ignorarla la agranda.',
    '? ¿Cuál es la primera reacción típica de un cliente en mora, y qué hacemos con ella? | defensa, defenderse, vergüenza, miedo, escuchar | Defenderse, por vergüenza o miedo. Se le baja la defensa escuchando sin juzgar, no discutiendo.',
    '* Un cliente contesta molesto y dice que ya está cansado de que lo llamen. ¿Qué se hace primero?',
    '+ Escucharlo sin interrumpir y reconocer lo que siente. | Nombrar la emoción la desarma; ignorarla la agranda.',
    'x Recordarle de inmediato que la deuda existe y crece. | Confirma que no lo están escuchando y hace que cuelgue.',
    'x Colgar y volver a llamar más tarde. | Se pierde el único momento en que el cliente sí contestó.',
    '',
    '# Objeciones: escuchar, validar, ofrecer',
    '- Paso uno: escuchar la objeción completa sin interrumpir. El que interrumpe confirma que no le importa; el que escucha se gana el derecho a proponer.',
    '- Paso dos: validar sin regalar la deuda. Entiendo, la situación está dura no es lo mismo que no se preocupe: se valida la emoción, no el no pago.',
    '- Paso tres: ofrecer siempre dos opciones concretas: ¿le queda mejor abonar el quince o pagar completo el treinta? El que elige entre dos opciones ya decidió pagar; solo está eligiendo cómo.',
    '? Un cliente dice que no tiene plata. Después de escuchar y validar, ¿cuál es el tercer paso? | opciones, dos, ofrecer, fechas | Ofrecer dos opciones concretas de pago: quien elige entre dos fechas ya decidió pagar.',
    '* Después de escuchar y validar, ¿cómo se propone el pago?',
    '+ Ofreciendo dos opciones concretas de fecha o monto. | Quien elige entre dos opciones ya decidió pagar: solo está eligiendo cómo.',
    'x Preguntando abiertamente cuándo cree que podría pagar. | Una pregunta abierta invita a aplazar sin comprometerse.',
    'x Exigiendo el pago total ese mismo día. | Sin alternativa, el cliente se bloquea y no hay acuerdo.',
    '',
    '# El cierre: de la charla al compromiso',
    '- Ancle alto: proponga primero el pago total. Frente a ese ancla, el abono parcial se siente alcanzable y el cliente lo acepta con alivio.',
    '- Consiga síes pequeños antes del sí grande: ¿me confirma que este sigue siendo su número?, ¿le sirve el recibo por WhatsApp? El que ya dijo sí dos veces dice sí la tercera.',
    '- Todo cierre se repite en voz alta y en concreto: entonces quedamos en cincuenta mil el viernes quince por la aplicación, ¿correcto? Compromiso que no se repite y se confirma, no existe.',
    '? ¿Por qué se propone primero el pago total aunque sepamos que el cliente abonará menos? | ancla, anclar, parcial, alcanzable | Es el ancla: comparado con el total, el abono parcial se siente alcanzable y se acepta más fácil.',
    '* ¿Cómo se cierra correctamente un acuerdo?',
    '+ Repitiendo en voz alta el monto y la fecha, y confirmando con el cliente. | Un compromiso que no se repite y se confirma no existe.',
    'x Diciendo que quedamos pendientes y colgando. | No hay fecha ni monto: no es un acuerdo, es una llamada perdida.',
    'x Anotándolo en el sistema sin decírselo al cliente. | El cliente no se compromete con algo que no escuchó de su parte.',
    '',
    '# La línea roja: persuadir no es presionar',
    '- La urgencia se usa solo si es cierta: el descuento autorizado vence el viernes persuade; mañana lo embargan, si no es verdad, es ilegal y destruye la confianza que cobra.',
    '- Repetir llamadas hasta cansar no es persuasión: es acoso, y la Ley 2300 lo sanciona. Una llamada bien hecha logra lo que diez llamadas de presión no logran.',
    '- La prueba final de toda técnica: ¿funcionaría si el cliente la conociera? El ancla y las dos opciones pasan la prueba; la mentira y la vergüenza no. Lo que no pasa la prueba, no se usa.',
    '? Decirle al cliente que mañana pasa a jurídica, sin ser cierto: ¿se puede? | no, mentira, ilegal, falsa | No: la urgencia falsa es mentira, es sancionable y quema la relación. La urgencia solo se usa cuando es cierta.',
    '* ¿Cuál es la prueba de que una técnica de persuasión es legítima?',
    '+ Que funcionaría igual si el cliente supiera que se la están aplicando. | El ancla y las dos opciones la pasan; la mentira y la vergüenza no.',
    'x Que consiga el pago, sin importar cómo. | El resultado no vuelve legal una amenaza ni una mentira.',
    'x Que la usen todos los asesores del equipo. | Que sea costumbre no la hace correcta ni legal.'
  ].join('\n');


  /* Curso extraído del propio sistema MATRIX (matrix.html, 4.529 líneas) el
     28-ago-2026. NO se escribió de memoria: cada afirmación se verificó contra
     el código, y lo que no se podía sostener quedó fuera o marcado como "hay
     que confirmarlo con el supervisor" dentro del propio texto.

     El hallazgo que reordenó el curso: MATRIX NO es el ADMIN donde se gestiona
     la cartera — es la capa que mide el desempeño y calcula la comisión. El
     propio sistema lo dice: "la herramienta no se conecta a ADMIN". Por eso
     este curso enseña cómo lo miden y cómo le pagan a un asesor, que es
     valioso desde el primer día, pero NO reemplaza el curso del ADMIN real
     (la plataforma de casa matriz), que todavía no existe. */
  var TEXTO_MATRIX = [
    "MATRIX: cómo te miden y cómo te pagan",
    "",
    "# Dónde está usted parado: MATRIX mide, el ADMIN es donde se cobra",
    "- Bienvenido. Lo primero es corregir algo que confunde a casi todo el que llega: MATRIX y el ADMIN no son el mismo sistema. El ADMIN es la plataforma de casa matriz, la de los encabezados en chino, y es ahí donde vive la cartera. MATRIX es una herramienta aparte que lee lo que el ADMIN exporta y con eso calcula desempeño, comisiones y reportes.",
    "- En MATRIX no existe ninguna pantalla de deudor. No hay cédula, no hay teléfono del cliente, no hay saldo por cuenta ni historial de gestión de un caso. Búsquelo y no lo va a encontrar, y eso no es una falla: MATRIX no fue hecha para eso.",
    "- Lo que MATRIX guarda es una fila por asesor, por categoría de mora y por día, con cuatro números: cuentas asignadas, cuentas cobradas, base a cobrar y dinero recuperado.",
    "- La propia herramienta lo dice con todas las letras. En la pantalla de Asignación hay un aviso que dice, textual: la herramienta no se conecta a ADMIN, te arma el plan de reparto por cantidades y tú lo ejecutas allá con Batch Assignment.",
    "- Y cuando el tablero está vacío el mensaje es igual de claro: MATRIX no se conecta sola al ADMIN. Para traer al equipo hay que abrir en el ADMIN el informe Aging Real-time Report, exportarlo, y pegar esa tabla dentro de MATRIX.",
    "- Entonces la regla que se lleva de este módulo es sencilla: usted trabaja sus cuentas en el ADMIN, y MATRIX es el espejo donde usted y sus jefes ven cómo le fue y cuánto va a cobrar.",
    "- Un dato técnico que le conviene tener claro: MATRIX guarda todo en el navegador del computador donde se abre. No hay servidor. Lo que se captura en un computador no aparece en otro, y nada de lo que usted escriba en MATRIX viaja al ADMIN.",
    "? ¿Dónde gestiona usted sus cuentas y para qué sirve entonces MATRIX? | admin, cartera, cuentas, gestiono, matrix, mide, comisión, desempeño | Las cuentas se gestionan en el ADMIN, que es la plataforma de casa matriz donde vive la cartera. MATRIX es otra cosa: es donde se mide el desempeño, se calcula la comisión y salen los reportes. En MATRIX no hay ficha de deudor.",
    "* Usted necesita ver el historial de gestión de un deudor. ¿Dónde lo busca?",
    "+ En el ADMIN, que es donde vive la cartera. | MATRIX no tiene ficha de deudor: no hay cédula, ni teléfono, ni saldo por cuenta.",
    "x En la pantalla Llamadas de MATRIX. | Esa pantalla no contiene el historial de gestión de las cuentas del ADMIN.",
    "x En el Tablero de MATRIX, filtrando por cliente. | El Tablero muestra cifras del equipo por categoría, no cuentas individuales.",
    "? Si usted escribe algo en MATRIX, ¿eso le llega al ADMIN? | no, no llega, no viaja, no se conecta, navegador, computador | No llega. MATRIX no se conecta sola al ADMIN: solo lee lo que el ADMIN exporta. Lo que se escribe queda guardado en el navegador de ese computador, y allá no llega nada.",
    "* Usted corrige un número en MATRIX. ¿Qué pasa en el ADMIN?",
    "+ No pasa nada: MATRIX no se conecta al ADMIN. | El propio sistema lo dice: la herramienta no se conecta a ADMIN. Lo escrito queda en el navegador de ese computador.",
    "x Se actualiza automáticamente en unos minutos. | No hay conexión ni servidor entre los dos sistemas.",
    "x Se actualiza cuando alguien cierra el periodo. | Cerrar el periodo no envía nada al ADMIN.",
    "",
    "# Entrar y moverse por MATRIX sin perderse",
    "- MATRIX abre con una pantalla negra que pide un PIN. Pídaselo a su supervisor: es el mismo para todo el equipo, así que trátelo como la llave de la oficina y no lo comparta por fuera.",
    "- Si se equivoca, sale un texto rojo que dice PIN incorrecto, se borra la casilla y puede volver a intentar.",
    "- Existe un interruptor llamado Modo asesor. Si en ese equipo escogieron a un asesor, MATRIX abre mostrando solamente la pantalla Mi progreso de esa persona: los demás botones del menú desaparecen y también se esconde el selector de periodo.",
    "- Ese modo es para que usted trabaje tranquilo con lo suyo. Y una advertencia honesta: no dé por hecho que sus números son privados, porque MATRIX guarda todo en ese computador y quien lo use puede verlos.",
    "- El menú es una sola columna negra a la izquierda y tiene dos pisos. Arriba se ven ocho botones: Resultados, Tablero, Análisis, Reuniones, Comisiones, Equipo, Registro y Ajustes.",
    "- Los otros nueve están escondidos hasta que usted pulse el botón que dice Más opciones. Ahí aparecen Apps, Organización, SIMs, Docs, Asignación, Reportes, Llamadas, Tendencia y Mi progreso. Fíjese que justo las dos pantallas más útiles para usted, Llamadas y Mi progreso, viven en el piso escondido.",
    "- Hay una trampa el primer día: al abrir, el botón resaltado en rojo dice Resultados, pero lo que se ve en la pantalla es el Tablero. Fíese siempre del título grande de la derecha, no del botón resaltado. Con un clic en cualquier botón los dos quedan de acuerdo.",
    "- Al final de la barra negra, debajo de todos los botones, hay una lista pequeña que dice Periodo activo. Un periodo es un corte de medición, una quincena o un mes. Cambiarlo redibuja casi toda la aplicación, sin aviso y sin confirmación, así que antes de leer cualquier cifra revise que el periodo activo sea el que usted quiere.",
    "? ¿Cómo sabe usted que el computador donde está sentado está en modo asesor, y cómo se sale de ahí? | solo, mi progreso, una pantalla, sin menú, sello, eme, esquina, pin | Si al abrir solo se ve la pantalla Mi progreso y no hay menú, ese equipo está en modo asesor. Para volver a gerencia se hace clic en el sello eme de la esquina de arriba a la izquierda y se escribe el PIN.",
    "? Usted abre MATRIX y ve un número en el Tablero. ¿Qué revisa antes de reportarlo? | periodo, periodo activo, corte, quincena, título, pantalla | Reviso el Periodo activo, que está al final de la barra negra, para confirmar que es el corte que estoy buscando. Y me guío por el título grande de la pantalla, no por el botón que aparece resaltado.",
    "* Antes de creerle a una cifra del Tablero, ¿qué hay que revisar?",
    "+ El Periodo activo, al final de la barra negra del menú. | Cambiar el periodo redibuja casi toda la aplicación sin avisar: la cifra puede ser de otro corte.",
    "x Que el botón resaltado en rojo diga Tablero. | Al abrir, el botón resaltado dice Resultados aunque se vea el Tablero: hay que guiarse por el título grande.",
    "x Nada, las cifras siempre están al día. | MATRIX solo tiene lo que alguien haya pegado del export del ADMIN.",
    "",
    "# Su categoría de mora: el estado que lo decide todo",
    "- Cada cuenta que le reparten viene con una categoría. Es la etapa de mora, y en el ADMIN esa columna se llama tipo de orden de trabajo. La categoría define contra qué tabla le pagan a usted.",
    "- La lista completa que MATRIX reconoce es: eme cero, eme cero pe pe, eme cero ve pe, eme uno uno, eme uno uno a, eme uno uno be, eme cero uno pe pe, eme uno dos, eme uno tres, eme dos, eme tres, y una opción llamada Combinar cuentas.",
    "- De todas esas, solo cinco tienen tabla de pago cargada en el sistema: eme cero pe pe, eme cero ve pe, eme uno uno a, eme uno uno be y eme uno uno. Si a usted lo ponen en una categoría distinta, MATRIX no encuentra tabla y esa línea suya queda en cero pesos hasta que alguien la defina en la pantalla Comisiones.",
    "- La categoría viaja pegada al nombre del equipo en el ADMIN. Un nombre de equipo se ve así: eme cero pe pe, luego el nombre de la app, luego el gerente y luego el supervisor. De ahí MATRIX saca categoría, app y los dos jefes.",
    "- Usted puede tener más de una línea si le asignan más de una categoría, y cada línea se paga aparte, con su propia tabla y sus propios días.",
    "- Y ahora la regla de oro, la que más disgustos evita: no compare su porcentaje con el de un compañero de otra categoría. En eme cero pe pe el escalón más alto pide cincuenta por ciento de cuentas cobradas; en eme uno uno be el escalón más alto pide siete por ciento. Un siete por ciento en eme uno uno be puede ser mejor trabajo que un cuarenta por ciento en eme cero pe pe.",
    "- Una advertencia honesta, para que usted no repita cosas que no le constan: el sistema no define qué significan exactamente las siglas pe pe y ve pe, ni cuántos días de mora cubre cada categoría, ni qué es Combinar cuentas. Lo único escrito, dentro de un módulo que hoy está apagado, es que eme uno anda más o menos entre treinta y cincuenta y nueve días, que eme cero ve pe es vencido parcial, o sea que el cliente abonó una parte o va corto, y que eme dos y eme tres son prejurídico. Confirme esos significados con su supervisor antes de darlos por ciertos.",
    "? ¿Por qué no tiene sentido comparar su porcentaje con el de un compañero de otra categoría? | metas, distintas, tablas, diferentes, categoría, escalón, no se comparan | Porque cada categoría tiene su propia tabla y sus propias metas. El escalón más alto de eme cero pe pe pide cincuenta por ciento y el de eme uno uno be pide siete por ciento, así que un ocho por ciento en eme uno puede ser mejor trabajo que un cincuenta en eme cero.",
    "* Un compañero de otra categoría tiene 40% y usted 8%. ¿Quién trabajó mejor?",
    "+ No se puede saber: cada categoría tiene su propia tabla y sus propias metas. | El escalón más alto de M0-PP pide 50% y el de M1-1B pide 7%: un 8% en M1-1B puede ser mejor trabajo que un 40% en M0-PP.",
    "x El compañero, porque 40 es mayor que 8. | Comparar porcentajes entre categorías distintas no significa nada.",
    "x Usted, porque las categorías altas son más difíciles. | Tampoco se puede afirmar así: hay que mirar la tabla de cada categoría.",
    "? Si a usted lo ponen en una categoría como eme uno dos o eme dos, ¿qué pasa con su pago en el sistema? | no hay tabla, sin tabla, cero, no calcula, comisiones, avisar | Esas categorías no tienen tabla de pago cargada, entonces esa línea sale en cero pesos hasta que alguien la defina en la pantalla Comisiones. Si me pasa, lo aviso de una vez.",
    "",
    "# Cómo su trabajo se convierte en plata: el escalón, el sábado y Mi progreso",
    "- El número que manda sobre su pago es el porcentaje de cuentas cobradas: cuentas cobradas dividido entre cuentas asignadas. En el ADMIN ese indicador tiene su propio nombre y es distinto del otro que va a oír.",
    "- El otro es el porcentaje de recuperación: dinero recuperado sobre la base a cobrar. Ese mide plata, y en el código se usa para el pago de jefes con apps mezcladas, no para el suyo.",
    "- De ahí sale el error de criterio más caro que puede cometer un asesor nuevo: a usted le pagan por cuentas, no por pesos. Si persigue dos cuentas grandes y deja morir veinte pequeñas, su día se desploma.",
    "- El pago es escalonado, no proporcional. MATRIX busca en su tabla el escalón más alto que usted alcanza, y ese escalón da un pago fijo por día. Su pago del periodo es ese valor multiplicado por los días trabajados.",
    "- Le doy la tabla que hoy trae el sistema para eme cero pe pe en LuckyPlata y Dinerbacano, para que entienda la forma: cincuenta por ciento paga cincuenta y cinco mil pesos al día; cuarenta y cinco paga cuarenta y siete mil; cuarenta y tres paga treinta y nueve mil; cuarenta paga treinta y un mil; treinta y ocho paga veintitrés mil; y treinta y siete paga quince mil.",
    "- Por debajo del último escalón el pago no es cero: es negativo. En eme cero pe pe son menos seis mil pesos por día, en eme cero ve pe menos siete mil doscientos, y en eme uno uno a y eme uno uno be menos cinco mil. Eso en el sistema se llama penalización, y significa que le resta.",
    "- Mire lo que valen dos décimas: quedarse en cuarenta y cuatro coma nueve paga treinta y nueve mil al día, y llegar a cuarenta y cinco paga cuarenta y siete mil. Una sola cuenta más puede valer ocho mil pesos por cada día del corte.",
    "- Los sábados el sistema baja el umbral al ochenta por ciento, o sea que ese día es más fácil subir de escalón. Pero le digo la verdad: en la pantalla Comisiones el propio texto dice que esa regla del sábado está pendiente, mientras que en Mi progreso se afirma como un hecho. El cálculo la aplica siempre. Confírmela con su jefe antes de armar su semana con eso.",
    "- Su pantalla es Mi progreso, y está en Más opciones. Ahí ve cuánto lleva ganado en el periodo, su porcentaje de cuentas cobradas con su nivel, cuánto recuperó, su puesto en el ranking, y el detalle de cada línea suya.",
    "- Lo más útil de esa pantalla es la caja que dice Tu próxima meta. Le dice, por cada categoría, cuántas cuentas más tiene que cobrar y cuánto le sube el pago diario si lo logra. La cuenta que hace es el umbral por sus cuentas asignadas, redondeado hacia arriba, menos las que ya cobró.",
    "- Ojo con los días trabajados, porque de eso depende su plata: no vienen del ADMIN. MATRIX los deduce contando los días distintos en que usted aparece con datos. Si un día no le asignaron nada, ese día no aparece y no se le paga. El propio sistema advierte que hay que revisar esos días en Registro antes de pagar, así que si le falta un día, reclámelo temprano.",
    "- Una última honestidad sobre los números que le acabo de dar: esas tablas se pueden editar desde la pantalla Comisiones, así que pueden haber cambiado. Pida la tabla vigente de su categoría y su grupo de app.",
    "? ¿Le pagan a usted por la plata recuperada o por las cuentas cobradas? | cuentas, cobradas, no por plata, porcentaje, asignadas, escalón | Me pagan por cuentas cobradas sobre cuentas asignadas, no por la plata. Ese porcentaje es el que define el escalón y el pago por día.",
    "? Usted va en cuarenta y cuatro por ciento en eme cero pe pe y le faltan dos días de corte. ¿Qué hace y por qué? | escalón, cuarenta y cinco, una cuenta, subir, ocho mil, por día, próxima meta | Busco llegar a cuarenta y cinco por ciento, porque el pago es escalonado: en cuarenta y tres o cuarenta y cuatro me pagan treinta y nueve mil al día y en cuarenta y cinco me pagan cuarenta y siete mil. En Mi progreso miro cuántas cuentas me faltan para ese escalón.",
    "? ¿Qué significa que su pago por día salga en rojo y en negativo? | penalización, negativo, resta, debajo, mínimo, tabla | Significa que estoy por debajo del mínimo de mi tabla y eso se llama penalización: no me pagan cero, me resta plata por cada día. Toca ver en Mi progreso cuántas cuentas necesito para salir de rojo.",
    "",
    "# De dónde salen las cifras, y cuándo no hay que creerles",
    "- MATRIX tiene dos fuentes de datos distintas y confundirlas es como se termina reportando un número que no es.",
    "- La pantalla Resultados se llena con los datos reales de la operación, que carga la aplicación de escritorio al arrancar. Esa pantalla tiene sus propios filtros de app, categoría, equipo y fechas, y no usa el periodo activo.",
    "- Todas las demás pantallas de cifras (Tablero, Comisiones, Apps, Reportes, Tendencia y Mi progreso) se alimentan del Registro, que es una tabla que alguien llenó a mano o pegando. Sus números son tan buenos como la última persona que los tecleó.",
    "- Si abre Resultados y sale un cartel que dice que faltan cargar los datos, no está dañado: MATRIX se abrió desde el navegador. Hay que cerrarla del todo y volver a abrirla desde el ícono del escritorio, porque desde el navegador no puede leer los archivos del computador.",
    "- MATRIX trae un juego de datos falsos para practicar. Mientras estén cargados, nueve pantallas muestran arriba una franja amarilla que dice, textual: estos son datos de ejemplo, no tu operación, no pagues ni decidas con esto.",
    "- Aprenda este reflejo: antes de mirar cualquier cifra en Tablero, Comisiones, Equipo, Registro, Reportes o Mi progreso, revise que no haya franja amarilla. Si la hay, esos números son inventados.",
    "- Y sepa dónde no lo protege esa franja: no aparece en Resultados, ni en Análisis, ni en Apps, ni en Tendencia. Ahí los datos de ejemplo se ven sin ninguna advertencia. Además existe un botón que apaga el aviso para siempre sin comprobar nada, así que su ausencia tampoco es garantía.",
    "- Un detalle que le va a extrañar: el Tablero muestra un indicador de promesas de pago y de promesas cumplidas. Cuando los datos vienen del ADMIN, los contactos y las promesas entran siempre en cero, porque el export no los trae. Si ve un cero ahí, no significa que usted no consiga promesas: significa que nadie alimentó ese dato.",
    "? ¿Cuál es la diferencia entre lo que muestra Resultados y lo que muestra el Tablero? | resultados, datos reales, admin, escritorio, tablero, registro, mano, tecleado | Resultados se llena con los datos reales que carga la app de escritorio desde el ADMIN. El Tablero y las demás pantallas de cifras salen del Registro, que alguien llenó a mano o pegando, así que pueden no coincidir.",
    "? Usted ve una franja amarilla arriba de la pantalla de Comisiones. ¿Qué hace? | datos de ejemplo, inventados, no pagar, no decidir, avisar | Esa franja dice que son datos de ejemplo, con nombres inventados y cifras al azar. No decido ni reporto nada con esos números y le aviso a mi jefe.",
    "",
    "# Llamadas y compromisos: la bitácora que sí existe en MATRIX",
    "- En Más opciones está la pantalla Llamadas. Arriba tiene tres indicadores: llamadas de hoy, compromisos abiertos y tiempo grabado hoy.",
    "- El formulario es corto: con quién fue la llamada, si fue saliente o entrante, el tema, el resultado, y un campo de compromiso que dice qué hay que hacer y para cuándo.",
    "- Lo único obligatorio es el contacto. Si lo deja vacío, el sistema le responde con una pregunta: con quién fue la llamada.",
    "- Si deja el compromiso vacío, la llamada queda registrada pero nada le va a recordar el pendiente. Los compromisos son lo único que sube al indicador de compromisos abiertos y al informe de Análisis, y se cierran marcando la casilla en el historial cuando ya se cumplieron.",
    "- Hay tres botones de grabación: grabar la llamada del PC, que captura el audio del sistema mezclado con su micrófono, una nota de voz que graba solo el micrófono, y un interruptor para silenciar su propio micrófono. Para grabar el audio del PC hay que elegir Toda la pantalla y marcar la casilla que dice compartir el audio del sistema; sin esa casilla no hay audio.",
    "- El navegador no puede capturar el audio de una llamada del celular. Para eso el sistema dice que se use la grabación nativa del teléfono, o poner el altavoz y grabar con nota de voz.",
    "- Y el aviso más importante de esa pantalla, que está escrito ahí mismo: si graba a otra persona, avísele, porque en Colombia la voz es dato sensible y el consentimiento lo protege a usted. Avise siempre, antes de empezar a grabar.",
    "- Ahora la parte honesta: todo indica que esta pantalla es para llamadas internas de coordinación, no para su gestión con el deudor. El campo pide un nombre o un área, los ejemplos de tema que trae son meta de eme uno dos, permiso y escalamiento, y no hay ningún campo de cliente, cédula, cuenta ni monto prometido. Pregúntele a su supervisor dónde se registra la gestión con el deudor antes de usar esta pantalla para eso.",
    "? Antes de grabar una llamada, ¿qué tiene que hacer siempre y por qué? | avisar, avisarle, permiso, consentimiento, voz, dato sensible, colombia | Avisarle a la otra persona que la voy a grabar. En Colombia la voz es un dato sensible y el consentimiento me protege a mí también.",
    "? ¿Qué pasa si registra una llamada y deja el campo de compromiso vacío? | nada, no recuerda, no aparece, compromisos abiertos, análisis, se olvida | La llamada queda registrada pero el pendiente no le aparece a nadie. Los compromisos son los que suben al indicador de compromisos abiertos y al informe de Análisis, así que si lo dejo vacío se olvida.",
    "",
    "# La ley al cobrar: lo que está escrito y lo que el sistema no le controla",
    "- Dentro del sistema hay un bloque de cumplimiento legal para Colombia. Se escribió para un módulo de mensajes que hoy está desconectado (no hay ningún botón que lleve ahí), pero las reglas son las que usted tiene que conocer de memoria. Se las leo tal como están escritas.",
    "- Trate al deudor con respeto y dignidad. Nunca amenace, insulte, humille ni use lenguaje intimidante.",
    "- No amenace con cárcel, ni con embargo inmediato, ni con acciones que no correspondan. Y no se haga pasar por abogado, juez, fiscal ni autoridad.",
    "- No mencione la deuda a terceros: ni a la familia, ni a los vecinos, ni al jefe, ni a los compañeros de trabajo. El mensaje es solo para el titular.",
    "- No falsee consecuencias ni invente plazos o cifras. Si menciona reporte a centrales de riesgo, hágalo como una posibilidad conforme a la ley, sin exagerar.",
    "- Ofrezca siempre una salida: canales de pago, posibilidad de acuerdo, o de comunicarse. Trate de usted y en horario prudente. Y cumpla la Ley 1266 de 2008, la de habeas data, y las normas de la Superintendencia de Industria y Comercio sobre cobranza.",
    "- Ahora la parte incómoda, y es la que el curso no le puede ocultar: en MATRIX no hay un solo campo, filtro ni validación sobre horarios de contacto, número de contactos por semana, canal autorizado por el deudor, ni marca de no contactar. La Ley 2300 no se nombra ni una sola vez en el sistema.",
    "- De ahí sale la regla que le va a salvar el puesto: que el sistema lo deje, no significa que se pueda. Ningún software le va a impedir llamar un domingo, llamar cinco veces en un día, o escribirle a la mamá del deudor, y la sanción no la para el software: la responde usted.",
    "- Por eso, antes de hacer su primera llamada, pida por escrito al área legal o a su supervisor tres cosas: en qué horario se puede contactar, cuántas veces se puede contactar a la misma persona, y qué se hace cuando el deudor pide que no lo llamen más. Eso no está en el sistema y usted no lo puede deducir de la pantalla.",
    "? Mencione tres cosas que usted nunca puede hacer al gestionar una cuenta. | amenazar, cárcel, embargo, abogado, autoridad, terceros, familia, jefe, mentir, inventar | Nunca amenazar con cárcel o embargo, nunca hacerme pasar por abogado o autoridad, y nunca contarle la deuda a terceros como la familia, el jefe o los vecinos. Tampoco inventar plazos ni cifras.",
    "? El sistema lo deja llamar a cualquier hora y cuantas veces quiera. ¿Eso quiere decir que se puede? | no, no quiere decir, no controla, ley, responsabilidad, preguntar, legal, horario | No. El sistema no controla horarios ni número de contactos, así que la responsabilidad es mía. Tengo que pedirle al área legal el horario permitido, cuántas veces puedo contactar y qué hacer si el deudor pide que no lo llamen más.",
    "",
    "# Los errores caros: lo que usted no debe tocar",
    "- Hay tres pantallas de MATRIX que no le corresponden a un asesor: Registro, Comisiones y Ajustes. No es desconfianza: es que ahí se captura y se paga el trabajo de todo el equipo, y un error ahí le cambia la plata a otra persona.",
    "- Si usted ve un número equivocado en Registro, no lo corrija. Avísele a su supervisor y déjelo así. Corregirlo usted, aunque sea con la mejor intención, cambia lo que alguien va a cobrar.",
    "- En Comisiones vive la tabla que decide el pago de todos los de su categoría. Esa pantalla se mira, no se toca.",
    "- En Ajustes están los botones de respaldo. Uno reemplaza toda la base y otro la borra, y como MATRIX no tiene servidor, lo que se pierde ahí no está en ninguna otra parte. Esa pantalla es del administrador.",
    "- Si alguna vez le toca descargar un respaldo, trátelo como trataría una nómina impresa: adentro van los datos y los pagos de todo el equipo. No se manda por WhatsApp ni se deja en la carpeta de descargas.",
    "- Hay una casilla que dice Pregúntale a MATRIX. Esa manda información real de la operación a un servicio de afuera y le cuesta plata a la empresa cada vez. No es un juguete para probar.",
    "- Su pantalla es Mi progreso, y también puede mirar el Tablero para ver cómo va el equipo. Con eso le alcanza para todo el día.",
    "* Usted ve un número equivocado en la pantalla Registro. ¿Qué hace?",
    "+ No lo corrijo: le aviso a mi supervisor. | Esa celda cambia lo que alguien va a cobrar, y corregirla no le corresponde a un asesor.",
    "x Lo corrijo, porque está mal y es rápido. | Cambia la comisión de otra persona: no es una corrección inocente.",
    "x Lo corrijo y después le aviso a mi supervisor. | El daño ya quedó hecho; primero se avisa.",
    "* ¿Cuáles son las pantallas que un asesor no debe tocar?",
    "+ Registro, Comisiones y Ajustes. | Ahí se captura, se paga y se administra el trabajo de todo el equipo.",
    "x Mi progreso y el Tablero. | Al contrario: esas son justamente las suyas.",
    "x Ninguna: si están visibles, es porque se pueden usar. | Que estén visibles no significa que le correspondan.",
    "? ¿Qué hace usted si ve un número equivocado en la pantalla Registro? | no lo corrijo, no toco, avisar, supervisor | No lo corrijo yo: le aviso a mi supervisor. Esa celda cambia lo que alguien va a cobrar."
  ].join('\n');

  var CURSOS = [
    { clave: 'induccion', texto: TEXTO_INDUCCION },
    { clave: 'ley2300', texto: TEXTO_LEY },
    { clave: 'persuasion', texto: TEXTO_PERSUASION },
    { clave: 'matrix', texto: TEXTO_MATRIX }
  ];

  // Convierte el texto plano a la estructura que usa la app.
  function analizarTexto(texto) {
    var lineas = String(texto || '').split('\n');
    var contenido = { titulo: '', modulos: [] };
    var moduloActual = null;
    var preguntaOpciones = null;  // la pregunta de opciones que está recibiendo sus líneas

    for (var i = 0; i < lineas.length; i++) {
      var linea = lineas[i].trim();
      if (!linea) continue;

      if (linea.charAt(0) === '#') {
        moduloActual = { titulo: linea.slice(1).trim(), puntos: [], preguntas: [], pregunta: null };
        preguntaOpciones = null;
        contenido.modulos.push(moduloActual);
      } else if (linea.charAt(0) === '-' && moduloActual) {
        moduloActual.puntos.push(linea.slice(1).trim());
      } else if (linea.charAt(0) === '*' && moduloActual) {
        // Pregunta de opción múltiple: la ÚNICA que se puede calificar sin
        // ambigüedad y sin costo. Las de palabras clave sirven para mantener
        // despierta a la sala, pero no para sostener un "aprobado" que decide
        // si alguien sale al teléfono a cobrar.
        preguntaOpciones = {
          tipo: 'opciones',
          texto: linea.slice(1).trim(),
          opciones: []
        };
        moduloActual.preguntas.push(preguntaOpciones);
        if (!moduloActual.pregunta) moduloActual.pregunta = preguntaOpciones;
      } else if ((linea.charAt(0) === '+' || linea.charAt(0) === 'x') && preguntaOpciones) {
        var partesOp = linea.slice(1).split('|');
        preguntaOpciones.opciones.push({
          texto: (partesOp[0] || '').trim(),
          correcta: linea.charAt(0) === '+',
          porQue: (partesOp[1] || '').trim()
        });
      } else if (linea.charAt(0) === '?' && moduloActual) {
        var partes = linea.slice(1).split('|');
        // Varias preguntas por módulo se acumulan. Antes la asignación directa
        // pisaba la anterior: un cliente que escribía tres perdía dos, en
        // silencio y sin manera de notarlo hasta el día de la capacitación.
        preguntaOpciones = null;
        moduloActual.preguntas.push({
          tipo: 'abierta',
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
