import { useState } from 'react';
import { AlertTriangle, Loader2, Pencil } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { sobrescribirResultadoGymkana } from '../../services/adminService';

const OPCIONES = [
  { valor: 'gano', texto: 'Ganó' },
  { valor: 'empato', texto: 'Empató' },
  { valor: 'perdio', texto: 'Perdió' },
];

const ETIQUETA = { gano: 'Ganó', empato: 'Empató', perdio: 'Perdió' };
const INVERSO = { gano: 'perdio', perdio: 'gano', empato: 'empato' };

/** Fila editable de un enfrentamiento de Gymkana: el Admin puede fijar
 * o corregir el resultado de cualquier base, esté o no marcada en alerta. */
export default function PartidoGymkanaRow({ partido, onCambio }) {
  const { showToast } = useToast();
  const [editando, setEditando] = useState(false);
  const [seleccion, setSeleccion] = useState(partido.resultado_a ?? 'gano');
  const [guardando, setGuardando] = useState(false);

  async function handleGuardar() {
    setGuardando(true);
    try {
      await sobrescribirResultadoGymkana(partido.id, seleccion, INVERSO[seleccion]);
      showToast('Resultado actualizado', 'success');
      setEditando(false);
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo actualizar el resultado', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="glass-row px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm text-slate-300">
          Base {partido.base_id} ·{' '}
          <span style={{ color: partido.equipo_a?.color_hex }}>{partido.equipo_a?.nombre}</span>
          {' vs '}
          <span style={{ color: partido.equipo_b?.color_hex }}>{partido.equipo_b?.nombre}</span>
        </span>

        <div className="flex items-center gap-2">
          {partido.requiere_auditoria && (
            <span className="flex items-center gap-1 text-xs text-red-300">
              <AlertTriangle size={12} /> Alerta
            </span>
          )}
          <span className="text-xs text-slate-500">
            {partido.finalizado ? `${ETIQUETA[partido.resultado_a]} / ${ETIQUETA[partido.resultado_b]}` : 'Pendiente'}
          </span>
          <button onClick={() => setEditando((v) => !v)} className="btn-ghost !px-2">
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {editando && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-slate-500">
            Resultado de <span style={{ color: partido.equipo_a?.color_hex }}>{partido.equipo_a?.nombre}</span> (el
            del rival se calcula solo):
          </p>
          <div className="grid grid-cols-3 gap-2">
            {OPCIONES.map((op) => (
              <button
                key={op.valor}
                onClick={() => setSeleccion(op.valor)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  seleccion === op.valor
                    ? 'border-indigo-400/60 bg-indigo-500/15 text-indigo-200'
                    : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                {op.texto}
              </button>
            ))}
          </div>
          <button onClick={handleGuardar} disabled={guardando} className="btn-primary w-full !py-2 text-sm">
            {guardando && <Loader2 className="animate-spin" size={14} />}
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
