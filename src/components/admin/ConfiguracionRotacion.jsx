import { useState } from 'react';
import { Loader2, Play, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { iniciarRotacion } from '../../services/coloresService';

const COLOR_DEFAULT = '#733f2d';
const MIN_BASES = 2;
const MAX_BASES = 12;

export default function ConfiguracionRotacion({ onListo }) {
  const { showToast } = useToast();
  const [cantidadBases, setCantidadBases] = useState(4);
  const [bases, setBases] = useState(
    Array.from({ length: 4 }, () => ({ nombre: '', lugar: '' }))
  );
  const [equipos, setEquipos] = useState([{ nombre: '', color_hex: COLOR_DEFAULT }]);
  const [minutos, setMinutos] = useState(5);
  const [segundos, setSegundos] = useState(0);
  const [enviando, setEnviando] = useState(false);

  function handleCantidadBases(valor) {
    const n = Math.max(MIN_BASES, Math.min(MAX_BASES, Number(valor) || MIN_BASES));
    setCantidadBases(n);
    setBases((prev) => {
      const copia = [...prev];
      while (copia.length < n) copia.push({ nombre: '', lugar: '' });
      return copia.slice(0, n);
    });
    // Si sobran equipos respecto a las nuevas actividades, se recortan
    setEquipos((prev) => (prev.length > n ? prev.slice(0, n) : prev));
  }

  function actualizarBase(i, campo, valor) {
    setBases((prev) => prev.map((b, idx) => (idx === i ? { ...b, [campo]: valor } : b)));
  }

  function agregarEquipo() {
    if (equipos.length >= cantidadBases) {
      showToast(`No puedes tener más equipos que actividades (${cantidadBases})`, 'warning');
      return;
    }
    setEquipos((prev) => [...prev, { nombre: '', color_hex: COLOR_DEFAULT }]);
  }

  function quitarEquipo(i) {
    setEquipos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function actualizarEquipo(i, campo, valor) {
    setEquipos((prev) => prev.map((e, idx) => (idx === i ? { ...e, [campo]: valor } : e)));
  }

  async function handleValidarEIniciar() {
    if (bases.some((b) => !b.nombre.trim() || !b.lugar.trim())) {
      showToast('Completa nombre y lugar de todas las actividades', 'error');
      return;
    }
    if (equipos.length === 0 || equipos.some((e) => !e.nombre.trim())) {
      showToast('Completa el nombre de todos los equipos', 'error');
      return;
    }

    const duracionSegundos = minutos * 60 + segundos;
    if (duracionSegundos <= 0) {
      showToast('Define un tiempo de rotación mayor a 0', 'error');
      return;
    }

    setEnviando(true);
    try {
      await iniciarRotacion({
        bases: bases.map((b) => ({ nombre: b.nombre.trim(), lugar: b.lugar.trim() })),
        equipos: equipos.map((e) => ({ nombre: e.nombre.trim(), color_hex: e.color_hex })),
        duracionSegundos,
      });
      showToast('¡Rotación iniciada!', 'success');
      onListo();
    } catch (err) {
      showToast(err.message ?? 'No se pudo iniciar la rotación', 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-card p-5 space-y-4">
        <h2 className="font-semibold text-white">1. Actividades</h2>

        <div className="space-y-1.5 max-w-[180px]">
          <label className="field-label">Cantidad de actividades</label>
          <input
            type="number"
            min={MIN_BASES}
            max={MAX_BASES}
            value={cantidadBases}
            onChange={(e) => handleCantidadBases(e.target.value)}
            className="field"
          />
        </div>

        <div className="space-y-3">
          {bases.map((b, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input
                placeholder={`Nombre actividad ${i + 1}`}
                value={b.nombre}
                onChange={(e) => actualizarBase(i, 'nombre', e.target.value)}
                className="field"
              />
              <input
                placeholder="Lugar"
                value={b.lugar}
                onChange={(e) => actualizarBase(i, 'lugar', e.target.value)}
                className="field"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">
            2. Equipos ({equipos.length}/{cantidadBases})
          </h2>
          <button
            type="button"
            onClick={agregarEquipo}
            disabled={equipos.length >= cantidadBases}
            className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>

        <div className="space-y-3">
          {equipos.map((eq, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={eq.color_hex}
                onChange={(e) => actualizarEquipo(i, 'color_hex', e.target.value)}
                className="w-11 h-11 rounded-lg cursor-pointer shrink-0 bg-transparent"
              />
              <input
                placeholder={`Nombre equipo ${i + 1}`}
                value={eq.nombre}
                onChange={(e) => actualizarEquipo(i, 'nombre', e.target.value)}
                className="field"
              />
              {equipos.length > 1 && (
                <button
                  type="button"
                  onClick={() => quitarEquipo(i)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg shrink-0 transition-all duration-300"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <h2 className="font-semibold text-white">3. Tiempo de rotación</h2>
        <div className="flex items-center gap-3">
          <div className="space-y-1.5">
            <label className="field-label">Minutos</label>
            <input
              type="number"
              min={0}
              value={minutos}
              onChange={(e) => setMinutos(Math.max(0, Number(e.target.value) || 0))}
              className="field w-24"
            />
          </div>
          <div className="space-y-1.5">
            <label className="field-label">Segundos</label>
            <input
              type="number"
              min={0}
              max={59}
              value={segundos}
              onChange={(e) =>
                setSegundos(Math.max(0, Math.min(59, Number(e.target.value) || 0)))
              }
              className="field w-24"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleValidarEIniciar}
        disabled={enviando}
        className="btn-primary w-full !py-5 !text-lg"
      >
        {enviando ? <Loader2 className="animate-spin" size={22} /> : <Play size={22} />}
        Validar e Iniciar Actividad
      </button>
    </div>
  );
}
