import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BloqueComisiones from '../components/panel/BloqueComisiones';
import BloqueActividades from '../components/panel/BloqueActividades';
import BloqueCronograma from '../components/panel/BloqueCronograma';
import BloqueAyuda from '../components/panel/BloqueAyuda';

// Logica de permisos exacta:
// - animador: Comisiones + Ayuda (NO actividades, NO cronograma... espera,
//   cronograma SI lo ve animador, segun lo confirmado). Ve Bloque 1,
//   Cronograma y Bloque 3; NO ve Actividades.
// - staff_gymkana / staff_tesoro / arbitro: Comisiones + Actividades (solo
//   la suya) + Ayuda. NO ven Cronograma (es exclusivo de animador + Admin).
// - admin: ve TODO.
const TODOS_LOS_TABS = [
  {
    id: 'comisiones',
    label: 'Comisiones',
    roles: ['admin', 'animador', 'staff_gymkana', 'staff_tesoro', 'arbitro'],
  },
  {
    id: 'actividades',
    label: 'Actividades',
    roles: ['admin', 'staff_gymkana', 'staff_tesoro', 'arbitro'],
  },
  {
    id: 'cronograma',
    label: 'Cronograma',
    roles: ['admin', 'animador'],
  },
  {
    id: 'ayuda',
    label: 'Ayuda',
    roles: ['admin', 'animador', 'staff_gymkana', 'staff_tesoro', 'arbitro'],
  },
];

export default function PanelAnimadorPage() {
  const { perfil } = useAuth();
  const tabsVisibles = TODOS_LOS_TABS.filter((t) => t.roles.includes(perfil?.rol));

  const [tabSeleccionado, setTabSeleccionado] = useState(null);
  const tabActivo = tabsVisibles.some((t) => t.id === tabSeleccionado)
    ? tabSeleccionado
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

      <main className="max-w-3xl mx-auto px-4 py-6">
        {tabActivo === 'comisiones' && <BloqueComisiones />}
        {tabActivo === 'actividades' && <BloqueActividades rol={perfil?.rol} />}
        {tabActivo === 'cronograma' && <BloqueCronograma />}
        {tabActivo === 'ayuda' && <BloqueAyuda />}
      </main>
    </>
  );
}
