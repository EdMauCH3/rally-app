import BloqueEnMantenimiento from './BloqueEnMantenimiento';

const COMISIONES = ['Logística', 'Económica', 'Animación', 'Formación'];

export default function BloqueComisiones() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <BloqueEnMantenimiento
        titulo="Comisiones en construcción"
        descripcion="Muy pronto aquí encontrarás el contenido de cada comisión."
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
        {COMISIONES.map((c) => (
          <div
            key={c}
            className="glass-row px-3 py-4 text-center text-sm font-semibold text-slate-300"
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
