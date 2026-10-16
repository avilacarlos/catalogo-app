# Contexto del proyecto

## Estado actual

- El catálogo público se sirve desde la entrada raíz `index.html`; su implementación está en `v2`.
- Las páginas antiguas se conservan en el repositorio, fuera del build, para permitir una reversión durante la validación.
- La V2 utilizará el mismo proyecto de Supabase.
- La tabla `versos` se conservará sin cambios durante la primera etapa.
- El catálogo V2 funcionará mediante una URL personalizada basada en el `slug` de un evento.

## Trabajo realizado

- Se revisó la documentación de arquitectura y migración ubicada en `v2`.
- Se revisó el MVP frontend de `v2`, que implementa:
  - carga del evento por `slug`;
  - carga de versos por categoría;
  - favoritos;
  - selección de un verso;
  - compartir versos;
  - navegación móvil.
- Se definió un script SQL para crear las tablas nuevas:
  - `categorias_verso`;
  - `clientes`;
  - `eventos`;
  - `favoritos`;
  - `selecciones`.
- El script SQL incluye claves foráneas, índices, restricciones de estados, unicidad de `slug`, unicidad de favoritos por evento y un único registro de selección por evento.
- El esquema SQL se ejecutó en Supabase; RLS y sus políticas permanecen pendientes.

## Pendientes

1. Configurar `VITE_CATALOGO_SUPABASE_URL` y `VITE_CATALOGO_SUPABASE_ANON_KEY` en Netlify y desplegar el build raíz.
2. Validar en producción los enlaces por `slug`, favoritos, selección, compartir y uso móvil.
3. Migrar progresivamente `versos.categoria` a `versos.categoria_id` y confirmar que no queden dependencias antiguas.
4. **Al final, habilitar RLS y crear políticas que separen el acceso administrativo del acceso del cliente.**

## Actualizacion

- Se agrego `v2/01-schema.sql` con la primera migracion de tablas, indices, triggers y categorias iniciales.
- La migracion se ejecuto correctamente en Supabase y no devolvio filas, como se esperaba.
- Las tablas, relaciones, indices, triggers y categorias iniciales quedaron creados.
- Se agrego `v2/02-test-data.sql` para crear un cliente y un evento demo reproducibles.
- La URL de prueba sera `/demo-v2-art-print-7k2m`.
- Supabase confirmo el evento demo activo con 34 versos disponibles.
- La V2 ahora acepta pruebas locales mediante `/v2/?slug=demo-v2-art-print-7k2m`.
- Se valido la sintaxis de `v2/main.js` y el build actual del proyecto termino correctamente; quedaron dos advertencias preexistentes sobre `auth-guard.js`.
- La pantalla de confirmacion ahora muestra “¡Verso elegido!” para distinguirla de favoritos.
- Se agrego `eventos.html` al panel para consultar eventos, favoritos y verso elegido.
- El panel ahora permite abrir el catalogo demo y copiar su URL.
- El build del proyecto se valido correctamente; permanecen las advertencias existentes de `auth-guard.js` cargado como script clasico.
- El panel de eventos se movio a `v2/eventos.html` y ya no depende de la sesion del panel antiguo.
- La URL de prueba del panel V2 es `/v2/eventos.html`.
- El error 401 del panel V2 se corrigio: la clave de Supabase estaba incompleta en `v2/eventos.js`.
- Se elimino telefono y fecha del formulario de eventos.
- El campo del evento paso a representar al `festejado`.
- El catalogo ahora muestra el nombre del cliente como saludo y el festejado en el texto de la categoria, por ejemplo: `Hola Guadalupe` y `Bautizo de Alondra`.
- Se agrego `v2/03-rename-event-name-to-festejado.sql`; debe ejecutarse en Supabase antes de probar el nuevo flujo.
- Se corrigio la compatibilidad de versos con categorias antiguas como `xv` y `XV Anos`.
- Se deduplicaron las categorias visibles en los formularios de la V2 y del panel administrativo.
- No se eliminaron registros duplicados de Supabase automaticamente; queda pendiente revisar y normalizar esos datos desde SQL.
- Se agrego `v2/04-normalize-categories.sql` para consolidar duplicados conservando la categoria con menor ID y reasignando eventos antes de eliminar duplicados.
- El panel administrativo ahora incluye búsqueda, filtros por estado, edición de cliente/festejado/categoría/slug/estado y detalle de códigos favoritos.
- La gestión visible de estados se sustituyó por una acción de eliminación de evento con confirmación; favoritos y selección se eliminan en cascada y el cliente permanece.
- El panel V2 ahora incluye un formulario para crear clientes y eventos activos, generando el `slug` automaticamente.
- La creacion de eventos es temporalmente publica porque RLS y autenticacion administrativa aun no estan habilitados.

## Decisiones importantes

## Estado consolidado de la V2

### Hecho

- Se mantiene una sola fuente de datos en el mismo proyecto Supabase.
- Se crearon y validaron las tablas de categorías, clientes, eventos, favoritos y selecciones.
- El catálogo público funciona por `slug`, muestra el cliente y el festejado, carga la categoría correcta y permite favoritos y selección.
- El panel `C:\\desarrollo_vite\\panel-administrativo` crea, edita, consulta y elimina eventos, y será la fuente de las URLs públicas.
- La eliminación de un evento conserva el cliente y elimina favoritos y selección asociados.
- Se mantienen compatibles los formatos antiguos de categorías y versos.
- Se retiraron `v2/eventos.html` y `v2/eventos.js`; la administración de eventos corresponde al panel administrativo.

### Pendiente

- Configurar el despliegue de `catalogodeversos.netlify.app` para publicar `v2` en la raíz del sitio.
- Confirmar que el panel administrativo genera enlaces `https://catalogodeversos.netlify.app/?slug={slug}` y retirar el flujo antiguo después de validar la transición.
- Mejorar el diseño visual del catálogo V2 y agregar arte/decoración.
- Revisar accesibilidad, mensajes y pruebas en móvil.
- Habilitar RLS y crear políticas para separar acceso público y administración.
- Validar todo en producción antes de retirar contraseñas, rutas y código antiguo.

- No crear una base de datos independiente para la V2.
- No eliminar ni modificar inicialmente `versos.categoria`.
- No activar RLS durante el desarrollo inicial.
- No eliminar la estructura antigua hasta validar completamente la V2 y el panel actual.

## Actualización de transición

- Se ejecutó la normalización de saltos de línea en Supabase y se confirmó que el catálogo los renderiza correctamente.
- El diagnóstico de categorías duplicadas devolvió cero filas; no se ejecutó la migración de normalización porque no había duplicados.
- El panel administra clientes y eventos en Supabase; los enlaces finales deben apuntar a `https://catalogodeversos.netlify.app/?slug={slug}`, sin la ruta temporal `/v2` ni el dominio del panel `artnprint-admin.netlify.app`.
- Se eliminaron las páginas auxiliares de administración de eventos dentro de `v2` para evitar duplicar ese flujo.
- `index.html` fue sustituido por la entrada del catálogo V2; la versión anterior se conserva en `legacy/index.html`.
- Vite ahora publica solo el catálogo raíz; los recursos V2 están aislados en `v2/public/assets` y los recursos antiguos se conservan en `public`.
- Las credenciales de Supabase se leen desde `VITE_CATALOGO_SUPABASE_URL` y `VITE_CATALOGO_SUPABASE_ANON_KEY`; falta configurarlas en Netlify.
