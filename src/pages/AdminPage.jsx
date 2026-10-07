import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useEstadoPersistente } from '../hooks/useEstadoPersistente';
import { listarEquipos } from '../services/equiposService';
import {
  obtenerMarcadorGeneral,
  listarAjustes,
  gymkanaEstaIniciada,
  listarRutasGymkana,
  listarPartidosGymkana,
  listarAlertasGymkana,
  suscribirseAlertasGymkana,
} from '../services/adminService';
import {
  listarAlertasAnimador,
  suscribirseAlertasAnimador,
} from '../services/alertasAnimadorService';
import { listarSubEquiposColorPorActividad } from '../services/subEquiposColorService';
import ConfiguracionUIPanel from '../components/admin/ConfiguracionUIPanel';
import EquiposCRUD from '../components/admin/EquiposCRUD';
import GestionSubEquiposColor from '../components/admin/GestionSubEquiposColor';
import ControlInicioActividades from '../components/admin/ControlInicioActividades';
import FormacionAdminTab from '../components/formacion/FormacionAdminTab';
import AnimacionAdminTab from '../components/admin/AnimacionAdminTab';
import NotificacionesAdminPanel from '../components/admin/NotificacionesAdminPanel';
import AlertasAnimadorAdminPanel from '../components/admin/AlertasAnimadorAdminPanel';
import ReiniciarEvento from '../components/admin/ReiniciarEvento';

// Barra superior del Admin. "Reiniciar" es destructiva: se dibuja como botón
// rojo aparte, no como una pestaña más, para que nadie la toque sin querer.
const TABS = [
  { id: 'main', label: 'Main Page' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'formacion', label: 'Formación' },
  { id: 'animacion', label: 'Animación' },
  { id: 'notificaciones', label: 'Notificaciones' },
  { id: 'alertas', label: 'Alertas' },
  { id: 'peligro', label: 'Reiniciar', destructiva: true },
];

