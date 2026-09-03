import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogIn, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="glass-card w-full max-w-sm p-8 space-y-6 animate-fade-up"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-glow">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold heading-gradient">Interoratorios 2026</h1>
          <p className="text-sm text-slate-400">Inicia sesión para continuar</p>
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
