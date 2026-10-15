import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Clock, Flag, Loader2, MapPin, Pencil, RotateCw, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useBasesGymkana } from '../../hooks/useBasesGymkana';
import { useCircuitoGymkana } from '../../hooks/useCircuitoGymkana';
import { ajustarRondaGymkana, rotarEquiposGymkana } from '../../services/gymkanaCircuitoService';
import { listarAlertasGymkana, suscribirseAlertasGymkana } from '../../services/adminService';
import {
  esRondaFinal,
  ocupacionBasesCircuito,
  puedeRotar,
  radarCircuito,
  tituloBase,
} from '../../services/gymkanaLogica';
import ControlPausaActividades from '../admin/ControlPausaActividades';
import AlertasGymkana from '../admin/AlertasGymkana';
import GestionBasesGymkana from '../admin/GestionBasesGymkana';
import { Switch } from '../admin/ControlInicioActividades';
import RelojRonda from './RelojRonda';
import ModalRotarGymkana from './ModalRotarGymkana';
import ResultadosCircuito from './ResultadosCircuito';

const ESTILO_BASE = {
  libre: 'border-white/10 bg-white/[0.03] text-slate-400',
  compitiendo: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100',
  calificada: 'border-sky-400/50 bg-sky-500/10 text-sky-100',
};
const ETIQUETA_BASE = { libre: 'Sin cruce esta ronda', compitiendo: 'Compitiendo', calificada: 'Calificada' };

const ETIQUETA_EQUIPO = {
  esperando: ['Esperando la primera rotación', 'text-sky-300', Clock],
  compitiendo: ['Compitiendo en', 'text-emerald-300', Users],
  listo: ['Calificado en', 'text-sky-300', Check],
  termino: ['Completó el circuito', 'text-emerald-300', Check],
};

