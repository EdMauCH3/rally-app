import { Droplet } from 'lucide-react';

/**
 * Gota azul: la unidad de puntuación de Las Tinajas Perdidas.
 * `llena` la rellena y le da un resplandor; vacía queda solo el contorno.
 */
export default function IconoGota({ size = 20, llena = true, className = 'text-cyan-400', ...props }) {
  return (
    <Droplet
      size={size}
      aria-hidden="true"
      className={className}
      fill={llena ? 'currentColor' : 'none'}
      fillOpacity={llena ? 0.55 : 0}
      style={llena ? { filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.65))' } : undefined}
      {...props}
    />
  );
}
