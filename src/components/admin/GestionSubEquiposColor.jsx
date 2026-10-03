import { useCallback, useEffect, useState } from 'react';
import { Loader2, X, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  listarSubEquiposColor,
  crearSubEquipoColor,
  actualizarSubEquipoColor,
  eliminarSubEquipoColor,
  suscribirseSubEquiposColor,
} from '../../services/subEquiposColorService';

const ACTIVIDADES = [
  { id: 'gymkana', label: 'Gymkana' },
  { id: 'tesoro', label: 'Tesoro' },
  { id: 'torneo', label: 'Torneo' },
];

const COLOR_DEFAULT = '#733f2d';

export default function GestionSubEquiposColor({ macroEquipos }) {
  const { showToast } = useToast();
  const [colores, setColores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null); // { macroEquipoId, actividad, id? }
  const [colorNombre, setColorNombre] = useState('');
  const [colorHex, setColorHex] = useState(COLOR_DEFAULT);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    listarSubEquiposColor()
      .then(setColores)
      .catch(() => showToast('No se pudieron cargar los colores', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseSubEquiposColor(cargar);
    return unsubscribe;
  }, [cargar]);

  function colorDe(macroEquipoId, actividad) {
    return colores.find((c) => c.macro_equipo_id === macroEquipoId && c.actividad === actividad);
  }

  function abrirForm(macroEquipoId, actividad, colorExistente) {
    setEditando({ macroEquipoId, actividad, id: colorExistente?.id ?? null });
    setColorNombre(colorExistente?.color_nombre ?? '');
    setColorHex(colorExistente?.color_hex ?? COLOR_DEFAULT);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!colorNombre.trim()) {
      showToast('Ponle un nombre al color', 'error');
      return;
    }
    setGuardando(true);
    try {
      if (editando.id) {
        await actualizarSubEquipoColor(editando.id, {
          colorNombre: colorNombre.trim(),
          colorHex,
        });
      } else {
        await crearSubEquipoColor({
          macroEquipoId: editando.macroEquipoId,
          colorNombre: colorNombre.trim(),
          colorHex,
          actividad: editando.actividad,
        });
      }
      showToast('Guardado', 'success');
      setEditando(null);
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo guardar', 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar() {
    if (!editando?.id) return;
    if (!window.confirm('¿Quitar este color de la actividad?')) return;
    setGuardando(true);
    try {
      await eliminarSubEquipoColor(editando.id);
      showToast('Color eliminado', 'success');
      setEditando(null);
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo eliminar', 'error');
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
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-white">Colores por Macro-Equipo</h2>
        <p className="text-sm text-slate-400 mt-1">
          Asigna qué color de cada Macro-Equipo va a Gymkana, cuál a Tesoro y cuál a Torneo.
        </p>
      </div>

      {macroEquipos.length === 0 && (
        <p className="text-sm text-slate-500">Crea primero tus Macro-Equipos arriba.</p>
      )}

      {macroEquipos.map((macro) => (
        <div key={macro.id} className="glass-card p-4 space-y-3">
          <p className="font-semibold text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: macro.color_hex }} />
            {macro.nombre}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVIDADES.map((act) => {
              const color = colorDe(macro.id, act.id);
              return (
                <button
                  key={act.id}
                  onClick={() => abrirForm(macro.id, act.id, color)}
                  className="rounded-xl border-2 p-3 text-center transition-all duration-300 ease-in-out hover:scale-105"
                  style={{ borderColor: color ? color.color_hex : 'rgba(255,255,255,0.1)' }}
                >
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                    {act.label}
                  </p>
                  {color ? (
                    <>
                      <span
                        className="block w-6 h-6 rounded-full mx-auto my-1.5"
                        style={{ backgroundColor: color.color_hex }}
                      />
                      <p className="text-xs font-bold text-white truncate">{color.color_nombre}</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 py-3">+ Asignar</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 px-4">
          <form
            onSubmit={handleGuardar}
            className="bg-brand-navy border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">
                {editando.id ? 'Editar color' : 'Asignar color'} —{' '}
                {ACTIVIDADES.find((a) => a.id === editando.actividad)?.label}
              </h3>
              <button type="button" onClick={() => setEditando(null)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="field-label">Nombre del color</label>
              <input
                value={colorNombre}
                onChange={(e) => setColorNombre(e.target.value)}
                placeholder="Amarillo"
                className="field"
              />
            </div>

            <div className="space-y-1.5">
              <label className="field-label">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer bg-transparent"
                />
                <input
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="field font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {editando.id && (
                <button
                  type="button"
                  onClick={handleEliminar}
                  disabled={guardando}
                  className="btn-danger !px-3 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button type="submit" disabled={guardando} className="btn-primary flex-1">
                {guardando && <Loader2 className="animate-spin" size={16} />}
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
