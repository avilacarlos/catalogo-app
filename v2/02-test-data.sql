-- Datos de prueba para validar la interfaz V2.
-- Ejecutar despues de 01-schema.sql.

do $$
declare
  v_cliente_id bigint;
  v_categoria_id bigint;
begin
  select id into v_cliente_id
    from public.clientes
   where telefono = '0000000000'
   limit 1;

  if v_cliente_id is null then
    insert into public.clientes (nombre, telefono, notas)
    values ('Cliente Demo V2', '0000000000', 'Registro de prueba')
    returning id into v_cliente_id;
  end if;

  select id into v_categoria_id
    from public.categorias_verso
   where slug = 'boda'
   limit 1;

  if v_categoria_id is null then
    raise exception 'No existe la categoria boda';
  end if;

  insert into public.eventos (
    cliente_id, categoria_id, festejado, slug, estado, notas
  )
  select
    v_cliente_id,
    v_categoria_id,
    'Demo Art & Print',
    'demo-v2-art-print-7k2m',
    'activo',
    'Evento de prueba para la interfaz V2'
  where not exists (
    select 1
      from public.eventos
     where slug = 'demo-v2-art-print-7k2m'
  );
end;
$$;

select
  e.id,
  e.festejado,
  e.slug,
  e.estado,
  c.nombre as categoria,
  count(v.id) as versos_disponibles
from public.eventos e
join public.categorias_verso c on c.id = e.categoria_id
left join public.versos v
  on lower(trim(v.categoria)) = lower(trim(c.nombre))
where e.slug = 'demo-v2-art-print-7k2m'
group by e.id, e.festejado, e.slug, e.estado, c.nombre;
