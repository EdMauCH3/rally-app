import { useEffect, useState } from 'react';
import { Check, Loader2, MapPin, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { listarBasesGymkana, guardarBasesGymkana } from '../../services/gymkanaBasesService';

const NUMEROS = [1, 2, 3, 4, 5, 6];
const MAX_LUGAR = 100;
const MAX_DESCRIPCION = 200;

const vacias = () => NUMEROS.map((n) => ({ numero: n, lugar: '', descripcion: '' }));
const instantanea = (bases) => JSON.stringify(bases);

/**
 * Las 6 bases de la Gymkana (lugar + descripción corta). Se configuran
 * ANTES de lanzar la Gymkana y quedan guardadas en la base de datos: no se
 * pierden al recargar. El número de base es fijo (1 a 6); es el mismo que
 * usan las rutas y los partidos.
 */
export default function GestionBasesGymkana() {
  const { showToast } = useToast();
  const [bases, setBases] = useState(vacias);
  const [guardado, setGuardado] = useState(null); // null = aún no se pudo leer
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listarBasesGymkana()
      .then((lista) => {
        const porNumero = new Map(lista.map((b) => [b.numero, b]));
        const cargadas = NUMEROS.map((n) => ({
          numero: n,
          lugar: porNumero.get(n)?.lugar ?? '',
          descripcion: porNumero.get(n)?.descripcion ?? '',
        }));
        setBases(cargadas);
        setGuardado(instantanea(cargadas));
      })
      .catch(() =>
        showToast('No se pudieron cargar las bases. ¿Ya corriste el SQL de las bases de la Gymkana?', 'error')
      )
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function actualizar(numero, campo, valor) {
    setBases((prev) => prev.map((b) => (b.numero === numero ? { ...b, [campo]: valor } : b)));
  }

  const hayCambios = guardado !== null && instantanea(bases) !== guardado;
  const algunaConfigurada = bases.some((b) => b.lugar.trim() || b.descripcion.trim());
  const faltanLugares = bases.some((b) => !b.lugar.trim());

  async function handleGuardar() {
    setGuardando(true);
    try {
      await guardarBasesGymkana(bases);
      setGuardado(instantanea(bases));
      if (faltanLugares) {
        showToast('Bases guardadas. Aún faltan lugares por completar.', 'warning');
      } else {
        showToast('Bases guardadas', 'success');
      }
    } catch (err) {
      showToast(err.message ?? 'No se pudieron guardar las bases', 'error');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-white" size={24} />
      </div>
    );
  }

  return (
    <section className="max-w-2xl mx-auto space-y-4">
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <MapPin size={18} className="text-emerald-300" />
          Bases de la Gymkana
        </h2>
        <p className="mt-1 text-sm text-slate-400 leading-relaxed">
          Cuéntale a cada equipo dónde queda su base y de qué se trata. Esto se muestra cuando se
          dirigen a ella. Puedes guardarlo desde ya, antes de lanzar la Gymkana.
        </p>
      </div>

      <div className="space-y-3">
        {bases.map((b) => (
          <div key={b.numero} className="glass-card p-4 flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600/25 border border-emerald-500/30 text-lg font-black text-emerald-200">
              {b.numero}
            </span>

            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="space-y-1">
                <label className="field-label" htmlFor={`base-lugar-${b.numero}`}>
                  Lugar / ubicación
                </label>
                <input
                  id={`base-lugar-${b.numero}`}
                  value={b.lugar}
                  maxLength={MAX_LUGAR}
                  onChange={(e) => actualizar(b.numero, 'lugar', e.target.value)}
                  placeholder="Ej: Cancha de baloncesto"
                  className="field"
                />
              </div>

              <div className="space-y-1">
                <label className="field-label" htmlFor={`base-desc-${b.numero}`}>
                  Descripción corta
                </label>
                <textarea
                  id={`base-desc-${b.numero}`}
                  value={b.descripcion}
                  maxLength={MAX_DESCRIPCION}
                  rows={2}
                  onChange={(e) => actualizar(b.numero, 'descripcion', e.target.value)}
                  placeholder="Ej: Lleven el balón y formen una fila de 5"
                  className="field resize-none"
                />
                <p className="text-right text-xs text-slate-500 tabular-nums">
                  {b.descripcion.length}/{MAX_DESCRIPCION}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {guardado !== null && (
        <p
          className={`flex items-center gap-2 text-sm font-semibold ${
            hayCambios
              ? 'text-amber-300'
              : algunaConfigurada
                ? 'text-emerald-300'
                : 'text-slate-400'
          }`}
        >
          {!hayCambios && algunaConfigurada && <Check size={16} />}
          {hayCambios
            ? 'Tienes cambios sin guardar'
            : algunaConfigurada
              ? 'Bases guardadas'
              : 'Aún no has configurado ninguna base'}
        </p>
      )}

      <button
        type="button"
        onClick={handleGuardar}
        disabled={guardando || guardado === null}
        className="btn-primary w-full !py-4 !text-base"
      >
        {guardando ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        Guardar bases
      </button>
    </section>
  );
}
