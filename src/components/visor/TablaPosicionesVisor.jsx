const MEDALLAS = ['🥇', '🥈', '🥉', '4º'];

export default function TablaPosicionesVisor({ generales }) {
  if (generales.length === 0) {
    return <p className="text-center text-slate-400 py-10">Aún no hay equipos registrados.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-brand-navy/40 backdrop-blur-xl shadow-2xl shadow-black/50">
      <table className="w-full text-sm sm:text-base">
        <thead>
          <tr className="text-left text-slate-400 text-[11px] sm:text-xs uppercase tracking-wide border-b border-white/10">
            <th className="px-4 py-3">Equipo</th>
            <th className="px-2 sm:px-3 py-3 text-right">Pts Gymkana</th>
            <th className="px-2 sm:px-3 py-3 text-right">Pts Tesoro</th>
            <th className="px-2 sm:px-3 py-3 text-right">Pts Torneo</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {generales.map((eq, i) => (
            <tr
              key={eq.equipo_id}
              className="border-b border-white/5 last:border-0 transition-colors duration-300 hover:bg-white/[0.03]"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg sm:text-2xl w-7 sm:w-9 shrink-0 text-center">
                    {MEDALLAS[i] ?? `${i + 1}º`}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: eq.color_hex }}
                  />
                  <span className="font-bold text-white truncate">{eq.nombre}</span>
                </div>
              </td>
              <td className="px-2 sm:px-3 py-4 text-right text-slate-300 tabular-nums">
                {eq.total_gymkana}
              </td>
              <td className="px-2 sm:px-3 py-4 text-right text-slate-300 tabular-nums">
                {eq.total_tesoro}
              </td>
              <td className="px-2 sm:px-3 py-4 text-right text-slate-300 tabular-nums">
                {eq.total_torneo}
              </td>
              <td
                className="px-4 py-4 text-right font-black text-lg sm:text-2xl tabular-nums"
                style={{ color: eq.color_hex }}
              >
                {eq.puntos_generales}
              </td>
            </tr>
          ))}

        </tbody>
      </table>
    </div>
  );
}
