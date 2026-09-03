const MEDALLAS = ['🥇', '🥈', '🥉', '4º'];

export default function TablaPosicionesVisor({ equipos }) {
  if (equipos.length === 0) {
    return <p className="text-center text-slate-500 py-10">Aún no hay equipos registrados.</p>;
  }

  return (
    <div className="space-y-3">
      {equipos.map((e, i) => (
        <div
          key={e.equipo_id}
          className="animate-fade-up rounded-2xl p-4 sm:p-6 flex items-center gap-4 sm:gap-6 backdrop-blur-xl border transition-transform hover:-translate-y-0.5"
          style={{
            animationDelay: `${i * 70}ms`,
            backgroundColor: `${e.color_hex}12`,
            borderColor: `${e.color_hex}55`,
            boxShadow: i === 0 ? `0 0 40px -12px ${e.color_hex}` : undefined,
          }}
        >
          <span className="text-3xl sm:text-5xl font-black w-14 sm:w-20 text-center shrink-0">
            {MEDALLAS[i] ?? `${i + 1}º`}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-xl sm:text-3xl font-black text-white truncate">{e.nombre}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-400 mt-1">
              <span>Gymkana: {e.total_gymkana}</span>
              <span>Tesoro: {e.total_tesoro}</span>
              <span>Torneo: {e.total_torneo}</span>
              <span>Ajustes: {e.total_ajustes}</span>
            </div>
          </div>

          <span
            className="text-3xl sm:text-5xl font-black shrink-0"
            style={{ color: e.color_hex, textShadow: `0 0 30px ${e.color_hex}80` }}
          >
            {e.puntos_generales}
          </span>
        </div>
      ))}
    </div>
  );
}
