import { useEffect, useState, useCallback } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listarEquipos } from '../services/equiposService';
import {
  BASES_TESORO,
  obtenerPuntuacionesTesoro,
  marcarLlegadaTesoro,
  calificarBaseTesoro,
  suscribirseTesoro,
} from '../services/tesoroService';
import EquipoSelector from '../components/gymkana/EquipoSelector';
import ProgresoTesoro from '../components/tesoro/ProgresoTesoro';
import BaseTesoroCard from '../components/tesoro/BaseTesoroCard';

export default function TesoroPage() {
  const { perfil, logout } = useAuth();
  const { showToast } = useToast();

  const [equipos, setEquipos] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);

  useEffect(() => {
    listarEquipos()
      .then(setEquipos)
      .catch(() => showToast('No se pudieron cargar los equipos', 'error'))
      .finally(() => setCargandoEquipos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarRegistros = useCallback((equipoId) => {
    setCargandoRegistros(true);
    obtenerPuntuacionesTesoro(equipoId)
      .then(setRegistros)
      .catch(() => showToast('No se pudieron cargar las bases', 'error'))
      .finally(() => setCargandoRegistros(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!equipoSeleccionado) return;
    cargarRegistros(equipoSeleccionado.id);
    const unsubscribe = suscribirseTesoro(equipoSeleccionado.id, () =>
      cargarRegistros(equipoSeleccionado.id)
    );
    return unsubscribe;
  }, [equipoSeleccionado, cargarRegistros]);

  async function handleMarcarLlegada(baseId) {
    try {
      const resultado = await marcarLlegadaTesoro(equipoSeleccionado.id, baseId);
      showToast(resultado?.mensaje ?? 'Llegada registrada', resultado?.ok ? 'success' : 'warning');
      cargarRegistros(equipoSeleccionado.id);
    } catch (err) {
      showToast(err.message ?? 'Error al registrar la llegada', 'error');
    }
  }

  async function handleCalificar(baseId, puntos) {
    try {
      const resultado = await calificarBaseTesoro(equipoSeleccionado.id, baseId, puntos);
      showToast(resultado?.mensaje ?? 'Calificación registrada', resultado?.ok ? 'success' : 'warning');
      cargarRegistros(equipoSeleccionado.id);
    } catch (err) {
      showToast(err.message ?? 'Error al calificar la base', 'error');
    }
  }

  function registroDeBase(baseId) {
    return registros.find((r) => r.base_id === baseId) ?? null;
  }

  const completadas = registros.filter((r) => r.puntos_evaluacion != null).length;

  return (
    <div className="min-h-screen pb-10">
      <header className="glass-header px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-white">Staff Búsqueda del Tesoro</h1>
          <p className="text-xs text-slate-400">{perfil?.nombre}</p>
        </div>
        <button onClick={logout} className="btn-ghost hover:!text-red-400">
          <LogOut size={16} /> Salir
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {cargandoEquipos ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-indigo-400" size={28} />
          </div>
        ) : (
          <EquipoSelector
            equipos={equipos}
            equipoSeleccionado={equipoSeleccionado}
            onSeleccionar={setEquipoSeleccionado}
          />
        )}

        {equipoSeleccionado && (
          <section className="space-y-3">
            <h2 className="font-semibold text-slate-200">
              Bases — {equipoSeleccionado.nombre}
            </h2>

            {!cargandoRegistros && (
              <ProgresoTesoro completadas={completadas} total={BASES_TESORO.length} />
            )}

            {cargandoRegistros ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-indigo-400" size={28} />
              </div>
            ) : (
              BASES_TESORO.map((baseId) => (
                <BaseTesoroCard
                  key={baseId}
                  baseId={baseId}
                  registro={registroDeBase(baseId)}
                  equipoColor={equipoSeleccionado.color_hex}
                  onMarcarLlegada={handleMarcarLlegada}
                  onCalificar={handleCalificar}
                />
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
