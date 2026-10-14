import { MapPin } from 'lucide-react';
import { nombreCancha } from '../../services/torneoLogica';

// Colores fijos y de alto contraste: así cada cancha se reconoce de un vistazo.
const ESTILO = {
  1: 'bg-amber-400 text-slate-950 ring-amber-200/60',
  2: 'bg-sky-500 text-white ring-sky-200/60',
};
const TAMANO = {
  grande: 'gap-2 px-4 py-2 text-lg',
  normal: 'gap-1.5 px-3 py-1 text-sm',
  mini: 'gap-1 px-2 py-0.5 text-[11px]',
};
const ICONO = { grande: 20, normal: 15, mini: 11 };

/**
 * Etiqueta de la cancha del partido ("COLISEO" o "CANCHA AZUL"), grande y de
 * alto contraste para que los participantes encuentren su cancha en el celular.
 */
export default function BadgeCancha({ cancha, tamano = 'normal', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-xl font-black uppercase leading-none tracking-wide shadow-lg ring-2 ${
        ESTILO[cancha] ?? 'bg-slate-300 text-slate-900 ring-white/40'
      } ${TAMANO[tamano]} ${className}`}
    >
      <MapPin size={ICONO[tamano]} className="shrink-0" aria-hidden="true" />
      {nombreCancha(cancha)}
    </span>
  );
}
