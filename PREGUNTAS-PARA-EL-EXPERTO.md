# Lo que falta preguntarle al que sabe

Estas preguntas salieron de leer MATRIX línea por línea. Son lo que el código
NO puede responder y que solo sabe una persona. Cada una bloquea una parte del
curso: mientras no se respondan, Vera no puede enseñar eso sin inventar.

**El hallazgo que hay que tener claro antes de todo:** MATRIX no es el ADMIN.
El propio sistema lo dice — *"la herramienta no se conecta a ADMIN"*. MATRIX
mide el desempeño y calcula comisiones; la cartera vive en la plataforma de
casa matriz. El curso extraído enseña MATRIX, que sirve desde el primer día,
pero el curso del ADMIN todavía no se puede escribir.

## 1. ¿Nos pueden mostrar el ADMIN en pantalla (o dar capturas y una grabación) de: cómo se busca una cuenta, qué campos tiene la ficha del deudor, cómo se marca o tipifica una gestión, qué estados tiene una cuenta y cómo se registra una promesa de pago?

*Por qué importa:* matrix.html no contiene NI UNA pantalla del ADMIN: solo lo nombra (Aging Real-time Report, Collection Performance Report, Batch Assignment) y reconoce ocho encabezados en chino. Sin esto, el curso puede enseñar cómo se MIDE al asesor pero no cómo se GESTIONA una cuenta, que es literalmente el trabajo. Es el hueco más grande de todos.

## 2. ¿Qué exige la Ley 2300 en la operación: horario permitido de contacto, cuántas veces se puede contactar a la misma persona por semana, qué canales, y qué se hace cuando el deudor pide que no lo contacten más? ¿Dónde se registra todo eso: en el ADMIN o en ninguna parte?

*Por qué importa:* Buscado a fondo en las 4.529 líneas, la Ley 2300 no aparece ni una vez y no existe ningún campo, filtro ni validación de horario, frecuencia, canal autorizado o marca de no contactar. Lo único legal escrito es la Ley 1266 y la SIC, dentro de un módulo apagado. El curso solo puede decir que el sistema no lo frena; la regla concreta tiene que venir del área legal.

## 3. ¿Qué significan exactamente PP y VP, cuántos días de mora cubre cada categoría (M0, M0-PP, M0-VP, M1-1, M1-1A, M1-1B, M1-2, M1-3, M2, M3), qué es 'Combinar cuentas' y por qué existe 'M01-PP' además de 'M0-PP'?

*Por qué importa:* El código lista las doce categorías pero no define ninguna. Lo único deducible está en textos de un módulo desconectado: M0-VP como 'vencido parcial', M1 como '~30-59 días' y M2/M3 como 'prejurídico'. 'M01-PP' podría ser un valor real del ADMIN o un error heredado, y eso cambia lo que se le enseña al asesor.

## 4. ¿Las tablas de pago que trae el código (por ejemplo M0-PP LuckyPlata: 50%→$55.000, 45%→$47.000 … 0→−$6.000 por día) siguen vigentes hoy? ¿Quién actualiza el Excel de casa matriz, cada cuánto cambia y dónde se consigue la versión vigente?

*Por qué importa:* Las tablas están en el código como valores por defecto y son editables desde la pantalla Comisiones, así que pueden estar desactualizadas. El curso enseña cifras concretas de sueldo: si están viejas, se le promete al asesor una plata que no es.

## 5. ¿La regla del sábado (el umbral baja al 80%) es oficial de casa matriz, sí o no?

*Por qué importa:* Hay una contradicción DENTRO del propio sistema: la pantalla Comisiones dice en cursiva 'Sábado = 80% del umbral: pendiente', mientras que Mi progreso lo afirma como un hecho ('los sábados cuentan doble de fácil') y el cálculo la aplica siempre. El curso no puede resolver esto solo.

## 6. ¿Dónde registra el asesor su gestión con el deudor (la llamada, el resultado, la promesa)? ¿La pantalla Llamadas de MATRIX se usa para eso o es solo para llamadas internas de coordinación?

