import { useCallback, useEffect, useState } from 'react';
import { Loader2, Send, PowerOff, Megaphone, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  enviarNotificacion,
  listarHistorialNotificaciones,
  apagarNotificacionPermanente,
  suscribirseHistorialNotificaciones,
} from '../../services/notificacionesService';

const TIPOS = [
  { valor: 'push', label: 'Push (descartable)', desc: 'El usuario la puede cerrar con una X' },
  { valor: 'permanente', label: 'Permanente (bloqueante)', desc: 'Solo tú la puedes apagar' },
];

export default function NotificacionesAdminPanel() {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [apagandoId, setApagandoId] = useState(null);

  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipo, setTipo] = useState('push');

  const cargar = useCallback(() => {
    listarHistorialNotificaciones()
      .then(setHistorial)
      .catch(() => showToast('No se pudo cargar el historial de notificaciones', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseHistorialNotificaciones(cargar);
    return unsubscribe;
  }, [cargar]);

  const permanenteActiva = historial.find((n) => n.tipo === 'permanente' && n.estado_activa);

  async function handleEnviar(e) {
    e.preventDefault();
    if (!titulo.trim() || !mensaje.trim()) {
      showToast('Completa el título y el mensaje', 'error');
      return;
    }

    setEnviando(true);
    try {
      await enviarNotificacion({
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        tipo,
        creadoPor: session.user.id,
      });
      showToast('Notificación enviada', 'success');
      setTitulo('');
      setMensaje('');
      setTipo('push');
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo enviar la notificación', 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function handleApagar() {
    if (!permanenteActiva) return;
    if (!window.confirm('¿Apagar esta notificación permanente para todos los usuarios?')) return;

    setApagandoId(permanenteActiva.id);
    try {
      await apagarNotificacionPermanente(permanenteActiva.id);
      showToast('Notificación apagada', 'success');
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo apagar', 'error');
    } finally {
      setApagandoId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {permanenteActiva && (
        <button
          onClick={handleApagar}
          disabled={apagandoId === permanenteActiva.id}
          className="btn-danger w-full !py-5 !text-lg animate-pulse disabled:animate-none"
        >
          {apagandoId === permanenteActiva.id ? (
            <Loader2 className="animate-spin" size={22} />
          ) : (
            <PowerOff size={22} />
          )}
          APAGAR NOTIFICACIÓN ACTUAL
        </button>
      )}

      <form onSubmit={handleEnviar} className="glass-card p-5 space-y-4">
        <h2 className="font-semibold text-white">Nueva notificación</h2>

        <div className="space-y-1.5">
          <label className="field-label">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Cambio de horario"
            className="field !text-lg !font-semibold"
          />
        </div>

        <div className="space-y-1.5">
          <label className="field-label">Mensaje</label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribe el mensaje que verán todos los usuarios..."
            rows={4}
            className="field resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="field-label">Tipo</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTipo(t.valor)}
                className={`text-left rounded-xl border-2 p-3 transition-all duration-300 ease-in-out ${
                  tipo === t.valor
                    ? 'border-brand-brown bg-brand-brown/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <span className="block font-semibold text-white text-sm">{t.label}</span>
                <span className="block text-xs text-slate-400 mt-0.5">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={enviando} className="btn-primary w-full !py-3.5">
          {enviando ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          Enviar
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300">Historial</h3>

        {cargando ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        ) : historial.length === 0 ? (
          <p className="text-sm text-slate-500 glass-card p-4">
            Aún no se ha enviado ninguna notificación.
          </p>
        ) : (
          <div className="space-y-2">
            {historial.map((n) => (
              <div key={n.id} className="glass-row px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold text-white text-sm truncate">
                    {n.tipo === 'permanente' ? (
                      <AlertTriangle size={14} className="text-red-300 shrink-0" />
                    ) : (
                      <Megaphone size={14} className="text-amber-200 shrink-0" />
                    )}
                    {n.titulo}
                  </span>
                  {n.tipo === 'permanente' && (
                    <span
                      className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        n.estado_activa
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {n.estado_activa ? 'Activa' : 'Apagada'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{n.mensaje}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={11} />
                  {new Date(n.fecha_creacion).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
