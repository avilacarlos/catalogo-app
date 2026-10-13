-- Migracion de eventos: nombre del evento -> festejado.
-- Ejecutar una sola vez sobre una base creada con 01-schema.sql anterior.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'eventos'
      and column_name = 'nombre'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'eventos'
      and column_name = 'festejado'
  ) then
    alter table public.eventos rename column nombre to festejado;
  end if;
end;
$$;