function Punto({ color }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}99` }}
    />
  );
}

/** Radar de los sub-equipos: dónde está cada uno en la ronda actual. */
export function RadarEquiposGymkana({ filas, bases }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {filas.map((f) => {
        const [texto, clase, Icono] = ETIQUETA_EQUIPO[f.estado];
        const pct = (f.completadas / f.total) * 100;
        return (
          <div key={f.equipo.id} className="glass-row space-y-1.5 px-3 py-2.5">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <Punto color={f.equipo.color_hex} />
              {f.equipo.nombre}
              {f.rival && <span className="text-xs font-normal text-slate-400">vs {f.rival.nombre}</span>}
            </p>
            <p className={`flex items-center gap-1.5 text-sm ${clase}`}>
              <Icono size={14} />
              {texto}
              {f.destino && ` ${tituloBase(f.destino, bases[f.destino])}`}
            </p>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: f.equipo.color_hex }}
                />
              </div>
              <span className="text-xs tabular-nums text-slate-400">
                {f.completadas}/{f.total}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Las 6 bases con lo que pasa en cada una en la ronda en curso. */
export function FichasBasesGymkana({ fichas, bases }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {fichas.map((f) => (
        <div key={f.numero} className={`space-y-1.5 rounded-2xl border-2 p-3 ${ESTILO_BASE[f.estado]}`}>
          <p className="flex items-center justify-between gap-1 text-sm font-black leading-tight text-white">
            <span className="break-words">{tituloBase(f.numero, bases[f.numero])}</span>
            {f.estado === 'calificada' && <Check size={15} className="shrink-0" />}
          </p>
          {bases[f.numero]?.lugar?.trim() && (
            <p className="flex items-start gap-1 text-xs text-slate-300">
              <MapPin size={12} className="mt-0.5 shrink-0" />
              <span className="break-words">{bases[f.numero].lugar.trim()}</span>
            </p>
          )}
          <p className="text-xs font-semibold">{ETIQUETA_BASE[f.estado]}</p>
          {f.equipos.length > 0 && (
            <div className="space-y-0.5">
              {f.equipos.map((e) => (
                <span key={e.id} className="flex items-center gap-1 text-xs text-white">
                  <Punto color={e.color_hex} />
                  {e.nombre}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Centro de control operativo de la Gymkana. Lo usan el Admin y la Coordinación:
 * reloj de la ronda, botón de rotación general (con su ventana de minutos), tiempo
 * y última base, pausa de emergencia, estado de las 6 bases, radar de equipos,
 * correcciones y edición de bases.
 */
export default function ConsolaGymkana({ esAdmin = false, conAlertas = false, onCambio }) {
  const { showToast } = useToast();
  const bases = useBasesGymkana();
  const { circuito, cruces, equipos, desfaseMs, cargando, error, recargar } = useCircuitoGymkana();

  const [modal, setModal] = useState(false);
  const [rotando, setRotando] = useState(false);
  const [minutosTexto, setMinutosTexto] = useState('');
  const [editandoTiempo, setEditandoTiempo] = useState(false);
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);
  const [alertas, setAlertas] = useState([]);

  const cargarAlertas = useCallback(() => {
    if (!conAlertas) return;
    listarAlertasGymkana().then(setAlertas).catch(() => {});
  }, [conAlertas]);

  useEffect(() => {
    cargarAlertas();
    if (!conAlertas) return undefined;
    return suscribirseAlertasGymkana(cargarAlertas);
  }, [conAlertas, cargarAlertas]);

  const calculos = useMemo(() => {
    if (!circuito) return null;
    return {
      radar: radarCircuito(circuito, equipos, cruces),
      fichas: ocupacionBasesCircuito(circuito, equipos, cruces),
      final: esRondaFinal(circuito, equipos, cruces),
      rotable: puedeRotar(circuito, equipos, cruces),
    };
  }, [circuito, equipos, cruces]);

  async function confirmarRotacion({ duracion, ultima, duelos, forzar }) {
    setRotando(true);
    try {
      const r = await rotarEquiposGymkana({ duracion, ultima, duelos, forzar });
      if (r?.ok) {
        showToast(r.mensaje, 'success');
        setModal(false);
        await recargar();
        onCambio?.();
      } else {
        showToast(r?.mensaje ?? 'No se pudo rotar', 'warning');
        await recargar();
      }
    } catch (err) {
      showToast(err.message ?? 'No se pudo rotar los equipos', 'error');
    } finally {
      setRotando(false);
    }
  }

  async function ajustar(cambios, mensaje) {
    setGuardandoAjuste(true);
    try {
      await ajustarRondaGymkana(cambios);
      showToast(mensaje, 'success');
      await recargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo ajustar la ronda', 'error');
    } finally {
      setGuardandoAjuste(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }
  if (error || !circuito) {
    return (
      <p className="glass-card p-5 text-center text-sm text-red-300">
        No se pudo cargar el circuito de la Gymkana. ¿Ya corriste el SQL 49 en Supabase?
      </p>
    );
  }

  const enCurso = circuito.estado === 'en_curso';
  const minutosNuevos = Number.parseInt(minutosTexto, 10);
  const minutosValidos = Number.isInteger(minutosNuevos) && minutosNuevos >= 1 && minutosNuevos <= 180;
  const textoBoton =
    circuito.estado === 'esperando' ? 'Iniciar Gymkana · Primera rotación' : 'Rotar Equipos';

  return (
    <div className="space-y-8">
      {/* ───────── Rotación general ───────── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Flag size={18} className="text-emerald-300" /> Circuito general de la Gymkana
        </h2>

        <RelojRonda circuito={circuito} equipos={equipos} cruces={cruces} desfaseMs={desfaseMs} />

        {circuito.estado === 'completado' ? (
          <p className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            🎉 Todos los sub-equipos completaron las 6 bases. Ya no se pueden generar más rotaciones; los
            jueces y el público ven el mensaje de cierre.
          </p>
        ) : (
          <>
            <button
              type="button"
              disabled={!calculos.rotable || equipos.length < 2}
              onClick={() => setModal(true)}
              className="btn-primary w-full !py-4 !text-lg"
            >
              <RotateCw size={22} />
              {textoBoton}
            </button>
            {!calculos.rotable && enCurso && (
              <p className="text-center text-sm text-amber-200">
                {circuito.ultima_base
                  ? 'Se declaró la última base: no se generan más cruces.'
                  : 'Todos los equipos ya tienen sus 6 bases asignadas: esta es la ronda final.'}
              </p>
            )}
            {equipos.length < 2 && (
              <p className="text-center text-sm text-amber-200">
                Faltan sub-equipos de Gymkana por crear (pestaña Equipos).
              </p>
            )}

            {enCurso && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="glass-row space-y-2 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-200">
                      Duración de la ronda: <strong className="text-white">{circuito.duracion_minutos} min</strong>
                    </span>
                    {!editandoTiempo && (
                      <button
                        type="button"
                        onClick={() => {
                          setMinutosTexto(String(circuito.duracion_minutos));
                          setEditandoTiempo(true);
                        }}
                        className="btn-ghost !px-2"
                        aria-label="Cambiar el tiempo"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                  {editandoTiempo && (
                    <form
                      className="flex items-center gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!minutosValidos) return;
                        await ajustar({ duracion: minutosNuevos }, 'Tiempo actualizado');
                        setEditandoTiempo(false);
                      }}
                    >
                      <input
                        value={minutosTexto}
                        onChange={(e) => setMinutosTexto(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        inputMode="numeric"
                        aria-label="Nuevos minutos"
                        className="field !w-20 text-center font-mono"
                      />
                      <span className="text-xs text-slate-400">min desde el inicio</span>
                      <button
                        type="submit"
                        disabled={!minutosValidos || guardandoAjuste}
                        className="btn-primary !px-3 !py-1.5 text-sm"
                      >
                        {guardandoAjuste ? <Loader2 className="animate-spin" size={14} /> : 'Aplicar'}
                      </button>
                      <button type="button" onClick={() => setEditandoTiempo(false)} className="btn-ghost !px-2 text-sm">
                        Cancelar
                      </button>
                    </form>
                  )}
                </div>

                <div className="glass-row flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-200">Declarar Última Base</span>
                  <Switch
                    activo={calculos.final}
                    disabled={guardandoAjuste || (calculos.final && !circuito.ultima_base)}
                    onChange={(v) =>
                      ajustar(
                        { ultima: v },
                        v ? 'Última base declarada: ronda final' : 'Última base anulada'
                      )
                    }
                  />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ───────── Pausa de emergencia ───────── */}
      <ControlPausaActividades actividades={['gymkana']} puedeEncender={esAdmin} />

      {/* ───────── Bases ───────── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <MapPin size={16} className="text-emerald-300" /> Estado de las 6 bases
        </h2>
        <FichasBasesGymkana fichas={calculos.fichas} bases={bases} />
      </section>

      {/* ───────── Radar ───────── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Users size={16} className="text-sky-300" /> ¿Dónde está cada equipo?
        </h2>
        <RadarEquiposGymkana filas={calculos.radar} bases={bases} />
      </section>

      {/* ───────── Alertas (solo Coordinación; el Admin las tiene en su pestaña) ───────── */}
      {conAlertas && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <AlertTriangle size={16} className="text-red-300" /> Alertas de los jueces
            {alertas.filter((a) => a.requiere_auditoria).length > 0 && (
              <span className="rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                {alertas.filter((a) => a.requiere_auditoria).length}
              </span>
            )}
          </h2>
          <AlertasGymkana alertas={alertas} onCambio={cargarAlertas} />
        </section>
      )}

      {/* ───────── Correcciones y bases ───────── */}
      <section className="space-y-3">
        <details className="glass-card p-4">
          <summary className="cursor-pointer select-none font-semibold text-slate-200">
            Resultados por ronda (toca el lápiz para corregir)
          </summary>
          <div className="mt-4">
            <ResultadosCircuito
              cruces={cruces}
              equipos={equipos}
              bases={bases}
              onCambio={() => {
                recargar();
                onCambio?.();
              }}
            />
          </div>
        </details>

        <details className="glass-card p-4">
          <summary className="cursor-pointer select-none font-semibold text-slate-200">
            Nombres y lugares de las bases
          </summary>
          <div className="mt-4">
            <GestionBasesGymkana />
          </div>
        </details>
      </section>

      {modal && (
        <ModalRotarGymkana
          circuito={circuito}
          equipos={equipos}
          cruces={cruces}
          bases={bases}
          procesando={rotando}
          onConfirmar={confirmarRotacion}
          onCancelar={() => setModal(false)}
        />
      )}
    </div>
  );
}
