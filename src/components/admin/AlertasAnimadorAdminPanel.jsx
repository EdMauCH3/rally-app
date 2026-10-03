import { useCallback, useEffect, useState } from 'react';
import { Loader2, Phone, MessageSquare, CheckCircle2, Clock, User } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  listarAlertasAnimador,
  marcarAlertaAtendida,
  suscribirseAlertasAnimador,
} from '../../services/alertasAnimadorService';

export default function AlertasAnimadorAdminPanel() {
  const { showToast } = useToast();
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargar = useCallback(() => {
    listarAlertasAnimador()
      .then(setAlertas)
      .catch(() => showToast('No se pudieron cargar las alertas', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseAlertasAnimador(cargar);
    return unsubscribe;
  }, [cargar]);

  async function handleAtender(id) {
    setProcesandoId(id);
    try {
      await marcarAlertaAtendida(id);
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo marcar como atendida', 'error');
    } finally {
      setProcesandoId(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  const pendientes = alertas.filter((a) => !a.atendida);
  const atendidas = alertas.filter((a) => a.atendida);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-semibold text-white">Alertas de Animadores</h2>
        <p className="text-sm text-slate-400 mt-1">
          Avisos enviados por el staff desde el Bloque Ayuda del Panel del Animador.
        </p>
      </div>

      {pendientes.length === 0 ? (
        <p className="text-sm text-slate-500 glass-card p-4">No hay alertas pendientes. 🎉</p>
      ) : (
        <div className="space-y-2">
          {pendientes.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border-2 border-orange-500/25 bg-orange-500/[0.05] p-4 space-y-2"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2 font-semibold text-white">
                  <User size={14} className="text-orange-300" /> {a.nombre}
                </span>
                <button
                  onClick={() => handleAtender(a.id)}
                  disabled={procesandoId === a.id}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors duration-300 disabled:opacity-50"
                >
                  {procesandoId === a.id ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Marcar atendida
                </button>
              </div>

              {a.telefono && (
                <p className="flex items-center gap-1.5 text-sm text-slate-300">
                  <Phone size={13} /> {a.telefono}
                </p>
              )}

              {a.asunto && (
                <p className="flex items-start gap-1.5 text-sm text-slate-300">
                  <MessageSquare size={13} className="mt-0.5 shrink-0" />
                  <span>{a.asunto}</span>
                </p>
              )}

              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={11} /> {new Date(a.fecha_creacion).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {atendidas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400">Atendidas</h3>
          {atendidas.map((a) => (
            <div
              key={a.id}
              className="glass-row px-4 py-3 flex items-center justify-between opacity-70"
            >
              <span className="text-sm text-slate-300">{a.nombre}</span>
              <span className="text-xs text-slate-500">
                {new Date(a.fecha_creacion).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
