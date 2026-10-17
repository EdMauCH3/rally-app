import { useState } from 'react';
import {
  ChevronDown, Info, BookOpen, Flag, Map, Trophy, Eye, Pause, Bell, GraduationCap, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Cada sección = un rol (o "todos"). `pasos` son tarjetas numeradas; `avisos` son recuadros de color.
const SECCIONES = [
  {
    id: 'basico',
    titulo: 'Navegación básica y estados generales',
    roles: [],
    etiqueta: 'Todos',
    color: 'bg-sky-400/20 text-sky-200 border-sky-300/30',
    Icono: Info,
    intro: 'Lo que todo voluntario debe saber antes de empezar.',
    pasos: [
      ['Qué significa cada pestaña', 'Información General: este manual. Actividades: tu módulo de trabajo (Gymkana, Tinajas o Torneo según tu rol). Control Gymkana: consola de la coordinación. Torneo (DT): gestión completa del torneo. Formación: estación formativa. Cronograma: horarios del día. Ayuda: avisa a la coordinación si tienes un problema.'],
      ['Dónde consultar el cronograma', 'Abre la pestaña "Cronograma". Tiene dos bloques: Cronograma general y Fest Color. Puedes verlo en tarjetas o en tabla, y el momento en curso aparece marcado como AHORA.'],
      ['Notificaciones globales', 'Cuando la coordinación envía un aviso a todos, aparece una notificación en pantalla. Léela hasta el final y sigue la indicación.'],
    ],
    avisos: [
      { tono: 'amber', titulo: 'Pausa de emergencia', texto: 'Si ves el aviso "Actividad pausada por coordinación": permanece en tu sitio, no registres nada y espera. Cuando la coordinación reanude, la pantalla vuelve sola; NO recargues la página.' },
    ],
  },
  {
    id: 'formacion',
    titulo: 'Módulo de Formación',
    roles: ['formacion'],
    etiqueta: 'Rol Formación',
    color: 'bg-violet-400/20 text-violet-200 border-violet-300/30',
    Icono: GraduationCap,
    intro: 'Pestaña "Formación".',
    pasos: [
      ['Selecciona tu estación formativa', 'Elige la base que te corresponde. Queda guardada para que no tengas que escogerla de nuevo.'],
      ['Recuerda: es solo informativo', 'Este módulo no asigna puntos. Sirve para saber qué grupo llega y cuándo rota.'],
      ['Interpreta la tarjeta', 'La tarjeta muestra qué grupo viene, el nombre de su color y el tiempo de rotación en curso.'],
    ],
  },
  {
    id: 'gymkana',
    titulo: 'Gymkana sincronizada',
    roles: ['staff_gymkana', 'coordinador_gymkana'],
    etiqueta: 'Staff Gymkana y Coordinación',
    color: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/30',
    Icono: Flag,
    intro: 'Pestaña "Actividades" → Gymkana.',
    pasos: [
      ['Elige tu base fija', 'Selecciona la Base 1 a 6 que te asignaron. Verás su nombre temático y su ubicación física ("Lugar").'],
      ['Estado de espera', 'Si dice "Aún no viene ningún equipo", quédate en tu base: el sistema te avisará cuando llegue el siguiente.'],
      ['Recibe a los sub-equipos', 'Aparece el duelo (por ejemplo, Azul 1 vs Rojo 2) con un pitazo y un parpadeo visual. Recibe a ambos equipos en tu base.'],
      ['Califica el duelo', 'Registra el resultado y confirma. Al confirmar, el formulario se bloquea solo para evitar duplicados.'],
      ['Cronómetro sincronizado', 'Verás el tiempo de la estación (20 minutos por defecto) igual que todos. Tras calificar, espera la señal de rotación general de la coordinación.'],
    ],
    avisos: [
      { tono: 'emerald', titulo: 'Coordinación', texto: 'La coordinación (rol coordinador) inicia cada rotación, define cuántos minutos dura la estación y declara la última base desde "Control Gymkana".' },
    ],
  },
  {
    id: 'tinajas',
    titulo: 'Las Tinajas Perdidas',
    roles: ['staff_tesoro'],
    etiqueta: 'Staff Tinajas (juez fijo)',
    color: 'bg-amber-400/20 text-amber-200 border-amber-300/30',
    Icono: Map,
    intro: 'Pestaña "Actividades" → Las Tinajas Perdidas.',
    pasos: [
      ['Selecciona tu tinaja fija', 'Elige la Tinaja 1 a 10 que te asignaron; cada una tiene su propio nombre.'],
      ['Espera al equipo', 'Cuando el grupo esté frente a ti, pulsa "Marcar llegada".'],
      ['Asigna las gotas', 'Asigna las gotas que corresponden según el resultado del equipo.'],
      ['Siguiente destino', 'El sistema le asigna automáticamente al equipo su próximo destino. No tienes que decirle nada más.'],
      ['Cuándo recoger la base', 'Cuando aparezca "Todos los equipos han pasado por esta tinaja", ya puedes recoger y apoyar el resto del evento.'],
    ],
  },
  {
    id: 'torneo',
    titulo: 'Torneo de microfútbol',
    roles: ['arbitro', 'director_tecnico'],
    etiqueta: 'Árbitro y Director Técnico',
    color: 'bg-rose-400/20 text-rose-200 border-rose-300/30',
    Icono: Trophy,
    intro: 'Pestaña "Actividades" → Torneo (árbitro) o pestaña "Torneo (DT)".',
    pasos: [
      ['Inscribe a los jugadores', 'Busca por Macro-equipo o grupo, escribe el dorsal (#) y el nombre, y guarda.'],
      ['Abre el partido en vivo', 'En el modal En Vivo inicia o pausa el cronómetro oficial.'],
      ['Registra los eventos', 'Goles (con su autor) y faltas: tarjetas amarillas y rojas, siempre con el nombre del infractor.'],
      ['Canchas oficiales', 'Coliseo (Cancha 1) y Cancha Azul (Cancha 2).'],
      ['Definición por penales', 'En los partidos finales (Fecha 10 y Fecha 11) aparece el botón de definición por penales.'],
    ],
    avisos: [
      { tono: 'rose', titulo: 'Recordatorio disciplinario', texto: 'La tarjeta roja resta 1 punto al macro-equipo e inhabilita al jugador para el siguiente encuentro.' },
    ],
  },
  {
    id: 'publico',
    titulo: 'Vista pública y participantes',
    roles: [],
    etiqueta: 'Todos',
    color: 'bg-sky-400/20 text-sky-200 border-sky-300/30',
    Icono: Eye,
    intro: 'Lo que ven los jóvenes en la web pública, por si te preguntan.',
    pasos: [
      ['Las Tinajas Perdidas', 'Cada equipo ve su mapa de ruta y su próximo destino.'],
      ['Gymkana', 'Cada equipo ve la próxima base a la que debe ir.'],
      ['Torneo', 'Se ve el bracket tipo FIFA con los partidos y resultados.'],
      ['Marcador general', 'Tabla acumulada por Macro-equipos con los puntos de todas las actividades.'],
    ],
  },
];

const AVISO = {
  amber: 'border-amber-300/40 bg-amber-400/10 text-amber-100',
  emerald: 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100',
  rose: 'border-rose-300/40 bg-rose-400/10 text-rose-100',
};

export default function BloqueInformacionGeneral() {
  const { perfil } = useAuth();
  const rol = perfil?.rol;
  const miSeccion = SECCIONES.find((s) => s.roles.includes(rol))?.id;
  const [abierta, setAbierta] = useState(miSeccion ?? 'basico');

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <header className="space-y-1 text-center sm:text-left">
        <h2 className="flex items-center justify-center sm:justify-start gap-2 text-2xl font-black text-white">
          <BookOpen size={24} className="text-blue-300" /> Información General
        </h2>
        <p className="text-sm text-slate-400">
          Guía paso a paso para resolver tus dudas sin llamar a la coordinación. Toca una sección para abrirla.
        </p>
      </header>

      <ul className="space-y-3">
        {SECCIONES.map((s) => {
          const abre = abierta === s.id;
          const esMia = s.id === miSeccion;
          return (
            <li key={s.id}>
              <section className={`glass-card overflow-hidden ${esMia ? 'ring-2 ring-blue-400/60' : ''}`}>
                <button
                  onClick={() => setAbierta(abre ? null : s.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                  aria-expanded={abre}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                    <s.Icono size={20} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-lg font-black text-white leading-snug">{s.titulo}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${s.color}`}>{s.etiqueta}</span>
                      {esMia && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-black text-white">
                          <Sparkles size={11} /> Tu rol
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronDown size={20} className={`shrink-0 text-slate-400 transition-transform ${abre ? 'rotate-180' : ''}`} />
                </button>

                {abre && (
                  <div className="border-t border-white/10 bg-black/15 p-4 space-y-4">
                    <p className="text-sm text-slate-300">{s.intro}</p>
                    <ol className="space-y-3">
                      {s.pasos.map(([t, d], i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-sm font-black text-blue-200">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-bold text-white">{t}</p>
                            <p className="text-sm text-slate-300 leading-relaxed">{d}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {s.avisos?.map((a) => (
                      <div key={a.titulo} className={`rounded-2xl border p-3.5 ${AVISO[a.tono]}`}>
                        <p className="flex items-center gap-2 font-black">
                          {a.tono === 'amber' ? <Pause size={16} /> : <Bell size={16} />} {a.titulo}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">{a.texto}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
