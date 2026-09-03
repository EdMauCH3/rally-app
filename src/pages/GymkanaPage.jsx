import { useEffect, useState, useCallback } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listarEquipos } from '../services/equiposService';
import {
  obtenerEstadoGymkana,
  sellarResultadoGymkana,
  reportarAlertaGymkana,
  suscribirseGymkana,
} from '../services/gymkanaService';
import EquipoSelector from '../components/gymkana/EquipoSelector';
import PartidoGymkanaActual, { MiniProgresoGymkana } from '../components/gymkana/PartidoGymkanaActual';

export default function GymkanaPage() {
  const { perfil, logout } = useAuth();
  const { showToast } = useToast();

  const [equipos, setEquipos] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [estado, setEstado] = useState(null);
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [cargandoEstado, setCargandoEstado] = useState(false);

  useEffect(() => {
    listarEquipos()
      .then(setEquipos)
      .catch(() => showToast('No se pudieron cargar los equipos', 'error'))
      .finally(() => setCargandoEquipos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarEstado = useCallback((equipoId) => {
    setCargandoEstado(true);
    obtenerEstadoGymkana(equipoId)
      .then(setEstado)
      .catch(() => showToast('No se pudo cargar la ruta de este equipo', 'error'))
      .finally(() => setCargandoEstado(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!equipoSeleccionado) return;
    cargarEstado(equipoSeleccionado.id);
    const unsubscribe = suscribirseGymkana(() => cargarEstado(equipoSeleccionado.id));
    return unsubscribe;
  }, [equipoSeleccionado, cargarEstado]);

  async function handleCalificar(partidoId, resultado) {
    try {
      const resultadoRpc = await sellarResultadoGymkana(partidoId, equipoSeleccionado.id, resultado);
      showToast(
        resultadoRpc?.mensaje ?? 'Resultado registrado',
        resultadoRpc?.ya_bloqueado ? 'warning' : 'success'
      );
      cargarEstado(equipoSeleccionado.id);
    } catch (err) {
      showToast(err.message ?? 'Error al registrar el resultado', 'error');
    }
  }

  async function handleReportarAlerta(partidoId) {
    try {
      await reportarAlertaGymkana(partidoId);
      showToast('Alerta enviada al Admin', 'warning');
      cargarEstado(equipoSeleccionado.id);
    } catch (err) {
      showToast(err.message ?? 'No se pudo reportar la alerta', 'error');
    }
  }

  return (
    <div className="min-h-screen pb-10">
      <header className="glass-header px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-white">Staff Gymkana</h1>
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
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-200">
                Ruta — {equipoSeleccionado.nombre}
              </h2>
              {estado && <MiniProgresoGymkana recorrido={estado.recorrido} />}
            </div>

            {cargandoEstado ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-indigo-400" size={28} />
              </div>
            ) : (
              <PartidoGymkanaActual
                equipoId={equipoSeleccionado.id}
                equipoColor={equipoSeleccionado.color_hex}
                rival={estado?.rival}
                estado={estado}
                onCalificar={handleCalificar}
                onReportarAlerta={handleReportarAlerta}
              />
            )}
          </section>
        )}
      </main>
    </div>
  );
}
