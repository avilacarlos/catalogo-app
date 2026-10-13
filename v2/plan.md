Avanzaremos en este orden:
1. Base de datos
   - Ejecutar el SQL en Supabase.
   - Crear datos de prueba.
   - Validar relaciones y restricciones.
2. Preparar la V2
   - Separar la V2 del código actual.
   - Mover credenciales a variables de entorno.
   - Mantener el panel actual intacto.
3. Capa de datos
   - Crear funciones para consultar eventos, versos, favoritos y selecciones.
   - Centralizar las consultas a Supabase.
4. Flujo principal
   - URL con slug.
   - Cargar evento.
   - Cargar categoría.
   - Mostrar versos correspondientes.
5. Interacciones
   - Favoritos.
   - Selección de verso.
   - Compartir.
   - Estados de carga y errores.
6. Refactor frontend
   - Separar estado, vistas, acciones y utilidades.
   - Eliminar duplicación del código actual.
7. Panel administrativo
   - Agregar clientes.
   - Agregar eventos.
   - Generar y copiar URLs.
8. Migración de versos
   - Cambiar categoria por categoria_id.
   - Actualizar panel y V2.
   - Eliminar dependencias antiguas.
9. Seguridad
   - Habilitar RLS.
   - Crear políticas para clientes y administración.
   - Validar que un cliente no pueda acceder a otros eventos.
El siguiente paso será preparar y validar la base de datos antes de modificar la interfaz.