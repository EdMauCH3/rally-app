import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  obtenerConfiguracion,
  listarBases,
  listarEquipos,
  suscribirseColores,
} from '../../services/coloresService';
import ConfiguracionRotacion from './ConfiguracionRotacion';
import EjecucionRotacion from './EjecucionRotacion';

export default function RotacionColoresAdmin() {
  const { showToast } = useToast();
  const [cargando, setCargando] = useState(true);
  const [config, setConfig] = useState(null);
  const [bases, setBases] = useState([]);
  const [equipos, setEquipos] = useState([]);

  const cargarTodo = useCallback(() => {
    Promise.all([obtenerConfiguracion(), listarBases(), listarEquipos()])
      .then(([c, b, e]) => {
        setConfig(c);
        setBases(b);
        setEquipos(e);
      })
      .catch(() => showToast('No se pudo cargar la Rotación de Colores', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarTodo();
    const unsubscribe = suscribirseColores(cargarTodo);
    return unsubscribe;
  }, [cargarTodo]);

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  if (config?.estado === 'esperando') {
    return (
      <ConfiguracionRotacion
        config={config}
        bases={bases}
        equipos={equipos}
        onListo={cargarTodo}
      />
    );
  }

  return (
    <EjecucionRotacion config={config} bases={bases} equipos={equipos} onCambio={cargarTodo} />
  );
}
