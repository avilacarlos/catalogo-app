# Contexto del proyecto

## Estado actual

- El proyecto actual administra versos mediante la tabla existente `versos`.
- La carpeta `v2` contiene el plan de refactorización del catálogo.
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
- El script SQL no habilita RLS ni crea políticas de seguridad.
- El script SQL todavía no se ha ejecutado en Supabase.

## Pendientes

1. Ejecutar y validar el SQL en Supabase.
2. Verificar que `public.versos.id` sea compatible con las referencias `bigint`.
3. Insertar y revisar las categorías iniciales.
4. Ejecutar `v2/02-test-data.sql` y crear el evento demo.
5. Validar el flujo `slug -> evento -> categoría -> versos`.
6. Probar favoritos, selección y compartir.
7. Separar el código V2 en módulos y mover las credenciales a variables de entorno.
8. Integrar la administración de clientes y eventos en el panel actual.
9. Migrar progresivamente `versos.categoria` hacia `versos.categoria_id`.
10. Confirmar que no existan dependencias de la estructura antigua.
11. **Al final, habilitar RLS y crear las políticas necesarias para separar el acceso administrativo del acceso del cliente.**

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
- El panel administrativo principal ahora crea, edita, consulta y elimina eventos.
- La eliminación de un evento conserva el cliente y elimina favoritos y selección asociados.
- Se mantienen compatibles los formatos antiguos de categorías y versos.
- Se decidió que `v2/eventos.html` y `v2/eventos.js` son herramientas auxiliares de desarrollo, no parte del flujo final.

### Pendiente

- Terminar la normalización definitiva de categorías ejecutando y revisando `v2/04-normalize-categories.sql`.
- Normalizar los versos para convertir `<br>` y `\\n` literales en saltos de línea reales.
- Actualizar el editor de versos para guardar saltos de línea seguros y renderizar con `white-space: pre-line`.
- Configurar `VITE_CATALOGO_V2_URL` para la URL real del catálogo.
- Mejorar el diseño visual del catálogo V2 y agregar arte/decoración.
- Revisar accesibilidad, mensajes y pruebas en móvil.
- Habilitar RLS y crear políticas para separar acceso público y administración.
- Validar todo en producción antes de retirar contraseñas, rutas y código antiguo.

- No crear una base de datos independiente para la V2.
- No eliminar ni modificar inicialmente `versos.categoria`.
- No activar RLS durante el desarrollo inicial.
- No eliminar la estructura antigua hasta validar completamente la V2 y el panel actual.
