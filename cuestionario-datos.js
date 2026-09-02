/* Las 29 preguntas del cuestionario de nanocréditos, generadas a partir del
   trabajo de diseño del 31 de agosto de 2026. NO se editan a mano aquí sin
   pensarlo dos veces: cada pregunta se escribió para producir una parte
   concreta del curso, y quitar una deja un módulo sin materia prima.

   'minimo' marca las doce que bastan para tener un curso dictable. Salieron
   de preguntarle al diseño qué es lo mínimo con lo que un asesor puede
   sentarse a cobrar sin que nadie le explique nada más.

   'critica' marca las que, si quedan vacías, obligan a INVENTAR: sin los
   textos reales de WhatsApp la IA redacta un mensaje de banco, y el curso
   pierde credibilidad en los primeros diez minutos. */

window.CUESTIONARIO_NANO = {
 "bloques": [
  {
   "titulo": "1. Quién se sienta el viernes (5 minutos, pero decide todo lo demás)",
   "paraQue": "Módulo 0 (el glosario hablado) y el tamaño del curso entero: cuántos módulos caben, con qué palabras se dictan y qué se le promete al asesor sobre su plata.",
   "campos": [
    {
     "id": "nc01",
     "num": 1,
     "label": "Quiénes se sientan el viernes 11: cuántos son, para cuál de las apps van (la que sea), a qué cartera entran (M0 PP, M0 VP, M1-1…), si han cobrado antes en otra parte, cuánto dura ahí un asesor en promedio, y —lo que más manda— cuánto tiempo REAL me das de curso antes de sentarlos a producir: ¿una hora?, ¿dos?, ¿media jornada?",
     "pista": "Seis líneas sueltas, sin redactar. La última decide todo: con una hora el curso son 6 módulos y hay que dejar cosas por fuera; con media jornada caben 12 y cabe la práctica con casos. Si entran a M0 el curso es de día cero; si entran a M1-1 es otro curso.",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc02",
     "num": 2,
     "label": "¿Qué palabras del trabajo NO entiende un asesor el primer día? Hazme la lista con la traducción a español de la calle, incluidas las que tú ya ni oyes: M0, M0 PP, M0 VP, M1-1, altura de mora, tipificar, gestión, cartera asignada, PDP, contacto efectivo, castigo, centrales.",
     "pista": "Una línea por palabra: «tipificar — ponerle el resultado a la gestión, escogiendo de una lista». Diez o quince líneas, cinco minutos. Vera LEE en voz alta: una palabra que no se entendió oída se lleva por delante los diez minutos siguientes.",
     "critica": false,
     "minimo": false
    },
    {
     "id": "nc03",
     "num": 3,
     "label": "¿Cómo se le paga a un asesor y qué se le va a exigir? Básico, cuánto gana por cuenta recuperada (o por gestión), cada cuánto se le paga, y la meta de un día normal: cuentas gestionadas, promesas conseguidas y monto recuperado.",
     "pista": "Cinco líneas con números, aunque sean rangos. Es lo primero que pregunta el que entra; si el curso no se lo contesta, pierde autoridad para todo lo demás.",
     "critica": false,
     "minimo": false
    }
   ]
  },
  {
   "titulo": "2. Lo que se escribe (el corazón del curso)",
   "paraQue": "Los módulos que el asesor usa en el minuto uno de su turno: qué manda, qué contesta cuando le devuelven la pelota y cuándo llama. De aquí sale también la mitad de las preguntas del examen.",
   "campos": [
    {
     "id": "nc04",
     "num": 4,
     "label": "Pégame TAL CUAL los mensajes de WhatsApp que más se mandan en un día: el del día del vencimiento, el de 2 o 3 días de mora, el de la semana siguiente y el último antes de que la cuenta salga de las manos del asesor. Con emojis, mayúsculas, saltos de línea y variables ({nombre}, {monto}, {link}). Al lado de cada uno márcame dos cosas: si es plantilla oficial o se lo inventó el asesor, y cuál de todos jala más.",
     "pista": "Copiar y pegar, no resumir. Con cuatro basta. Si tienes la versión que un asesor se inventó y funciona mejor que la oficial, esa es la más valiosa. Sin los textos reales la IA redacta un mensaje de banco —largo, con «estimado usuario»— y el curso pierde credibilidad en los primeros diez minutos.",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc05",
     "num": 5,
     "label": "Las cinco frases que más te devuelve el cliente y la respuesta EXACTA que se le da a cada una, escrita como se contesta, no explicada. Para cada una: qué contesta el asesor bueno y qué contesta el novato que pierde la cuenta. («ya pagué», «me quedé sin trabajo», «páseme a la otra semana», «yo no pedí ese crédito», «estoy pagando otras apps primero», «denúncieme, no tengo con qué»…)",
     "pista": "Cinco bloques de tres líneas: lo que dice el cliente / BIEN: «…» / MAL: «…». Entre comillas y con las palabras de verdad. Es el bloque que más minutos de curso produce por línea que escribas, y el MAL de cada pareja es la trampa de una pregunta del examen.",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc06",
     "num": 6,
     "label": "Tu cliente le debe al mismo tiempo a tres o cuatro apps y el sueldo no alcanza para todas. ¿Qué hace que te pague a ti primero? Dime lo que de verdad funciona y también lo que suena lógico pero no sirve.",
     "pista": "Dos listas cortas —FUNCIONA / NO FUNCIONA— de cuatro líneas cada una. Es lo más propio de este negocio y no está en ningún manual de cobranza: el novato cree que compite con la desidia del cliente y en realidad compite con otras tres apps por el mismo billete.",
     "critica": false,
     "minimo": false
    },
    {
     "id": "nc07",
     "num": 7,
     "label": "¿En qué momento deja de servir el WhatsApp y toca llamar? Y cuando se llama, escríbeme la llamada como un libreto: los primeros 15 segundos del asesor, lo que casi siempre contesta el cliente, y cómo se cierra. ¿Cuánto dura de verdad esa llamada?",
     "pista": "Un párrafo de guion con las frases entre comillas, más una línea con la regla de cuándo se llama y otra con la duración real (¿40 segundos?, ¿minuto y medio?). Sin tu libreto la IA inventa una llamada de banco de veinte minutos que aquí nadie hace.",
     "critica": false,
     "minimo": false
    },
    {
     "id": "nc08",
     "num": 8,
     "label": "Pégame DOS conversaciones de WhatsApp reales, tapando nombre, número y cédula: una que terminó en pago y una que se perdió o terminó en queja. Sin arreglarlas: con la hora de cada mensaje, las faltas de ortografía y los audios descritos entre corchetes ([nota de voz de 40 s: le explica el recargo]). Debajo de cada una, dos líneas tuyas: en qué mensaje exacto se ganó o se perdió la cuenta.",
     "pista": "Copiar y pegar del teléfono. De todo lo que no es crítico, esta es la que más sube el curso: un asesor no cambia lo que escribe porque le digan «sé claro», cambia cuando oye el mensaje que sí cobró al lado del que no. Si solo consigues una, que sea la que terminó mal.",
     "critica": false,
     "minimo": false
    }
   ]
  },
  {
   "titulo": "3. El turno: qué abre, a quién le cobra y cómo lee la pantalla",
   "paraQue": "El módulo del día uno. Sin esto Vera solo puede decir «tu supervisor te dará el acceso», que es cierto y no capacita a nadie.",
   "campos": [
    {
     "id": "nc09",
     "num": 9,
     "label": "Hazme la lista de TODO lo que un asesor tiene abierto en su turno, una herramienta por línea, con este formato: NOMBRE — para qué la usa — quién le da el acceso. Incluye lo que no es un programa (el chip de la empresa, el grupo de WeChat, un Excel que le mandan). Marca con estrella dónde vive la cuenta del deudor. Y cierra con los pasos desde que se sienta hasta que manda el primer mensaje: usuario, clave, si el sistema obliga a cambiarla, cómo queda enlazado WhatsApp Web con el chip de la empresa.",
     "pista": "Ocho o diez líneas y luego cinco pasos numerados. Ojo con lo que ya nos ha costado: MATRIX no es el ADMIN. Si el curso no lo aclara el primer día, el asesor nuevo se sienta a buscar deudores en la pantalla equivocada y pierde el día uno.",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc10",
     "num": 10,
     "label": "¿Cómo sabe el asesor a quién le cobra HOY? Contéstame cuatro cosas en líneas separadas: (a) quién arma la asignación, a qué hora está lista y dónde la ve; (b) cuántas cuentas trae en un día normal; (c) el orden exacto en que hay que atacarla —una regla por línea, de la primera a la última— y a cuáles no se les dedica un minuto hoy; (d) cuántos minutos puede gastar de verdad en una cuenta antes de soltarla, y qué hace si termina la lista antes de que acabe el turno.",
     "pista": "La (c) vale oro: es lo que separa a tu mejor asesor del que no rinde y hoy solo está en tu cabeza. Escríbela como órdenes: «1º las promesas que vencen hoy. 2º las de 1 a 5 días de mora que ya contestaron alguna vez. Nunca: las marcadas número equivocado». De ahí salen preguntas de examen con respuesta objetiva («de estas cuatro cuentas, ¿cuál trabajas primero?»).",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc11",
     "num": 11,
     "label": "Nómbrame los campos que el asesor ve en la ficha de una cuenta y, en una línea por campo, QUÉ DECIDE con ese dato (no qué significa: qué hace distinto según lo que diga). Márcame además tres cosas: qué campos suelen estar desactualizados y no hay que creerles; cuáles teléfonos son del deudor y cuáles no se marcan nunca; y si en la ficha aparecen contactos sacados de la agenda del celular del cliente, su ubicación o su lugar de trabajo.",
     "pista": "Una línea por campo, diez o doce en total; incluye si es primer crédito o el quinto, si pagó puntual antes y a qué hora pidió el crédito, porque eso cambia el mensaje. Lo último no es curiosidad: si esos contactos están en pantalla el asesor los va a usar aunque nadie se lo diga, y la regla «esos números no se tocan» solo se puede enseñar nombrando el campo tal como se ve.",
     "critica": true,
     "minimo": false
    },
    {
     "id": "nc12",
     "num": 12,
     "label": "¿Cómo es el ritmo del día? A qué hora sale la primera tanda, a qué horas contesta y paga la gente, qué días del mes entra la plata de verdad, y cómo se cierra el turno: qué reporte manda el asesor, a quién, a qué hora, qué números incluye y quién le revisa el trabajo al día siguiente.",
     "pista": "Ocho líneas. Sin esto el asesor nuevo dispara toda su lista a las 9 de la mañana y a las 11 se queda sin nada que hacer, y se entera del reporte de cierre el día que se lo reclaman.",
     "critica": false,
     "minimo": false
    }
   ]
  },
  {
   "titulo": "4. Cerrar la cuenta: qué se promete, cómo se cobra y qué se deja escrito",
   "paraQue": "Los módulos de negociar, verificar el pago y registrar. Son los únicos con respuestas objetivas, así que de aquí salen las preguntas de examen que califican de verdad.",
   "campos": [
    {
     "id": "nc13",
     "num": 13,
     "label": "¿Qué puede ofrecer un asesor por su propia cuenta y qué no puede prometer NUNCA? Los números: hasta qué descuento o condonación de intereses da él solo, cuántos días puede correr la fecha, hasta cuántos días adelante se acepta una promesa, si acepta abono parcial y desde qué monto, y desde qué punto necesita autorización y de quién. Aparte, la lista de lo que está prohibido prometer aunque el cliente lo pida o lo provoque.",
     "pista": "Números exactos y sí/no; nada de «depende del caso». Es lo que más plata y más riesgo cuesta cuando el asesor lo aprende improvisando: una promesa que la empresa no cumple mata la cuenta y produce el reclamo. Y es el bloque más fácil de examinar, justo lo que el examen de opción múltiple necesita.",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc14",
     "num": 14,
     "label": "El cliente dice «mañana le pago». Paso a paso: qué le pregunta el asesor en ese mismo momento, qué le manda de inmediato, qué registra, qué hace el día pactado y qué hace al día siguiente si no pagó. Y dime cómo distingues una promesa que se va a cumplir de una que es solo para quitarte de encima.",
     "pista": "Cinco pasos numerados y dos líneas de «promesa firme / promesa floja». Es el producto del día del asesor y de ahí sale su comisión; además volver a escribirle antes de la fecha pactada es un contacto de más.",
     "critica": false,
     "minimo": false
    },
    {
     "id": "nc15",
     "num": 15,
     "label": "¿Por dónde puede pagar un cliente y cuánto tarda cada medio en verse reflejado en el sistema? Una línea por medio (link de la app, Nequi, PSE, Efecty, corresponsal…). Después, cómo comprueba el asesor que un pago entró de verdad: en qué pantalla lo mira y qué dato busca. Y cierra con una línea: qué NO es prueba de pago.",
     "pista": "Los tiempos por medio son la mitad del valor y solo los sabe quien opera: «Efecty puede tardar al día siguiente; si pagó el viernes en la tarde, aparece el lunes». Sin esto el asesor cierra cuentas que no pagaron o pelea con clientes que sí pagaron.",
     "critica": true,
     "minimo": false
    },
    {
     "id": "nc16",
     "num": 16,
     "label": "El cliente dice que YA PAGÓ y el sistema lo sigue mostrando en mora. Paso a paso: qué le pide (soporte, fecha, valor, referencia), a quién le reporta el caso y por cuál canal, en cuánto se resuelve, qué le responde al cliente mientras tanto y —lo más importante— ¿esa cuenta se congela o se sigue gestionando? Agrega qué se hace si el cliente ya está bravo o amenaza con poner la queja.",
     "pista": "Seis líneas. Es el caso que produce quejas ante la SIC y el que más daño le hace a la marca: seguirle cobrando a alguien que ya pagó. Si no está escrito, el asesor improvisa justo en el momento de mayor riesgo legal y con la conversación quedando grabada.",
     "critica": true,
     "minimo": false
    },
    {
     "id": "nc17",
     "num": 17,
     "label": "Cópiame la lista COMPLETA de tipificaciones (los resultados que el asesor escoge al cerrar una gestión) tal como salen en el ADMIN — si están en chino o en inglés, pega el texto tal cual y al lado el nombre que usa el equipo. Una por línea: NOMBRE — cuándo se usa — qué le pasa a esa cuenta después (¿vuelve mañana a la lista?, ¿sale?, ¿la toma otro?). Al final, las dos o tres que la gente nueva SIEMPRE usa mal y por qué está mal.",
     "pista": "Una captura de pantalla del desplegable más tres líneas tuyas basta. Es el hueco más grande del curso y el único bloque del que salen preguntas de examen de verdad («el cliente dijo que paga el viernes: ¿qué tipificas?»). Sin esta lista, la constancia que emite Vera no prueba que el asesor sepa operar.",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc18",
     "num": 18,
     "label": "Apenas manda el mensaje o cuelga, ¿qué hace en el sistema? Y las dos que producen peleas de nómina: (a) ¿qué gestión NO cuenta para el indicador — un mensaje sin respuesta, una llamada que no contestaron, tipificar sin escribir comentario? (b) ¿hay un mínimo de gestiones por cuenta al día y qué pasa si una cuenta se queda sin tocar? Ponme además una nota bien escrita al lado de una nota inútil.",
     "pista": "Cuatro pasos y dos ejemplos de comentario («Contesté 2:15 pm, le pagan el 30, ofrezco 20% dto, confirma hoy 6 pm» frente a «gestionado»). Una gestión mal registrada es trabajo que no existió: ni se la pagan al asesor ni sirve de prueba en una auditoría.",
     "critica": false,
     "minimo": false
    }
   ]
  },
  {
   "titulo": "5. La ley como se vive aquí, no como se recita",
   "paraQue": "El módulo legal aplicado a tu operación: qué se hace EN LUGAR de lo que se hace hoy. Es el que evita la queja ante la SIC, y el que no se puede escribir sin ti porque ya existe un curso que recita artículos y no cambia nada.",
   "campos": [
    {
     "id": "nc19",
     "num": 19,
     "label": "Cuéntame, día por día y sin maquillar, qué se hace hoy con una cuenta desde que vence hasta que sale de las manos del asesor: qué día WhatsApp, qué día llamada, qué día SMS, cuándo cambia de categoría o de equipo (M0 → M1-1) y qué pasa al final. Y en cada paso dime a QUÉ NÚMERO se marca o se escribe y de dónde salió ese número: el que registró el cliente, un segundo número del formulario, una referencia personal, el del trabajo.",
     "pista": "Un renglón por día, del 1 al último. Escríbelo como pasa de verdad, sin maquillarlo: si el procedimiento real se aparta de lo que dice el manual, esa diferencia es justo lo que el curso tiene que resolver — no la puedo adivinar. El artículo 4 de la Ley 2300 prohíbe sin excepción contactar a un tercero, así que de aquí sale una regla dura del curso: hay que saber qué se hace hoy para poder escribirla.",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc20",
     "num": 20,
     "label": "¿A qué horas trabajan de verdad los asesores, se trabaja sábado o festivo, y hay mensajes automáticos (SMS, WhatsApp o llamadas del sistema) que salgan solos? Si los hay: a qué hora salen, cada cuántos días, quién los programó y ¿el asesor alcanza a verlos en alguna pantalla? Y la otra mitad: cuando la misma persona debe en dos de tus apps y la llevan dos asesores distintos, ¿alguien cruza eso o cada app va por su lado?",
     "pista": "Diez líneas. El tope legal es UN contacto por persona al día, no por cuenta: si el sistema ya escribió a las 7 a.m., la llamada del asesor a las 11 es la segunda y la infracción se la anotan a él. Si nadie cruza las apps, dímelo así: el curso le enseña al asesor la única salida que le queda (preguntarle al cliente y dejarlo anotado).",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc21",
     "num": 21,
     "label": "Las reglas de la casa para WhatsApp: ¿de dónde copia el asesor las plantillas?, ¿cuántos mensajes se le mandan a la misma persona en un día y con cuánta separación?, ¿qué hace cuando el cliente contesta a las 10 de la noche o un domingo?, y una línea por cada cosa que está prohibido escribir o hacer por ese canal.",
     "pista": "Seis u ocho líneas. La ley ya la tengo verificada (lun-vie 7:00–19:00, sáb 8:00–15:00, nunca domingos ni festivos); lo que me falta es la regla operativa tuya, que es la que el asesor va a obedecer a las 6:50 p.m. con 40 cuentas sin tocar.",
     "critica": false,
     "minimo": false
    },
    {
     "id": "nc22",
     "num": 22,
     "label": "Un cliente responde «no me vuelvan a escribir» o «solo contácteme por correo». Hoy, en la práctica: ¿dónde queda anotado eso?, ¿quién lo ve?, ¿y qué pasa mañana cuando la cuenta le cae a otro asesor o cuando ese mismo señor debe también en otra de tus apps?",
     "pista": "Tres líneas. Si hoy eso no queda registrado en ninguna parte, dímelo así de simple: con esa respuesta el curso define el apaño que se usa desde el lunes (una etiqueta, una hoja compartida) y de paso queda escrito lo que hay que pedirle al ADMIN. Una respuesta bonita no sirve para nada.",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc23",
     "num": 23,
     "label": "En un crédito de $150.000 a 15 días: ¿la empresa reporta de verdad a Datacrédito o TransUnion? ¿Desde cuántos días de mora, quién manda el aviso previo de 20 días y por cuál canal? Y si NO se reporta: ¿el asesor puede nombrar el reporte en un mensaje, sí o no?",
     "pista": "Cinco líneas. «Va a quedar reportado en Datacrédito» es la frase más escrita en esta cobranza y la que más caro sale si la empresa no es fuente inscrita o si el aviso de los 20 días nunca sale: sanción de la SIC y el reporte se cae en cuanto el cliente lo reclame. «No reportamos nada» también es una respuesta válida y cambia el módulo entero; de tu respuesta sale la frase exacta que el asesor SÍ puede escribir.",
     "critica": true,
     "minimo": true
    },
    {
     "id": "nc24",
     "num": 24,
     "label": "¿Cuándo deja el asesor de gestionar y pasa el caso a alguien más? Para cada situación dime a quién se lo pasa y por cuál canal: el cliente amenaza con demandar o dice que ya puso la queja en la SIC, manda un derecho de petición, dice que tiene abogado o tutela, dice que le robaron los datos y él no pidió ese crédito, el titular murió, el número es de otra persona, pidió que no lo contacten más.",
     "pista": "Una línea por caso: «si nombra abogado o tutela: se corta la gestión ahí mismo, se tipifica y se pasa al supervisor por el grupo el mismo día». Si alguna ruta no existe, dímelo y la definimos: sin ella el asesor sigue contestando y cada respuesta suya empeora la prueba en contra de la empresa.",
     "critica": true,
     "minimo": true
    }
   ]
  },
  {
   "titulo": "6. Con qué se califica y con qué se practica",
   "paraQue": "El examen final, la constancia que dice APROBADO y la práctica con casos antes de que el asesor toque a un cliente de verdad.",
   "campos": [
    {
     "id": "nc25",
     "num": 25,
     "label": "Termina esta frase ocho veces, cada línea empezando por un verbo: «Al terminar el curso, el asesor debe poder ______ sin preguntarle a nadie». Y aparte, las dos o tres cosas que en su primer turno todavía NO lo dejas hacer solo, y a quién se las pasa.",
     "pista": "Ocho líneas cortas («abrir mi lista del día y decir cuáles cinco cuentas trabajo primero y por qué»). Es la lista contra la que se arma el examen final. Si no alcanzas, yo te la propongo a partir de tus otras respuestas y tú solo dices sí o no.",
     "critica": false,
     "minimo": false
    },
    {
     "id": "nc26",
     "num": 26,
     "label": "Escríbeme unas 15 parejas de frases: la EQUIVOCADA tal como la dice o la escribe la gente nueva, entre comillas, y al lado la correcta, también entre comillas. Incluye las que has tenido que prohibir en tu operación. No redactes preguntas de examen: yo convierto cada pareja en una pregunta donde la equivocada es la trampa.",
     "pista": "Formato: MAL: «¿y por qué no ha pagado?» → BIEN: «¿qué fecha le queda cómoda para ponerse al día?». Vera solo califica opción múltiple, y una pregunta sirve o no según las opciones FALSAS: si son caricaturas, todos pasan y la constancia miente. Las buenas son las frases que un asesor tuyo diría de verdad, y eso no lo puedo inventar sin inventarme el negocio.",
     "critica": false,
     "minimo": false
    },
    {
     "id": "nc27",
     "num": 27,
     "label": "Los cinco errores que comete SIEMPRE el asesor nuevo en su primera semana. Uno por línea y en tres partes separadas por una raya: qué hace exactamente / qué pasa por hacerlo (en pesos, en queja, en cuenta perdida, en sanción) / qué debió hacer.",
     "pista": "Sé quirúrgico: «manda el mismo mensaje a las 9 de la noche» enseña; «le falta empatía» no enseña nada. Si tienes un caso real de llamado de atención, cuéntalo sin nombres: una sanción contada se recuerda una semana después, un artículo citado no. Y si el curso no los nombra, los vas a seguir corrigiendo uno por uno con cada asesor que entra, que es justo el trabajo que estamos tratando de quitarte.",
     "critica": false,
     "minimo": false
    },
    {
     "id": "nc28",
     "num": 28,
     "label": "Dos listas cortas y un sí/no: (a) qué NO puede tocar un asesor en el sistema, dicho como orden y sin explicar por qué el sistema lo permite; (b) qué prohíbe la empresa aunque la ley lo permita; (c) al asesor que se pasa de la raya, ¿qué le pasa: se le descuenta la comisión, carta, se va? Y confírmame si el bloque de seis reglas de cumplimiento que ya está en matrix.html sigue vigente como texto oficial.",
     "pista": "Cinco o seis líneas. La (c) no es un detalle moral: un asesor que cobra por comisión solo frena si sabe qué pierde ÉL, y sin eso el módulo legal es un sermón. Y el curso no puede volverse un manual de fraude: el asesor necesita saber QUÉ no se toca, no por qué el sistema es frágil.",
     "critica": false,
     "minimo": false
    },
    {
     "id": "nc29",
     "num": 29,
     "label": "Cópiame la ficha de tres cuentas reales como las ve el asesor, sin nombre, sin cédula y sin teléfono: monto, fecha de desembolso, vencimiento, días de mora, saldo con recargos, por qué canal ya se le escribió y el historial de gestiones tal cual («12-ago no contesta», «13-ago promesa para el 15, incumplida»). Una fácil, una regular y una fea. Si me dices qué debería hacer el asesor con cada una, esas tres respuestas se vuelven la corrección.",
     "pista": "Tres bloques de cinco líneas, copiados de la pantalla. Con esto Vera puede parar a mitad del curso y decir «esta es tu cuenta, ¿qué haces primero y qué le escribes?», que es la parte que de verdad forma. Sin ellas el curso es un manual leído en voz alta.",
     "critica": false,
     "minimo": false
    }
   ]
  }
 ],
 "nota": "Contesta a lo bruto y en desorden: pega los textos tal cual salen del teléfono o del ADMIN, con emojis, mayúsculas y faltas, porque lo que maquilles se convierte en un curso que el asesor no reconoce y no sigue. Cuando una respuesta sea incómoda —«eso no lo anota nadie», «el manual dice una cosa y se hace otra»— esa es justo la que más sirve: con ella el curso enseña qué se hace desde el lunes en vez de recitar la ley. Si no llegas a todo, responde primero las doce del mínimo viable y el resto lo completamos después del viernes; y si no contestas la 1, doy por hecho dos horas de curso para asesores que entran a M0.",
 "minimo": "Con UNA sentada de unos 45 minutos basta si responde estas doce: 1, 4, 5, 9, 10, 13, 17, 19, 20, 22, 23 y 24. Con ellas sale un curso de seis módulos dictable el viernes 11: (I) qué abres y a quién le cobras hoy [9, 10]; (II) qué escribes y qué contestas cuando te devuelven la pelota [4, 5]; (III) qué puedes prometer y qué no [13]; (IV) qué dejas registrado al cerrar la gestión [17]; (V) la ley aquí — a qué número se marca y a cuál no, horarios y mensajes automáticos, quién pidió que no lo contacten, qué se puede decir del reporte a centrales [19, 20, 22, 23]; (VI) cuándo sueltas la cuenta y a quién se la pasas [24]. El examen final se arma con las trampas que ya vienen dentro de las respuestas 5, 13 y 17, así que hay nota y constancia sin pedirle nada más. Si le sobran diez minutos, cuatro preguntas más en este orden: 15 y 16 (el pago y el «ya pagué», el hueco que más quejas ante la SIC produce), 11 (los campos de la ficha, sobre todo si aparecen los contactos de la agenda del cliente) y 26 (las parejas MAL/BIEN, que es lo que hace que el examen no lo pase cualquiera). Todo lo demás —2, 3, 6, 7, 8, 12, 14, 18, 21, 25, 27, 28 y 29— sube el curso pero no lo bloquea, y de ese grupo la 8 (dos conversaciones reales pegadas tal cual) es la que más lo sube. Sin las doce de arriba el curso igual se puede dictar, pero con contenido inventado: sonaría a cobranza de banco y el asesor lo notaría en los primeros diez minutos."
};
