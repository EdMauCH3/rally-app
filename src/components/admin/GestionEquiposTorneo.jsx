import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  listarRosterTorneo,
  crearEquipoExclusivoTorneo,
  quitarEquipoDelTorneo,
  suscribirseRosterTorneo,
} from '../../services/torneoService';

const COLOR_DEFAULT = '#733f2d';

export default function GestionEquiposTorneo() {
  const { showToast } = useToast();
  const [roster, setRoster] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);

  const [nombreNuevo, setNombreNuevo] = useState('');
  const [colorNuevo, setColorNuevo] = useState(COLOR_DEFAULT);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(() => {
    listarRosterTorneo()
      .then(setRoster)
      .catch(() => showToast('No se pudo cargar la gestión de equipos del Torneo', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseRosterTorneo(cargar);
    return unsubscribe;
  }, [cargar]);

  async function handleCrearExclusivo(e) {
    e.preventDefault();
    if (!nombreNuevo.trim()) {
      showToast('Ponle un nombre al equipo', 'error');
      return;
    }
    setCreando(true);
    try {
      await crearEquipoExclusivoTorneo(nombreNuevo.trim(), colorNuevo);
      showToast('Equipo exclusivo creado', 'success');
      setNombreNuevo('');
      setColorNuevo(COLOR_DEFAULT);
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo crear el equipo', 'error');
    } finally {
      setCreando(false);
    }
  }

  async function handleEliminarExclusivo(fila) {
    if (!window.confirm(`¿Eliminar "${fila.nombre}" del Torneo?`)) return;
    setProcesandoId(fila.id);
    try {
      await quitarEquipoDelTorneo(fila.id);
      showToast('Equipo exclusivo eliminado', 'success');
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo eliminar', 'error');
    } finally {
      setProcesandoId(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  const exclusivos = roster.filter((r) => r.es_exclusivo);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-card p-4 text-sm text-slate-400">
        Los 4 colores asignados a Torneo (uno por Macro-Equipo) entran aquí automáticamente —
        configúralos desde la pestaña <strong className="text-white">Equipos</strong>. Esta
        sección es solo para equipos exclusivos del Torneo, ajenos a cualquier Macro-Equipo.
      </div>

      <div className="glass-card p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-white">Equipos Exclusivos del Torneo</h2>
          <p className="text-sm text-slate-400 mt-1">
            Solo compiten aquí; sus puntos no afectan el Gran Total del rally.
          </p>
        </div>

        <div className="space-y-2">
          {exclusivos.length === 0 && (
            <p className="text-sm text-slate-500">Aún no hay equipos exclusivos.</p>
          )}
          {exclusivos.map((eq) => (
            <div key={eq.id} className="flex items-center justify-between glass-row px-4 py-3">
              <span className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: eq.color_hex }}
                />
                <span className="font-medium text-white">{eq.nombre}</span>
              </span>
              <button
                onClick={() => handleEliminarExclusivo(eq)}
                disabled={procesandoId === eq.id}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                {procesandoId === eq.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleCrearExclusivo} className="flex items-center gap-2 pt-2">
          <input
            type="color"
            value={colorNuevo}
            onChange={(e) => setColorNuevo(e.target.value)}
            className="w-11 h-11 rounded-lg cursor-pointer shrink-0 bg-transparent"
          />
          <input
            placeholder="Nombre del nuevo equipo"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            className="field"
          />
          <button
            type="submit"
            disabled={creando}
            className="btn-secondary !px-3 shrink-0 disabled:opacity-50"
          >
            {creando ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
