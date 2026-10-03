import { useCallback, useEffect, useState } from 'react';
import { Loader2, Flag, Map, Trophy } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  listarEstadoActividades,
  actualizarEstadoActividad,
  suscribirseEstadoActividades,
} from '../../services/estadoActividadesService';

function Switch({ activo, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => onChange(!activo)}
      disabled={disabled}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-all duration-300 ease-in-out disabled:opacity-50 ${
        activo ? 'bg-emerald-600' : 'bg-white/15'
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

const ACTIVIDADES = [
  { id: 'gymkana', label: 'Gymkana', icon: Flag },
  { id: 'tesoro', label: 'Búsqueda del Tesoro', icon: Map },
  { id: 'torneo', label: 'Torneo', icon: Trophy },
];

export default function ControlInicioActividades() {
  const { showToast } = useToast();
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);

  const cargar = useCallback(() => {
    listarEstadoActividades()
      .then(setEstados)
      .catch(() => showToast('No se pudo cargar el estado de las actividades', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseEstadoActividades(cargar);
    return unsubscribe;
  }, [cargar]);

  async function handleToggle(actividad, valor) {
    setGuardandoId(actividad);
    try {
      await actualizarEstadoActividad(actividad, valor);
    } catch (err) {
      showToast(err.message ?? 'No se pudo actualizar', 'error');
    } finally {
      setGuardandoId(null);
    }
  }

  function estadoDe(actividad) {
    return estados.find((e) => e.actividad === actividad)?.iniciada ?? false;
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-white" size={24} />
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-white">Control de Actividades</h2>
        <p className="text-sm text-slate-400 mt-1">
          Mientras una actividad esté apagada, el público ve un letrero de espera en vez del
          contenido.
        </p>
      </div>

      {ACTIVIDADES.map(({ id, label, icon: Icon }) => (
        <div key={id} className="flex items-center justify-between glass-row px-4 py-3">
          <span className="flex items-center gap-2 font-medium text-white">
            <Icon size={18} className="text-emerald-300" /> {label}
          </span>
          <Switch
            activo={estadoDe(id)}
            disabled={guardandoId === id}
            onChange={(v) => handleToggle(id, v)}
          />
        </div>
      ))}
    </div>
  );
}
