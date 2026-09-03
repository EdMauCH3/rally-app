import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { crearAjuste } from '../../services/adminService';

export default function AjustesForm({ equipos, historial, onCambio }) {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [equipoId, setEquipoId] = useState('');
  const [puntos, setPuntos] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!equipoId || !motivo.trim() || puntos === '') {
      showToast('Completa equipo, puntos y motivo', 'error');
      return;
    }
    setGuardando(true);
    try {
      await crearAjuste(equipoId, Number(puntos), motivo.trim(), session.user.id);
      showToast('Ajuste registrado', 'success');
      setPuntos('');
      setMotivo('');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo registrar el ajuste', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass-card p-4 space-y-3">
        <h2 className="font-semibold text-slate-200">Nuevo ajuste manual</h2>

        <select
          value={equipoId}
          onChange={(e) => setEquipoId(e.target.value)}
          className="field [&>option]:bg-slate-900"
        >
          <option value="">Selecciona un equipo</option>
          {equipos.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.nombre}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={puntos}
          onChange={(e) => setPuntos(e.target.value)}
          placeholder="Puntos (positivo o negativo, ej: -2 o 5)"
          className="field"
        />

        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo del ajuste"
          rows={2}
          className="field resize-none"
        />

        <button type="submit" disabled={guardando} className="btn-primary px-4">
          {guardando && <Loader2 className="animate-spin" size={18} />}
          Registrar ajuste
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="font-semibold text-slate-200 text-sm">Historial de ajustes</h3>
        {historial.length === 0 ? (
          <p className="text-sm text-slate-400">Aún no hay ajustes registrados.</p>
        ) : (
          <div className="space-y-2">
            {historial.map((a) => (
              <div key={a.id} className="glass-row p-3 text-sm flex justify-between">
                <div>
                  <span className="font-medium" style={{ color: a.equipos?.color_hex }}>
                    {a.equipos?.nombre}
                  </span>
                  <p className="text-slate-400">{a.motivo}</p>
                </div>
                <span className={`font-bold ${a.puntos_extra >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {a.puntos_extra >= 0 ? '+' : ''}
                  {a.puntos_extra}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
