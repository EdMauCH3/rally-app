import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock, MapPin, Users, Sparkles, CalendarClock, PartyPopper, DoorOpen, Camera,
  Church, Cookie, BookOpen, Utensils, Trophy, Shirt, ClipboardCheck, LogOut,
  Backpack, ChevronDown, Flag,
} from 'lucide-react';

const FECHA_EVENTO = '2026-10-17';
const FORM_EVALUACION =
  'https://docs.google.com/forms/d/e/1FAIpQLSekb1eeqgPJu1jnsBF0VtgC76XnKdZlHVVipDT3cOJIxY4R3g/viewform';

const h = (hh, mm = 0) => hh * 60 + mm;

const MOMENTOS = [
  { ini: h(7, 30), fin: h(8), hora: '7:30 – 8:00 a.m.', titulo: 'Llegada y Apertura de Puertas', lugar: 'Entrada del Colegio', organiza: 'Equipo de Bienvenida', preparar: 'Llegar puntual con tu delegación y documento de identidad.', Icono: DoorOpen, tono: 'sky' },
  { ini: h(8), fin: h(9), hora: '8:00 – 9:00 a.m.', titulo: 'Acogida, Registro y Foto de Grupo', lugar: 'Entrada y Patio Principal', organiza: 'Logística, Animación y Comunicaciones', preparar: 'Reclamar manilla, guardar equipaje en guardarropa. Foto oficial por grupo (8:45 a.m.).', Icono: Camera, tono: 'sky' },
  { ini: h(9), fin: h(9, 20), hora: '9:00 – 9:20 a.m.', titulo: 'Opening', lugar: 'Coliseo', organiza: 'Comisión de Animación (CEDBOS)', preparar: 'Ubicarse con tu delegación en graderías y vivir la apertura con alegría.', Icono: PartyPopper, tono: 'amber' },
  { ini: h(9, 20), fin: h(10, 20), hora: '9:20 – 10:20 a.m.', titulo: 'Eucaristía y Reconciliación', lugar: 'Coliseo (Confesiones en Corredor)', organiza: 'Comisión de Formación y Sacerdotes', preparar: 'Disposición de escucha y silencio. Sacerdotes disponibles para confesar.', Icono: Church, tono: 'violet' },
  { ini: h(10, 20), fin: h(10, 40), hora: '10:20 – 10:40 a.m.', titulo: 'Merienda de la Mañana', lugar: 'Tienda escolar y Patio', organiza: 'Logística y Economía', preparar: 'Reclamar refrigerio con tu manilla y alistarse para la ruta formativa.', Icono: Cookie, tono: 'orange' },
  { ini: h(10, 40), fin: h(12, 30), hora: '10:40 a.m. – 12:30 p.m.', titulo: 'Talleres y Bases de Formación', lugar: 'Aulas asignadas (Pisos 1 y 2)', organiza: 'Comisión de Formación', preparar: 'Seguir el mapa de ruta y desplazarse junto al líder de grupo a cada base.', Icono: BookOpen, tono: 'violet' },
  { ini: h(12, 30), fin: h(13, 30), hora: '12:30 – 1:30 p.m.', titulo: 'Almuerzo Comunitario', lugar: 'Primer Piso y Zonas Comunes', organiza: 'Logística y Asesores de Delegación', preparar: 'Compartir con tu grupo y mantenerse en el 1er piso. Hidratarse bien.', Icono: Utensils, tono: 'orange' },
  { ini: h(13, 30), fin: h(16), hora: '1:30 – 4:00 p.m.', titulo: 'Tarde Deportiva, Gymcana y Búsqueda del Tesoro', lugar: 'Patio Principal y Canchas Polideportivas', organiza: 'Comisión de Animación y Logística', preparar: 'Ropa deportiva cómoda, tenis y termo de agua. Apoyar a tus equipos.', Icono: Trophy, tono: 'emerald' },
  { ini: h(16), fin: h(16, 30), hora: '4:00 – 4:30 p.m.', titulo: 'Aseo Personal y Cambio de Indumentaria', lugar: 'Baños y Guardarropas (3er Piso)', organiza: 'Comisión de Logística', preparar: 'Ponerse la camiseta oficial del IO 2026 y alistar vestuario/utilería de presentación.', Icono: Shirt, tono: 'sky' },
  { ini: h(16, 30), fin: h(16, 55), hora: '4:30 – 4:55 p.m.', titulo: 'Merienda de la Tarde', lugar: 'Tienda escolar y Patio', organiza: 'Logística y Economía', preparar: 'Reclamar refrigerio de la tarde y pasar puntualmente al Coliseo.', Icono: Cookie, tono: 'orange' },
  { ini: h(17), fin: h(19, 34), hora: '5:00 – 7:34 p.m.', titulo: 'FEST COLOR', subtitulo: 'Muestras Culturales y Premiación', lugar: 'Coliseo', organiza: 'Animación, Comunicaciones y Premiación', preparar: 'Delegaciones atentas al orden de presentación en camerino. Diligenciar encuesta por QR.', Icono: Sparkles, tono: 'rosa', cumbre: true },
  { ini: h(19, 34), fin: h(19, 44), hora: '7:34 – 7:44 p.m.', titulo: 'Evaluación Digital y Buenas Noches', lugar: 'Coliseo', organiza: 'P. César y Equipo Coordinador', preparar: 'Llenar la evaluación desde tu celular para premios por delegación y escuchar Buenas Noches.', Icono: ClipboardCheck, tono: 'violet', evaluacion: true },
  { ini: h(19, 54), fin: h(20), hora: '7:54 p.m.', titulo: 'Cierre Oficial y Salida de Delegaciones', lugar: 'Portería Principal', organiza: 'Logística y Asesores de Delegación', preparar: 'Recoger pertenencias del guardarropa y retirarse de forma ordenada.', Icono: LogOut, tono: 'sky' },
];

