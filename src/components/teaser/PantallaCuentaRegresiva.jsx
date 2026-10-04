import { Link } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import ContadorTeaser from './ContadorTeaser';

/**
 * Pantalla previa al evento. Cubre TODA la app para el público sin
 * sesión (ver AppLayout). El staff entra con el botón "Acceso Staff".
 */
export default function PantallaCuentaRegresiva() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Velo azul sobre el fondo global + orbes de luz para el ambiente festivo */}
      <div className="absolute inset-0 bg-brand-navy/65" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-brown/40 blur-[90px] animate-glow-pulse" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-amber-500/25 blur-[100px] animate-glow-pulse [animation-delay:1.2s]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-sky-500/20 blur-[100px] animate-glow-pulse [animation-delay:2.4s]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 pb-12 pt-4 sm:pt-6">
        {/* Acceso del staff: visible pero discreto */}
        <div className="flex justify-end">
          <Link
            to="/login"
            className="btn-secondary !py-2 text-sm"
            aria-label="Acceso Staff, iniciar sesión"
          >
            <LogIn size={16} />
            Acceso Staff
            <span className="hidden sm:inline text-slate-400">· Iniciar sesión</span>
          </Link>
        </div>

        {/* Identidad */}
        <header className="mt-2 flex flex-col items-center text-center sm:mt-4">
          <img
            src="/widelogo.png"
            alt="Interoratorios 2026"
            className="h-auto w-64 max-w-[80vw] object-contain drop-shadow-2xl animate-fade-up sm:w-96"
          />
          <p className="mt-3 text-sm font-bold uppercase tracking-[0.35em] text-amber-200/90">
            Interoratorios 2026
          </p>
        </header>

        {/* Mensaje animador */}
        <section className="mt-8 text-center sm:mt-12">
          <div className="mb-3 flex items-center justify-center gap-3 text-amber-300">
            <Sparkles className="animate-pulse" size={22} />
            <Sparkles className="animate-pulse [animation-delay:0.6s]" size={30} />
            <Sparkles className="animate-pulse [animation-delay:1.2s]" size={22} />
          </div>
          <h1 className="text-3xl font-black leading-tight text-white drop-shadow-lg sm:text-5xl">
            ¡Estamos próximos a comenzar la{' '}
            <span className="accent-gradient-text">diversión!</span>
          </h1>
        </section>

        {/* Contador */}
        <section className="mt-8 sm:mt-10">
          <ContadorTeaser />
        </section>

        {/* Paso 3: aquí entra el carrusel. */}
      </div>
    </div>
  );
}
