-- Renombra la categoria visible sin cambiar su slug historico.
-- El slug `varios` se conserva para no romper enlaces ni compatibilidad
-- con los versos existentes en public.versos.

begin;

update public.categorias_verso
set
  nombre = 'Esquelas',
  descripcion = 'Versos para esquelas'
where slug = 'varios';

commit;

-- Verificacion
select id, nombre, slug, descripcion
from public.categorias_verso
where slug = 'varios';
