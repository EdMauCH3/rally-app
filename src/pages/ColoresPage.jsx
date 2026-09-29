import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  obtenerConfiguracion,
  listarBases,
  listarEquipos,
  suscribirseColores,
} from '../services/coloresService';

const LS_KEY = 'colores_equipo_seleccionado';

export default function ColoresPage() {
  const [cargando, setCargando] = useState(true);
  const [config, setConfig] = useState(null);
  const [bases, setBases] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [equipoId, setEquipoId] = useState(() => localStorage.getItem(LS_KEY));
  const [flasheando, setFlasheando] = useState(false);

  const rondaAnteriorRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Se crea una sola vez. El navegador puede bloquear el autoplay de
    // audio sin interacción previa del usuario; como aquí el usuario ya
    // tocó su equipo en la pantalla de selección, cuenta como interacción
    // y el .play() posterior no debería ser bloqueado.
    audioRef.current = new Audio('/sonido-rotacion.mp3');
  }, []);

  useEffect(() => {
    function cargarTodo() {
      Promise.all([obtenerConfiguracion(), listarBases(), listarEquipos()])
        .then(([c, b, e]) => {
          const huboRotacion =
            rondaAnteriorRef.current !== null &&
            c.ronda_actual > rondaAnteriorRef.current &&
            c.estado === 'en_curso';

          rondaAnteriorRef.current = c.ronda_actual;
          setConfig(c);
          setBases(b);
          setEquipos(e);

          if (huboRotacion) {
            dispararEfectoRotacion();
          }
        })
        .finally(() => setCargando(false));
    }

    cargarTodo();
    const unsubscribe = suscribirseColores(cargarTodo);
    return unsubscribe;
  }, []);

  function dispararEfectoRotacion() {
    setFlasheando(true);
    audioRef.current?.play().catch(() => {
      // Autoplay bloqueado por el navegador: no es critico, el anuncio
      // visual y el flash de luces igual se muestran.
    });
    setTimeout(() => setFlasheando(false), 2500);
  }

  function elegirEquipo(id) {
    localStorage.setItem(LS_KEY, id);
    setEquipoId(id);
  }

  function cambiarEquipo() {
    localStorage.removeItem(LS_KEY);
    setEquipoId(null);
  }

  if (cargando) {
    return (
      <div className="min-h-[calc(100vh-1px)] flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  const equipoActual = equipos.find((e) => e.id === equipoId) ?? null;
  const baseActual =
    equipoActual && bases.length > 0
      ? bases[(equipoActual.orden + config.ronda_actual) % bases.length]
      : null;

  return (
    <div className="relative min-h-[calc(100vh-1px)] flex items-center justify-center px-6 py-16 text-center overflow-hidden">
      {flasheando && <div className="fixed inset-0 z-50 pointer-events-none animate-luces-rotacion" />}

      <div className="absolute inset-0 bg-brand-navy/50" />

      <div className="relative z-10 w-full max-w-xl space-y-8">
        {config.estado === 'esperando' && (
          <p className="text-2xl sm:text-4xl font-black text-white leading-snug animate-fade-up">
            Aún no es momento, los animadores te informarán para iniciar la rotación.
          </p>
        )}

        {config.estado === 'terminado' && (
          <p className="text-2xl sm:text-4xl font-black text-white leading-snug animate-fade-up">
            La rotación ha terminado, sigue las instrucciones de tu ANIMADOR y dirígete al lugar
            correspondiente.
          </p>
        )}

        {config.estado === 'en_curso' && !equipoActual && (
          <div className="space-y-6 animate-fade-up">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">¿Cuál es tu equipo?</h1>
            <div className="grid gap-3">
              {equipos.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => elegirEquipo(eq.id)}
                  className="flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-300 ease-in-out hover:scale-105 backdrop-blur-xl bg-white/5"
                  style={{ borderColor: eq.color_hex }}
                >
                  <span
                    className="w-10 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: eq.color_hex, boxShadow: `0 0 16px ${eq.color_hex}` }}
                  />
                  <span className="text-xl font-bold text-white">{eq.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {config.estado === 'en_curso' && equipoActual && baseActual && (
          <div className="space-y-6 animate-fade-up">
            {config.ultima_base && (
              <p className="inline-block px-4 py-2 rounded-full bg-red-600 text-white font-black text-sm sm:text-base animate-pulse">
                ÚLTIMA BASE
              </p>
            )}

            <p
              className="text-3xl sm:text-5xl font-black text-white leading-tight"
              style={{ textShadow: `0 0 30px ${equipoActual.color_hex}` }}
            >
              Dirígete a la Base {baseActual.nombre}
              <br />
              ubicada en {baseActual.lugar}
            </p>

            <div className="pt-4">
              <p className="text-sm uppercase tracking-wide text-white/70 mb-1">
                Tiempo restante para la rotación:
              </p>
              <Cronometro tiempoFin={config.tiempo_fin} />
            </div>

            <button
              onClick={cambiarEquipo}
              className="text-xs text-white/50 underline underline-offset-2 hover:text-white/80 transition-colors duration-300"
            >
              No es tu equipo, cambiar selección
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Cronometro({ tiempoFin }) {
  const [restanteMs, setRestanteMs] = useState(0);

  useEffect(() => {
    function tick() {
      if (!tiempoFin) {
        setRestanteMs(0);
        return;
      }
      setRestanteMs(Math.max(0, new Date(tiempoFin).getTime() - Date.now()));
    }
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [tiempoFin]);

  const totalSeg = Math.ceil(restanteMs / 1000);
  const m = Math.floor(totalSeg / 60).toString().padStart(2, '0');
  const s = (totalSeg % 60).toString().padStart(2, '0');
  const agotado = restanteMs <= 0;

  return (
    <p
      className={`text-5xl sm:text-7xl font-mono font-black transition-colors duration-300 ${
        agotado ? 'text-red-400 animate-pulse' : 'text-white'
      }`}
    >
      {m}:{s}
    </p>
  );
}
