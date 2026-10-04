import { createContext, useContext, useEffect, useRef, useState } from 'react';
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

// Prefijo de las claves de sessionStorage donde se recuerda en qué parte
// de la interfaz estaba cada quien (pestaña, partido abierto, etc.).
const PREFIJO_UI = 'rally_ui_';

function limpiarEstadoDeInterfaz() {
  try {
    Object.keys(sessionStorage)
      .filter((clave) => clave.startsWith(PREFIJO_UI))
      .forEach((clave) => sessionStorage.removeItem(clave));
  } catch {
    // sessionStorage no disponible: nada que limpiar.
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  // Quién está logueado ahora. Sirve para distinguir "volvió a la pestaña
  // y Supabase renovó la sesión del MISMO usuario" (no hay que hacer nada)
  // de "entró otro usuario" (sí hay que cargar su perfil).
  const usuarioActualRef = useRef(null);

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

  function aplicarSesion(s) {
    if (!s) {
      if (usuarioActualRef.current) limpiarEstadoDeInterfaz();
      usuarioActualRef.current = null;
      setSession(null);
      setPerfil(null);
      setLoading(false);
      return;
    }

    // Siempre se guarda la sesión más reciente (token renovado)...
    setSession(s);

    // ...pero si es el MISMO usuario NO se vuelve a cargar el perfil ni se
    // enciende `loading`. Antes, cada vez que volvías a la pestaña
    // Supabase avisaba, se ponía loading=true, ProtectedRoute desmontaba
    // toda la pantalla y se perdía en qué pestaña/partido estabas.
    if (usuarioActualRef.current === s.user.id) return;

    if (usuarioActualRef.current) limpiarEstadoDeInterfaz(); // cambió de usuario
    usuarioActualRef.current = s.user.id;
    cargarPerfil(s.user.id);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (mounted) aplicarSesion(s);
    });

    // El setTimeout evita consultar a Supabase de forma síncrona dentro del
    // callback de autenticación (puede bloquearse en algunas versiones).
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, s) => {
      setTimeout(() => {
        if (mounted) aplicarSesion(s);
      }, 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function logout() {
    await supabase.auth.signOut();
    limpiarEstadoDeInterfaz();
    usuarioActualRef.current = null;
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
