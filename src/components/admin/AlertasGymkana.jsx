import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { sobrescribirResultadoGymkana } from '../../services/adminService';

const OPCIONES = [
  { valor: 'gano', texto: 'Ganó' },
  { valor: 'empato', texto: 'Empató' },
  { valor: 'perdio', texto: 'Perdió' },
];

export default function AlertasGymkana({ alertas, onCambio }) {
  const { showToast } = useToast();
  const [resolviendoId, setResolviendoId] = useState(null);
  const [seleccion, setSeleccion] = useState({});

  function elegir(alertaId, lado, valor) {
    setSeleccion((prev) => ({
      ...prev,
      [alertaId]: { ...prev[alertaId], [lado]: valor },
    }));
  }

  async function handleResolver(alerta) {
    const sel = seleccion[alerta.id] ?? {};
    const resultadoA = sel.a ?? alerta.resultado_a ?? 'gano';
    const resultadoB = sel.b ?? alerta.resultado_b ?? 'perdio';

    setResolviendoId(alerta.id);
    try {
      await sobrescribirResultadoGymkana(alerta.id, resultadoA, resultadoB);
      showToast('Resultado sobrescrito', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo sobrescribir el resultado', 'error');
    } finally {
      setResolviendoId(null);
    }
  }

  if (alertas.length === 0) {
    return (
      <p className="text-sm text-slate-400 glass-card p-4">
        No hay alertas registradas en Gymkana. 🎉
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {alertas.map((a) => {
        const sel = seleccion[a.id] ?? {};
        const pendiente = a.requiere_auditoria;
        return (
          <div
            key={a.id}
            className={`rounded-2xl border backdrop-blur-xl p-4 space-y-3 ${
              pendiente
                ? 'border-red-500/25 bg-red-500/[0.05]'
                : 'border-emerald-500/20 bg-emerald-500/[0.04]'
            }`}
          >
            <div
              className={`flex items-center justify-between gap-2 text-sm font-semibold ${
                pendiente ? 'text-red-300' : 'text-emerald-300'
              }`}
            >
              <span className="flex items-center gap-2">
                {pendiente ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                Base {a.base_id} — {a.equipo_a?.nombre} vs {a.equipo_b?.nombre}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  pendiente
                    ? 'bg-red-500/15 text-red-300'
                    : 'bg-emerald-500/15 text-emerald-300'
                }`}
              >
                {pendiente ? 'Pendiente' : 'Resuelta'}
              </span>
            </div>

            {[
              { equipo: a.equipo_a, lado: 'a', actual: a.resultado_a },
              { equipo: a.equipo_b, lado: 'b', actual: a.resultado_b },
            ].map(({ equipo, lado, actual }) => (
              <div key={lado} className="space-y-1.5">
                <p className="text-xs text-slate-400">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                    style={{ backgroundColor: equipo?.color_hex }}
                  />
                  {equipo?.nombre} — resultado actual: {actual ?? 'sin definir'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {OPCIONES.map((op) => (
                    <button
                      key={op.valor}
                      onClick={() => elegir(a.id, lado, op.valor)}
                      className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        (sel[lado] ?? actual) === op.valor
                          ? 'border-indigo-400/60 bg-indigo-500/15 text-indigo-200'
                          : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {op.texto}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => handleResolver(a)}
              disabled={resolviendoId === a.id}
              className="btn-primary w-full"
            >
              {resolviendoId === a.id && <Loader2 className="animate-spin" size={16} />}
              {pendiente ? 'Confirmar resultado final' : 'Corregir de nuevo'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
