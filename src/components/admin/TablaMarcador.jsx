export default function TablaMarcador({ equipos }) {
  if (equipos.length === 0) {
    return <p className="text-sm text-slate-400">Aún no hay equipos creados.</p>;
  }

  return (
    <div className="overflow-x-auto glass-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 text-left text-xs uppercase tracking-wide">
            <th className="px-4 py-3">Equipo</th>
            <th className="px-4 py-3 text-right">Gymkana</th>
            <th className="px-4 py-3 text-right">Tesoro</th>
            <th className="px-4 py-3 text-right">Torneo</th>
            <th className="px-4 py-3 text-right">Ajustes</th>
            <th className="px-4 py-3 text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((e) => (
            <tr key={e.equipo_id} className="border-t border-white/10 hover:bg-white/[0.03] transition-colors">
              <td className="px-4 py-3 font-medium text-slate-200">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle"
                  style={{ backgroundColor: e.color_hex, boxShadow: `0 0 8px ${e.color_hex}` }}
                />
                {e.nombre}
              </td>
              <td className="px-4 py-3 text-right text-slate-400">{e.total_gymkana}</td>
              <td className="px-4 py-3 text-right text-slate-400">{e.total_tesoro}</td>
              <td className="px-4 py-3 text-right text-slate-400">{e.total_torneo}</td>
              <td className="px-4 py-3 text-right text-slate-400">{e.total_ajustes}</td>
              <td className="px-4 py-3 text-right font-bold accent-gradient-text">
                {e.puntos_generales}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
