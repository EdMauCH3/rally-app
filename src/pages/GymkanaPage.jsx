import { useBasesGymkana } from '../hooks/useBasesGymkana';
import { useEstadoPersistente } from '../hooks/useEstadoPersistente';
import SelectorEstacion from '../components/estacion/SelectorEstacion';
import EstacionGymkana from '../components/gymkana/EstacionGymkana';

const BASES = [1, 2, 3, 4, 5, 6];

/**
 * Gymkana en el panel del staff: el juez elige SU base y se queda ahí. Los
 * equipos vienen a él (ver EstacionGymkana). La base elegida se recuerda
 * aunque se cambie de pestaña o se recargue la página.
 */
export default function GymkanaPage() {
  const bases = useBasesGymkana();
  const [base, setBase] = useEstadoPersistente('rally_ui_gymkana_base', null, (v) =>
    BASES.includes(v)
  );

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="sr-only">Staff Gymkana</h1>

      {base == null ? (
        <SelectorEstacion
          etiqueta="Base"
          numeros={BASES}
          seleccionada={base}
          onSeleccionar={setBase}
          detalle={(n) => bases[n]?.lugar?.trim()}
        />
      ) : (
        <>
          <EstacionGymkana key={base} base={base} />
          <button
            type="button"
            onClick={() => setBase(null)}
            className="mx-auto block text-sm text-slate-400 underline underline-offset-2 transition-colors hover:text-white"
          >
            Cambiar de base
          </button>
        </>
      )}
    </main>
  );
}
