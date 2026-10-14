import { Globe } from 'lucide-react';

const WEB_SALESIANOS = 'https://salesianos.edu.co/';

const INSTAGRAMS = [
  { usuario: 'posfelipe_rinaldi', url: 'https://www.instagram.com/posfelipe_rinaldi/' },
  { usuario: 'rinaldiestereo', url: 'https://www.instagram.com/rinaldiestereo/' },
  { usuario: 'salesianoscom', url: 'https://www.instagram.com/salesianoscom/' },
];

/**
 * Icono de Instagram dibujado aquí mismo: las versiones recientes de lucide-react
 * retiraron los iconos de marcas, y un import que no existe rompería el pie de página.
 */
function IconoInstagram({ size = 18, className = '' }) {
  return (
    <svg
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
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const ENLACE =
  'group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 px-4 py-9 text-center">
        {/* Logotipos: Interoratorios + POS */}
        <div className="flex items-center justify-center gap-5 sm:gap-7">
          <img
            src="/icon.png"
            alt="Interoratorios 2026"
            className="h-14 w-14 object-contain opacity-95 sm:h-16 sm:w-16"
          />
          <span className="h-10 w-px bg-white/15" aria-hidden="true" />
          <img
            src="/pos.png"
            alt="POS"
            className="h-14 max-w-[9rem] object-contain opacity-95 sm:h-16 sm:max-w-[11rem]"
          />
        </div>

        <div className="space-y-1">
          <p className="font-semibold tracking-wide text-slate-100">Interoratorios 2026</p>
          <p className="font-serif text-lg italic text-slate-300">“Hagan lo que Él les diga”</p>
        </div>

        {/* Enlaces institucionales y redes */}
        <nav aria-label="Enlaces del evento" className="flex flex-wrap items-center justify-center gap-2.5">
          <a href={WEB_SALESIANOS} target="_blank" rel="noopener noreferrer" className={ENLACE}>
            <Globe size={18} className="transition-transform duration-300 group-hover:rotate-12" />
            Portal Salesiano
          </a>
          {INSTAGRAMS.map((ig) => (
            <a key={ig.usuario} href={ig.url} target="_blank" rel="noopener noreferrer" className={ENLACE}>
              <IconoInstagram size={18} className="transition-transform duration-300 group-hover:scale-110" />
              @{ig.usuario}
            </a>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-800/80 py-4 text-center">
        <p className="px-4 text-xs text-slate-500">
          © {new Date().getFullYear()} Interoratorios. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
