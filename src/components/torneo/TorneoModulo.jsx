import { ClipboardList, Loader2, Users } from 'lucide-react';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import { useModoTorneoPro } from '../../hooks/useModoTorneoPro';
import TorneoPage from '../../pages/TorneoPage';
import PartidosPro from './PartidosPro';
import InscripcionJugadores from './InscripcionJugadores';

const VISTAS = [
  { id: 'partidos', label: 'Partidos', icon: ClipboardList },
  { id: 'jugadores', label: 'Jugadores', icon: Users },
];

/**
 * Lo que ve el árbitro dentro de Actividades > Torneo.
 * - Modo Pro apagado: el sistema básico de siempre, sin cambios.
 * - Modo Pro encendido: dos vistas, Partidos y Jugadores.
 */
export default function TorneoModulo() {
  const { modoPro, cargando } = useModoTorneoPro();
  const [vista, setVista] = useEstadoPersistente('rally_ui_torneo_vista', 'partidos', (v) =>
    VISTAS.some((x) => x.id === v)
  );

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  if (!modoPro) return <TorneoPage />;

  return (
    <div className="space-y-4">
      <div className="max-w-2xl mx-auto px-4 grid grid-cols-2 gap-2">
        {VISTAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setVista(id)}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold transition-all duration-300 ease-in-out ${
              vista === id
                ? 'border-brand-brown bg-brand-brown/15 text-white'
                : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {vista === 'partidos' ? <PartidosPro /> : <InscripcionJugadores />}
    </div>
  );
}
