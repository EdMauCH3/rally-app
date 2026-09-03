import { useState } from 'react';
import { Shuffle, Loader2, MapPin } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { iniciarGymkana } from '../../services/adminService';
import PartidoGymkanaRow from './PartidoGymkanaRow';

export default function IniciarGymkanaPanel({ equipos, rutas, partidos, gymkanaIniciada, onCambio }) {
  const { showToast } = useToast();
  const [iniciando, setIniciando] = useState(false);

  async function handleIniciar() {
    setIniciando(true);
    try {
      await iniciarGymkana(equipos);
      showToast('Gymkana iniciada: parejas y rutas generadas', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo iniciar la Gymkana', 'error');
    } finally {
      setIniciando(false);
    }
  }

  if (!gymkanaIniciada) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10 text-violet-300">
          <Shuffle size={22} />
        </div>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Aún no se ha iniciado la Gymkana. Al presionar el botón se sortean 2 parejas fijas
          entre los 4 equipos y se asigna a cada una un recorrido de 6 bases que no se cruza.
        </p>
        <button
          onClick={handleIniciar}
          disabled={iniciando || equipos.length !== 4}
          className="btn-primary mx-auto"
        >
          {iniciando ? <Loader2 className="animate-spin" size={18} /> : <Shuffle size={18} />}
          Iniciar Gymkana
        </button>
        {equipos.length !== 4 && (
          <p className="text-xs text-amber-300">
            Se necesitan exactamente 4 equipos creados (hay {equipos.length}).
          </p>
        )}
      </div>
    );
  }

  const parejas = [1, 2].map((num) => rutas.filter((r) => r.pareja_num === num));
  const parejaPorEquipo = new Map(rutas.map((r) => [r.equipo_id, r.pareja_num]));

  return (
    <div className="space-y-3">
      {parejas.map((pareja, i) => {
        const parejaNum = i + 1;
        const partidosPareja = (partidos ?? []).filter(
          (p) => parejaPorEquipo.get(p.equipo_a?.id) === parejaNum
        );

        return (
          <div key={i} className="glass-card p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Pareja {parejaNum}
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100 flex-wrap">
              {pareja.map((r, idx) => (
                <span key={r.equipo_id} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: r.equipo?.color_hex, boxShadow: `0 0 8px ${r.equipo?.color_hex}` }}
                  />
                  {r.equipo?.nombre}
                  {idx === 0 && <span className="text-slate-600 font-normal px-1">vs</span>}
                </span>
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={12} />
              {pareja[0]?.orden_bases.map((b, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <span className="text-slate-700">→</span>}
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-white/[0.06] border border-white/10 text-slate-300">
                    {b}
                  </span>
                </span>
              ))}
            </p>

            {partidosPareja.length > 0 && (
              <div className="space-y-2 pt-1">
                {partidosPareja.map((p) => (
                  <PartidoGymkanaRow key={p.id} partido={p} onCambio={onCambio} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
