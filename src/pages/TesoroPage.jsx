import { useEstadoPersistente } from '../hooks/useEstadoPersistente';
import SelectorEstacion from '../components/estacion/SelectorEstacion';
import EstacionTesoro from '../components/tesoro/EstacionTesoro';
import { BASES_TESORO } from '../services/tesoroService';

/**
 * Búsqueda del Tesoro en el panel del staff: el juez elige SU tinaja y se
 * queda ahí; los equipos vienen a él (ver EstacionTesoro). La tinaja elegida
 * se recuerda aunque se cambie de pestaña o se recargue la página.
 */
export default function TesoroPage() {
  const [tinaja, setTinaja] = useEstadoPersistente('rally_ui_tesoro_tinaja', null, (v) =>
    BASES_TESORO.includes(v)
  );

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="sr-only">Staff Búsqueda del Tesoro</h1>

      {tinaja == null ? (
        <SelectorEstacion
          etiqueta="Tinaja"
          numeros={BASES_TESORO}
          seleccionada={tinaja}
          onSeleccionar={setTinaja}
        />
      ) : (
        <>
          <EstacionTesoro key={tinaja} tinaja={tinaja} />
          <button
            type="button"
            onClick={() => setTinaja(null)}
            className="mx-auto block text-sm text-slate-400 underline underline-offset-2 transition-colors hover:text-white"
          >
            Cambiar de tinaja
          </button>
        </>
      )}
    </main>
  );
}
