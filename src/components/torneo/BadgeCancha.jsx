import { MapPin } from 'lucide-react';
import { colorTextoSobre, nombreCancha } from '../../services/torneoLogica';
import { useCanchas } from '../../hooks/useCanchas';

// Colores de respaldo (mientras carga la lista o si el SQL 46 aún no se ejecutó).
const COLOR_DEFECTO = { 1: '#fbbf24', 2: '#0ea5e9' };
const TAMANO = {
  grande: 'gap-2 px-4 py-2 text-lg',
  normal: 'gap-1.5 px-3 py-1 text-sm',
  mini: 'gap-1 px-2 py-0.5 text-[11px]',
};
const ICONO = { grande: 20, normal: 15, mini: 11 };

/**
 * Etiqueta del lugar de juego ("COLISEO", "CANCHA AZUL"…), grande y de alto contraste para
 * que los participantes encuentren su cancha en el celular. Nombre y color los define el
 * Admin / Director Técnico, así que cambian en vivo.
 */
export default function BadgeCancha({ cancha, tamano = 'normal', className = '' }) {
  const { porId } = useCanchas();
  const fondo = porId.get(cancha)?.color ?? COLOR_DEFECTO[cancha] ?? '#cbd5e1';
  return (
    <span
      className={`inline-flex items-center rounded-xl font-black uppercase leading-none tracking-wide shadow-lg ring-2 ring-white/40 ${TAMANO[tamano]} ${className}`}
      style={{ backgroundColor: fondo, color: colorTextoSobre(fondo) }}
    >
      <MapPin size={ICONO[tamano]} className="shrink-0" aria-hidden="true" />
      {nombreCancha(cancha)}
    </span>
  );
}
