import { Crown, Medal, Trophy } from 'lucide-react';
import TarjetaPartido from './TarjetaPartido';
import InsigniaEquipo from './InsigniaEquipo';

function Podio({ puesto, titulo, equipo, color, Icono }) {
  return (
    <div
      className="glass-card flex flex-col items-center gap-1.5 px-1.5 py-3 text-center"
      style={{ borderColor: `${color}66` }}
    >
      <Icono size={22} style={{ color }} />
      <InsigniaEquipo
        colorEquipo={equipo.color}
        colorMacro={equipo.macroColor}
        macroNombre={equipo.macro}
        tamano={44}
      />
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
        {puesto} · {titulo}
      </span>
      <span className="font-black leading-tight text-white">{equipo.nombre}</span>
      <span className="text-[11px] text-slate-400">{equipo.macro}</span>
    </div>
  );
}

function ganadorDe(p) {
  if (!p?.finalizado || !p.ganador_id) return null;
  const a = p.ganador_id === p.equipo_a_id;
  const perdedorLado = a ? 'b' : 'a';
  const g = a ? 'a' : 'b';
  const dato = (l) => ({
    nombre: p[`${l}_nombre`],
    color: p[`${l}_color`],
    macro: p[`${l}_macro_nombre`],
    macroColor: p[`${l}_macro_color`],
  });
  return { ganador: dato(g), perdedor: dato(perdedorLado) };
}

/** Fase Final (Cancha 1): Tercer Puesto (fecha 10) y Gran Final (fecha 11). */
export default function PanelFinal({ ctx }) {
  const { partidos } = ctx;
  const final = partidos.find((p) => p.fase === 'final');
  const tercero = partidos.find((p) => p.fase === 'tercer_puesto');
  const rf = ganadorDe(final);
  const rt = ganadorDe(tercero);

  return (
    <div className="space-y-4">
      {rf && (
        <div className="grid grid-cols-3 gap-2" aria-label="Podio">
          <Podio puesto="1.º" titulo="Campeón" equipo={rf.ganador} color="#fbbf24" Icono={Crown} />
          <Podio puesto="2.º" titulo="Subcampeón" equipo={rf.perdedor} color="#cbd5e1" Icono={Trophy} />
          {rt && <Podio puesto="3.º" titulo="Tercer puesto" equipo={rt.ganador} color="#d97706" Icono={Medal} />}
        </div>
      )}

      {final ? (
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-amber-300">
            <Trophy size={14} /> Gran Final
          </h3>
          <TarjetaPartido p={final} {...ctx} abiertoInicial={final.finalizado} />
          <p className="px-1 text-[11px] text-slate-500">
            Si hay empate: tiempo suplementario de 2 × 5 min y, de seguir igual, 5 penales por equipo y muerte súbita.
          </p>
        </section>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">Los partidos finales aún no se han generado.</p>
      )}

      {tercero && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-amber-600">
            <Medal size={14} /> Tercer Puesto
          </h3>
          <TarjetaPartido p={tercero} {...ctx} abiertoInicial={tercero.finalizado} />
          <p className="px-1 text-[11px] text-slate-500">
            Si hay empate: penales directos (3 cobros por equipo y muerte súbita).
          </p>
        </section>
      )}
    </div>
  );
}
