import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(undefined);

let idCounter = 0;

const ESTILOS = {
  success: 'bg-emerald-500/95 shadow-emerald-950/50',
  error: 'bg-red-500/95 shadow-red-950/50',
  warning: 'bg-amber-500/95 shadow-amber-950/50',
  info: 'bg-slate-800/95 shadow-black/50',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (mensaje, tipo = 'info', duracionMs = 4500) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, mensaje, tipo }]);
      setTimeout(() => remove(id), duracionMs);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl backdrop-blur-xl border border-white/10 shadow-lg px-4 py-3 text-sm font-medium text-white ${ESTILOS[t.tipo] ?? ESTILOS.info}`}
          >
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
