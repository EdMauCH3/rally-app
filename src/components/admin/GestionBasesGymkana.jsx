import { useEffect, useState } from 'react';
import { Check, Loader2, MapPin, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { listarBasesGymkana, guardarBasesGymkana } from '../../services/gymkanaBasesService';

const NUMEROS = [1, 2, 3, 4, 5, 6];
const MAX_NOMBRE = 80;
const MAX_LUGAR = 100;

const vacias = () => NUMEROS.map((n) => ({ numero: n, nombre: '', lugar: '' }));
const instantanea = (bases) => JSON.stringify(bases);

/**
 * Las 6 bases de la Gymkana: número fijo (Base 1 a 6), nombre temático
 * ("Esperanza") y lugar físico ("Cancha de baloncesto"). Lo editan el Admin y
 * la Coordinación de Gymkana, antes o durante el evento; los cambios llegan solos
 * a las pantallas del público y de los jueces.
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
          nombre: porNumero.get(n)?.nombre ?? '',
          lugar: porNumero.get(n)?.lugar ?? '',
        }));
        setBases(cargadas);
        setGuardado(instantanea(cargadas));
      })
      .catch(() =>
        showToast('No se pudieron cargar las bases. ¿Ya corriste el SQL 49 de la Gymkana?', 'error')
      )
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function actualizar(numero, campo, valor) {
    setBases((prev) => prev.map((b) => (b.numero === numero ? { ...b, [campo]: valor } : b)));
  }

  const hayCambios = guardado !== null && instantanea(bases) !== guardado;
  const algunaConfigurada = bases.some((b) => b.lugar.trim() || b.nombre.trim());
  const faltanDatos = bases.some((b) => !b.lugar.trim() || !b.nombre.trim());

  async function handleGuardar() {
    setGuardando(true);
    try {
      await guardarBasesGymkana(bases);
      setGuardado(instantanea(bases));
      showToast(
        faltanDatos ? 'Bases guardadas. Aún faltan nombres o lugares por completar.' : 'Bases guardadas',
        faltanDatos ? 'warning' : 'success'
      );
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
    <section className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <MapPin size={18} className="text-emerald-300" />
          Bases de la Gymkana
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Cada base se muestra como <strong className="text-slate-200">«Base 1 - Esperanza»</strong> y, debajo,
          el lugar en letra grande. Puedes cambiarlo en caliente, incluso con la Gymkana en marcha.
        </p>
      </div>

      <div className="space-y-3">
        {bases.map((b) => (
          <div key={b.numero} className="glass-card flex gap-3 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-600/25 text-lg font-black text-emerald-200">
              {b.numero}
            </span>

            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="space-y-1">
                <label className="field-label" htmlFor={`base-nombre-${b.numero}`}>
                  Nombre de la Base
                </label>
                <input
                  id={`base-nombre-${b.numero}`}
                  value={b.nombre}
                  maxLength={MAX_NOMBRE}
                  onChange={(e) => actualizar(b.numero, 'nombre', e.target.value)}
                  placeholder="Ej: Esperanza"
                  className="field"
                />
                <p className="text-xs text-slate-500">
                  Se verá: <span className="font-semibold text-slate-300">Base {b.numero}{b.nombre.trim() ? ` - ${b.nombre.trim()}` : ''}</span>
                </p>
              </div>

              <div className="space-y-1">
                <label className="field-label" htmlFor={`base-lugar-${b.numero}`}>
                  Lugar / Ubicación
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
            </div>
          </div>
        ))}
      </div>

      {guardado !== null && (
        <p
          className={`flex items-center gap-2 text-sm font-semibold ${
            hayCambios ? 'text-amber-300' : algunaConfigurada ? 'text-emerald-300' : 'text-slate-400'
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
