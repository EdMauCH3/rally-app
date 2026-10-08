import { useEffect, useState } from 'react';
import {
  listarEstadoActividades,
  suscribirseEstadoActividades,
} from '../services/estadoActividadesService';
import LetreroActividadNoIniciada from '../components/common/LetreroActividadNoIniciada';
import PausaActividadOverlay from '../components/common/PausaActividadOverlay';
import TorneoPublicoFases from '../components/torneo/fases/TorneoPublicoFases';

export default function TorneoPublicoPage() {
  const [iniciada, setIniciada] = useState(null);

  useEffect(() => {
    function cargarEstadoGlobal() {
      listarEstadoActividades().then((lista) => {
        setIniciada(lista.find((e) => e.actividad === 'torneo')?.iniciada ?? false);
      });
    }
    cargarEstadoGlobal();
    return suscribirseEstadoActividades(cargarEstadoGlobal);
  }, []);

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