const RESUMEN = [
  { k: 'Jornada general', v: '7:30 a.m. – 7:54 p.m.', Icono: Clock },
  { k: 'Lugar principal', v: 'Coliseo y Canchas', Icono: MapPin },
  { k: 'Momento cumbre', v: 'Fest Color (5:00 p.m.)', Icono: Sparkles },
  { k: 'Camiseta oficial', v: 'Poner tras tarde deportiva', Icono: Shirt },
  { k: 'Recomendación', v: 'Cuidar guardarropa y termo', Icono: Backpack },
];

const TONOS = {
  sky: { barra: 'bg-sky-400', chip: 'bg-sky-400/15 text-sky-200 border-sky-300/20', punto: 'bg-sky-400', halo: 'shadow-sky-400/40' },
  amber: { barra: 'bg-amber-400', chip: 'bg-amber-400/15 text-amber-200 border-amber-300/20', punto: 'bg-amber-400', halo: 'shadow-amber-400/40' },
  violet: { barra: 'bg-violet-400', chip: 'bg-violet-400/15 text-violet-200 border-violet-300/20', punto: 'bg-violet-400', halo: 'shadow-violet-400/40' },
  orange: { barra: 'bg-orange-400', chip: 'bg-orange-400/15 text-orange-200 border-orange-300/20', punto: 'bg-orange-400', halo: 'shadow-orange-400/40' },
  emerald: { barra: 'bg-emerald-400', chip: 'bg-emerald-400/15 text-emerald-200 border-emerald-300/20', punto: 'bg-emerald-400', halo: 'shadow-emerald-400/40' },
  rosa: { barra: 'bg-fuchsia-400', chip: 'bg-fuchsia-400/15 text-fuchsia-200 border-fuchsia-300/20', punto: 'bg-fuchsia-400', halo: 'shadow-fuchsia-400/50' },
};

// Hora y fecha en Colombia (UTC-5, sin horario de verano).
function ahoraColombia(simular) {
  const d = new Date(Date.now() - 5 * 3600 * 1000);
  let fecha = d.toISOString().slice(0, 10);
  let min = d.getUTCHours() * 60 + d.getUTCMinutes();
  if (simular && /^\d{1,2}:\d{2}$/.test(simular)) {
    const [a, b] = simular.split(':').map(Number);
    fecha = FECHA_EVENTO;
    min = a * 60 + b;
  }
  return { fecha, min };
}

