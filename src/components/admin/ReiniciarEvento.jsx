import { useState } from 'react';
import { AlertOctagon, Loader2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { reiniciarEvento } from '../../services/adminService';

export default function ReiniciarEvento({ onCambio }) {
  const { showToast } = useToast();
  const [paso, setPaso] = useState(0); // 0 = cerrado, 1 = primera confirmacion, 2 = segunda confirmacion
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [procesando, setProcesando] = useState(false);

  function cerrar() {
    setPaso(0);
    setTextoConfirmacion('');
  }

  async function handleConfirmarFinal() {
    setProcesando(true);
    try {
      await reiniciarEvento();
      showToast('Evento reiniciado. Puntuaciones y partidos borrados.', 'success');
      cerrar();
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo reiniciar el evento', 'error');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] backdrop-blur-xl p-5 space-y-3">
      <div className="flex items-center gap-2 text-red-300 font-bold">
        <AlertOctagon size={20} />
        Zona de peligro
      </div>
      <p className="text-sm text-red-300/80">
        Reiniciar el evento borra TODAS las puntuaciones de Gymkana, Tesoro y los partidos del
        Torneo. Los equipos, usuarios y el historial de ajustes manuales se conservan.
      </p>
      <button onClick={() => setPaso(1)} className="btn-danger !px-4 !py-2 text-sm">
        Reiniciar Evento
      </button>

      {paso > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="glass-card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-red-300">
                {paso === 1 ? '¿Reiniciar el evento?' : 'Última confirmación'}
              </h3>
              <button onClick={cerrar} className="text-slate-500 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            {paso === 1 && (
              <>
                <p className="text-sm text-slate-400">
                  Esta acción es irreversible. Se borrarán todas las puntuaciones y partidos
                  registrados hasta ahora.
                </p>
                <button onClick={() => setPaso(2)} className="btn-danger w-full">
                  Sí, entiendo, continuar
                </button>
              </>
            )}

            {paso === 2 && (
              <>
                <p className="text-sm text-slate-400">
                  Escribe <span className="font-mono font-bold text-slate-200">REINICIAR</span> para confirmar
                  definitivamente.
                </p>
                <input
                  value={textoConfirmacion}
                  onChange={(e) => setTextoConfirmacion(e.target.value)}
                  className="field font-mono"
                  placeholder="REINICIAR"
                />
                <button
                  onClick={handleConfirmarFinal}
                  disabled={textoConfirmacion !== 'REINICIAR' || procesando}
                  className="btn-danger w-full"
                >
                  {procesando && <Loader2 className="animate-spin" size={18} />}
                  Reiniciar definitivamente
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
