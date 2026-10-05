import { Amphora, Bell, CalendarClock, MapPin, Sparkles, Trophy } from 'lucide-react';

// Cada actividad tiene su propia paleta e ícono: la pantalla de espera ya
// anticipa de qué se trata. Las clases van completas (no armadas con
// pedazos de texto) para que Tailwind las detecte.
const TEMAS = {
  gymkana: {
    nombre: 'La Gymkana',
    titulo: '¡Prepárate para la Gymkana!',
    detalle: 'Las bases se están alistando para recibirte.',
    Icono: MapPin,
    tarjeta: 'from-emerald-600/40 via-emerald-950/50 to-brand-navy/80',
    borde: 'border-emerald-400/30',
    orbe: 'bg-emerald-400/30',
    insignia: 'border-emerald-300/50 bg-emerald-500/20',
    acento: 'text-emerald-300',
    punto: 'bg-emerald-300',
  },
  tesoro: {
    nombre: 'La Búsqueda del Tesoro',
    titulo: '¡Las tinajas ya esperan!',
    detalle: 'Pronto empieza la aventura de llenarlas de vino.',
    Icono: Amphora,
    tarjeta: 'from-orange-700/40 via-rose-950/50 to-brand-navy/80',
    borde: 'border-orange-300/30',
    orbe: 'bg-orange-400/30',
    insignia: 'border-orange-300/50 bg-orange-500/20',
    acento: 'text-orange-300',
    punto: 'bg-orange-300',
  },
  torneo: {
    nombre: 'El Torneo',
    titulo: '¡El balón está a punto de rodar!',
    detalle: 'Los equipos están calentando motores.',
    Icono: Trophy,
    tarjeta: 'from-violet-600/40 via-indigo-950/50 to-brand-navy/80',
    borde: 'border-violet-300/30',
    orbe: 'bg-violet-400/30',
    insignia: 'border-violet-300/50 bg-violet-500/20',
    acento: 'text-violet-300',
    punto: 'bg-violet-300',
  },
};

const GENERICO = {
  titulo: '¡Muy pronto!',
  detalle: 'Estamos preparando todo para ti.',
  Icono: CalendarClock,
  tarjeta: 'from-brand-brown/45 via-brand-navy/60 to-brand-navy/80',
  borde: 'border-amber-200/25',
  orbe: 'bg-amber-300/25',
  insignia: 'border-amber-200/50 bg-amber-300/15',
  acento: 'text-amber-200',
  punto: 'bg-amber-200',
};

function conMayuscula(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

/**
 * Pantalla de "esta actividad todavía no empieza".
 * `tema`: 'gymkana' | 'tesoro' | 'torneo' (sin tema usa un estilo neutro).
 * `nombreActividad` solo se usa si no hay tema, para armar la frase.
 */
export default function LetreroActividadNoIniciada({ tema, nombreActividad }) {
  const t = TEMAS[tema] ?? GENERICO;
  const nombre = TEMAS[tema]?.nombre ?? conMayuscula(nombreActividad) ?? 'La actividad';
  const { Icono } = t;

  return (
    <div className="mx-auto max-w-md px-4 py-10 animate-fade-up">
      <div
        className={`relative overflow-hidden rounded-[2rem] border bg-gradient-to-br p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10 ${t.tarjeta} ${t.borde}`}
      >
        {/* Luces de fondo y chispas */}
        <div
          className={`pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl animate-glow-pulse ${t.orbe}`}
        />
        <div
          className={`pointer-events-none absolute -bottom-14 -left-14 h-48 w-48 rounded-full blur-3xl animate-glow-pulse [animation-delay:1.2s] ${t.orbe}`}
        />
        <Sparkles
          size={20}
          className="pointer-events-none absolute left-6 top-6 animate-pulse text-white/30"
        />
        <Sparkles
          size={14}
          className="pointer-events-none absolute right-8 top-20 animate-pulse text-white/25 [animation-delay:0.8s]"
        />
        <Sparkles
          size={16}
          className="pointer-events-none absolute bottom-24 left-9 animate-pulse text-white/20 [animation-delay:1.6s]"
        />

        <div className="relative space-y-6">
          <div
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 shadow-xl shadow-black/30 ${t.insignia}`}
          >
            <Icono className={t.acento} size={44} />
          </div>

          <div className="space-y-3">
            <p className={`text-sm font-extrabold uppercase tracking-[0.3em] ${t.acento}`}>
              Próximamente
            </p>
            <h2 className="font-display text-2xl font-black leading-tight text-white sm:text-3xl">
              {t.titulo}
            </h2>
            <p className="text-base leading-relaxed text-slate-200">
              <span className="font-bold text-white">{nombre}</span> aún no ha iniciado.{' '}
              {t.detalle}
            </p>
          </div>

          {/* Puntos que "respiran": la actividad se está preparando */}
          <div className="flex items-center justify-center gap-2" aria-hidden="true">
            <span className={`h-2.5 w-2.5 animate-pulse rounded-full ${t.punto}`} />
            <span className={`h-2.5 w-2.5 animate-pulse rounded-full [animation-delay:0.3s] ${t.punto}`} />
            <span className={`h-2.5 w-2.5 animate-pulse rounded-full [animation-delay:0.6s] ${t.punto}`} />
          </div>

          <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-slate-100">
            <Bell size={18} className={`shrink-0 ${t.acento}`} />
            <span>Tu animador te avisará cuando comience</span>
          </div>

          <p className="font-display text-base italic text-amber-200/85">
            “Hagan lo que Él les diga”
          </p>
        </div>
      </div>
    </div>
  );
}
