import { useState } from 'react';
import { AlertTriangle, Check, Dices, Loader2, RotateCcw, Shuffle, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import TablaFase from '../../torneo/TablaFase';
import {
  NOMBRE_FASE_PARTIDO,
  agruparPorFecha,
  avisosFixture,
  combinarFechaHora,
  horaParaInput,
  nombreLado,
  resumenProgreso,
  revisarPlantilla,
} from '../../../services/torneoLogica';
import {
  generarFixture,
  programarPartido,
  reiniciarFixture,
  repetirSorteo,
} from '../../../services/torneoService';

// Día del evento (Rally Interoratorios 2026). Solo se programa la hora.
const DIA_EVENTO = '2026-10-17';

const ESTADO_UI = {
  pendiente: { texto: 'Pendiente', clase: 'bg-slate-500/20 text-slate-300' },
  en_vivo: { texto: 'En vivo', clase: 'bg-red-500/20 text-red-300' },
  pausado: { texto: 'En vivo · pausa', clase: 'bg-amber-500/20 text-amber-300' },
  finalizado: { texto: 'Finalizado', clase: 'bg-emerald-500/20 text-emerald-300' },
};

function FilaPartido({ p, onHora }) {
  const estado = ESTADO_UI[p.estado] ?? ESTADO_UI.pendiente;
  const conMarcador = p.finalizado || p.estado === 'en_vivo' || p.estado === 'pausado';
  return (
    <div className="glass-row flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5">
      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold text-slate-200">
        Cancha {p.cancha}
      </span>
      <span className="flex min-w-0 flex-1 basis-40 flex-wrap items-center gap-x-1.5 text-sm font-semibold leading-tight text-white">
        <span className="inline-flex items-center gap-1.5">
          {p.a_color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.a_color }} />}
          {nombreLado(p, 'a')}
        </span>
        <span className="text-slate-500">vs</span>
        <span className="inline-flex items-center gap-1.5">
          {p.b_color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.b_color }} />}
          {nombreLado(p, 'b')}
        </span>
      </span>
      {conMarcador && (
        <span className="text-sm font-black tabular-nums text-white">
          {p.goles_a} - {p.goles_b}
          {p.pen_serie != null && p.fase_juego === 'penales' && (
            <span className="ml-1 text-xs font-semibold text-amber-300">
              ({p.pen_a}-{p.pen_b} pen.)
            </span>
          )}
        </span>
      )}
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${estado.clase}`}>
        {estado.texto}
      </span>
      <input
        type="time"
        aria-label={`Hora del partido ${p.partido_num}`}
        defaultValue={horaParaInput(p.hora_programada)}
        key={`${p.id}-${p.hora_programada ?? ''}`}
        onBlur={(e) => onHora(p, e.target.value)}
        className="field !h-8 !w-[6.5rem] !px-2 !py-0 text-xs"
      />
    </div>
  );
}

export default function FixtureAdmin({ macros, equipos, partidos, tablas, onCambio }) {
  const { showToast } = useToast();
  const [minutos, setMinutos] = useState('10');
  const [generando, setGenerando] = useState(false);
  const [paso, setPaso] = useState(0); // reinicio: 0 cerrado, 1 confirmar
  const [texto, setTexto] = useState('');
  const [procesando, setProcesando] = useState(false);

  const fixtureGenerado = partidos.length > 0;
  const plantilla = revisarPlantilla(macros, equipos);
  const progreso = resumenProgreso(partidos);
  const avisos = avisosFixture(partidos, tablas);
  const fechas = agruparPorFecha(partidos);

  async function handleGenerar() {
    const min = Number(minutos);
    if (!Number.isFinite(min) || min <= 0 || min > 300) {
      showToast('La duración debe estar entre 1 y 300 minutos', 'error');
      return;
    }
    if (
      !window.confirm(
        `Se crearán los 20 partidos (11 fechas, 2 canchas) de ${min} min cada uno.\n\nDespués no podrás mover equipos de grupo sin reiniciar el fixture. ¿Generar ahora?`
      )
    )
      return;
    setGenerando(true);
    try {
      await generarFixture(Math.round(min * 60));
      showToast('Fixture generado: 20 partidos', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo generar el fixture', 'error');
    } finally {
      setGenerando(false);
    }
  }

  async function handleHora(partido, valor) {
    const nueva = valor ? combinarFechaHora(DIA_EVENTO, valor) : null;
    const actual = partido.hora_programada ? new Date(partido.hora_programada).toISOString() : null;
    if (nueva === actual) return;
    try {
      await programarPartido(partido.id, nueva);
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo guardar la hora', 'error');
    }
  }

  async function handleReiniciar() {
    setProcesando(true);
    try {
      await reiniciarFixture();
      showToast('Fixture reiniciado. Los equipos y plantillas se conservan.', 'success');
      setPaso(0);
      setTexto('');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo reiniciar el fixture', 'error');
    } finally {
      setProcesando(false);
    }
  }

  async function handleSorteo(filas) {
    if (!window.confirm('Se vuelve a sortear el desempate entre estos equipos. ¿Continuar?')) return;
    try {
      await repetirSorteo(filas.map((f) => f.equipo_torneo_id));
      showToast('Sorteo repetido', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo repetir el sorteo', 'error');
    }
  }

  // ---------- Aún sin fixture ----------
  if (!fixtureGenerado) {
    return (
      <div className="glass-card mx-auto max-w-xl space-y-5 p-5">
        <div>
          <h2 className="font-bold text-white">Generar el fixture</h2>
          <p className="mt-1 text-sm text-slate-400">
            20 partidos: Fase de Grupos (12), Cuadrangular de líderes (6), Tercer Puesto y Gran
            Final. 11 fechas en 2 canchas.
          </p>
        </div>

        <ul className="space-y-1.5 text-sm">
          {plantilla.grupos.map((g) => (
            <li key={g.macro.id} className="flex items-center gap-2">
              {g.total === 3 ? (
                <Check size={16} className="text-emerald-400" />
              ) : (
                <X size={16} className="text-red-400" />
              )}
              <span className="text-slate-200">
                Grupo {g.letra} · {g.macro.nombre}
              </span>
              <span className="ml-auto text-xs text-slate-500">{g.total}/3 equipos</span>
            </li>
          ))}
          {!plantilla.macrosOk && (
            <li className="text-xs text-amber-400">
              Hacen falta exactamente 4 macro-equipos (hay {macros.length}).
            </li>
          )}
        </ul>

        <div>
          <label className="field-label">Duración de cada partido (minutos)</label>
          <input
            type="number"
            min="1"
            max="300"
            value={minutos}
            onChange={(e) => setMinutos(e.target.value)}
            className="field max-w-[8rem]"
          />
          <p className="mt-1 text-xs text-slate-500">
            El árbitro puede ajustarlo en cada partido. El suplementario de la Final siempre es de
            2 × 5 min.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerar}
          disabled={generando || !plantilla.listo}
          className="btn-primary w-full disabled:opacity-50"
        >
          {generando ? <Loader2 className="animate-spin" size={18} /> : <Shuffle size={18} />}
          Generar fixture
        </button>
        {!plantilla.listo && (
          <p className="text-center text-xs text-amber-400">
            Completa los equipos en la pestaña Equipos para poder generar.
          </p>
        )}
      </div>
    );
  }

  // ---------- Fixture generado ----------
  const grupos = ['A', 'B', 'C', 'D'];
  const filasGrupo = (letra) => tablas.filter((t) => t.fase === 'grupos' && t.grupo === letra);
  const filasCuad = tablas.filter((t) => t.fase === 'cuadrangular');
  const empatesSorteo = (filas) => filas.filter((f) => f.desempate === 'sorteo');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass-card grid grid-cols-3 gap-3 p-4 text-center">
        <div>
          <p className="text-2xl font-black text-white">{progreso.finalizados}</p>
          <p className="text-xs text-slate-400">Finalizados</p>
        </div>
        <div>
          <p className="text-2xl font-black text-red-300">{progreso.enVivo}</p>
          <p className="text-xs text-slate-400">En vivo</p>
        </div>
        <div>
          <p className="text-2xl font-black text-slate-300">{progreso.pendientes}</p>
          <p className="text-xs text-slate-400">Pendientes</p>
        </div>
      </div>

      {avisos.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle size={18} /> Revisa estos cruces
          </p>
          {avisos.map((a) => (
            <p key={a.texto} className="text-sm text-amber-200/90">
              {a.texto}
            </p>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-bold text-white">Calendario</h2>
        <p className="text-xs text-slate-500">
          Hora opcional de cada partido (día del evento: 17 de octubre). Se muestra al público.
        </p>
        {fechas.map(({ fecha, partidos: lista }) => (
          <div key={fecha} className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Fecha {fecha}
              {lista[0] && lista[0].fase !== 'grupos' && (
                <span className="ml-2 normal-case text-slate-500">
                  · {NOMBRE_FASE_PARTIDO[lista[0].fase]}
                </span>
              )}
            </p>
            {lista.map((p) => (
              <FilaPartido key={p.id} p={p} onHora={handleHora} />
            ))}
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-white">Clasificación actual</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {grupos.map((letra) => {
            const filas = filasGrupo(letra);
            if (filas.length === 0) return null;
            const sorteos = empatesSorteo(filas);
            return (
              <div key={letra} className="glass-card space-y-2 p-3">
                <p className="text-sm font-bold text-white">Grupo {letra}</p>
                <TablaFase filas={filas} equipos={equipos} resaltar={filas[0]?.completo ? 1 : 0} compacta />
                {sorteos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSorteo(filas)}
                    className="flex items-center gap-1.5 text-xs text-amber-300 underline underline-offset-2"
                  >
                    <Dices size={14} /> Se definió por sorteo · repetir
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {filasCuad.length > 0 && (
          <div className="glass-card space-y-2 p-3">
            <p className="text-sm font-bold text-white">Cuadrangular</p>
            <TablaFase filas={filasCuad} equipos={equipos} resaltar={0} compacta />
            {empatesSorteo(filasCuad).length > 0 && (
              <button
                type="button"
                onClick={() => handleSorteo(filasCuad)}
                className="flex items-center gap-1.5 text-xs text-amber-300 underline underline-offset-2"
              >
                <Dices size={14} /> Se definió por sorteo · repetir
              </button>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5">
        <p className="flex items-center gap-2 font-bold text-red-300">
          <RotateCcw size={18} /> Reiniciar el fixture
        </p>
        <p className="text-sm text-red-300/80">
          Borra los 20 partidos con sus goles, tarjetas y penales. Los equipos y las plantillas de
          jugadores se conservan, así podrás generarlo de nuevo.
        </p>
        {paso === 0 ? (
          <button type="button" onClick={() => setPaso(1)} className="btn-danger">
            Reiniciar fixture
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-200">
              Escribe <strong>REINICIAR</strong> para confirmar.
            </p>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="field"
              placeholder="REINICIAR"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaso(0);
                  setTexto('');
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={texto.trim().toUpperCase() !== 'REINICIAR' || procesando}
                onClick={handleReiniciar}
                className="btn-danger flex-1 disabled:opacity-40"
              >
                {procesando && <Loader2 className="animate-spin" size={16} />}
                Confirmar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
