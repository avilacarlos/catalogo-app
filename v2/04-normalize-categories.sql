-- Normaliza categorias duplicadas sin borrar la categoria que conserva eventos.
-- Revisar el resultado antes de ejecutar en produccion.

begin;

create temporary table categorias_canonicas on commit drop as
select
  id,
  lower(translate(trim(nombre), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')) as clave,
  min(id) over (partition by lower(translate(trim(nombre), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'))) as id_canonico
from public.categorias_verso;

update public.eventos e
set categoria_id = c.id_canonico
from categorias_canonicas c
where c.id = e.categoria_id
  and c.id <> c.id_canonico;

delete from public.categorias_verso c
using categorias_canonicas d
where c.id = d.id
  and d.id <> d.id_canonico;

commit;

-- Verificacion
select id, nombre, slug
from public.categorias_verso
order by orden, id;
