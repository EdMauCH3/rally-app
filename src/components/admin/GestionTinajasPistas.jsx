import { useCallback, useEffect, useState } from 'react';
import { Amphora, Check, Loader2, Play, RotateCcw, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  MAX_PISTA,
  listarPistasTesoro,
  guardarPistasTesoro,
} from '../../services/tesoroPistasService';
import {
  listarRutasTesoro,
  iniciarBusquedaTesoro,
  reiniciarBusquedaTesoro,
  suscribirseTesoroGlobal,
} from '../../services/tesoroService';
import { listarSubEquiposColorPorActividad } from '../../services/subEquiposColorService';

const NUMEROS = Array.from({ length: 10 }, (_, i) => i + 1);

const instantanea = (pistas) => JSON.stringify(pistas);
const tienePista = (p) => p.pista.trim().length > 0;

/**
 * Pistas de las tinajas + lanzamiento de la Búsqueda del Tesoro.
 *
 * - Las pistas se guardan como BORRADOR en la base de datos: no hace falta
 *   iniciar la búsqueda para que queden guardadas, y sobreviven a recargar.
 * - Una tinaja entra a la búsqueda solo si su pista tiene texto.
 * - "Iniciar" reparte a cada equipo su recorrido aleatorio y enciende la
 *   actividad para el público. Es el único interruptor de esta sección.
 */
