import { Radio, RotateCw } from 'lucide-react';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import RadarFormacion from './RadarFormacion';
import RotacionColoresAdmin from '../admin/RotacionColoresAdmin';

const SECCIONES = [
  { id: 'radar', label: 'Radar en vivo', icon: Radio },
  { id: 'control', label: 'Control de la rotación', icon: RotateCw },
];

/**
 * Pestaña "Formación" del Admin: el radar en vivo (qué equipo está en cada
 * base) y, aparte, el control que ya existía para configurar e iniciar la
 * rotación de la mañana.
 */
export default function FormacionAdminTab() {
  const [seccion, setSeccion] = useEstadoPersistente('rally_ui_admin_formacion', 'radar', (v) =>
    SECCIONES.some((s) => s.id === v)
  );

  return (
    <div className="space-y-6">
      <div className="mx-auto grid max-w-xl grid-cols-2 gap-2">
        {SECCIONES.map((s) => {
          const Icon = s.icon;
          const activa = s.id === seccion;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSeccion(s.id)}
              aria-pressed={activa}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all duration-300 ease-in-out ${
                activa
                  ? 'border-brand-brown bg-brand-brown/15 text-white'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              <Icon size={16} /> {s.label}
            </button>
          );
        })}
      </div>

      {seccion === 'radar' ? (
        <RadarFormacion onIrAControl={() => setSeccion('control')} />
      ) : (
        <RotacionColoresAdmin />
      )}
    </div>
  );
}