function fmtMin(m) {
  if (m < 60) return `${m} min`;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${hh} h ${mm} min` : `${hh} h`;
}

function diasHasta(fecha) {
  const a = Date.UTC(...fecha.split('-').map((n, i) => (i === 1 ? n - 1 : +n)));
  const b = Date.UTC(...FECHA_EVENTO.split('-').map((n, i) => (i === 1 ? n - 1 : +n)));
  return Math.round((b - a) / 86400000);
}

export default function CronogramaPage() {
  const [params] = useSearchParams();
  const simular = params.get('simular');
  const [ahora, setAhora] = useState(() => ahoraColombia(simular));
  const [abierto, setAbierto] = useState(null);
  const [vista, setVista] = useState('linea');
  const refActual = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setAhora(ahoraColombia(simular)), 30000);
    return () => clearInterval(t);
  }, [simular]);

  const estado = useMemo(() => {
    const { fecha, min } = ahora;
    if (fecha < FECHA_EVENTO) return { fase: 'antes', dias: diasHasta(fecha), idx: -1 };
    if (fecha > FECHA_EVENTO) return { fase: 'despues', idx: -1 };
    if (min < MOMENTOS[0].ini) return { fase: 'madrugada', idx: -1, falta: MOMENTOS[0].ini - min };
    let idx = -1;
    MOMENTOS.forEach((m, i) => { if (min >= m.ini) idx = i; });
    const m = MOMENTOS[idx];
    if (min >= m.fin && idx === MOMENTOS.length - 1) return { fase: 'despues', idx: -1 };
    // entre dos momentos (hueco): se muestra "siguiente"
    if (min >= m.fin) return { fase: 'pausa', idx, sig: idx + 1, falta: MOMENTOS[idx + 1].ini - min };
    return { fase: 'en_curso', idx, sig: idx + 1 < MOMENTOS.length ? idx + 1 : null, resta: m.fin - min, avance: Math.round(((min - m.ini) / (m.fin - m.ini)) * 100) };
  }, [ahora]);

  const idxActual = estado.fase === 'en_curso' ? estado.idx : -1;
  const idxSiguiente = estado.fase === 'pausa' ? estado.sig : estado.fase === 'madrugada' ? 0 : estado.fase === 'en_curso' ? estado.sig : -1;

  const irAhora = () => refActual.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <main className="relative min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 sm:py-12 overflow-hidden">
      <div className="absolute inset-0 bg-brand-navy/55" />
      <div className="relative z-10 mx-auto max-w-5xl space-y-8">
        {/* Encabezado */}
        <header className="text-center space-y-3 animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-200">
            <CalendarClock size={16} /> Sábado 17 de octubre · 2026
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            Guía y Horario Juvenil
            <span className="block bg-gradient-to-r from-amber-200 via-fuchsia-200 to-sky-200 bg-clip-text text-transparent">
              Interoratorios 2026
            </span>
          </h1>
          <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto">
            Itinerario general para participantes • Ubicaciones clave, momentos y preparación
          </p>
        </header>

        {/* Resumen */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-up">
          {RESUMEN.map(({ k, v, Icono }, i) => (
            <div
              key={k}
              className={`glass-card p-4 flex flex-col gap-2 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-amber-200">
                <Icono size={18} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">{k}</span>
              <span className="text-sm sm:text-base font-extrabold text-white leading-snug">{v}</span>
            </div>
          ))}
        </section>

        {/* Ahora / siguiente */}
        <EstadoAhora estado={estado} onIr={irAhora} />

        {/* Selector de vista */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-white">El día, momento a momento</h2>
          <div className="hidden md:flex gap-1 rounded-full bg-white/10 p-1 border border-white/10">
            {[['linea', 'Línea de tiempo'], ['tabla', 'Tabla']].map(([k, t]) => (
              <button
                key={k}
                onClick={() => setVista(k)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${vista === k ? 'bg-white text-brand-navy' : 'text-white/70 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {vista === 'tabla' ? (
          <Tabla idxActual={idxActual} />
        ) : (
          <ol className="relative space-y-4 pl-8 sm:pl-10">
            <span className="absolute left-[11px] sm:left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-sky-300/60 via-fuchsia-300/60 to-sky-300/40" />
            {MOMENTOS.map((m, i) => {
              const t = TONOS[m.tono];
              const activo = i === idxActual;
              const siguiente = i === idxSiguiente;
              const pasado = estado.fase === 'despues' || (estado.idx >= 0 && i < estado.idx) || (estado.fase === 'pausa' && i <= estado.idx);
              const abre = abierto === i || activo;
              return (
                <li key={i} ref={activo ? refActual : null} className="relative">
                  <span
                    className={`absolute -left-8 sm:-left-10 top-5 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full ${t.punto} text-brand-navy shadow-lg ${t.halo} ${activo ? 'ring-4 ring-white/70 animate-pulse' : ''} ${pasado ? 'opacity-40' : ''}`}
                  >
                    <m.Icono size={14} />
                  </span>
                  <article
                    className={`glass-card overflow-hidden transition-all ${activo ? 'ring-2 ring-amber-300/80' : ''} ${m.cumbre ? 'border-fuchsia-300/40 bg-gradient-to-br from-fuchsia-500/15 to-transparent' : ''} ${pasado ? 'opacity-60' : ''}`}
                  >
                    <button
                      onClick={() => setAbierto(abierto === i ? null : i)}
                      className="w-full text-left p-4 sm:p-5 flex items-start gap-3"
                      aria-expanded={abre}
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs sm:text-sm font-extrabold ${t.chip}`}>
                            <Clock size={13} /> {m.hora}
                          </span>
                          {activo && <span className="rounded-full bg-amber-300 px-2.5 py-1 text-xs font-black text-brand-navy">● AHORA</span>}
                          {siguiente && !activo && <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white">Sigue</span>}
                          {m.cumbre && <span className="rounded-full bg-fuchsia-400/25 px-2.5 py-1 text-xs font-black text-fuchsia-100">✨ Momento cumbre</span>}
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                          {m.titulo}
                          {m.subtitulo && <span className="block text-sm sm:text-base font-semibold text-white/70">{m.subtitulo}</span>}
                        </h3>
                        <p className="flex items-start gap-1.5 text-sm sm:text-base text-white/85">
                          <MapPin size={16} className="mt-0.5 shrink-0 text-amber-200" />
                          <span><span className="sr-only">Lugar: </span>{m.lugar}</span>
                        </p>
                        {activo && (
                          <div className="pt-1">
                            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                              <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${estado.avance}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-white/70">Quedan {fmtMin(estado.resta)}</p>
                          </div>
                        )}
                      </div>
                      <ChevronDown size={20} className={`mt-1 shrink-0 text-white/60 transition-transform ${abre ? 'rotate-180' : ''}`} />
                    </button>
                    {abre && (
                      <div className="border-t border-white/10 bg-black/15 px-4 sm:px-5 py-4 grid gap-3 sm:grid-cols-2 text-sm sm:text-base">
                        <div>
                          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/50"><Users size={14} /> Organiza</p>
                          <p className="mt-1 text-white/90">{m.organiza}</p>
                        </div>
                        <div>
                          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/50"><Backpack size={14} /> ¿Qué debes preparar?</p>
                          <p className="mt-1 text-white/90">{m.preparar}</p>
                          {m.evaluacion && (
                            <a href={FORM_EVALUACION} target="_blank" rel="noreferrer" className="btn-primary mt-3 inline-flex items-center gap-2 text-sm">
                              <ClipboardCheck size={16} /> Abrir evaluación
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        )}

        <p className="text-center text-xs sm:text-sm text-white/50 pb-4">
          Toca cada momento para ver quién lo organiza y qué debes preparar. Horario de Colombia.
        </p>
      </div>
    </main>
  );
}

function EstadoAhora({ estado, onIr }) {
  let titulo; let detalle; let accion = null;
  if (estado.fase === 'antes') {
    titulo = estado.dias === 0 ? '¡Hoy es el día!' : estado.dias === 1 ? '¡Mañana es el Interoratorios!' : `Faltan ${estado.dias} días`;
    detalle = 'El sábado 17 de octubre abrimos puertas a las 7:30 a.m. ¡Prepara tu delegación!';
  } else if (estado.fase === 'madrugada') {
    titulo = '¡Hoy es el día!'; detalle = `Abrimos puertas en ${fmtMin(estado.falta)} (7:30 a.m.).`;
  } else if (estado.fase === 'en_curso') {
    titulo = `Ahora: ${MOMENTOS[estado.idx].titulo}`;
    detalle = estado.sig != null ? `Sigue: ${MOMENTOS[estado.sig].titulo} (${MOMENTOS[estado.sig].hora}).` : 'Es el último momento de la jornada.';
    accion = 'Ir al momento actual';
  } else if (estado.fase === 'pausa') {
    titulo = 'Transición'; detalle = `Próximo: ${MOMENTOS[estado.sig].titulo} en ${fmtMin(estado.falta)}.`;
  } else {
    titulo = '¡Gracias por vivir el Interoratorios 2026!'; detalle = 'La jornada ha terminado. Que Dios los bendiga.';
  }
  return (
    <section className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 border-amber-300/30">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-brand-navy"><Flag size={22} /></span>
      <div className="flex-1 min-w-0">
        <p className="font-black text-white text-lg leading-snug">{titulo}</p>
        <p className="text-sm sm:text-base text-white/75">{detalle}</p>
      </div>
      {accion && <button onClick={onIr} className="btn-primary text-sm self-start sm:self-auto">{accion}</button>}
    </section>
  );
}

function Tabla({ idxActual }) {
  return (
    <div className="glass-card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-white/50 border-b border-white/10">
            {['Hora', 'Momento / Actividad', '¿Dónde debes estar?', 'Organiza', '¿Qué debes preparar?'].map((c) => (
              <th key={c} className="px-4 py-3 font-bold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOMENTOS.map((m, i) => (
            <tr key={i} className={`border-b border-white/5 align-top ${i === idxActual ? 'bg-amber-300/15' : m.cumbre ? 'bg-fuchsia-400/10' : 'hover:bg-white/5'}`}>
              <td className="px-4 py-3 font-extrabold text-amber-200 whitespace-nowrap">{m.hora}</td>
              <td className="px-4 py-3 font-bold text-white">{m.titulo}{m.subtitulo && <span className="block text-xs font-medium text-white/60">{m.subtitulo}</span>}</td>
              <td className="px-4 py-3 text-white/85">{m.lugar}</td>
              <td className="px-4 py-3 text-white/85">{m.organiza}</td>
              <td className="px-4 py-3 text-white/85">{m.preparar}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
