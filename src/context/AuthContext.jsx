import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(undefined);

// Mapa rol -> ruta de inicio para redirección tras login.
// Todos entran al Panel del Animador; el Admin llega a /admin con su
// propio botón en el Header cuando lo necesite, no automáticamente al
// iniciar sesión.
export const RUTA_POR_ROL = {
  admin: '/panel',
  animador: '/panel',
  staff_gymkana: '/panel',
  staff_tesoro: '/panel',
  arbitro: '/panel',
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s) {
        cargarPerfil(s.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        cargarPerfil(s.user.id);
      } else {
        setPerfil(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function cargarPerfil(userId) {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, nombre, rol')
      .eq('id', userId)
      .single();

    if (error) {
      // Usuario existe en Auth pero no tiene fila en `perfiles` todavía.
      // El Admin debe asignarle un rol manualmente.
      console.error('Error cargando perfil:', error.message);
      setPerfil(null);
    } else {
      setPerfil(data);
    }
    setLoading(false);
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function logout() {
    await supabase.auth.signOut();
    setPerfil(null);
    setSession(null);
  }

  const value = {
    session,
    perfil,
    rol: perfil?.rol ?? null,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
