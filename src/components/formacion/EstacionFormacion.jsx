import { useMemo } from 'react';
import { Check, Clock, Hourglass, MapPin, Sunrise, Users } from 'lucide-react';
import { useAlertaLlegada } from '../../hooks/useAlertaLlegada';
import { formatoMMSS, useRestanteMs } from '../../hooks/useRotacionFormacion';
import { calcularEstacionFormacion } from '../../services/formacionLogica';
import TarjetaLlegadaEquipo from '../estacion/TarjetaLlegadaEquipo';
import ChipsSubgrupos from './ChipsSubgrupos';

/**
 * Pantalla INFORMATIVA del formador de una base: quién está ahora, quién llega
 * después y cuánto falta para el cambio. No registra nada: sin puntos, sin
 * formularios, sin botones de calificación. Todo sale de la Rotación de la Mañana.
 */
export default function EstacionFormacion({ indiceBase, rotacion }) {
  const { config, bases, equipos, desfaseMs } = rotacion;

  const estacion = useMemo(
    () => calcularEstacionFormacion(indiceBase, config, bases, equipos),
    [indiceBase, config, bases, equipos]
  );
  const { base, actual, siguiente, faltan, estado } = estacion;

  const restanteMs = useRestanteMs(config?.tiempo_fin, desfaseMs);

  // Suena y parpadea cuando, al rotar, llega un equipo NUEVO a tu base.
  const clave = actual ? `${estacion.ronda}:${actual.id}` : null;
  const { alertando } = useAlertaLlegada(clave ? [clave] : [], { listo: true });

  if (!base) {
    return (
      <p className="glass-card p-6 text-center text-slate-300">
        Esa base ya no existe. Elige otra.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Encabezado estacion={estacion} indiceBase={indiceBase} />

      {estado === 'esperando' && (
        <Mensaje icono={Hourglass} tono="sky" titulo="La formación aún no empieza">
          Cuando la coordinación inicie la rotación, aquí verás qué equipo recibirás primero.
          Mientras tanto, prepara tu base.
        </Mensaje>
      )}

      {estado === 'terminado' && (
        <Mensaje icono={Check} tono="emerald" titulo="La formación ha terminado">
          Gracias por orientar a los equipos. Ya puedes recoger tu base y unirte al resto del
          evento.
        </Mensaje>
      )}

      {estado === 'en_curso' && (
        <>
          <RelojCambio
            restanteMs={restanteMs}
            ultimaBase={estacion.ultimaBase}
            ronda={estacion.ronda}
            totalRondas={estacion.totalRondas}
          />

          {actual ? (
            <div className="space-y-3">
              <TarjetaLlegadaEquipo
                titulo="En tu base ahora"
                equipos={[actual]}
                alertando={alertando}
                detalle={`Ronda ${estacion.ronda} de ${estacion.totalRondas}`}
              />
              <ChipsSubgrupos texto={actual.subgrupos} color={actual.color_hex} />
            </div>
          ) : (
            <Mensaje icono={Clock} tono="sky" titulo="Tu base está libre en esta ronda">
              {siguiente
                ? `No hay ningún equipo contigo ahora. Aprovecha para ajustar tu material: el próximo llega ${
                    faltan === 1 ? 'en el siguiente cambio de base' : `en ${faltan} cambios de base`
                  }.`
                : 'No hay ningún equipo contigo ahora.'}
            </Mensaje>
          )}

          <TarjetaSiguiente
            siguiente={siguiente}
            faltan={faltan}
            ultimaBase={estacion.ultimaBase}
            restanteMs={restanteMs}
          />

          <Agenda agenda={estacion.agenda} ultimaBase={estacion.ultimaBase} />
        </>
      )}
    </div>
  );
}

function Encabezado({ estacion, indiceBase }) {
  const { base, pasaron, total, estado } = estacion;
  const progreso = total > 0 ? (pasaron / total) * 100 : 0;
  return (
    <div className="glass-card space-y-3 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Sunrise size={24} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Base {indiceBase + 1}
          </p>
          <p className="break-words text-xl font-black leading-tight text-white">{base.nombre}</p>
          {base.lugar && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-300">
              <MapPin size={14} className="shrink-0" /> {base.lugar}
            </p>
          )}
        </div>
      </div>
      {estado === 'en_curso' && total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-end justify-between text-sm">
            <span className="text-slate-300">Equipos que ya pasaron por tu base</span>
            <span className="font-black tabular-nums text-white">
              {pasaron} <span className="font-semibold text-slate-400">de {total}</span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RelojCambio({ restanteMs, ultimaBase, ronda, totalRondas }) {
  const agotado = restanteMs <= 0;
  return (
    <div className="glass-card flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {ultimaBase ? 'Última base · cierre en' : 'Cambio de base en'}
        </p>
        <p className="text-xs text-slate-400">
          Ronda {ronda} de {totalRondas} ·{' '}
          {agotado ? 'los equipos están cambiando de base' : 'tiempo informativo, sin puntaje'}
        </p>
      </div>
      <p
        className={`font-mono text-3xl font-black tabular-nums ${
          agotado ? 'animate-pulse text-amber-300' : 'text-white'
        }`}
        aria-label={agotado ? 'Cambio de base en curso' : `Faltan ${formatoMMSS(restanteMs)}`}
      >
        {formatoMMSS(restanteMs)}
      </p>
    </div>
  );
}

function TarjetaSiguiente({ siguiente, faltan, ultimaBase, restanteMs }) {
  if (ultimaBase) {
    return (
      <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4">
        <p className="text-sm font-bold text-red-100">Esta es la última base de la mañana</p>
        <p className="text-sm text-red-200/80">
          Cuando termine esta ronda no llegará ningún equipo más.
        </p>
      </div>
    );
  }
  if (!siguiente) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-bold text-slate-200">No llegará ningún equipo más</p>
        <p className="text-sm text-slate-400">
          Ya recibiste a todos los equipos que te tocaban. Atento por si la coordinación avisa algo.
        </p>
      </div>
    );
  }
  return (
    <div
      className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/80 p-4"
      style={{ borderLeft: `8px solid ${siguiente.color_hex}` }}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-10 w-10 shrink-0 rounded-full border-2 border-slate-900"
          style={{ backgroundColor: siguiente.color_hex, boxShadow: `0 0 18px 2px ${siguiente.color_hex}88` }}
        />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
            Próximo en llegar
          </p>
          <p className="break-words text-lg font-black leading-tight text-white">
            {siguiente.nombre}
          </p>
          <p className="text-xs text-slate-400">
            {faltan === 1
              ? `Llega en el próximo cambio de base${restanteMs > 0 ? ` (en ${formatoMMSS(restanteMs)})` : ''}`
              : `Llega en ${faltan} cambios de base`}
          </p>
        </div>
      </div>
      <ChipsSubgrupos texto={siguiente.subgrupos} color={siguiente.color_hex} />
    </div>
  );
}

function Agenda({ agenda, ultimaBase }) {
  const filas = ultimaBase ? agenda.slice(0, 1) : agenda;
  if (filas.length <= 1) return null;
  return (
    <details className="glass-card group p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-200">
        <Users size={16} /> Quién pasará por tu base el resto de la mañana
      </summary>
      <ol className="mt-3 space-y-1.5">
        {filas.map((f) => (
          <li
            key={f.ronda}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
              f.esActual ? 'bg-white/10' : 'bg-white/[0.03]'
            }`}
          >
            <span className="text-slate-400">
              Ronda {f.ronda}
              {f.esActual ? ' · ahora' : ''}
            </span>
            {f.equipo ? (
              <span className="flex min-w-0 items-center gap-2 font-semibold text-white">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: f.equipo.color_hex }}
                />
                <span className="truncate">{f.equipo.nombre}</span>
              </span>
            ) : (
              <span className="text-slate-500">Libre</span>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}

function Mensaje({ icono: Icono, tono, titulo, children }) {
  const estilos =
    tono === 'emerald'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
      : 'border-white/10 bg-white/[0.04] text-white';
  return (
    <div className={`space-y-2 rounded-3xl border p-6 text-center animate-fade-up ${estilos}`}>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
        <Icono size={28} />
      </span>
      <p className="text-lg font-black leading-snug">{titulo}</p>
      <p className="text-sm opacity-80">{children}</p>
    </div>
  );
}
