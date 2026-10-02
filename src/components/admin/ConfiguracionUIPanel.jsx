import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sun, Moon, CalendarClock, ClipboardCheck, Video } from 'lucide-react';
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

function FilaSwitch({ icono, label, campo, config, guardando, onCambiar }) {
  return (
    <div className="flex items-center justify-between glass-row px-4 py-3">
      <span className="flex items-center gap-2 font-medium text-white">
        {icono} {label}
      </span>
      <Switch
        activo={config[campo]}
        disabled={guardando}
        onChange={(v) => onCambiar(campo, v)}
      />
    </div>
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

      <FilaSwitch
        icono={<Sun size={18} className="text-amber-300" />}
        label="Mañana (Formación)"
        campo="mostrar_manana"
        config={config}
        guardando={guardando}
        onCambiar={handleCambiar}
      />

      <FilaSwitch
        icono={<Moon size={18} className="text-orange-300" />}
        label="Tarde (Actividad)"
        campo="mostrar_tarde"
        config={config}
        guardando={guardando}
        onCambiar={handleCambiar}
      />

      <FilaSwitch
        icono={<CalendarClock size={18} className="text-blue-300" />}
        label="Cronograma"
        campo="mostrar_cronograma"
        config={config}
        guardando={guardando}
        onCambiar={handleCambiar}
      />

      <FilaSwitch
        icono={<ClipboardCheck size={18} className="text-emerald-300" />}
        label="Formulario de Evaluación"
        campo="mostrar_evaluacion"
        config={config}
        guardando={guardando}
        onCambiar={handleCambiar}
      />

      <FilaSwitch
        icono={<Video size={18} className="text-rose-300" />}
        label="Video de Bienvenida (modal automático)"
        campo="mostrar_video_bienvenida"
        config={config}
        guardando={guardando}
        onCambiar={handleCambiar}
      />
    </div>
  );
}
