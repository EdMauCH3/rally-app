-- =====================================================================
-- FIX: reiniciar_evento() no borraba rutas_gymkana
-- ---------------------------------------------------------------------
-- Síntoma reportado: después de "Reiniciar Evento" en el Admin, la
-- pestaña Gymkana seguía mostrando las parejas/rutas anteriores y no
-- dejaba volver a presionar "Iniciar Gymkana" (guardar_rutas_gymkana
-- revisa `exists (select 1 from rutas_gymkana)` y aborta si ya hay
-- filas). Confirmado en la base: puntuaciones_gymkana quedó en 0 filas
-- pero rutas_gymkana seguía con las 4 filas viejas.
--
-- Esta versión reemplaza reiniciar_evento() para que borre TODO lo que
-- corresponde a "puntuaciones del evento" (Gymkana, sus rutas, Tesoro,
-- Torneo) y conserve equipos, perfiles y el historial de ajustes
-- manuales — igual a como ya lo describe el texto de la Zona de
-- Peligro en el Admin. También queda restringida a Admin a nivel de
-- base de datos, no solo por la ruta protegida del frontend.
--
-- CÓMO EJECUTAR: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- =====================================================================

create or replace function public.reiniciar_evento()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_es_admin boolean;
begin
  select exists (
    select 1 from public.perfiles where id = auth.uid() and rol = 'admin'
  ) into v_es_admin;

  if not v_es_admin then
    raise exception 'Solo el Admin puede reiniciar el evento';
  end if;

  -- El "where true" es a propósito: la extensión safeupdate que Supabase
  -- activa por defecto bloquea cualquier DELETE sin WHERE (incluso
  -- dentro de una función) con el error "DELETE requires a WHERE
  -- clause". Con "where true" se sigue borrando todo, pero se cumple
  -- el requisito sintáctico.
  delete from public.puntuaciones_gymkana where true;
  delete from public.rutas_gymkana where true;
  delete from public.puntuaciones_tesoro where true;
  delete from public.partidos_torneo where true;
  -- equipos, perfiles y ajustes_admin NO se tocan: se conservan.
end;
$$;

revoke all on function public.reiniciar_evento() from public;
grant execute on function public.reiniciar_evento() to authenticated;