*Por qué importa:* El formulario de Llamadas no tiene campo de cliente, cédula, cuenta ni monto prometido; el contacto pide 'Nombre o área' y los ejemplos de tema son 'meta M1-2, permiso, escalamiento'. Todo apunta a uso interno, pero el código no lo decide. Si el curso lo enseña mal, el asesor registra su cobranza en un cuaderno que nadie audita.

## 7. ¿Los computadores de los asesores están hoy configurados en 'Modo asesor'? ¿Quién custodia el PIN, es el mismo en todos los equipos y hay política de cambiarlo?

*Por qué importa:* Si un equipo de asesor queda en modo gerencia, esa persona ve la nómina completa, las comisiones de todos y el organigrama. Y el modo asesor solo esconde botones: los datos siguen en el equipo y el PIN se guarda sin cifrar. El curso necesita saber para quién está escribiendo y qué se le puede prometer sobre privacidad.

## 8. ¿Con qué evidencia se verifican los días trabajados antes de pagar (planilla, biométrico, WeChat), y quién los revisa?

*Por qué importa:* Los días no vienen del export: MATRIX los deduce como 'días distintos con datos'. Si a un asesor no le asignaron cuentas un día, ese día desaparece de su nómina. La propia app dice 'revísalos en Registro antes de pagar', pero no dice quién ni contra qué. El asesor necesita saber a quién reclamar y en qué plazo.

## 9. ¿Dónde está hoy la herramienta 'Cobra IA' y sus 24 plantillas de mensaje por etapa? ¿Los asesores tienen acceso, y ese bloque de cumplimiento legal es el texto aprobado por la empresa?

*Por qué importa:* El código conserva las plantillas, las 7 objeciones típicas y el bloque legal, pero está desconectado: un comentario dice que 'Cobra IA se movió a su propio proyecto', no existe el elemento donde se pintaría, y no hay botón en el menú. El curso enseña esas reglas legales como conocimiento, pero no puede llamarlas 'plantillas oficiales' ni decirle al alumno dónde abrirlas.

## 10. ¿Quién saca el export del ADMIN, cada cuánto, y cuál es la ruta paso a paso hasta el botón Export? ¿Quién deja los consolidados donde la app de escritorio los encuentra al arrancar?

*Por qué importa:* MATRIX reconoce los encabezados chinos del Aging Real-time Report, pero del proceso solo dice 'Collection Performance Report → Export'. Y la pantalla Resultados se llena de un objeto que inyecta una app de escritorio que no está en este archivo. Sin eso, el curso no puede explicar por qué un día las cifras no están.

## 11. ¿Cuántas cuentas se le asignan de verdad a un asesor por categoría? ¿Siguen siendo los rangos que hay en el código (M0-PP 30 a 45, M0-VP 40 a 45, M1-1A 60 a 75, M1-1B 70 a 80, M1-1 60 a 75)?

*Por qué importa:* Esos rangos están escritos en el código pero no se usan en ninguna pantalla: podrían ser una referencia de casa matriz o un resto de una versión anterior. Es la primera pregunta que hace un asesor nuevo ('¿cuántas cuentas me van a dar?') y hoy no se puede responder con certeza.

## 12. ¿La empresa autorizó que se manden datos de empleados (nombres, sede, cuentas, recuperado, comisiones) a un proveedor de inteligencia artificial en el exterior, y de quién es la clave configurada hoy?

*Por qué importa:* La caja 'Pregúntale a MATRIX' envía hasta 180.000 caracteres del resumen real de la operación a api.anthropic.com, y el respaldo JSON descarga el PIN y esa clave en texto legible. Es una pregunta para el área legal y para quien paga la cuenta, no algo que el curso pueda zanjar.

## 13. ¿Las ventanas de confirmación del navegador funcionan cuando MATRIX se abre desde el ícono del escritorio?

*Por qué importa:* Un comentario del propio autor, en la línea 1635, dice que 'las ventanitas nativas del navegador no funcionan en la app de escritorio' (por eso 'Dar de baja' se rehízo con ventana propia). Pero Borrar todo, Eliminar persona, Restaurar tablas y el PIN de gerencia siguen usando esas ventanas. Si allá no aparecen, esas confirmaciones no están protegiendo nada y el módulo de errores caros habría que reescribirlo.

---

## Qué tan fiable es el curso extraído

