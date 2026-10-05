import { ClipboardList, Flag, Map, Settings, Trophy } from 'lucide-react';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import ResumenAnimacion from './ResumenAnimacion';
import GestionBasesGymkana from './GestionBasesGymkana';
import IniciarGymkanaPanel from './IniciarGymkanaPanel';
import AlertasGymkana from './AlertasGymkana';
import TorneoAdminTab from './TorneoAdminTab';
import AjustesForm from './AjustesForm';
import TesoroAdminModulo from './TesoroAdminModulo';

const MODULOS = [
  {
    id: 'resumen',
    nombre: 'Resumen',
    detalle: 'Estado general',
    icon: ClipboardList,
    clases: 'from-sky-500 to-sky-700',
  },
  {
    id: 'gymkana',
    nombre: 'Gymkana',
    detalle: 'Bases y alertas',
    icon: Flag,
    clases: 'from-emerald-500 to-emerald-700',
  },
  {
    id: 'torneo',
    nombre: 'Torneo',
    detalle: 'Partidos',
    icon: Trophy,
    clases: 'from-violet-500 to-violet-700',
  },
  {
    id: 'tesoro',
    nombre: 'Búsqueda del Tesoro',
    detalle: 'Pistas y puntajes',
    icon: Map,
    clases: 'from-amber-500 to-amber-700',
  },
  {
    id: 'puntos',
    nombre: 'Ajuste de Puntos',
    detalle: 'Puntos manuales',
    icon: Settings,
    clases: 'from-rose-500 to-rose-700',
  },
];

const SUBMODULOS_GYMKANA = ['controles', 'alertas'];

/** Círculo rojo con el número de alertas pendientes (no se dibuja si es 0). */
function InsigniaAlertas({ cantidad, className = '' }) {
  if (!(cantidad > 0)) return null;
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white shadow-md shadow-black/40 ${className}`}
      aria-label={`${cantidad} ${cantidad === 1 ? 'alerta pendiente' : 'alertas pendientes'}`}
    >
      {cantidad}
    </span>
  );
}

/**
 * Pestaña "Animación" del Admin: agrupa todo lo que se maneja durante las
 * actividades de la tarde, con el mismo estilo de selector que el panel del
 * animador. Los módulos se eligen con tarjetas; el que quedó abierto se
 * recuerda aunque se recargue la página.
 */
export default function AnimacionAdminTab({
  marcador,
  equipos,
  ajustes,
  alertas,
  alertasPendientes,
  coloresGymkana,
  rutasGymkana,
  partidosGymkana,
  gymkanaIniciada,
  onCambio,
}) {
  const [modulo, setModulo] = useEstadoPersistente('rally_ui_admin_animacion', 'resumen', (v) =>
    MODULOS.some((m) => m.id === v)
  );
  const [subGymkana, setSubGymkana] = useEstadoPersistente(
    'rally_ui_admin_animacion_gymkana',
    'controles',
    (v) => SUBMODULOS_GYMKANA.includes(v)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
        {MODULOS.map((m) => {
          const Icon = m.icon;
          const activo = m.id === modulo;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setModulo(m.id)}
              className={`relative flex flex-col items-center gap-1.5 rounded-2xl p-4 transition-all duration-300 ease-in-out ${
                activo
                  ? `bg-gradient-to-br ${m.clases} shadow-xl shadow-black/40 scale-[1.03]`
                  : 'border border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              {/* Badge en cascada: la alerta de Gymkana se ve desde la tarjeta */}
              {m.id === 'gymkana' && (
                <InsigniaAlertas cantidad={alertasPendientes} className="absolute -right-1.5 -top-1.5" />
              )}
              <Icon size={24} className="text-white" />
              <span className="text-center text-sm font-bold leading-tight text-white">
                {m.nombre}
              </span>
              <span className={`text-xs ${activo ? 'text-white/80' : 'text-slate-500'}`}>
                {m.detalle}
              </span>
            </button>
          );
        })}
      </div>

      {modulo === 'resumen' && (
        <ResumenAnimacion
          marcador={marcador}
          gymkanaLanzada={gymkanaIniciada}
          partidosGymkana={partidosGymkana}
          alertasGymkanaPendientes={alertasPendientes}
        />
      )}

      {modulo === 'gymkana' && (
        <div className="space-y-6">
          <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
            {[
              { id: 'controles', label: 'Controles' },
              { id: 'alertas', label: 'Alertas Gymkana' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubGymkana(s.id)}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold transition-all duration-300 ease-in-out ${
                  subGymkana === s.id
                    ? 'border-brand-brown bg-brand-brown/15 text-white'
                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                {s.label}
                {s.id === 'alertas' && <InsigniaAlertas cantidad={alertasPendientes} />}
              </button>
            ))}
          </div>

          {subGymkana === 'controles' ? (
            <div className="space-y-8">
              <GestionBasesGymkana />
              <IniciarGymkanaPanel
                equipos={coloresGymkana}
                rutas={rutasGymkana}
                partidos={partidosGymkana}
                gymkanaIniciada={gymkanaIniciada}
                onCambio={onCambio}
              />
            </div>
          ) : (
            <AlertasGymkana alertas={alertas} onCambio={onCambio} />
          )}
        </div>
      )}

      {modulo === 'torneo' && <TorneoAdminTab />}

      {modulo === 'tesoro' && <TesoroAdminModulo />}

      {modulo === 'puntos' && (
        <AjustesForm equipos={equipos} historial={ajustes} onCambio={onCambio} />
      )}
    </div>
  );
}
