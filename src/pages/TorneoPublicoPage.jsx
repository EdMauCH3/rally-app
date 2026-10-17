import { useEstadoActividad } from '../hooks/useEstadoActividades';
import LetreroActividadNoIniciada from '../components/common/LetreroActividadNoIniciada';
import PausaActividadOverlay from '../components/common/PausaActividadOverlay';
import TorneoPublicoFases from '../components/torneo/fases/TorneoPublicoFases';

export default function TorneoPublicoPage() {
  const { iniciada: iniciadaHook, cargando: cargandoEstado } = useEstadoActividad('torneo');
  const iniciada = cargandoEstado ? null : iniciadaHook; // null = aun no sabemos

  if (iniciada === null) return null;

  if (!iniciada) {
    return (
      <main className="max-w-2xl mx-auto px-4">
        <LetreroActividadNoIniciada tema="torneo" />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <PausaActividadOverlay actividad="torneo" />
      <TorneoPublicoFases />
    </main>
  );
}
