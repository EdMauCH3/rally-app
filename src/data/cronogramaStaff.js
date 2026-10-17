// Cronograma OFICIAL del staff (Interoratorios 2026). Fuente: cronograma general y
// itinerario detallado del Fest Color. Para corregir un dato basta editar este archivo.
//
// ini/fin: minutos desde la medianoche (hora de Colombia), solo para resaltar "AHORA".
// Los textos largos se separan con \n para mostrarse en líneas.

export const FECHA_EVENTO = '2026-10-17';
const h = (hh, mm = 0) => hh * 60 + mm;

/** @type {{ini:number,fin:number,hora:string,actividad:string,detalle?:string,comision:string,responsables?:string,lugar:string,materiales?:string,notas?:string,cumbre?:boolean}[]} */
export const cronogramaGeneralData = [
  {
    ini: h(7, 30), fin: h(8), hora: '7:30 a.m.', actividad: 'Hora de inicio',
    comision: 'Todos', responsables: 'Todos', lugar: 'Todos',
  },
  {
    ini: h(8), fin: h(9), hora: '8:00 – 9:00 a.m.', actividad: 'Acogida',
    detalle: 'Entrega de manillas, consentimiento informado al salesiano y entrega de camisetas al coordinador del grupo juvenil (la camiseta debe ponerse después de la tarde de integración). Foto creativa por grupo (8:45 a.m.).',
    comision: 'Logística · Animación (Juegos) · Comunicaciones (Foto)',
    responsables: 'Logística: Kevin · Animación: Nicolás, Pedro y Yerinson · Comunicaciones: Diego, Yulian y Jesús',
    lugar: 'Entrada del colegio',
    materiales: 'Manillas · Sonido (2 micrófonos inalámbricos) · Camisetas (divididas en grupos juveniles) · Mesa (2) · Silla (3) · Lapiceros · Micrófonos para animadores · Balones (fútbol, baloncesto y voleibol)',
    notas: 'Habilitar guardarropas. Alejandro y Bayron ayudan a los muchachos a organizarse para los guardarropas. Nadie por otro espacio distinto al patio principal, canchas o entrada del colegio. A las 8:50 a.m. el animador debe enviarlos a la Eucaristía.',
  },
  {
    ini: h(9), fin: h(9, 10), hora: '9:00 – 9:10 a.m.', actividad: 'Opening',
    detalle: 'Presentación de apertura CEDBOS.',
    comision: 'Animación', responsables: 'Animadores y presentadores', lugar: 'Coliseo',
    materiales: 'Video beam · Sonido · Micrófonos · Extensión del video beam',
    notas: 'Los animadores deben recibir a los jóvenes y organizarlos. Si se puede iniciar a las 9:00 a.m., muchísimo mejor.',
  },
  {
    ini: h(9, 10), fin: h(10, 5), hora: '9:10 – 10:05 a.m.', actividad: 'Eucaristía y confesiones',
    detalle: 'Para las confesiones, distribuir a los ministros buscando dos sillas para cada uno.',
    comision: 'Formación', responsables: 'Andrés delega a uno de los hermanos de su comisión de formación',
    lugar: 'Coliseo · Corredor (confesiones)',
    materiales: 'Sonido · Artículos de la misa',
    notas: 'Después de la misa se explicará a los muchachos cómo será la metodología de la formación, la división de grupos, quiénes dirigen cada base de formación y su lugar, y quién es el líder del grupo. También se dirá el método de la rotación y cuánto dura (puede ser el timbre o la sirena). Recoger los artículos de la misa. A las 10:15 a.m. el animador debe enviarlos a la merienda.',
  },
  {
    ini: h(10, 10), fin: h(10, 30), hora: '10:10 – 10:30 a.m.', actividad: 'Merienda',
    comision: 'Logística · Economía', responsables: 'P. César, Sebastián y José Mario', lugar: 'Tienda del colegio',
    materiales: 'Meriendas · Marcadores · Lapiceros',
    notas: 'Se sugiere que a las 10:30 se haga el llamado para la formación (Andrés). Marcar con lapicero a los jóvenes que recibieron merienda.',
  },
  {
    ini: h(10, 30), fin: h(12, 20), hora: '10:30 a.m. – 12:20 p.m.', actividad: 'Formación',
    comision: 'Formación', responsables: 'Andrés y salesianos encargados de la formación',
    lugar: 'Primer y segundo piso (cerca de la cafetería y sala de profesores)',
    materiales: 'Mapa ruta impreso',
    notas: 'Señalización de los lugares y mapa ruta: enviar al grupo de WhatsApp. Una vez terminada la formación se debe abrir el salón con el grupo completo al ingresar y salir.',
  },
  {
    ini: h(12, 20), fin: h(13, 20), hora: '12:20 – 1:20 p.m.', actividad: 'Almuerzo',
    comision: 'Logística · Economía · Apostolados · Asesores adultos / Coordinadores del grupo juvenil',
    responsables: 'P. César, responsable de los almuerzos de la comunidad del POS',
    lugar: 'Primer piso',
    notas: 'Tener almuerzos de más por si alguno no lleva. Nadie almuerza en el segundo piso.',
  },
  {
    ini: h(13, 20), fin: h(15, 50), hora: '1:20 – 3:50 p.m.', actividad: 'Deporte, Gymkana y búsqueda del tesoro',
    comision: 'Actividad lúdica: Animación · Asistencia a lugares: Logística y Economía',
    responsables: 'Nicolás, Yerinson, Carlos, Mauricio, Bayron, Alejandro, Kevin, Sebastián y José Mario',
    lugar: 'Patio y espacios que el colegio dispone (canchas)',
    materiales: 'Balones · Árbitro · Planillas · Sonido · Micrófonos',
    notas: 'Se sugiere usar solo el espacio del primer piso para estas actividades. Colocar bandas para bloquear la entrada a esos pisos. Se sugiere que a la 1:10 p.m. se empiece a llamar para iniciar toda la actividad, haciendo la división de las disciplinas de los deportes, Gymkana y búsqueda del tesoro.',
  },
  {
    ini: h(15, 50), fin: h(16, 10), hora: '3:50 – 4:10 p.m.', actividad: 'Aseo personal',
    comision: 'Asistencia a lugares: Logística', responsables: 'Alejandro, Bayron y Kevin', lugar: 'Baños y salones del tercer piso',
    notas: '3:40 p.m. abrir salones de guardarropa. Llamado a la merienda por parte de la comisión de animación. Cada grupo lleva sus cosas para la presentación.',
  },
  {
    ini: h(16, 20), fin: h(16, 40), hora: '4:20 – 4:40 p.m.', actividad: 'Merienda',
    comision: 'Logística · Economía', responsables: 'P. César, Sebastián y José Mario', lugar: 'Tienda del colegio',
    materiales: 'Meriendas',
    notas: '4:55 p.m. llamado para el Fest Color.',
  },
  {
    ini: h(17), fin: h(19, 34), hora: '5:00 – 7:34 p.m.', actividad: 'Acto cultural · FEST COLOR',
    detalle: 'Presentaciones, premiación, fiesta, buenas noches y foto oficial.',
    comision: 'Animación · Logística · Economía · Comunicaciones',
    responsables: 'Nicolás (premios); Nicolás y Pedro anuncian los grupos que se presentan y se preparan para su acto cultural, y designan qué hermanos de su comisión acompañan la entrada y salida en el camerino. Apoyo: Bayron, Alejandro, Kevin, Sebastián, José Mario, Diego y Yulian',
    lugar: 'Coliseo (camerino) · Foto IO 2026',
    materiales: 'Premios · Imprimir los QR · Presentar el QR',
    notas: 'Cada presentación debe durar entre 5 y 8 minutos, con 2 minutos para el cambio. Mientras un apostolado se presenta, el otro debe estar alistándose. Se tendrán los QR para que los jóvenes realicen la evaluación del encuentro.',
    cumbre: true,
  },
];

