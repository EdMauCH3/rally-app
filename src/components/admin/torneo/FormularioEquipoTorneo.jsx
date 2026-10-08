import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { validarEquipoForm } from '../../../services/torneoLogica';
import { crearEquipoTorneo, actualizarEquipoTorneo } from '../../../services/torneoService';

const COLOR_DEFAULT = '#733f2d';

/** Crear o editar un equipo del torneo (siempre dentro de un macro-equipo). */
export default function FormularioEquipoTorneo({
  macros,
  equipo = null,
  macroInicialId = null,
  fixtureGenerado,
  onCerrar,
  onGuardado,
}) {
  const { showToast } = useToast();
  const [nombre, setNombre] = useState(equipo?.nombre ?? '');
  const [colorHex, setColorHex] = useState(equipo?.color_hex ?? COLOR_DEFAULT);
  const [descripcion, setDescripcion] = useState(equipo?.descripcion ?? '');
  const [macroEquipoId, setMacroEquipoId] = useState(equipo?.macro_equipo_id ?? macroInicialId ?? '');
  const [guardando, setGuardando] = useState(false);

  const macroBloqueado = Boolean(equipo) && fixtureGenerado;

  async function handleSubmit(e) {
    e.preventDefault();
    const problema = validarEquipoForm({ nombre, colorHex, macroEquipoId });
    if (problema) {
      showToast(problema, 'error');
      return;
    }
    setGuardando(true);
    try {
      if (equipo) {
        await actualizarEquipoTorneo(equipo.id, {
          nombre,
          colorHex,
          descripcion,
          macroEquipoId: macroBloqueado ? null : macroEquipoId,
        });
      } else {
        await crearEquipoTorneo({ nombre, colorHex, descripcion, macroEquipoId });
      }
      showToast(equipo ? 'Equipo actualizado' : 'Equipo creado', 'success');
      onGuardado();
    } catch (err) {
      showToast(err.message ?? 'No se pudo guardar el equipo', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="glass-card w-full max-w-md space-y-4 p-5 rounded-b-none sm:rounded-b-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">{equipo ? 'Editar equipo' : 'Nuevo equipo del torneo'}</h3>
          <button type="button" onClick={onCerrar} className="p-2 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="field-label">Macro-equipo (grupo)</label>
          <select
            value={macroEquipoId}
            onChange={(e) => setMacroEquipoId(e.target.value)}
            disabled={macroBloqueado}
            className="field disabled:opacity-60"
          >
            <option value="">Elige un macro-equipo…</option>
            {macros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          {macroBloqueado && (
            <p className="mt-1 text-xs text-amber-400">
              El fixture ya está generado: para cambiar el macro, reinicia el fixture.
            </p>
          )}
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
          <div>
            <label className="field-label">Color</label>
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="h-11 w-14 cursor-pointer rounded-lg bg-transparent"
            />
          </div>
          <div>
            <label className="field-label">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={40}
              placeholder="Ej. Los Centinelas"
              className="field"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="field-label">Descripción (opcional)</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            maxLength={240}
            placeholder="Una frase para presentar al equipo al público"
            className="field resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCerrar} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className="btn-primary flex-1 disabled:opacity-50">
            {guardando && <Loader2 className="animate-spin" size={16} />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
