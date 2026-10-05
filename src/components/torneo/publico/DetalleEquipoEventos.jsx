import { EMOJI_TIPO, anotadoresAgrupados, golesDeEquipo, tarjetasDeEquipo } from './utilsTorneo';

/**
 * Lo que hizo un equipo en un partido, con el NOMBRE del jugador en cada
 * caso: goles ("Pedro 12' 30'"), amarillas y rojas ("Luis 8'").
 * Lo usan el marcador en vivo y el resumen desplegable.
 */
export default function DetalleEquipoEventos({ partido, equipoId, eventos }) {
  const goles = anotadoresAgrupados(golesDeEquipo(partido, equipoId, eventos));
  const tarjetas = tarjetasDeEquipo(partido, equipoId, eventos);

  if (goles.length === 0 && tarjetas.length === 0) return null;

  return (
    <ul className="space-y-0.5 text-sm text-slate-200">
      {goles.map((a) => (
        <li key={a.clave}>
          {EMOJI_TIPO.gol} <span className="font-medium">{a.nombre}</span>
          {a.autogol ? ' (a.g.)' : ''}{' '}
          <span className="text-slate-400">{a.minutos.map((m) => `${m}'`).join(' ')}</span>
        </li>
      ))}
      {tarjetas.map((t) => (
        <li key={t.id}>
          {EMOJI_TIPO[t.tipo]}{' '}
          <span className="font-medium">{t.jugador_nombre ?? 'Jugador'}</span>
          {t.automatica ? ' (2.ª amarilla)' : ''}{' '}
          <span className="text-slate-400">{t.minuto}'</span>
        </li>
      ))}
    </ul>
  );
}