Qué tan fiable es lo que hay en el curso, dicho sin adornos:

FIABLE (verificado línea por línea en C:/Users/joanh/OneDrive/Desktop/Joan te presta/matrix.html, 4.529 líneas): los 17 botones del menú y el reparto 8 visibles / 9 escondidos (líneas 262-277 y CSS .navbtn.sec{display:none}); el PIN de máximo 6 dígitos, que entra directo si está vacío y el texto "PIN incorrecto" (initPin, línea 4519); el modo asesor que solo pone display:none a los botones y el desbloqueo por el sello M con prompt (aplicarModoAsesor / desbloquearGerencia, líneas 2624-2637); el desajuste de apertura (botón "resultados" con clase .on en la 262 contra la sección v-dash con .on en la 288, y abrirApp que no llama a irA en modo gerencia); las 12 categorías y las 5 con tabla (CATEGORIAS y CATS_DEMO, líneas 613-614); las cifras de las tablas de pago citadas (TABLAS_ASESOR_DEF, líneas 617-637); el escalón más alto alcanzado y el sábado al 80% (pagoDiaAsesor, línea 899, con `const k=sabado?0.8:1`); el pago = pago/día × días (comisionDe); la cuenta de "Tu próxima meta" (siguienteEscalon, línea 1181); las 8 columnas de Registro, el guardado en 'change' y parseNum que borra comas y puntos (líneas 2718-2782 y 850); delLinea y delFila sin confirm; que "Pegar tabla" crea personas nuevas y el mensaje final con "· N nuevos" (procesarPaste, línea 2962); que resumirAdmin nunca suma contactos ni PDP (líneas 3072-3100); las nueve vistas con aviso de datos de ejemplo y su texto literal (líneas 3391-3400); importar() sin ninguna confirmación (línea 3778); borrarPersona barriendo todos los periodos (línea 3763); el bloque COBRA_LEGAL palabra por palabra (líneas 670-676); los campos y el aviso de grabación de Llamadas (líneas 1550-1608); las llamadas a api.anthropic.com (líneas 2204, 2474, 2530, 3959); y que todo vive en localStorage con KEY='joan_cobranzas_v1'.

VERIFICADO POR AUSENCIA: "Ley 2300" no aparece ninguna vez en el archivo; tampoco "domingo", "festivo" ni "no contactar"; "horario" aparece una sola vez, dentro de COBRA_LEGAL. El módulo Cobra IA está efectivamente apagado: renderCobra busca un elemento 'cobraBody' que no existe en ninguna parte del archivo, renderCobra no está en la lista de render() (línea 990) y no hay botón con data-v="cobra".

LO QUE NO SE PUEDE SOSTENER Y POR ESO NO ESTÁ EN EL CURSO: cualquier procedimiento del ADMIN (buscar una cuenta, tipificar, agendar, registrar una PDP); el significado de las siglas de las categorías más allá de las tres pistas citadas; los volúmenes reales de asignación; quién puede tocar qué (no hay ningún control por rol en el código: quien entra con el PIN edita a cualquiera); y si la regla del sábado es oficial.

DOS AVISOS SOBRE EL CURSO MISMO: (1) El curso enseña cifras de sueldo concretas. Son las que están escritas en el código como valores por defecto y son editables desde la pantalla Comisiones, así que hay que confirmarlas contra el Excel vigente ANTES de dictar el módulo 4; si no se confirman, quítense las cifras y déjese solo la mecánica del escalón. (2) El título que pidieron, "Procesos del ADMIN (MATRIX)", parte de un supuesto que el código desmiente: MATRIX y el ADMIN son dos sistemas distintos. Mantuve el título pero el primer módulo corrige el supuesto de entrada, porque si no, el asesor se sienta el primer día a buscar un deudor en MATRIX y no lo encuentra.

TAL COMO ESTÁ, ESTE CURSO NO ENSEÑA A COBRAR. Enseña dónde está parado el asesor, cómo lo miden, cómo se convierte su trabajo en plata, qué no debe tocar y qué reglas legales lo obligan. La gestión de una cuenta —que es la mitad del oficio— está fuera de este archivo y solo se puede escribir después de ver el ADMIN con alguien que lo use a diario.