import { CalendarDays, History, Layers, ListChecks, Loader2, ShieldHalf } from 'lucide-react';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import { useTorneoFases } from '../../hooks/useTorneoFases';
import HistorialEventosTorneo from './HistorialEventosTorneo';
import EquiposPorMacro from './torneo/EquiposPorMacro';
import GruposAdmin from './torneo/GruposAdmin';
import EtapasAdmin from './torneo/EtapasAdmin';
import CalendarioAdmin from './torneo/CalendarioAdmin';

const VISTAS = [
  { id: 'equipos', label: 'Equipos', icon: ShieldHalf },
  { id: 'grupos', label: 'Grupos', icon: Layers },
  { id: 'etapas', label: 'Etapas', icon: ListChecks },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays },
  { id: 'historial', label: 'Historial', icon: History },
];

/**
 * Gestión completa del torneo (Admin y Director Técnico):
 * Equipos → Grupos → Etapas (formato, vista previa, confirmar) → Calendario (W.O., retiros) → Historial.
 */
export default function TorneoAdminTab() {
  const { partidos, borradores, tablas, equipos, macros, etapas, jugadores, cargando, error, recargar } = useTorneoFases({
    detalle: true,
  });
  const [vista, setVista] = useEstadoPersistente('rally_ui_admin_torneo', 'equipos', (v) => VISTAS.some((x) => x.id === v));

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
        <p className="text-xs text-slate-500">Si acabas de actualizar la app, verifica que ya ejecutaste los SQL 44 y 45 en Supabase.</p>
        <button type="button" onClick={recargar} className="btn-secondary mx-auto">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Gestión del torneo">
        {VISTAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={vista === id}
            onClick={() => setVista(id)}
            className={`flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out ${
              vista === id
                ? 'border-brand-brown bg-brand-brown/15 text-white'
                : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {vista === 'equipos' && (
        <EquiposPorMacro macros={macros} equipos={equipos} jugadores={jugadores} partidos={partidos} onCambio={recargar} />
      )}
      {vista === 'grupos' && <GruposAdmin equipos={equipos} partidos={partidos} borradores={borradores} onCambio={recargar} />}
      {vista === 'etapas' && (
        <EtapasAdmin equipos={equipos} partidos={partidos} borradores={borradores} etapas={etapas} onCambio={recargar} />
      )}
      {vista === 'calendario' && <CalendarioAdmin equipos={equipos} partidos={partidos} tablas={tablas} onCambio={recargar} />}
      {vista === 'historial' && <HistorialEventosTorneo modoPro />}
    </div>
  );
}
