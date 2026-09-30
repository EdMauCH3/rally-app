import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sun, Moon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  obtenerConfiguracionApp,
  actualizarConfiguracionApp,
  suscribirseConfiguracionApp,
} from '../../services/configuracionAppService';

function Switch({ activo, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => onChange(!activo)}
      disabled={disabled}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-all duration-300 ease-in-out disabled:opacity-50 ${
        activo ? 'bg-brand-brown' : 'bg-white/15'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          activo ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function ConfiguracionUIPanel() {
  const { showToast } = useToast();
  const [config, setConfig] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    obtenerConfiguracionApp()
      .then(setConfig)
      .catch(() => showToast('No se pudo cargar la configuración del Main Page', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseConfiguracionApp(cargar);
    return unsubscribe;
  }, [cargar]);

  async function handleCambiar(campo, valor) {
    setGuardando(true);
    setConfig((prev) => ({ ...prev, [campo]: valor })); // actualizacion optimista
    try {
      await actualizarConfiguracionApp({ [campo]: valor });
    } catch (err) {
      showToast(err.message ?? 'No se pudo actualizar', 'error');
      cargar(); // revertir si la escritura falla
    } finally {
      setGuardando(false);
    }
  }

  if (cargando || !config) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  return (
    <div className="glass-card p-5 max-w-md space-y-5">
      <div>
        <h2 className="font-semibold text-white">Botones del Main Page</h2>
        <p className="text-sm text-slate-400 mt-1">
          Enciende o apaga cada botón según lo que esté pasando en el evento.
        </p>
      </div>

      <div className="flex items-center justify-between glass-row px-4 py-3">
        <span className="flex items-center gap-2 font-medium text-white">
          <Sun size={18} className="text-amber-300" /> Mañana (Formación)
        </span>
        <Switch
          activo={config.mostrar_manana}
          disabled={guardando}
          onChange={(v) => handleCambiar('mostrar_manana', v)}
        />
      </div>

      <div className="flex items-center justify-between glass-row px-4 py-3">
        <span className="flex items-center gap-2 font-medium text-white">
          <Moon size={18} className="text-indigo-300" /> Tarde (Actividad)
        </span>
        <Switch
          activo={config.mostrar_tarde}
          disabled={guardando}
          onChange={(v) => handleCambiar('mostrar_tarde', v)}
        />
      </div>
    </div>
  );
}
