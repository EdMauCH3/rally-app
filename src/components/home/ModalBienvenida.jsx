import { useState } from 'react';
import { X } from 'lucide-react';

const VIDEO_ID = 'zC0JJGgnf9g';

export default function ModalBienvenida() {
  const [abierto, setAbierto] = useState(true);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-up">
      <div className="relative w-full max-w-3xl bg-brand-navy/95 border border-white/10 rounded-3xl shadow-2xl shadow-black/70 p-4 sm:p-6 space-y-4">
        <button
          onClick={() => setAbierto(false)}
          className="absolute -top-3 -right-3 sm:top-4 sm:right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl sm:text-2xl font-black text-white text-center pt-2">
          ¡Bienvenido a Interoratorios 2026!
        </h2>

        <div className="relative w-full overflow-hidden rounded-2xl aspect-video bg-black">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${VIDEO_ID}`}
            title="Video de bienvenida"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <button onClick={() => setAbierto(false)} className="btn-primary w-full !py-4 !text-lg">
          Cerrar
        </button>
      </div>
    </div>
  );
}
