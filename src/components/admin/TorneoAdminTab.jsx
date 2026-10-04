import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { actualizarConfiguracionApp } from '../../services/configuracionAppService';
import { useModoTorneoPro } from '../../hooks/useModoTorneoPro';
import ModoTorneoProSwitch from './ModoTorneoProSwitch';
import HistorialEventosTorneo from './HistorialEventosTorneo';
import GestionEquiposTorneo from './GestionEquiposTorneo';
import TorneoPage from '../../pages/TorneoPage';

export default function TorneoAdminTab() {
  const { showToast } = useToast();
  const { modoPro, setModoPro, cargando } = useModoTorneoPro();
  const [guardando, setGuardando] = useState(false);

  async function handleCambiarModo(valor) {
    const previo = modoPro;
    setModoPro(valor); // actualización optimista
    setGuardando(true);
    try {
      await actualizarConfiguracionApp({ torneo_modo_pro: valor });
      showToast(valor ? 'Modo Torneo Pro encendido' : 'Modo Torneo Pro apagado', 'success');
    } catch (err) {
      setModoPro(previo); // revertir si la escritura falla
      showToast(err.message ?? 'No se pudo cambiar el modo', 'error');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto">
        <ModoTorneoProSwitch
          activo={modoPro}
          guardando={guardando}
          onCambiar={handleCambiarModo}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-center font-semibold text-white">Fixture y partidos</h2>
        <TorneoPage />
      </section>

      <HistorialEventosTorneo modoPro={modoPro} />

      <GestionEquiposTorneo />
    </div>
  );
}
