import { Loader2, Sunrise } from 'lucide-react';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import { useRotacionFormacion } from '../../hooks/useRotacionFormacion';
import SelectorEstacion from '../estacion/SelectorEstacion';
import EstacionFormacion from './EstacionFormacion';

/**
 * Pestaña "Formación" del panel del staff. El formador elige la base donde
 * está parado y se queda ahí: la pantalla le dice qué equipo tiene enfrente y
 * cuál viene después. La base elegida se recuerda aunque recargue la página.
 */
export default function FormacionPanel() {
  const rotacion = useRotacionFormacion();
  const [base, setBase] = useEstadoPersistente('rally_ui_formacion_base', null, (v) =>
    Number.isInteger(v)
  );

  if (rotacion.cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (rotacion.error) {
    return (
      <p className="mx-auto max-w-md rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-center text-sm text-amber-100">
        No se pudo cargar la rotación. Revisa tu conexión: se reintenta sola.
      </p>
    );
  }

  const { bases } = rotacion;
  if (bases.length === 0) {
    return (
      <div className="glass-card mx-auto max-w-md space-y-2 p-8 text-center">
        <Sunrise className="mx-auto text-slate-300" size={34} />
        <p className="font-bold text-white">Todavía no hay bases configuradas</p>
        <p className="text-sm text-slate-400">
          La coordinación aún no prepara la rotación de la mañana. Vuelve en un momento.
        </p>
      </div>
    );
  }

  // Si la base guardada ya no existe (se reconfiguró la rotación), se vuelve a pedir.
  const indice = base !== null && base >= 0 && base < bases.length ? base : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="sr-only">Formación</h1>

      {indice === null ? (
        <SelectorEstacion
          etiqueta="Base"
          numeros={bases.map((_, i) => i + 1)}
          seleccionada={null}
          onSeleccionar={(n) => setBase(n - 1)}
          detalle={(n) => bases[n - 1]?.nombre}
        />
      ) : (
        <>
          <EstacionFormacion key={indice} indiceBase={indice} rotacion={rotacion} />
          <button
            type="button"
            onClick={() => setBase(null)}
            className="mx-auto block text-sm text-slate-400 underline underline-offset-2 transition-colors hover:text-white"
          >
            Cambiar de base
          </button>
        </>
      )}
    </div>
  );
}
