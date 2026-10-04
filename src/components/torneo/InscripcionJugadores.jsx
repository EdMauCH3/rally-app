import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { listarRosterTorneo } from '../../services/torneoService';
import {
  listarEstadoJugadores,
  crearJugador,
  actualizarJugador,
  eliminarJugador,
  suscribirseTorneoPro,
} from '../../services/torneoProService';
import EquipoSelector from '../gymkana/EquipoSelector';

function siguienteDorsalLibre(lista) {
  const usados = new Set(lista.map((j) => j.dorsal));
  for (let n = 1; n <= 99; n += 1) {
    if (!usados.has(n)) return n;
  }
  return '';
}

function mensajeDeError(err) {
  // 23505 = violación de unicidad: el dorsal ya existe en ese equipo.
  if (err?.code === '23505') return 'Ese dorsal ya lo tiene otro jugador de este equipo.';
  return err?.message ?? 'No se pudo guardar el jugador';
}

export default function InscripcionJugadores() {
  const { showToast } = useToast();
  const [roster, setRoster] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [equipoId, setEquipoId] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [nuevo, setNuevo] = useState({ dorsal: '', nombre: '' });
  const [editandoId, setEditandoId] = useState(null);
  const [edicion, setEdicion] = useState({ dorsal: '', nombre: '' });
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const nombreRef = useRef(null);

  const cargar = useCallback(() => {
    Promise.all([listarRosterTorneo(), listarEstadoJugadores()])
      .then(([r, j]) => {
        setRoster(r);
        setJugadores(j);
      })
      .catch(() => showToast('No se pudo cargar la plantilla', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseTorneoPro(cargar);
    return unsubscribe;
  }, [cargar]);

  const equipo = roster.find((e) => e.id === equipoId) ?? null;
  const delEquipo = jugadores.filter((j) => j.equipo_torneo_id === equipoId);
  const sancionados = delEquipo.filter((j) => j.sancionado);

  function elegirEquipo(eq) {
    setEquipoId(eq.id);
    setEditandoId(null);
    const lista = jugadores.filter((j) => j.equipo_torneo_id === eq.id);
    setNuevo({ dorsal: String(siguienteDorsalLibre(lista)), nombre: '' });
  }

  async function handleAgregar(e) {
    e.preventDefault();
    const nombre = nuevo.nombre.trim();
    const dorsal = Number(nuevo.dorsal);
    if (!nombre) {
      showToast('Escribe el nombre del jugador', 'error');
      return;
    }
    if (nuevo.dorsal === '' || !Number.isInteger(dorsal) || dorsal < 0 || dorsal > 99) {
      showToast('El dorsal debe ser un número entre 0 y 99', 'error');
      return;
    }

    setGuardando(true);
    try {
      await crearJugador({ equipoTorneoId: equipoId, nombre, dorsal });
      const lista = [...delEquipo, { dorsal }];
      setNuevo({ dorsal: String(siguienteDorsalLibre(lista)), nombre: '' });
      cargar();
      nombreRef.current?.focus(); // listo para el siguiente jugador
    } catch (err) {
      showToast(mensajeDeError(err), 'error');
    } finally {
      setGuardando(false);
    }
  }

  function abrirEdicion(j) {
    setEditandoId(j.jugador_id);
    setEdicion({ dorsal: String(j.dorsal), nombre: j.nombre });
  }

  async function handleGuardarEdicion(j) {
    const nombre = edicion.nombre.trim();
    const dorsal = Number(edicion.dorsal);
    if (!nombre) {
      showToast('El nombre no puede quedar vacío', 'error');
      return;
    }
    if (edicion.dorsal === '' || !Number.isInteger(dorsal) || dorsal < 0 || dorsal > 99) {
      showToast('El dorsal debe ser un número entre 0 y 99', 'error');
      return;
    }

    setProcesandoId(j.jugador_id);
    try {
      await actualizarJugador(j.jugador_id, { nombre, dorsal });
      setEditandoId(null);
      cargar();
    } catch (err) {
      showToast(mensajeDeError(err), 'error');
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleEliminar(j) {
    const tieneEventos = j.goles + j.amarillas + j.rojas > 0;
    const aviso = tieneEventos
      ? `¿Borrar a #${j.dorsal} ${j.nombre}? Tiene goles o tarjetas registrados: el historial los conserva con su nombre.`
      : `¿Borrar a #${j.dorsal} ${j.nombre} de la plantilla?`;
    if (!window.confirm(aviso)) return;

    setProcesandoId(j.jugador_id);
    try {
      await eliminarJugador(j.jugador_id);
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo borrar al jugador', 'error');
    } finally {
      setProcesandoId(null);
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
    <div className="max-w-2xl mx-auto px-4 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-black text-white">Inscripción de jugadores</h2>
        <p className="text-sm text-slate-400">Elige un equipo y arma su plantilla.</p>
      </div>

      <EquipoSelector equipos={roster} equipoSeleccionado={equipo} onSeleccionar={elegirEquipo} />

      {equipo && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: equipo.color_hex, boxShadow: `0 0 8px ${equipo.color_hex}` }}
              />
              {equipo.nombre}
            </h3>
            <span className="text-sm text-slate-400">
              {delEquipo.length} {delEquipo.length === 1 ? 'jugador' : 'jugadores'}
            </span>
          </div>

          {sancionados.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-300" />
              <p className="text-sm text-red-200">
                {sancionados.length === 1
                  ? '1 jugador sancionado: el equipo jugará con uno menos'
                  : `${sancionados.length} jugadores sancionados: el equipo jugará con ${sancionados.length} menos`}{' '}
                en su próximo partido.
              </p>
            </div>
          )}

          <form
            onSubmit={handleAgregar}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
          >
            <p className="text-sm font-semibold text-white">Agregar jugador</p>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                value={nuevo.dorsal}
                onChange={(e) => setNuevo((n) => ({ ...n, dorsal: e.target.value }))}
                placeholder="N°"
                aria-label="Número de camiseta"
                className="field !w-20 text-center !text-lg !font-bold"
              />
              <input
                ref={nombreRef}
                value={nuevo.nombre}
                onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
                placeholder="Nombre del jugador"
                aria-label="Nombre del jugador"
                className="field"
              />
            </div>
            <button type="submit" disabled={guardando} className="btn-primary w-full">
              {guardando ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              Agregar
            </button>
          </form>

          <div className="space-y-2">
            {delEquipo.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">
                Este equipo aún no tiene jugadores inscritos.
              </p>
            )}

            {delEquipo.map((j) =>
              editandoId === j.jugador_id ? (
                <div key={j.jugador_id} className="glass-row px-3 py-2.5 flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={99}
                    value={edicion.dorsal}
                    onChange={(e) => setEdicion((d) => ({ ...d, dorsal: e.target.value }))}
                    aria-label="Número de camiseta"
                    className="field !w-16 !px-2 text-center font-bold"
                  />
                  <input
                    value={edicion.nombre}
                    onChange={(e) => setEdicion((d) => ({ ...d, nombre: e.target.value }))}
                    aria-label="Nombre del jugador"
                    className="field !px-3"
                  />
                  <button
                    type="button"
                    onClick={() => handleGuardarEdicion(j)}
                    disabled={procesandoId === j.jugador_id}
                    className="p-2 text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all duration-300 disabled:opacity-50"
                    aria-label="Guardar cambios"
                  >
                    {procesandoId === j.jugador_id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Check size={18} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditandoId(null)}
                    className="p-2 text-slate-400 hover:bg-white/10 rounded-lg transition-all duration-300"
                    aria-label="Cancelar"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  key={j.jugador_id}
                  className={`glass-row px-3 py-2.5 flex items-center gap-3 ${
                    j.sancionado ? '!border-red-500/40 !bg-red-500/[0.06]' : ''
                  }`}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white drop-shadow"
                    style={{ backgroundColor: equipo.color_hex }}
                  >
                    {j.dorsal}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{j.nombre}</p>
                    {(j.goles > 0 || j.amarillas > 0 || j.rojas > 0) && (
                      <p className="text-xs text-slate-400 flex gap-3">
                        {j.goles > 0 && <span>⚽ {j.goles}</span>}
                        {j.amarillas > 0 && <span>🟨 {j.amarillas}</span>}
                        {j.rojas > 0 && <span>🟥 {j.rojas}</span>}
                      </p>
                    )}
                    {j.sancionado && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-red-300">
                        <AlertTriangle size={12} />
                        Sancionado: no juega el partido #{j.partido_sancion_num}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirEdicion(j)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                    aria-label="Editar jugador"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(j)}
                    disabled={procesandoId === j.jugador_id}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 disabled:opacity-50"
                    aria-label="Borrar jugador"
                  >
                    {procesandoId === j.jugador_id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
