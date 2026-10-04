import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { listarRosterTorneo } from '../../services/torneoService';
import { obtenerTorneoPosiciones } from '../../services/visorService';
import {
  listarPartidosPro,
  listarEventosTorneo,
  listarEstadoJugadores,
  suscribirseTorneoPro,
} from '../../services/torneoProService';
import MarcadoresEnVivo from './publico/MarcadoresEnVivo';
import TablaPosicionesPro from './publico/TablaPosicionesPro';
import ListaPartidosPro from './publico/ListaPartidosPro';

function Seccion({ titulo, children }) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-sm font-bold uppercase tracking-widest text-slate-400">{titulo}</h2>
      {children}
    </section>
  );
}

export default function TorneoPublicoPro() {
  const [partidos, setPartidos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [roster, setRoster] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [posiciones, setPosiciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    Promise.all([
      listarPartidosPro(),
      listarEventosTorneo(),
      listarRosterTorneo(),
      listarEstadoJugadores(),
      obtenerTorneoPosiciones(),
    ])
      .then(([p, e, r, j, pos]) => {
        setPartidos(p);
        setEventos(e);
        setRoster(r);
        setJugadores(j);
        setPosiciones(pos);
      })
      .catch((err) => console.error('Error cargando el torneo:', err.message))
      .finally(() => setCargando(false));
  }, []);

  // Realtime: cada gol o tarjeta actualiza esta pantalla. Las ráfagas de
  // cambios (p. ej. doble amarilla + roja) se agrupan en una sola consulta.
  useEffect(() => {
    cargar();
    let temporizador;
    const cancelar = suscribirseTorneoPro(() => {
      clearTimeout(temporizador);
      temporizador = setTimeout(cargar, 300);
    });
    return () => {
      clearTimeout(temporizador);
      cancelar();
    };
  }, [cargar]);

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <h1 className="text-center text-xl font-black text-white">Torneo</h1>

      <Seccion titulo="En vivo">
        <MarcadoresEnVivo partidos={partidos} roster={roster} eventos={eventos} />
      </Seccion>

      <Seccion titulo="Tabla de posiciones">
        <TablaPosicionesPro posiciones={posiciones} jugadores={jugadores} />
      </Seccion>

      <Seccion titulo="Partidos">
        <ListaPartidosPro
          partidos={partidos}
          roster={roster}
          eventos={eventos}
          jugadores={jugadores}
        />
      </Seccion>
    </div>
  );
}
