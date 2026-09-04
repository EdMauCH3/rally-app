import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth, RUTA_POR_ROL } from '../context/AuthContext';

export default function Login() {
  const { login, session, perfil, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Si ya hay sesión y perfil cargado, redirige automáticamente a su módulo
  useEffect(() => {
    if (!loading && session && perfil) {
      navigate(RUTA_POR_ROL[perfil.rol] ?? '/', { replace: true });
    }
  }, [loading, session, perfil, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(email, password);
      // La redirección ocurre en el useEffect de arriba cuando el perfil cargue
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Resplandor café decorativo detrás de la tarjeta */}
      <div className="pointer-events-none absolute h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-brand-brown/30 blur-[100px]" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm p-8 space-y-6 rounded-2xl border border-brand-brown/40 bg-gradient-to-b from-brand-brown/20 via-brand-navy/50 to-brand-navy/70 backdrop-blur-2xl shadow-2xl shadow-black/60 transition-all duration-300 ease-in-out hover:border-brand-brown/60 animate-fade-up"
      >
        <div className="text-center space-y-2">
          <img
            src="/widelogo.png"
            alt="Interoratorios 2026"
            className="w-full max-w-[220px] object-contain mx-auto mb-1 drop-shadow-2xl"
          />
          <p className="text-sm text-slate-300">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="field-label">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder="tucorreo@rally.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="field-label">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={enviando} className="btn-primary w-full py-3">
          {enviando ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
