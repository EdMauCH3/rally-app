import { ClipboardList, Settings2 } from 'lucide-react';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import TorneoAdminTab from '../admin/TorneoAdminTab';
import TorneoModulo from './TorneoModulo';

const VISTAS = [
  { id: 'direccion', label: 'Dirección del torneo', icon: Settings2 },
  { id: 'arbitraje', label: 'Arbitrar partidos', icon: ClipboardList },
];

/**
 * Pantalla del Director Técnico: junta TODO lo que puede hacer el Admin en el torneo
 * (equipos, grupos, etapas, W.O., retiros) con TODO lo del árbitro (planillas de
 * inscripción y partido en vivo: cronómetro, tarjetas, goles, penales y actas).
 */
export default function DirectorTecnicoPanel() {
  const [vista, setVista] = useEstadoPersistente('rally_ui_dt_vista', 'direccion', (v) =>
    VISTAS.some((x) => x.id === v)
  );

  return (
    <div className="space-y-6">
      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2">
        {VISTAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setVista(id)}
            className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3.5 text-sm font-bold transition-all duration-300 ease-in-out ${
              vista === id
                ? 'border-violet-400 bg-violet-500/20 text-white shadow-lg shadow-violet-950/40'
                : 'border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {vista === 'direccion' ? <TorneoAdminTab /> : <TorneoModulo />}
    </div>
  );
}
