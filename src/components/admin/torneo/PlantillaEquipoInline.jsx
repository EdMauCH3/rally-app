import { useRef, useState } from 'react';
import { Check, Loader2, Pencil, Plus, ShieldAlert, Trash2, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { actualizarJugador, crearJugador, eliminarJugador } from '../../../services/torneoProService';

function siguienteDorsalLibre(lista) {
  const usados = new Set(lista.map((j) => j.dorsal));
  for (let n = 1; n <= 99; n += 1) if (!usados.has(n)) return n;
  return '';
}

function mensajeDeError(err) {
  if (err?.code === '23505') return 'Ese dorsal ya lo tiene otro jugador de este equipo.';
  return err?.message ?? 'No se pudo guardar el jugador';
}

function validar(nombre, dorsalTexto) {
  if (!nombre.trim()) return 'Escribe el nombre completo del jugador';
  const d = Number(dorsalTexto);
  if (dorsalTexto === '' || !Number.isInteger(d) || d < 0 || d > 99) return 'El dorsal debe ser un número entre 0 y 99';
  return null;
}

/**
 * Paso 3 del flujo Macro-equipo → Equipo → Plantilla: los jugadores del equipo
 * (nombre completo + dorsal), con alta rápida: Enter guarda y deja el cursor
 * listo para el siguiente.
 */
export default function PlantillaEquipoInline({ equipo, jugadores, onCambio }) {
  const { showToast } = useToast();
  const lista = [...jugadores].sort((a, b) => a.dorsal - b.dorsal);
  const [nuevo, setNuevo] = useState({ nombre: '', dorsal: String(siguienteDorsalLibre(lista)) });
  const [editando, setEditando] = useState(null); // { id, nombre, dorsal }
  const [ocupado, setOcupado] = useState(null);
  const nombreRef = useRef(null);

  async function agregar(e) {
    e.preventDefault();
    const problema = validar(nuevo.nombre, nuevo.dorsal);
    if (problema) return showToast(problema, 'error');
    setOcupado('nuevo');
    try {
      await crearJugador({ equipoTorneoId: equipo.id, nombre: nuevo.nombre.trim(), dorsal: Number(nuevo.dorsal) });
      setNuevo({ nombre: '', dorsal: String(siguienteDorsalLibre([...lista, { dorsal: Number(nuevo.dorsal) }])) });
      onCambio();
      nombreRef.current?.focus();
    } catch (err) {
      showToast(mensajeDeError(err), 'error');
    } finally {
      setOcupado(null);
    }
  }

  async function guardarEdicion() {
    const problema = validar(editando.nombre, editando.dorsal);
    if (problema) return showToast(problema, 'error');
    setOcupado(editando.id);
    try {
      await actualizarJugador(editando.id, { nombre: editando.nombre.trim(), dorsal: Number(editando.dorsal) });
      setEditando(null);
      onCambio();
    } catch (err) {
      showToast(mensajeDeError(err), 'error');
    } finally {
      setOcupado(null);
    }
  }

  async function quitar(j) {
    const conEventos = j.goles + j.amarillas + j.rojas > 0;
    const aviso = conEventos
      ? `¿Borrar a #${j.dorsal} ${j.nombre}? Tiene goles o tarjetas: el historial los conserva con su nombre.`
      : `¿Borrar a #${j.dorsal} ${j.nombre} de la plantilla?`;
    if (!window.confirm(aviso)) return;
    setOcupado(j.jugador_id);
    try {
      await eliminarJugador(j.jugador_id);
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo borrar al jugador', 'error');
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-2.5 rounded-xl bg-black/20 p-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        Paso 3 · Plantilla de {equipo.nombre}
      </p>

      {lista.length === 0 && <p className="text-sm text-slate-400">Aún no hay jugadores inscritos.</p>}

      <ul className="space-y-1.5">
        {lista.map((j) =>
          editando?.id === j.jugador_id ? (
            <li key={j.jugador_id} className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                value={editando.dorsal}
                onChange={(e) => setEditando((x) => ({ ...x, dorsal: e.target.value }))}
                aria-label="Dorsal"
                className="field !w-16 shrink-0 !px-2 text-center"
              />
              <input
                value={editando.nombre}
                onChange={(e) => setEditando((x) => ({ ...x, nombre: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && guardarEdicion()}
                aria-label="Nombre completo"
                className="field min-w-0 flex-1 !px-3"
              />
              <button type="button" onClick={guardarEdicion} aria-label="Guardar" className="p-2 text-emerald-300">
                {ocupado === j.jugador_id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button type="button" onClick={() => setEditando(null)} aria-label="Cancelar" className="p-2 text-slate-400">
                <X size={16} />
              </button>
            </li>
          ) : (
            <li key={j.jugador_id} className="glass-row flex items-center gap-2.5 px-3 py-2 text-sm">
              <span className="w-7 shrink-0 text-right font-black tabular-nums text-slate-300">{j.dorsal}</span>
              <span className="min-w-0 flex-1 break-words font-medium leading-tight text-white">{j.nombre}</span>
              {j.sancionado && (
                <span title="Sancionado en su próximo partido" className="text-red-300">
                  <ShieldAlert size={14} />
                </span>
              )}
              <button
                type="button"
                onClick={() => setEditando({ id: j.jugador_id, nombre: j.nombre, dorsal: String(j.dorsal) })}
                aria-label={`Editar a ${j.nombre}`}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => quitar(j)}
                aria-label={`Borrar a ${j.nombre}`}
                className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
              >
                {ocupado === j.jugador_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </li>
          )
        )}
      </ul>

      <form onSubmit={agregar} className="flex items-center gap-2 pt-1">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={99}
          value={nuevo.dorsal}
          onChange={(e) => setNuevo((n) => ({ ...n, dorsal: e.target.value }))}
          aria-label="Dorsal"
          placeholder="N.º"
          className="field !w-16 shrink-0 !px-2 text-center"
        />
        <input
          ref={nombreRef}
          value={nuevo.nombre}
          onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
          aria-label="Nombre completo del jugador"
          placeholder="Nombre completo"
          maxLength={60}
          className="field min-w-0 flex-1 !px-3"
        />
        <button type="submit" disabled={ocupado === 'nuevo'} className="btn-primary shrink-0 !px-3.5" aria-label="Agregar jugador">
          {ocupado === 'nuevo' ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        </button>
      </form>
    </div>
  );
}
