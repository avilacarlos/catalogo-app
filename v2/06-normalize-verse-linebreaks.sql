-- Normaliza saltos de linea heredados en public.versos.contenido.
-- Idempotente: se puede volver a ejecutar sin duplicar saltos.
-- Ejecutar primero en desarrollo y revisar los resultados antes de produccion.

begin;

update public.versos
set contenido = regexp_replace(
  replace(
    replace(contenido, E'\\n', E'\n'),
    E'\r\n',
    E'\n'
  ),
  '<br\s*/?>',
  E'\n',
  'gi'
)
where contenido ~* '<br\s*/?>'
   or position(E'\\n' in contenido) > 0
   or position(E'\r' in contenido) > 0;

commit;

-- Verificacion manual: revisar una muestra representativa en el editor y catalogo.
select id, codigo, contenido
from public.versos
where contenido like '%' || E'\n' || '%'
order by id
limit 50;
