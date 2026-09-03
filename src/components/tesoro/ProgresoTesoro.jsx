export default function ProgresoTesoro({ completadas, total }) {
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);

  return (
    <div className="glass-card p-4 space-y-2">
      <div className="flex justify-between text-sm font-medium text-slate-300">
        <span>Bases completadas</span>
        <span>
          {completadas}/{total}
        </span>
      </div>
      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-glow transition-all duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