export default function AdminPage() {
  const { showToast } = useToast();

  const [tab, setTab] = useEstadoPersistente('rally_ui_admin_tab', 'animacion', (v) =>
    TABS.some((t) => t.id === v)
  );
  const [cargando, setCargando] = useState(true);
  const [marcador, setMarcador] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [gymkanaIniciada, setGymkanaIniciada] = useState(false);
  const [rutasGymkana, setRutasGymkana] = useState([]);
  const [partidosGymkana, setPartidosGymkana] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [alertasAnimador, setAlertasAnimador] = useState([]);
  const [coloresGymkana, setColoresGymkana] = useState([]);

  // `silencioso`: recarga los datos SIN mostrar el spinner ni desmontar la
  // pantalla. Solo la primera carga muestra el spinner; si no, cada aviso en
  // tiempo real (una alerta nueva, un cambio de datos) le borraría al Admin lo
  // que estuviera haciendo.
  const cargarTodo = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!silencioso) setCargando(true);

      const [m, e, a, iniciada, alertasData, alertasAnimadorData, coloresGymkanaData] =
        await Promise.allSettled([
          obtenerMarcadorGeneral(),
          listarEquipos(),
          listarAjustes(),
          gymkanaEstaIniciada(),
          listarAlertasGymkana(),
          listarAlertasAnimador(),
          listarSubEquiposColorPorActividad('gymkana'),
        ]);

      if (m.status === 'fulfilled') setMarcador(m.value);
      if (e.status === 'fulfilled') setEquipos(e.value);
      if (a.status === 'fulfilled') setAjustes(a.value);
      if (alertasData.status === 'fulfilled') setAlertas(alertasData.value);
      if (alertasAnimadorData.status === 'fulfilled') setAlertasAnimador(alertasAnimadorData.value);
      if (coloresGymkanaData.status === 'fulfilled') setColoresGymkana(coloresGymkanaData.value);

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
            if (!silencioso) showToast('No se pudieron cargar las rutas de Gymkana', 'error');
          }
        } else {
          setRutasGymkana([]);
          setPartidosGymkana([]);
        }
      }

      const fallidas = [m, e, a, iniciada, alertasData].filter((r) => r.status === 'rejected');
      if (fallidas.length > 0) {
        console.error('Fallos al cargar Admin:', fallidas.map((r) => r.reason));
        if (!silencioso) {
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
      }

      if (!silencioso) setCargando(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  );

  // Lo que los módulos llaman después de guardar algo: recarga sin parpadeo.
  const recargar = useCallback(() => cargarTodo({ silencioso: true }), [cargarTodo]);

  // Solo las alertas (consulta liviana): se usa para los contadores de la barra,
  // que deben actualizarse al instante cuando llega una alerta.
  const recargarAlertas = useCallback(async () => {
    const [g, a] = await Promise.allSettled([listarAlertasGymkana(), listarAlertasAnimador()]);
    if (g.status === 'fulfilled') setAlertas(g.value);
    if (a.status === 'fulfilled') setAlertasAnimador(a.value);
  }, []);

  useEffect(() => {
    cargarTodo();
    const cancelarAnimador = suscribirseAlertasAnimador(recargarAlertas);
    const cancelarGymkana = suscribirseAlertasGymkana(recargarAlertas);
    return () => {
      cancelarAnimador();
      cancelarGymkana();
    };
  }, [cargarTodo, recargarAlertas]);

  const alertasGymkanaPendientes = alertas.filter((a) => a.requiere_auditoria).length;
  const alertasAnimadorPendientes = alertasAnimador.filter((a) => !a.atendida).length;

  return (
    <>
      <h1 className="sr-only">Admin</h1>

      <nav className="sticky top-[112px] sm:top-[136px] z-10 border-b border-white/10 bg-brand-navy/70 backdrop-blur-xl shadow-xl shadow-black/30 transition-all duration-300 overflow-x-auto">
        <div className="flex items-center px-4 gap-1">
          {TABS.map((t) => {
            const activa = tab === t.id;

            if (t.destructiva) {
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`ml-auto shrink-0 whitespace-nowrap rounded-lg bg-red-600 px-3.5 py-1.5 text-sm font-bold text-white transition-all duration-300 hover:bg-red-700 ${
                    activa ? 'ring-2 ring-red-300 ring-offset-2 ring-offset-brand-navy' : ''
                  }`}
                >
                  {t.label}
                </button>
              );
            }

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`tab-pill ${
                  activa ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.label}
                {/* Alertas de Gymkana: visibles desde la barra, sin entrar al módulo */}
                {t.id === 'animacion' && alertasGymkanaPendientes > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold bg-red-500 text-white rounded-full">
                    {alertasGymkanaPendientes}
                  </span>
                )}
                {t.id === 'alertas' && alertasAnimadorPendientes > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold bg-orange-500 text-white rounded-full">
                    {alertasAnimadorPendientes}
                  </span>
                )}
                {activa && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-brown" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {cargando ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-white" size={28} />
          </div>
        ) : (
          <>
            {tab === 'main' && <ConfiguracionUIPanel />}
            {tab === 'equipos' && (
              <div className="space-y-6">
                <ControlInicioActividades actividades={['gymkana', 'torneo']} />
                <EquiposCRUD equipos={equipos} onCambio={recargar} />
                <GestionSubEquiposColor macroEquipos={equipos} />
              </div>
            )}
            {tab === 'formacion' && <FormacionAdminTab />}
            {tab === 'animacion' && (
              <AnimacionAdminTab
                marcador={marcador}
                equipos={equipos}
                ajustes={ajustes}
                alertas={alertas}
                alertasPendientes={alertasGymkanaPendientes}
                coloresGymkana={coloresGymkana}
                rutasGymkana={rutasGymkana}
                partidosGymkana={partidosGymkana}
                gymkanaIniciada={gymkanaIniciada}
                onCambio={recargar}
              />
            )}
            {tab === 'notificaciones' && <NotificacionesAdminPanel />}
            {tab === 'alertas' && <AlertasAnimadorAdminPanel />}
            {tab === 'peligro' && <ReiniciarEvento onCambio={recargar} />}
          </>
        )}
      </main>
    </>
  );
}
