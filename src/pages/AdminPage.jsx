import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { listarEquipos } from '../services/equiposService';
import {
  obtenerMarcadorGeneral,
  listarAjustes,
  gymkanaEstaIniciada,
  listarRutasGymkana,
  listarPartidosGymkana,
  listarAlertasGymkana,
} from '../services/adminService';
import TablaMarcador from '../components/admin/TablaMarcador';
import EquiposCRUD from '../components/admin/EquiposCRUD';
import AjustesForm from '../components/admin/AjustesForm';
import IniciarGymkanaPanel from '../components/admin/IniciarGymkanaPanel';
import AlertasGymkana from '../components/admin/AlertasGymkana';
import ReiniciarEvento from '../components/admin/ReiniciarEvento';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'ajustes', label: 'Ajustes' },
  { id: 'gymkana', label: 'Gymkana' },
  { id: 'alertas', label: 'Alertas' },
  { id: 'peligro', label: 'Reiniciar' },
];

export default function AdminPage() {
  const { showToast } = useToast();

  const [tab, setTab] = useState('resumen');
  const [cargando, setCargando] = useState(true);
  const [marcador, setMarcador] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [gymkanaIniciada, setGymkanaIniciada] = useState(false);
  const [rutasGymkana, setRutasGymkana] = useState([]);
  const [partidosGymkana, setPartidosGymkana] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const cargarTodo = useCallback(async () => {
    setCargando(true);

    const [m, e, a, iniciada, alertasData] = await Promise.allSettled([
      obtenerMarcadorGeneral(),
      listarEquipos(),
      listarAjustes(),
      gymkanaEstaIniciada(),
      listarAlertasGymkana(),
    ]);

    if (m.status === 'fulfilled') setMarcador(m.value);
    if (e.status === 'fulfilled') setEquipos(e.value);
    if (a.status === 'fulfilled') setAjustes(a.value);
    if (alertasData.status === 'fulfilled') setAlertas(alertasData.value);

    if (iniciada.status === 'fulfilled') {
      setGymkanaIniciada(iniciada.value);
      if (iniciada.value) {
        try {
          const [rutasData, partidosData] = await Promise.all([
            listarRutasGymkana(),
            listarPartidosGymkana(),
          ]);
          setRutasGymkana(rutasData);
          setPartidosGymkana(partidosData);
        } catch {
          showToast('No se pudieron cargar las rutas de Gymkana', 'error');
        }
      } else {
        setRutasGymkana([]);
        setPartidosGymkana([]);
      }
    }

    const fallidas = [m, e, a, iniciada, alertasData].filter((r) => r.status === 'rejected');
    if (fallidas.length > 0) {
      console.error('Fallos al cargar Admin:', fallidas.map((r) => r.reason));
      const esGymkanaFaltante = fallidas.some((r) =>
        ['42703', 'PGRST205', '42P01'].includes(r.reason?.code)
      );
      showToast(
        esGymkanaFaltante
          ? 'Falta correr el SQL de Gymkana en Supabase (rutas_gymkana / puntuaciones_gymkana)'
          : 'No se pudo cargar parte de la información del Admin',
        'error'
      );
    }

    setCargando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const alertasPendientes = alertas.filter((a) => a.requiere_auditoria).length;

  return (
    <>
      <h1 className="sr-only">Admin</h1>

      <nav className="sticky top-[112px] sm:top-[136px] z-10 border-b border-white/10 bg-brand-navy/70 backdrop-blur-xl shadow-xl shadow-black/30 transition-all duration-300 overflow-x-auto">
        <div className="flex px-4 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-pill ${
                tab === t.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
              {t.id === 'alertas' && alertasPendientes > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-red-500 text-white rounded-full">
                  {alertasPendientes}
                </span>
              )}
              {tab === t.id && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-brown" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {cargando ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-indigo-400" size={28} />
          </div>
        ) : (
          <>
            {tab === 'resumen' && <TablaMarcador equipos={marcador} />}
            {tab === 'equipos' && <EquiposCRUD equipos={equipos} onCambio={cargarTodo} />}
            {tab === 'ajustes' && (
              <AjustesForm equipos={equipos} historial={ajustes} onCambio={cargarTodo} />
            )}
            {tab === 'gymkana' && (
              <IniciarGymkanaPanel
                equipos={equipos}
                rutas={rutasGymkana}
                partidos={partidosGymkana}
                gymkanaIniciada={gymkanaIniciada}
                onCambio={cargarTodo}
              />
            )}
            {tab === 'alertas' && <AlertasGymkana alertas={alertas} onCambio={cargarTodo} />}
            {tab === 'peligro' && <ReiniciarEvento onCambio={cargarTodo} />}
          </>
        )}
      </main>
    </>
  );
}
