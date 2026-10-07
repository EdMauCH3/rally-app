import { useAuth } from '../context/AuthContext';
import { useEstadoPersistente } from '../hooks/useEstadoPersistente';
import BloqueComisiones from '../components/panel/BloqueComisiones';
import BloqueActividades from '../components/panel/BloqueActividades';
import BloqueCronograma from '../components/panel/BloqueCronograma';
import BloqueAyuda from '../components/panel/BloqueAyuda';
import FormacionPanel from '../components/formacion/FormacionPanel';

// Permisos de pestañas:
// - Comisiones, Cronograma y Ayuda: TODO el staff (admin, animador,
//   staff_gymkana, staff_tesoro, arbitro y formacion).
// - Actividades: todos menos el animador, y cada rol ve SOLO la suya
//   (ver BloqueActividades); el Admin ve las tres.
// - Formación: solo el rol `formacion` (y el Admin). El formador ve además
//   Comisiones, Cronograma y Ayuda, pero NO Actividades (sin módulos competitivos).
const TODOS_LOS_TABS = [
  {
    id: 'comisiones',
    label: 'Comisiones',
    roles: ['admin', 'animador', 'staff_gymkana', 'staff_tesoro', 'arbitro', 'formacion'],
  },
  {
    id: 'actividades',
    label: 'Actividades',
    roles: ['admin', 'staff_gymkana', 'staff_tesoro', 'arbitro'],
  },
  {
    id: 'formacion',
    label: 'Formación',
    roles: ['admin', 'formacion'],
  },
  {
    id: 'cronograma',
    label: 'Cronograma',
    roles: ['admin', 'animador', 'staff_gymkana', 'staff_tesoro', 'arbitro', 'formacion'],
  },
  {
    id: 'ayuda',
    label: 'Ayuda',
    roles: ['admin', 'animador', 'staff_gymkana', 'staff_tesoro', 'arbitro', 'formacion'],
  },
];

export default function PanelAnimadorPage() {
  const { perfil } = useAuth();
  const tabsVisibles = TODOS_LOS_TABS.filter((t) => t.roles.includes(perfil?.rol));

  const [tabSeleccionado, setTabSeleccionado] = useEstadoPersistente('rally_ui_panel_tab', null);
  const tabActivo = tabsVisibles.some((t) => t.id === tabSeleccionado)
    ? tabSeleccionado
    : perfil?.rol === 'formacion'
      ? 'formacion' // el formador abre directo en su pestaña
      : tabsVisibles[0]?.id;

  return (
    <>
      <h1 className="sr-only">Panel del Animador</h1>

      <nav className="sticky top-[112px] sm:top-[136px] z-10 border-b border-white/10 bg-brand-navy/70 backdrop-blur-xl shadow-xl shadow-black/30 transition-all duration-300 overflow-x-auto">
        <div className="flex px-4 gap-1">
          {tabsVisibles.map((t) => (
            <button
              key={t.id}
              onClick={() => setTabSeleccionado(t.id)}
              className={`tab-pill ${
                tabActivo === t.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
              {tabActivo === t.id && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-brown" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-4 py-6">
        {tabActivo === 'comisiones' && <BloqueComisiones />}
        {tabActivo === 'actividades' && <BloqueActividades rol={perfil?.rol} />}
        {tabActivo === 'formacion' && <FormacionPanel />}
        {tabActivo === 'cronograma' && <BloqueCronograma />}
        {tabActivo === 'ayuda' && <BloqueAyuda />}
      </main>
    </>
  );
}
