import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import GestionTinajasPistas from './GestionTinajasPistas';
import SupervisionTesoroAdmin from './SupervisionTesoroAdmin';
import TesoroPage from '../../pages/TesoroPage';

const VISTAS = [
  { id: 'pistas', label: 'Pistas y lanzamiento' },
  { id: 'supervision', label: 'Supervisión' },
  { id: 'animador', label: 'Vista del animador' },
];

/**
 * Búsqueda del Tesoro dentro de Animación (Admin):
 *  - Pistas y lanzamiento: escribir las pistas e iniciar la búsqueda.
 *  - Supervisión: avance de cada equipo y recalificación.
 *  - Vista del animador: el mismo flujo guiado, por si el Admin tiene que operarlo.
 */
export default function TesoroAdminModulo() {
  const [vista, setVista] = useEstadoPersistente('rally_ui_admin_tesoro_vista', 'pistas', (v) =>
    VISTAS.some((x) => x.id === v)
  );

  return (
    <div className="space-y-6">
      <div className="mx-auto grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-3">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVista(v.id)}
            className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all duration-300 ease-in-out ${
              vista === v.id
                ? 'border-brand-brown bg-brand-brown/15 text-white'
                : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {vista === 'pistas' && <GestionTinajasPistas />}
      {vista === 'supervision' && <SupervisionTesoroAdmin />}
      {vista === 'animador' && <TesoroPage />}
    </div>
  );
}
