import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { crearEquipo, actualizarEquipo, eliminarEquipo } from '../../services/adminService';

const MAX_EQUIPOS = 4;

export default function EquiposCRUD({ equipos, onCambio }) {
  const { showToast } = useToast();
  const [editando, setEditando] = useState(null); // null | 'nuevo' | equipo
  const [nombre, setNombre] = useState('');
  const [colorHex, setColorHex] = useState('#6366F1');
  const [guardando, setGuardando] = useState(false);

  function abrirNuevo() {
    setEditando('nuevo');
    setNombre('');
    setColorHex('#6366F1');
  }

  function abrirEditar(equipo) {
    setEditando(equipo);
    setNombre(equipo.nombre);
    setColorHex(equipo.color_hex);
  }

  function cerrar() {
    setEditando(null);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando === 'nuevo') {
        await crearEquipo(nombre.trim(), colorHex);
        showToast('Equipo creado', 'success');
      } else {
        await actualizarEquipo(editando.id, { nombre: nombre.trim(), colorHex });
        showToast('Equipo actualizado', 'success');
      }
      cerrar();
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo guardar el equipo', 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(equipo) {
    if (!window.confirm(`¿Eliminar "${equipo.nombre}"? Esto borra también sus puntuaciones.`)) {
      return;
    }
    try {
      await eliminarEquipo(equipo.id);
      showToast('Equipo eliminado', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo eliminar el equipo', 'error');
    }
  }

  const puedeCrear = equipos.length < MAX_EQUIPOS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-200">
          Equipos <span className="text-slate-500">({equipos.length}/{MAX_EQUIPOS})</span>
        </h2>
        <button onClick={abrirNuevo} disabled={!puedeCrear} className="btn-primary !px-3 !py-2 text-sm">
          <Plus size={16} /> Nuevo equipo
        </button>
      </div>

      {!puedeCrear && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
          Ya existen los 4 equipos del evento. Elimina uno para poder crear otro.
        </p>
      )}

      <div className="grid gap-3">
        {equipos.map((equipo) => (
          <div
            key={equipo.id}
            className="glass-card-hover flex items-center justify-between p-4"
            style={{ borderColor: `${equipo.color_hex}55` }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: equipo.color_hex, boxShadow: `0 0 10px ${equipo.color_hex}` }}
              />
              <span className="font-semibold text-slate-100">{equipo.nombre}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => abrirEditar(equipo)} className="btn-ghost !px-2">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleEliminar(equipo)} className="btn-ghost !px-2 hover:!text-red-400">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 px-4">
          <form onSubmit={handleGuardar} className="glass-card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">
                {editando === 'nuevo' ? 'Nuevo equipo' : 'Editar equipo'}
              </h3>
              <button type="button" onClick={cerrar} className="text-slate-500 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="field-label">Nombre</label>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="field"
                placeholder="Equipo Rojo"
              />
            </div>

            <div className="space-y-1.5">
              <label className="field-label">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10"
                />
                <input
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="field flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <button type="submit" disabled={guardando} className="btn-primary w-full">
              {guardando && <Loader2 className="animate-spin" size={18} />}
              Guardar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
