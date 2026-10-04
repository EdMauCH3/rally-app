import { AtSign, Globe } from 'lucide-react';

// TODO: reemplazar por las URLs reales cuando las tengas.
const INSTAGRAM_URL = '#';
const WEB_URL = '#';

export default function Footer() {
  return (
    <footer className="bg-stone-900 border-t border-white/5 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <img src="/icon.png" alt="Interoratorios 2026" className="h-10 w-10 object-contain opacity-90" />
          <div>
            <p className="font-semibold text-stone-200">Interoratorios 2026</p>
            <p className="text-sm text-stone-400">Rally de Competencia</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-stone-300 hover:text-stone-100 transition-colors duration-300"
          >
            <AtSign size={18} />
            <span className="text-sm font-medium">Instagram</span>
          </a>
          <a
            href={WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-stone-300 hover:text-stone-100 transition-colors duration-300"
          >
            <Globe size={18} />
            <span className="text-sm font-medium">Sitio web</span>
          </a>
        </div>
      </div>

      <div className="border-t border-white/5 py-4 text-center">
        <p className="text-xs text-stone-500">
          © {new Date().getFullYear()} Interoratorios. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
