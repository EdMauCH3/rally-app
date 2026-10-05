import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useEstadoPersistente } from '../hooks/useEstadoPersistente';
import { useToast } from '../context/ToastContext';
import { listarSubEquiposColorPorActividad } from '../services/subEquiposColorService';
import EquipoSelector from '../components/gymkana/EquipoSelector';
import FlujoTinajasEquipo from '../components/tesoro/FlujoTinajasEquipo';

/**
 * Búsqueda del Tesoro (Tinajas y Pistas) en el panel del animador: se elige el
 * equipo y se le acompaña tinaja por tinaja (ver FlujoTinajasEquipo).
 */
export default function TesoroPage() {
  const { showToast } = useToast();

  const [equipos, setEquipos] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useEstadoPersistente(
    'rally_ui_tesoro_equipo',
    null
  );
  const [cargandoEquipos, setCargandoEquipos] = useState(true);

  useEffect(() => {
    listarSubEquiposColorPorActividad('tesoro')
      .then(setEquipos)
      .catch(() => showToast('No se pudieron cargar los colores de Tesoro', 'error'))
      .finally(() => setCargandoEquipos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El equipo recordado puede haber cambiado de color o ya no existir:
  // se resincroniza con la lista real una vez cargada.
  useEffect(() => {
    if (cargandoEquipos || !equipoSeleccionado) return;
    const vigente = equipos.find((e) => e.id === equipoSeleccionado.id);
    if (!vigente) {
      setEquipoSeleccionado(null);
    } else if (
      vigente.nombre !== equipoSeleccionado.nombre ||
      vigente.color_hex !== equipoSeleccionado.color_hex
    ) {
      setEquipoSeleccionado(vigente);
    }
  }, [cargandoEquipos, equipos, equipoSeleccionado, setEquipoSeleccionado]);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="sr-only">Staff Búsqueda del Tesoro</h1>

      {cargandoEquipos ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      ) : (
        <EquipoSelector
          equipos={equipos}
          equipoSeleccionado={equipoSeleccionado}
          onSeleccionar={setEquipoSeleccionado}
        />
      )}

      {equipoSeleccionado && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-semibold text-slate-200">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: equipoSeleccionado.color_hex }}
            />
            {equipoSeleccionado.nombre}
          </h2>
          {/* key = equipo: al cambiar de equipo se reinicia todo el estado del flujo */}
          <FlujoTinajasEquipo key={equipoSeleccionado.id} equipo={equipoSeleccionado} />
        </section>
      )}
    </main>
  );
}
