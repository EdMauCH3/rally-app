import { CalendarDays, Loader2, ShieldHalf, Users, History } from 'lucide-react';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import { useTorneoFases } from '../../hooks/useTorneoFases';
import HistorialEventosTorneo from './HistorialEventosTorneo';
import EquiposPorMacro from './torneo/EquiposPorMacro';
import FixtureAdmin from './torneo/FixtureAdmin';
import InscripcionJugadores from '../torneo/InscripcionJugadores';

const VISTAS = [
  { id: 'equipos', label: 'Equipos', icon: ShieldHalf },
  { id: 'plantillas', label: 'Plantillas', icon: Users },
  { id: 'fixture', label: 'Fixture', icon: CalendarDays },
  { id: 'historial', label: 'Historial', icon: History },
];

export default function TorneoAdminTab() {
  const { partidos, tablas, equipos, macros, cargando, error, recargar } = useTorneoFases();
  const [vista, setVista] = useEstadoPersistente('rally_ui_admin_torneo', 'equipos', (v) =>
    VISTAS.some((x) => x.id === v)
  );

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card mx-auto max-w-md space-y-3 p-6 text-center">
        <p className="text-slate-300">No se pudo cargar el torneo.</p>
        <p className="text-xs text-slate-500">
          Si acabas de actualizar la app, verifica que ya ejecutaste el SQL 40 en Supabase.
        </p>
        <button type="button" onClick={recargar} className="btn-secondary mx-auto">
          Reintentar
        </button>
      </div>
    );
  }

  const fixtureGenerado = partidos.length > 0;

  return (
    <div className="space-y-6">
      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
        {VISTAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setVista(id)}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all duration-300 ease-in-out ${
              vista === id
                ? 'border-brand-brown bg-brand-brown/15 text-white'
                : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {vista === 'equipos' && (
        <EquiposPorMacro
          macros={macros}
          equipos={equipos}
          fixtureGenerado={fixtureGenerado}
          onCambio={recargar}
        />
      )}
      {vista === 'plantillas' && <InscripcionJugadores />}
      {vista === 'fixture' && (
        <FixtureAdmin
          macros={macros}
          equipos={equipos}
          partidos={partidos}
          tablas={tablas}
          onCambio={recargar}
        />
      )}
      {vista === 'historial' && <HistorialEventosTorneo modoPro />}
    </div>
  );
}