export default function GestionTinajasPistas() {
  const { showToast } = useToast();
  const [pistas, setPistas] = useState(() => NUMEROS.map((n) => ({ numero: n, pista: '' })));
  const [guardado, setGuardado] = useState(null); // null = aún no se pudo leer
  const [equiposConRuta, setEquiposConRuta] = useState(0);
  const [equiposTesoro, setEquiposTesoro] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [accionando, setAccionando] = useState(false);

  // Estado de la búsqueda (recorridos y equipos). NO toca lo que se está escribiendo.
  const cargarEstado = useCallback(async () => {
    const [rutas, equipos] = await Promise.allSettled([
      listarRutasTesoro(),
      listarSubEquiposColorPorActividad('tesoro'),
    ]);
    if (rutas.status === 'fulfilled') setEquiposConRuta(rutas.value.length);
    if (equipos.status === 'fulfilled') setEquiposTesoro(equipos.value.length);
  }, []);

  useEffect(() => {
    // Las pistas se leen UNA vez al abrir: un aviso en tiempo real después no debe
    // pisar el texto que el Admin esté escribiendo.
    listarPistasTesoro()
      .then((lista) => {
        const porNumero = new Map(lista.map((p) => [p.numero, p.pista]));
        const cargadas = NUMEROS.map((n) => ({ numero: n, pista: porNumero.get(n) ?? '' }));
        setPistas(cargadas);
        setGuardado(instantanea(cargadas));
      })
      .catch(() =>
        showToast('No se pudieron cargar las pistas. ¿Ya corriste el SQL de las tinajas?', 'error')
      )
      .finally(() => setCargando(false));

    cargarEstado();
    const cancelar = suscribirseTesoroGlobal(cargarEstado);
    return cancelar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iniciada = equiposConRuta > 0;
  const hayCambios = guardado !== null && instantanea(pistas) !== guardado;
  const configuradas = pistas.filter(tienePista).length;

  function actualizar(numero, texto) {
    setPistas((prev) => prev.map((p) => (p.numero === numero ? { ...p, pista: texto } : p)));
  }

  async function handleGuardar() {
    // Con la búsqueda en marcha, una tinaja que ya tiene recorrido no puede quedarse sin
    // pista: los equipos pasarían por ella y no habría nada que leerles.
    if (iniciada && guardado !== null) {
      const anteriores = JSON.parse(guardado);
      const vaciadas = anteriores.filter(
        (a) => tienePista(a) && !tienePista(pistas.find((p) => p.numero === a.numero))
      );
      if (vaciadas.length > 0) {
        showToast(
          `La búsqueda ya inició: no puedes dejar vacía la pista de la Tinaja ${vaciadas[0].numero}`,
          'error'
        );
        return;
      }
    }

    setGuardando(true);
    try {
      await guardarPistasTesoro(pistas);
      setGuardado(instantanea(pistas));
      if (iniciada && pistas.some((p, i) => tienePista(p) && !tienePista(JSON.parse(guardado)[i]))) {
        showToast(
          'Pistas guardadas. Una tinaja nueva no entra a una búsqueda que ya inició.',
          'warning'
        );
      } else {
        showToast('Pistas guardadas', 'success');
      }
    } catch (err) {
      showToast(err.message ?? 'No se pudieron guardar las pistas', 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function handleIniciar() {
    const aviso = `Se le dará a cada uno de los ${equiposTesoro} equipos un recorrido distinto y aleatorio de ${configuradas} tinajas, sin que dos equipos coincidan en la misma tinaja al mismo tiempo. La búsqueda quedará visible para el público.\n\n¿Iniciar la Búsqueda del Tesoro ahora?`;
    if (!window.confirm(aviso)) return;

    setAccionando(true);
    try {
      await iniciarBusquedaTesoro();
      showToast('¡Búsqueda del Tesoro iniciada!', 'success');
      await cargarEstado();
    } catch (err) {
      showToast(err.message ?? 'No se pudo iniciar la búsqueda', 'error');
    } finally {
      setAccionando(false);
    }
  }

  async function handleReiniciar() {
    const aviso =
      '¿Reiniciar la Búsqueda del Tesoro?\n\nSe borran los recorridos y TODAS las llegadas y puntuaciones del Tesoro, y la actividad se apaga. Las pistas se conservan.\n\nEsto no se puede deshacer.';
    if (!window.confirm(aviso)) return;

    setAccionando(true);
    try {
      await reiniciarBusquedaTesoro();
      showToast('Búsqueda reiniciada', 'success');
      await cargarEstado();
    } catch (err) {
      showToast(err.message ?? 'No se pudo reiniciar la búsqueda', 'error');
    } finally {
      setAccionando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-white" size={24} />
      </div>
    );
  }

  const faltanTinajas = equiposTesoro > 0 && configuradas < equiposTesoro;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Amphora size={18} className="text-amber-300" />
          Tinajas y pistas
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Escribe la pista o acertijo que llevará a los equipos hasta cada tinaja. Las que dejes
          vacías no entran a la búsqueda. Cada equipo recibirá las tinajas en un orden distinto,
          al azar.
        </p>
      </div>

      <div className="space-y-3">
        {pistas.map((p) => {
          const lista = tienePista(p);
          return (
            <div key={p.numero} className="glass-card space-y-2.5 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 font-bold text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-600/20 text-base font-black text-amber-200">
                    {p.numero}
                  </span>
                  Tinaja {p.numero}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    lista ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {lista ? 'Configurada' : 'Vacía'}
                </span>
              </div>

              <textarea
                value={p.pista}
                maxLength={MAX_PISTA}
                rows={4}
                onChange={(e) => actualizar(p.numero, e.target.value)}
                placeholder={`Escribe aquí la pista que llevará al equipo hasta la Tinaja ${p.numero}…`}
                aria-label={`Pista de la Tinaja ${p.numero}`}
                className="field min-h-[7rem] resize-y leading-relaxed"
              />
              <p className="text-right text-xs tabular-nums text-slate-500">
                {p.pista.length}/{MAX_PISTA}
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {guardado !== null && (
          <p
            className={`flex items-center gap-2 text-sm font-semibold ${
              hayCambios ? 'text-amber-300' : configuradas > 0 ? 'text-emerald-300' : 'text-slate-400'
            }`}
          >
            {!hayCambios && configuradas > 0 && <Check size={16} />}
            {hayCambios
              ? 'Tienes cambios sin guardar'
              : configuradas > 0
                ? `Pistas guardadas · ${configuradas} ${configuradas === 1 ? 'tinaja configurada' : 'tinajas configuradas'}`
                : 'Aún no has escrito ninguna pista'}
          </p>
        )}

        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando || guardado === null || accionando}
          className="btn-secondary w-full !py-4 !text-base"
        >
          {guardando ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Guardar pistas
        </button>
      </div>

      {/* Lanzamiento: el único control de inicio de esta sección */}
      <div
        className={`space-y-4 rounded-3xl border-2 p-5 ${
          iniciada
            ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
            : 'border-amber-400/30 bg-amber-500/[0.05]'
        }`}
      >
        {iniciada ? (
          <>
            <p className="flex items-center gap-2 font-bold text-emerald-300">
              <Check size={18} />
              Búsqueda del Tesoro iniciada
            </p>
            <p className="text-sm text-slate-300">
              {equiposConRuta} {equiposConRuta === 1 ? 'equipo tiene' : 'equipos tienen'} su
              recorrido. Puedes seguir corrigiendo el texto de las pistas, pero una tinaja nueva
              ya no entra.
            </p>
            <button
              type="button"
              onClick={handleReiniciar}
              disabled={accionando}
              className="btn-danger w-full !py-3"
            >
              {accionando ? <Loader2 className="animate-spin" size={18} /> : <RotateCcw size={18} />}
              Reiniciar búsqueda
            </button>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="font-bold text-white">Lanzamiento</p>
              <p className="text-sm text-slate-300">
                {equiposTesoro} {equiposTesoro === 1 ? 'equipo' : 'equipos'} ·{' '}
                {configuradas} {configuradas === 1 ? 'tinaja configurada' : 'tinajas configuradas'}
              </p>
            </div>

            {faltanTinajas && (
              <p className="text-sm text-amber-300">
                Necesitas al menos {equiposTesoro} tinajas con pista (una por equipo) para que dos
                equipos nunca coincidan en la misma.
              </p>
            )}
            {equiposTesoro === 0 && (
              <p className="text-sm text-amber-300">
                No hay equipos asignados a la Búsqueda del Tesoro. Asígnale un color de Tesoro a
                cada Macro-Equipo en Equipos.
              </p>
            )}
            {hayCambios && (
              <p className="text-sm text-amber-300">Guarda las pistas antes de iniciar.</p>
            )}

            <button
              type="button"
              onClick={handleIniciar}
              disabled={
                accionando || hayCambios || guardado === null || configuradas < 1 || faltanTinajas || equiposTesoro === 0
              }
              className="btn-primary w-full !py-5 !text-lg disabled:opacity-50"
            >
              {accionando ? <Loader2 className="animate-spin" size={22} /> : <Play size={22} />}
              Iniciar Búsqueda del Tesoro
            </button>
          </>
        )}
      </div>
    </section>
  );
}
