import { useEffect, useMemo } from 'react';
import { Flag, PartyPopper, Trophy, Users } from 'lucide-react';

const PASOS = {
  staff: {
    titulo: '¡Gymkana completada!',
    subtitulo: 'Todos los equipos completaron el circuito. ¡Gracias por hacerlo posible!',
    encabezadoPasos: 'Qué hacer ahora',
    pasos: [
      ['🧺', 'Recoge tu base', 'Guarda los materiales y deja el lugar limpio y ordenado.'],
      ['📋', 'Entrega tus resultados', 'Verifica que todos tus cruces quedaron calificados; si ves un error, repórtalo antes de irte.'],
      ['🤝', 'Apoya el resto del evento', 'Únete a la coordinación para ayudar en las demás actividades.'],
    ],
  },
  publico: {
    titulo: '¡Misión cumplida!',
    subtitulo: 'Has superado todas las bases de la Gymkana.',
    encabezadoPasos: 'Qué hacer ahora',
    pasos: [
      ['🎉', 'Celebra con tu equipo', 'Lo lograron juntos: ¡disfruten el momento!'],
      ['📍', 'Reúnete con tu macro-equipo', 'Busca a tu animador y sigue sus indicaciones.'],
      ['🏆', 'Mira el marcador', 'Tus puntos ya suman para tu macro-equipo. Revisa cómo va el rally.'],
    ],
  },
};

const COLORES = ['#facc15', '#34d399', '#38bdf8', '#f472b6', '#fb923c', '#a78bfa'];

/**
 * Tarjeta de cierre de la Gymkana, para el juez ('staff') y para el público.
 * Fondo festivo con confeti (se detiene si el dispositivo pide menos movimiento),
 * un encabezado grande y tres pasos claros de qué hacer ahora.
 */
export default function TarjetaCierreGymkana({ variante = 'publico', puntos = null, colorEquipo }) {
  const t = PASOS[variante];

  useEffect(() => {
    if (document.getElementById('estilos-cierre-gymkana')) return;
    const estilo = document.createElement('style');
    estilo.id = 'estilos-cierre-gymkana';
    estilo.textContent = `
      @keyframes cierre-caer { 0% { transform: translateY(-20px) rotate(0deg); opacity: 0 } 10% { opacity: 1 }
        100% { transform: translateY(420px) rotate(540deg); opacity: 0 } }
      @keyframes cierre-pop { 0% { transform: scale(.6); opacity: 0 } 70% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
      @media (prefers-reduced-motion: reduce) { .cierre-confeti, .cierre-pop { animation: none !important; } .cierre-confeti { display: none } }`;
    document.head.appendChild(estilo);
  }, []);

  const confeti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        i,
        izq: (i * 37) % 100,
        color: COLORES[i % COLORES.length],
        demora: ((i * 7) % 20) / 10,
        dur: 3.2 + ((i * 3) % 12) / 10,
        ancho: 6 + (i % 4) * 2,
      })),
    []
  );

  return (
    <div
      role="status"
      className="relative overflow-hidden rounded-3xl border-2 border-emerald-300/50 bg-gradient-to-br from-emerald-600/40 via-sky-700/40 to-indigo-700/40 p-6 text-center shadow-2xl shadow-black/50"
      style={colorEquipo ? { boxShadow: `0 0 40px -8px ${colorEquipo}aa` } : undefined}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {confeti.map((c) => (
          <span
            key={c.i}
            className="cierre-confeti absolute top-0 block rounded-sm"
            style={{
              left: `${c.izq}%`,
              width: c.ancho,
              height: c.ancho * 1.6,
              backgroundColor: c.color,
              animation: `cierre-caer ${c.dur}s ${c.demora}s linear infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative space-y-5">
        <div className="cierre-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-yellow-300 ring-4 ring-white/20" style={{ animation: 'cierre-pop .7s ease-out both' }}>
          {variante === 'staff' ? <Flag size={40} /> : <Trophy size={40} />}
        </div>

        <div className="space-y-1.5">
          <h2 className="flex items-center justify-center gap-2 text-3xl font-black leading-tight text-white">
            <PartyPopper size={28} className="shrink-0 text-yellow-300" aria-hidden="true" />
            {t.titulo}
          </h2>
          <p className="text-base leading-relaxed text-emerald-50">{t.subtitulo}</p>
        </div>

        {puntos !== null && (
          <p className="mx-auto inline-flex items-baseline gap-2 rounded-2xl bg-black/30 px-5 py-2 text-white">
            <span className="text-sm text-slate-300">Tus puntos</span>
            <span className="text-3xl font-black tabular-nums">{puntos}</span>
          </p>
        )}

        <div className="space-y-2.5 rounded-2xl bg-slate-950/60 p-4 text-left">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
            <Users size={14} aria-hidden="true" /> {t.encabezadoPasos}
          </p>
          <ol className="space-y-3">
            {t.pasos.map(([emoji, titulo, detalle], i) => (
              <li key={titulo} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg" aria-hidden="true">
                  {emoji}
                </span>
                <span className="min-w-0">
                  <span className="block font-black leading-tight text-white">
                    {i + 1}. {titulo}
                  </span>
                  <span className="block text-sm leading-snug text-slate-300">{detalle}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
