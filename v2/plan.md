# Plan de transición del catálogo V2

## Completado

1. **Base de datos:** tablas, relaciones, índices y categorías iniciales creados en Supabase; el evento demo se validó.
2. **Flujo del catálogo:** carga por `slug`, evento, categoría y versos; favoritos, selección y compartir funcionan.
3. **Panel administrativo:** crea y edita clientes y eventos en la misma base. El enlace del catálogo usa `catalogodeversos.netlify.app/?slug=...`.
4. **Saltos de línea:** datos normalizados y visualización confirmada en el panel y el catálogo.
5. **Categorías:** el diagnóstico de duplicados devolvió cero filas; no se requirió migración.

## Corte a la V2 en la raíz — preparado, falta configurar producción

- `index.html` ahora es la entrada del catálogo V2.
- Vite compila solo esa entrada; las páginas antiguas quedan fuera del build.
- La entrada anterior se conserva en `legacy/index.html` para facilitar una reversión.
- Los recursos V2 se sirven desde `v2/public/assets`; los recursos antiguos en `public` no se sobrescriben.
- La V2 usa `VITE_CATALOGO_SUPABASE_URL` y `VITE_CATALOGO_SUPABASE_ANON_KEY`.
- Netlify debe publicar el `dist` generado y definir esas dos variables.
- Las rutas desconocidas vuelven a `/index.html`, permitiendo enlaces por slug en la raíz.

## Pendiente después del corte

1. Definir las variables de Supabase en Netlify y desplegar.
2. Probar enlaces reales `https://catalogodeversos.netlify.app/?slug={slug}` y validar favoritos, selección, compartir y móvil.
3. Revisar accesibilidad y diseño final.
4. Migrar `versos.categoria` a `categoria_id` cuando panel y catálogo estén listos.
5. Habilitar RLS con políticas que separen acceso público y administración.
6. Retirar definitivamente los archivos antiguos solo después de validar producción.
