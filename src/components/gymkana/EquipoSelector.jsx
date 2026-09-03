export default function EquipoSelector({ equipos, equipoSeleccionado, onSeleccionar }) {
  if (equipos.length === 0) {
    return (
      <p className="text-center text-slate-400 text-sm py-6">
        Aún no hay equipos creados. Pide al Admin que los configure.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {equipos.map((equipo) => {
        const activo = equipo.id === equipoSeleccionado?.id;
        return (
          <button
            key={equipo.id}
            onClick={() => onSeleccionar(equipo)}
            className="rounded-2xl p-4 text-left border-2 font-semibold text-slate-100 transition-all backdrop-blur-xl"
            style={{
              borderColor: activo ? equipo.color_hex : 'rgba(255,255,255,0.1)',
              backgroundColor: activo ? `${equipo.color_hex}1f` : 'rgba(255,255,255,0.03)',
              boxShadow: activo ? `0 0 24px -4px ${equipo.color_hex}66` : 'none',
            }}
          >
            <span
              className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
              style={{ backgroundColor: equipo.color_hex, boxShadow: `0 0 8px ${equipo.color_hex}` }}
            />
            {equipo.nombre}
          </button>
        );
      })}
    </div>
  );
}