/** @type {{ini:number,fin:number,hora:string,momento:string,detalle?:string,prepara?:string,notas?:string,tipo:'animacion'|'presentacion'|'premio'|'fiesta'|'cierre'}[]} */
export const colorFestData = [
  { ini: h(17), fin: h(17, 10), hora: '5:00 – 5:10 p.m.', momento: 'Acogida del Fest Color · Momento de animación', prepara: 'Se prepara Don Bosco en lo Alto.', tipo: 'animacion' },
  { ini: h(17, 10), fin: h(17, 18), hora: '5:10 – 5:18 p.m.', momento: 'Se presenta Don Bosco en lo Alto', prepara: 'Se prepara Fratelli.', tipo: 'presentacion' },
  { ini: h(17, 18), fin: h(17, 26), hora: '5:18 – 5:26 p.m.', momento: 'Se presenta Fratelli', prepara: 'Se prepara Sufragio (Verkünder). Alistar premio a la mejor foto y delegación.', notas: 'Establecer criterio para la mejor foto y delegación.', tipo: 'presentacion' },
  { ini: h(17, 26), fin: h(17, 34), hora: '5:26 – 5:34 p.m.', momento: 'Entrega de premio', detalle: 'Mejor foto y delegación.', tipo: 'premio' },
  { ini: h(17, 34), fin: h(17, 42), hora: '5:34 – 5:42 p.m.', momento: 'Se presenta Sufragio (Verkünder)', prepara: 'Se prepara Girardota (San Juan Bosco).', tipo: 'presentacion' },
  { ini: h(17, 42), fin: h(17, 50), hora: '5:42 – 5:50 p.m.', momento: 'Se presenta Girardota (San Juan Bosco)', prepara: 'Se prepara Colegio María Auxiliadora.', notas: 'Alistar el premio de los ganadores de la tarde de integración: Gymkana, búsqueda del tesoro y torneo de microfútbol.', tipo: 'presentacion' },
  { ini: h(17, 50), fin: h(18), hora: '5:50 – 6:00 p.m.', momento: 'Entrega de premio', detalle: 'Ganadores de la tarde de integración.', tipo: 'premio' },
  { ini: h(18), fin: h(18, 8), hora: '6:00 – 6:08 p.m.', momento: 'Se presenta Colegio María Auxiliadora', prepara: 'Se prepara Ciudad Don Bosco.', tipo: 'presentacion' },
  { ini: h(18, 8), fin: h(18, 16), hora: '6:08 – 6:16 p.m.', momento: 'Se presenta Ciudad Don Bosco', prepara: 'Alistar premio Revelación IO 2026 y gran premio (rifa).', tipo: 'presentacion' },
  { ini: h(18, 16), fin: h(18, 24), hora: '6:16 – 6:24 p.m.', momento: 'Revelación IO y El gran premio', detalle: 'Entrega de premio.', tipo: 'premio' },
  { ini: h(18, 24), fin: h(18, 34), hora: '6:24 – 6:34 p.m.', momento: 'Entrega del reconocimiento a cada delegación', tipo: 'premio' },
  { ini: h(18, 34), fin: h(19, 34), hora: '6:34 – 7:34 p.m.', momento: 'Fiesta', tipo: 'fiesta' },
  { ini: h(19, 34), fin: h(19, 39), hora: '7:34 – 7:39 p.m.', momento: 'Evaluación', detalle: 'A cargo de Bayron, Alejandro y Kevin.', prepara: 'Se realizará por medio de una plataforma digital y se premiará la primera delegación que complete 25 evaluaciones diligenciadas.', tipo: 'cierre' },
  { ini: h(19, 39), fin: h(19, 44), hora: '7:39 – 7:44 p.m.', momento: 'Buenas noches y evaluación', detalle: 'P. César.', tipo: 'cierre' },
  { ini: h(19, 54), fin: h(20), hora: '7:54 p.m.', momento: 'Cierre de la IE', detalle: 'Responsable: Logística (Bayron).', notas: 'Aseo general del lugar. Los hermanos de tercer año salen antes para que puedan descansar y prepararse para las pruebas Saber Pro.', tipo: 'cierre' },
];
