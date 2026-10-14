import { useEffect, useState } from 'react';
import { ArrowRightLeft, Loader2, MapPin, Plus, Shuffle, Trash2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useCanchas } from '../../../hooks/useCanchas';
import {
  eliminarCancha,
  guardarCancha,
  reasignarCanchas,
  redistribuirCanchas,
} from '../../../services/canchasService';
import { colorTextoSobre } from '../../../services/torneoLogica';

const COLORES_RAPIDOS = ['#fbbf24', '#0ea5e9', '#22c55e', '#ef4444', '#a855f7', '#f97316', '#14b8a6', '#ec4899'];

function pendientesDe(partidos, id) {
  return partidos.filter((p) => p.cancha === id && !p.finalizado && !p.en_juego && !p.borrador).length;
}
function totalDe(partidos, id) {
  return partidos.filter((p) => p.cancha === id).length;
}

function FilaCancha({ cancha, partidos, onGuardada, onEliminada }) {
  const { showToast } = useToast();
  const [nombre, setNombre] = useState(cancha.nombre);
  const [color, setColor] = useState(cancha.color);
  const [activa, setActiva] = useState(cancha.activa);
  const [trabajando, setTrabajando] = useState(false);
  const cambios = nombre.trim() !== cancha.nombre || color !== cancha.color || activa !== cancha.activa;
  const pend = pendientesDe(partidos, cancha.id);

  useEffect(() => {
    setNombre(cancha.nombre);
    setColor(cancha.color);
    setActiva(cancha.activa);
  }, [cancha.nombre, cancha.color, cancha.activa]);

  async function guardar() {
    setTrabajando(true);
    try {
      await guardarCancha({ id: cancha.id, nombre, color, activa });
      showToast('Lugar guardado', 'success');
      onGuardada();
    } catch (err) {
      showToast(err.message ?? 'No se pudo guardar el lugar', 'error');
    } finally {
      setTrabajando(false);
    }
  }

  async function eliminar() {
    if (!window.confirm(`¿Eliminar "${cancha.nombre}"?`)) return;
    setTrabajando(true);
    try {
      await eliminarCancha(cancha.id);
      showToast('Lugar eliminado', 'success');
      onEliminada();
    } catch (err) {
      showToast(err.message ?? 'No se pudo eliminar el lugar', 'error');
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <div className={`glass-row space-y-3 p-3 ${activa ? '' : 'opacity-70'}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wide ring-2 ring-white/40"
          style={{ backgroundColor: color, color: colorTextoSobre(color) }}
        >
          <MapPin size={12} /> {nombre.trim() || 'Sin nombre'}
        </span>
        <span className="text-xs text-slate-400">
          {totalDe(partidos, cancha.id)} {totalDe(partidos, cancha.id) === 1 ? 'partido' : 'partidos'} · {pend} {pend === 1 ? 'pendiente' : 'pendientes'}
        </span>
        {!activa && <span className="rounded bg-red-500/20 px-1.5 text-[10px] font-bold uppercase text-red-300">Desactivado</span>}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <label className="field-label">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={30} className="field" />
        </div>
        <div>
          <label className="field-label">Color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg bg-transparent" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm text-slate-200">
          <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
          Disponible
        </label>
      </div>

      {!activa && pend > 0 && (
        <p className="text-xs text-amber-300">
          Tiene {pend} partido(s) pendiente(s). Pásalos a otro lugar con "Pasar pendientes" (arriba) o con "Redistribuir".
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={guardar} disabled={!cambios || trabajando} className="btn-primary !px-4 !py-2 text-sm disabled:opacity-40">
          {trabajando && <Loader2 className="animate-spin" size={15} />}
          Guardar
        </button>
        <button type="button" onClick={eliminar} disabled={trabajando} className="btn-danger !px-3 !py-2 text-sm">
          <Trash2 size={15} /> Eliminar
        </button>
      </div>
    </div>
  );
}

/**
 * Lugares de juego (Admin y Director Técnico): agregar, renombrar, cambiar de color,
 * marcar como no disponible y mover los partidos pendientes si ese día cambia el espacio.
 */
export default function CanchasAdmin({ partidos, onCambio }) {
  const { showToast } = useToast();
  const { canchas, activas, recargar } = useCanchas();
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoColor, setNuevoColor] = useState(COLORES_RAPIDOS[2]);
  const [desde, setDesde] = useState('');
  const [hacia, setHacia] = useState('');
  const [trabajando, setTrabajando] = useState(false);

  async function refrescar() {
    await recargar();
    onCambio();
  }

  async function agregar(e) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return showToast('Ponle un nombre al lugar', 'error');
    setTrabajando(true);
    try {
      await guardarCancha({ id: null, nombre: nuevoNombre, color: nuevoColor, activa: true });
      setNuevoNombre('');
      showToast('Lugar agregado. Ya puedes usarlo en nuevos partidos.', 'success');
      await refrescar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo agregar el lugar', 'error');
    } finally {
      setTrabajando(false);
    }
  }

  async function pasar() {
    if (!desde || !hacia || desde === hacia) return showToast('Elige un lugar de origen y otro de destino', 'error');
    setTrabajando(true);
    try {
      const n = await reasignarCanchas(Number(desde), Number(hacia));
      showToast(n === 0 ? 'No había partidos pendientes en ese lugar' : `${n} partido(s) pasaron al nuevo lugar`, n === 0 ? 'warning' : 'success');
      await refrescar();
    } catch (err) {
      showToast(err.message ?? 'No se pudieron pasar los partidos', 'error');
    } finally {
      setTrabajando(false);
    }
  }

  async function redistribuir() {
    if (!window.confirm('Se reparten los partidos pendientes de cada fecha entre los lugares disponibles. ¿Continuar?')) return;
    setTrabajando(true);
    try {
      const n = await redistribuirCanchas();
      showToast(n === 0 ? 'Ya estaban bien repartidos' : `${n} partido(s) cambiaron de lugar`, n === 0 ? 'warning' : 'success');
      await refrescar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo redistribuir', 'error');
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass-card space-y-1 p-4">
        <h2 className="flex items-center gap-2 font-bold text-white">
          <MapPin size={18} /> Lugares de juego
        </h2>
        <p className="text-sm text-slate-400">
          Cuántas canchas hay y cómo se llaman puede cambiar ese día. Los lugares disponibles se usan al generar el calendario, al agregar
          partidos y se muestran al público con su color. Cambios en vivo.
        </p>
      </div>

      <section className="space-y-3">
        {canchas.map((c) => (
          <FilaCancha key={c.id} cancha={c} partidos={partidos} onGuardada={refrescar} onEliminada={refrescar} />
        ))}
        {canchas.length === 0 && (
          <p className="glass-card p-4 text-center text-sm text-slate-400">
            No se pudieron cargar los lugares. Verifica que ya ejecutaste el SQL 46 en Supabase.
          </p>
        )}
      </section>

      <form onSubmit={agregar} className="glass-card space-y-3 p-4">
        <p className="font-bold text-white">Agregar un lugar</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="field-label">Nombre</label>
            <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} maxLength={30} placeholder="Ej. Cancha de arena" className="field" />
          </div>
          <div>
            <label className="field-label">Color</label>
            <input type="color" value={nuevoColor} onChange={(e) => setNuevoColor(e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg bg-transparent" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COLORES_RAPIDOS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              onClick={() => setNuevoColor(c)}
              className={`h-7 w-7 rounded-full border-2 ${nuevoColor === c ? 'border-white' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button type="submit" disabled={trabajando} className="btn-primary disabled:opacity-50">
          <Plus size={16} /> Agregar lugar
        </button>
      </form>

      <section className="glass-card space-y-4 p-4">
        <p className="font-bold text-white">Si un lugar deja de estar disponible</p>
        <div className="space-y-2">
          <p className="text-sm text-slate-400">Pasa los partidos pendientes de un lugar a otro (los ya jugados no se tocan).</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label className="field-label">Desde</label>
              <select value={desde} onChange={(e) => setDesde(e.target.value)} className="field">
                <option value="">Elige…</option>
                {canchas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({pendientesDe(partidos, c.id)} pend.)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Hacia</label>
              <select value={hacia} onChange={(e) => setHacia(e.target.value)} className="field">
                <option value="">Elige…</option>
                {activas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={pasar} disabled={trabajando} className="btn-secondary disabled:opacity-50">
              <ArrowRightLeft size={16} /> Pasar pendientes
            </button>
          </div>
        </div>
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-sm text-slate-400">
            O reparte todos los pendientes de cada fecha entre los lugares disponibles (útil si agregaste o quitaste canchas).
          </p>
          <button type="button" onClick={redistribuir} disabled={trabajando} className="btn-secondary disabled:opacity-50">
            <Shuffle size={16} /> Redistribuir pendientes
          </button>
        </div>
      </section>
    </div>
  );
}
