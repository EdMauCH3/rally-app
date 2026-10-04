import { useCallback, useEffect, useState } from 'react';
import { Loader2, Shuffle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  listarPartidos,
  generarPartidos,
  finalizarPartido,
  marcarPartidoEnJuego,
  marcarPartidoTerminado,
  listarRosterTorneo,
  suscribirsePartidos,
  suscribirseRosterTorneo,
} from '../services/torneoService';
import PartidoCard from '../components/torneo/PartidoCard';
import { useModoTorneoPro } from '../hooks/useModoTorneoPro';

export default function TorneoPage() {
  const { perfil } = useAuth();
  const { showToast } = useToast();
  const esAdmin = perfil?.rol === 'admin';
  const { modoPro } = useModoTorneoPro();

  const [roster, setRoster] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);

  const cargarTodo = useCallback(() => {
    setCargando(true);
    Promise.all([listarRosterTorneo(), listarPartidos()])
      .then(([r, p]) => {
        setRoster(r);
        setPartidos(p);
      })
      .catch(() => showToast('No se pudo cargar la información del torneo', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarTodo();
    const unsubPartidos = suscribirsePartidos(cargarTodo);
    const unsubRoster = suscribirseRosterTorneo(cargarTodo);
    return () => {
      unsubPartidos();
      unsubRoster();
    };
  }, [cargarTodo]);

  async function handleGenerar() {
    setGenerando(true);
    try {
      await generarPartidos();
      showToast('Partidos generados', 'success');
      cargarTodo();
    } catch (err) {
      showToast(err.message ?? 'No se pudieron generar los partidos', 'error');
    } finally {
      setGenerando(false);
    }
  }

  async function handleFinalizar(partidoId, ganador) {
    try {
      const resultado = await finalizarPartido(partidoId, ganador);
      showToast(
        resultado?.mensaje ?? 'Resultado registrado',
        resultado?.ok === false ? 'warning' : 'success'
      );
      cargarTodo();
    } catch (err) {
      showToast(err.message ?? 'Error al registrar el resultado', 'error');
    }
  }

  async function handleMarcarEnJuego(partidoId) {
    try {
      await marcarPartidoEnJuego(partidoId);
      cargarTodo();
    } catch (err) {
      showToast(err.message ?? 'No se pudo marcar el partido en juego', 'error');
    }
  }

  async function handleMarcarTerminado(partidoId) {
    try {
      await marcarPartidoTerminado(partidoId);
      cargarTodo();
    } catch (err) {
      showToast(err.message ?? 'No se pudo marcar el partido terminado', 'error');
    }
  }

  // El roster (equipos_torneo) es la fuente de verdad para nombre/color,
  // no la tabla general "equipos" (partidos_torneo.equipo_a_id/b_id
  // apuntan a equipos_torneo desde la Fase 1 de la reestructuracion).
  function equipoPorId(id) {
    return roster.find((e) => e.id === id);
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="sr-only">Árbitros del Torneo</h1>

      {cargando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      ) : partidos.length === 0 ? (
        <div className="glass-card text-center space-y-3 p-6">
          <p className="text-slate-400 text-sm">
            Aún no se han generado los partidos del torneo.
          </p>
          {esAdmin ? (
            <button
              onClick={handleGenerar}
              disabled={generando || roster.length < 2}
              className="btn-primary mx-auto disabled:opacity-50"
            >
              {generando ? <Loader2 className="animate-spin" size={18} /> : <Shuffle size={18} />}
              Generar Fixture
            </button>
          ) : (
            <p className="text-xs text-slate-500">Pide al Admin que los genere.</p>
          )}
          {roster.length < 2 && (
            <p className="text-xs text-amber-400">
              Se necesitan al menos 2 equipos en el Torneo (hay {roster.length}). Asígnale un
              color de Torneo a cada Macro-Equipo en Admin → Equipos, o crea equipos exclusivos
              en Admin → Torneo.
            </p>
          )}
        </div>
      ) : modoPro ? (
        <div className="glass-card p-5 text-center space-y-1">
          <p className="font-semibold text-white">Modo Torneo Pro encendido</p>
          <p className="text-sm text-slate-400">
            Hay {partidos.length} partidos generados. Se arbitran desde Panel del Animador →
            Actividades → Torneo → Partidos. El historial y las correcciones están más abajo.
          </p>
        </div>
      ) : (
        partidos.map((p) => (
          <PartidoCard
            key={p.id}
            partido={p}
            equipoA={equipoPorId(p.equipo_a_id)}
            equipoB={equipoPorId(p.equipo_b_id)}
            esAdmin={esAdmin}
            onFinalizar={handleFinalizar}
            onMarcarEnJuego={handleMarcarEnJuego}
            onMarcarTerminado={handleMarcarTerminado}
          />
        ))
      )}
    </main>
  );
}
