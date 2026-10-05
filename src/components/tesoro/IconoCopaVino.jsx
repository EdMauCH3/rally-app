/**
 * Copa de vino con el vino adentro (la mitad inferior rellena). SVG propio,
 * con el mismo estilo de trazo de los íconos de la app, para no depender de
 * que la versión instalada de lucide-react traiga un ícono de copa.
 * La copa toma el color del texto (currentColor, se tiñe con `className`);
 * el vino tiene su propio color (`colorVino`).
 */
export default function IconoCopaVino({
  size = 24,
  className = '',
  colorVino = '#b0245a', // granate: que se lea como vino, no como sangre
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* el vino */}
      <path d="M7 10h10a5 5 0 0 1-10 0Z" fill={colorVino} stroke="none" />
      {/* base, tallo, nivel del vino y copa */}
      <path d="M8 22h8" />
      <path d="M12 15v7" />
      <path d="M7 10h10" />
      <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" />
    </svg>
  );
}
