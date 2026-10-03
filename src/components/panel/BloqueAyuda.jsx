import { useState } from 'react';
import { Loader2, Send, LifeBuoy, Phone, MessageSquare, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { enviarAlertaAnimador } from '../../services/alertasAnimadorService';

export default function BloqueAyuda() {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [asunto, setAsunto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim()) {
      showToast('Escribe tu nombre', 'error');
      return;
    }

    setEnviando(true);
    try {
      await enviarAlertaAnimador({
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        asunto: asunto.trim() || null,
        creadoPor: session.user.id,
      });
      setEnviado(true);
      setNombre('');
      setTelefono('');
      setAsunto('');
    } catch (err) {
      showToast(err.message ?? 'No se pudo enviar el aviso', 'error');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-14 animate-fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15 border border-orange-500/30">
          <CheckCircle2 className="text-orange-300" size={30} />
        </div>
        <h2 className="text-xl font-bold text-white">¡Aviso enviado!</h2>
        <p className="text-slate-400 text-sm">El Admin ya lo tiene en su panel.</p>
        <button onClick={() => setEnviado(false)} className="btn-secondary mx-auto">
          Enviar otro aviso
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15 border border-orange-500/30">
          <LifeBuoy className="text-orange-300" size={26} />
        </div>
        <h2 className="text-xl font-black text-white">¿Necesitas ayuda?</h2>
        <p className="text-sm text-slate-400">
          Envía un aviso directo al Admin — le llega a su panel al instante.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border-2 border-orange-500/25 bg-gradient-to-b from-orange-500/[0.08] via-brand-navy/40 to-brand-navy/60 backdrop-blur-xl shadow-2xl shadow-black/50 p-6 space-y-4"
      >
        <div className="space-y-1.5">
          <label className="field-label flex items-center gap-1.5">
            <User size={14} className="text-orange-300" /> Nombre *
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            className="field focus:!border-orange-500/60 focus:!ring-orange-500/25"
          />
        </div>

        <div className="space-y-1.5">
          <label className="field-label flex items-center gap-1.5">
            <Phone size={14} className="text-orange-300" /> Teléfono
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Opcional"
            className="field focus:!border-orange-500/60 focus:!ring-orange-500/25"
          />
        </div>

        <div className="space-y-1.5">
          <label className="field-label flex items-center gap-1.5">
            <MessageSquare size={14} className="text-orange-300" /> Asunto
          </label>
          <textarea
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Opcional: cuéntale al Admin qué pasa"
            rows={3}
            className="field resize-none focus:!border-orange-500/60 focus:!ring-orange-500/25"
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 px-4 py-3.5 font-semibold text-white shadow-xl shadow-orange-950/50 transition-all duration-300 ease-in-out hover:scale-105 hover:from-orange-400 hover:to-orange-600 disabled:opacity-50 disabled:hover:scale-100"
        >
          {enviando ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          Enviar aviso al Admin
        </button>
      </form>
    </div>
  );
}
