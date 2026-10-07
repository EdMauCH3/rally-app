import { useMemo } from 'react';
import { AlertTriangle, Check, Clock, Hourglass, Loader2, MapPin, Radio, Users } from 'lucide-react';
import {
  formatoMMSS,
  useAtrasoMs,
  useRestanteMs,
  useRotacionFormacion,
} from '../../hooks/useRotacionFormacion';
import {
  matrizRotacionFormacion,
  ocupacionBasesFormacion,
  resumenOcupacion,
  ubicacionEquiposFormacion,
} from '../../services/formacionLogica';
import ChipsSubgrupos from './ChipsSubgrupos';

/**
 * Radar de Formación (Admin): mapa en vivo de la Rotación de la Mañana. Muestra
 * qué equipo está en cada base, qué bases están libres, hacia dónde va cada
 * equipo y el cronograma completo. Solo lectura: para rotar o configurar se usa
 * la sección "Control de la rotación".
 */
export default function RadarFormacion({ onIrAControl }) {
  const { config, bases, equipos, cargando, error, desfaseMs } = useRotacionFormacion();

  const ocupacion = useMemo(
    () => ocupacionBasesFormacion(config, bases, equipos),
    [config, bases, equipos]
  );
  const ubicaciones = useMemo(
    () => ubicacionEquiposFormacion(config, bases, equipos),
    [config, bases, equipos]
  );
  const matriz = useMemo(() => matrizRotacionFormacion(bases, equipos), [bases, equipos]);
  const resumen = resumenOcupacion(ocupacion);

  const restanteMs = useRestanteMs(config?.tiempo_fin, desfaseMs);
  const atrasoMs = useAtrasoMs(config?.tiempo_fin, desfaseMs);

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-center text-sm text-amber-100">
        No se pudo cargar el radar de Formación. Se reintenta sola.
      </p>
    );
  }

  const estado = config?.estado ?? 'esperando';
  const enCurso = estado === 'en_curso';
  const ronda = config?.ronda_actual ?? 0;

  if (bases.length === 0 || estado === 'esperando') {
    return (
      <div className="glass-card mx-auto max-w-md space-y-3 p-8 text-center">
        <Hourglass className="mx-auto text-slate-300" size={34} />
        <p className="font-bold text-white">La rotación de la mañana aún no empieza</p>
        <p className="text-sm text-slate-400">
          Cuando la inicies, aquí verás en vivo dónde está cada equipo.
        </p>
        {onIrAControl && (
          <button type="button" onClick={onIrAControl} className="btn-secondary mx-auto">
            Ir al control de la rotación
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado general */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Radio size={14} className={enCurso ? 'text-emerald-300' : 'text-slate-400'} />
            {enCurso ? 'Formación en curso' : 'Formación terminada'}
          </p>
          <p className="text-2xl font-black text-white">
            {enCurso ? `Ronda ${ronda + 1} de ${bases.length}` : 'Todas las rondas completadas'}
          </p>
          {config.ultima_base && enCurso && (
            <p className="inline-block rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-200">
              Última base activada
            </p>
          )}
        </div>

        {enCurso && (
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Próximo cambio de base
            </p>
            <p
              className={`font-mono text-3xl font-black tabular-nums ${
                restanteMs <= 0 ? 'text-amber-300' : 'text-white'
              }`}
            >
              {formatoMMSS(restanteMs)}
            </p>
            {restanteMs <= 0 && (
              <p className="flex items-center justify-end gap-1 text-xs font-semibold text-amber-300">
                <AlertTriangle size={13} />
                {atrasoMs >= 30000
                  ? `Cambio atrasado ${formatoMMSS(atrasoMs)}`
                  : 'Esperando el cambio de base'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contadores */}
      {enCurso && (
        <div className="grid grid-cols-3 gap-2.5">
          <Contador valor={resumen.ocupadas} etiqueta="Bases ocupadas" tono="emerald" />
          <Contador valor={resumen.libres} etiqueta="Bases libres" tono="slate" />
          <Contador valor={equipos.length} etiqueta="Equipos rotando" tono="sky" />
        </div>
      )}

      {/* Mapa de bases */}
      <section className="space-y-3">
        <h2 className="font-bold text-white">Mapa de bases</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ocupacion.map(({ base, indice, actual, siguiente, faltan }) => (
            <TarjetaBase
              key={base.id}
              base={base}
              indice={indice}
              actual={actual}
              siguiente={siguiente}
              faltan={faltan}
              enCurso={enCurso}
            />
          ))}
        </div>
      </section>

      {/* Dónde está cada equipo */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-bold text-white">
          <Users size={18} /> ¿Dónde está cada equipo?
        </h2>
        <div className="glass-card divide-y divide-white/5">
          {ubicaciones.map(({ equipo, base, siguienteBase, recorridas }) => (
            <div key={equipo.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <span className="flex min-w-0 flex-1 items-center gap-2.5 basis-40">
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: equipo.color_hex }}
                />
                <span className="truncate font-semibold text-white">{equipo.nombre}</span>
              </span>
              <span className="text-sm text-slate-200">
                {enCurso && base ? (
                  <>
                    <span className="text-slate-400">En </span>
                    <span className="font-semibold">{base.nombre}</span>
                  </>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </span>
              <span className="text-sm text-slate-400">
                {siguienteBase ? `Después: ${siguienteBase.nombre}` : enCurso ? 'Sin más cambios' : ''}
              </span>
              <span className="w-full text-xs tabular-nums text-slate-500 sm:w-auto">
                {recorridas} de {bases.length} bases recorridas
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Cronograma completo */}
      <details className="glass-card p-4">
        <summary className="cursor-pointer list-none font-bold text-white">
          Cronograma completo de la mañana
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-max border-separate border-spacing-1 text-center text-sm">
            <thead>
              <tr>
                <th className="px-2 text-left text-xs font-semibold text-slate-400">Equipo</th>
                {Array.from({ length: bases.length }, (_, r) => (
                  <th
                    key={r}
                    className={`rounded-lg px-2 py-1 text-xs font-bold ${
                      enCurso && r === ronda ? 'bg-white/15 text-white' : 'text-slate-400'
                    }`}
                  >
                    R{r + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matriz.map(({ equipo, celdas }) => (
                <tr key={equipo.id}>
                  <td className="whitespace-nowrap px-2 text-left font-semibold text-white">
                    <span
                      aria-hidden="true"
                      className="mr-2 inline-block h-3 w-3 rounded-full align-middle"
                      style={{ backgroundColor: equipo.color_hex }}
                    />
                    {equipo.nombre}
                  </td>
                  {celdas.map((c) => {
                    const actual = enCurso && c.ronda - 1 === ronda;
                    const pasada = estado === 'terminado' || (enCurso && c.ronda - 1 < ronda);
                    return (
                      <td
                        key={c.ronda}
                        title={bases[c.indiceBase]?.nombre}
                        className={`rounded-lg px-2 py-1.5 font-bold tabular-nums ${
                          actual
                            ? 'bg-white text-slate-900'
                            : pasada
                              ? 'bg-white/[0.04] text-slate-500'
                              : 'bg-white/10 text-slate-100'
                        }`}
                        style={actual ? undefined : { borderBottom: `3px solid ${equipo.color_hex}` }}
                      >
                        B{c.indiceBase + 1}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">
            B1, B2… son las bases en el orden configurado; la columna resaltada es la ronda actual.
          </p>
        </div>
      </details>
    </div>
  );
}

function Contador({ valor, etiqueta, tono }) {
  const color =
    tono === 'emerald' ? 'text-emerald-300' : tono === 'sky' ? 'text-sky-300' : 'text-slate-300';
  return (
    <div className="glass-card px-3 py-3 text-center">
      <p className={`text-3xl font-black tabular-nums ${color}`}>{valor}</p>
      <p className="text-xs text-slate-400">{etiqueta}</p>
    </div>
  );
}

function TarjetaBase({ base, indice, actual, siguiente, faltan, enCurso }) {
  const ocupada = !!actual;
  return (
    <div
      className={`space-y-2.5 rounded-2xl border p-4 transition-all duration-300 ${
        ocupada ? 'border-white/15 bg-slate-900/80' : 'border-dashed border-white/15 bg-white/[0.02]'
      }`}
      style={ocupada ? { borderLeft: `8px solid ${actual.color_hex}` } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Base {indice + 1}
          </p>
          <p className="break-words font-black leading-tight text-white">{base.nombre}</p>
          {base.lugar && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={12} className="shrink-0" /> {base.lugar}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            !enCurso
              ? 'bg-white/10 text-slate-300'
              : ocupada
                ? 'bg-emerald-500/20 text-emerald-200'
                : 'bg-white/10 text-slate-300'
          }`}
        >
          {!enCurso ? 'Cerrada' : ocupada ? 'Ocupada' : 'Libre'}
        </span>
      </div>

      {ocupada ? (
        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-lg font-black text-white">
            <span
              aria-hidden="true"
              className="h-5 w-5 shrink-0 rounded-full"
              style={{ backgroundColor: actual.color_hex, boxShadow: `0 0 14px 2px ${actual.color_hex}88` }}
            />
            {actual.nombre}
          </p>
          <ChipsSubgrupos texto={actual.subgrupos} color={actual.color_hex} />
        </div>
      ) : (
        enCurso && (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Check size={14} /> Sin equipo en esta ronda
          </p>
        )
      )}

      {enCurso && (
        <p className="flex items-center gap-1.5 border-t border-white/5 pt-2 text-xs text-slate-400">
          <Clock size={12} className="shrink-0" />
          {siguiente ? (
            <>
              Próximo:
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: siguiente.color_hex }}
              />
              <span className="font-semibold text-slate-200">{siguiente.nombre}</span>
              {faltan > 1 && <span>(en {faltan} cambios)</span>}
            </>
          ) : (
            'Sin próximo equipo'
          )}
        </p>
      )}
    </div>
  );
}
