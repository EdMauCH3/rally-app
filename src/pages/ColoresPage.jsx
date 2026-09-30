import { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Hourglass,
  Sparkles,
  Users,
  MapPin,
  Timer,
  Flame,
  PartyPopper,
} from 'lucide-react';
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

          if (huboRotacion) dispararEfectoRotacion();
        })
        .finally(() => setCargando(false));
    }

    cargarTodo();
    const unsubscribe = suscribirseColores(cargarTodo);
    return unsubscribe;
  }, []);

  function dispararEfectoRotacion() {
    setFlasheando(true);
    audioRef.current?.play().catch(() => {});
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
    <div className="relative min-h-[calc(100vh-1px)] flex items-center justify-center px-4 sm:px-6 py-14 text-center overflow-hidden">
      {flasheando && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-luces-rotacion" />
      )}

      <div className="absolute inset-0 bg-brand-navy/50" />

      <div className="relative z-10 w-full max-w-xl">
        {config.estado === 'esperando' && <PantallaEspera />}

        {config.estado === 'terminado' && <PantallaTerminado />}

        {config.estado === 'en_curso' && !equipoActual && (
          <PantallaSeleccion equipos={equipos} onElegir={elegirEquipo} />
        )}

        {config.estado === 'en_curso' && equipoActual && baseActual && (
          <PantallaActiva
            config={config}
            equipoActual={equipoActual}
            baseActual={baseActual}
            onCambiarEquipo={cambiarEquipo}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================
   ESTADO: ESPERANDO
   ============================================ */
function PantallaEspera() {
  return (
    <div className="flex flex-col items-center gap-8 animate-fade-up">
      <div className="relative flex items-center justify-center">
        <Sparkles
          className="absolute -top-6 -left-10 text-amber-300 animate-pulse"
          size={30}
        />
        <Sparkles
          className="absolute -bottom-4 -right-12 text-brand-brown animate-pulse"
          size={24}
          style={{ animationDelay: '0.5s' }}
        />
        <Sparkles
          className="absolute top-2 right-0 text-white/70 animate-pulse"
          size={18}
          style={{ animationDelay: '1s' }}
        />
        <div className="rounded-full bg-gradient-to-br from-brand-brown/30 to-brand-navy/40 p-8 sm:p-10 shadow-2xl shadow-black/50 backdrop-blur-xl border border-white/10">
          <Hourglass className="text-white animate-bounce" size={72} />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
          Aún no es momento
        </h1>
        <p className="text-lg sm:text-xl text-white/75 max-w-md mx-auto leading-relaxed">
          Los animadores te informarán para iniciar la rotación.
        </p>
        <p className="text-sm text-white/50 tracking-wide uppercase font-semibold pt-2">
          Prepárate para la aventura ✨
        </p>
      </div>
    </div>
  );
}

/* ============================================
   ESTADO: TERMINADO
   ============================================ */
function PantallaTerminado() {
  return (
    <div className="flex flex-col items-center gap-8 animate-fade-up">
      <div className="rounded-full bg-gradient-to-br from-emerald-500/25 to-brand-navy/40 p-8 sm:p-10 shadow-2xl shadow-black/50 backdrop-blur-xl border border-emerald-400/20">
        <PartyPopper className="text-emerald-300 animate-bounce" size={72} />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
          ¡La rotación ha terminado!
        </h1>
        <p className="text-lg sm:text-xl text-white/75 max-w-md mx-auto leading-relaxed">
          Sigue las instrucciones de tu <span className="font-bold text-white">ANIMADOR</span> y
          dirígete al lugar correspondiente.
        </p>
      </div>
    </div>
  );
}

/* ============================================
   ESTADO: SELECCION DE EQUIPO
   ============================================ */
function PantallaSeleccion({ equipos, onElegir }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-white/5 p-4 border border-white/10 shadow-xl shadow-black/40">
          <Users className="text-white" size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">¿Cuál es tu equipo?</h1>
        <p className="text-sm text-white/60">Toca tu color para ver tu siguiente base</p>
      </div>

      <div className="grid gap-3">
        {equipos.map((eq) => (
          <button
            key={eq.id}
            onClick={() => onElegir(eq.id)}
            className="flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-300 ease-in-out hover:scale-105 backdrop-blur-xl bg-white/5 shadow-2xl shadow-black/40"
            style={{ borderColor: eq.color_hex }}
          >
            <span
              className="w-10 h-10 rounded-full shrink-0"
              style={{ backgroundColor: eq.color_hex, boxShadow: `0 0 18px ${eq.color_hex}` }}
            />
            <span className="text-xl font-bold text-white">{eq.nombre}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================
   ESTADO: ACTIVA (equipo ya eligio, se le muestra su base)
   ============================================ */
function PantallaActiva({ config, equipoActual, baseActual, onCambiarEquipo }) {
  return (
    <div className="space-y-5 animate-fade-up">
      {config.ultima_base && <BannerUltimaBase />}

      {/* Tarjeta 1: Destino */}
      <div
        className="rounded-3xl border-2 p-8 sm:p-10 backdrop-blur-xl shadow-2xl shadow-black/60 bg-gradient-to-b from-brand-brown/20 via-brand-navy/40 to-brand-navy/60 transition-all duration-300"
        style={{ borderColor: `${equipoActual.color_hex}80` }}
      >
        <p className="text-lg sm:text-xl text-white/70 font-medium">Dirígete a la</p>

        <p
          className="text-6xl sm:text-8xl font-black leading-none my-3 tracking-tight"
          style={{
            color: equipoActual.color_hex,
            textShadow: `0 0 45px ${equipoActual.color_hex}99`,
          }}
        >
          BASE {baseActual.nombre}
        </p>

        <p className="text-lg sm:text-xl text-white/70 font-medium">ubicada en</p>

        <p className="flex items-center justify-center gap-3 text-3xl sm:text-5xl font-extrabold text-white mt-2 leading-tight">
          <MapPin size={36} className="shrink-0" style={{ color: '#c4915f' }} />
          {baseActual.lugar}
        </p>
      </div>

      {/* Tarjeta 2: Cronometro */}
      <div className="rounded-3xl border border-white/10 p-8 backdrop-blur-xl shadow-2xl shadow-black/60 bg-brand-navy/40 space-y-3">
        <p className="flex items-center justify-center gap-2 text-sm sm:text-base uppercase tracking-widest text-white/60 font-semibold">
          <Timer size={18} /> Tiempo restante para la rotación:
        </p>
        <Cronometro tiempoFin={config.tiempo_fin} duracionSegundos={config.duracion_segundos} />
      </div>

      <button
        onClick={onCambiarEquipo}
        className="text-xs text-white/50 underline underline-offset-2 hover:text-white/80 transition-colors duration-300"
      >
        No es tu equipo, cambiar selección
      </button>
    </div>
  );
}

function BannerUltimaBase() {
  return (
    <div className="rounded-2xl border-2 border-red-500/70 bg-gradient-to-r from-red-600/90 to-rose-600/90 px-6 py-4 shadow-2xl shadow-red-950/60 animate-pulse">
      <p className="flex items-center justify-center gap-2 text-white font-black text-lg sm:text-2xl tracking-wide">
        <Flame size={26} /> ÚLTIMA BASE <Flame size={26} />
      </p>
    </div>
  );
}

/* ============================================
   CRONOMETRO
   Cambia de color segun el % de tiempo restante:
   normal (blanco) -> aviso (ambar, <30%) -> critico (rojo, <10% o <=10s)
   ============================================ */
function Cronometro({ tiempoFin, duracionSegundos }) {
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

  const porcentaje = duracionSegundos ? restanteMs / 1000 / duracionSegundos : 1;
  const critico = totalSeg <= 10 || porcentaje <= 0.1;
  const aviso = !critico && porcentaje <= 0.3;

  const colorClase = critico
    ? 'text-red-400 animate-pulse'
    : aviso
      ? 'text-amber-300'
      : 'text-white';

  return (
    <p
      className={`font-mono font-black tabular-nums text-6xl sm:text-8xl transition-colors duration-300 ${colorClase}`}
    >
      {m}:{s}
    </p>
  );
}
