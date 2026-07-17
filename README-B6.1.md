# Control de Presupuesto B6.1

Versión enfocada en reorganizar la experiencia de uso: la pantalla principal queda centrada en el registro diario de gastos y el balance se mueve a una pestaña separada.

## Cambios principales

- Pestaña **Gastos** como inicio de la aplicación.
- Registro de gasto simplificado: monto, categoría, detalle, fecha automática y guardar.
- Balance e ingresos separados en la pestaña **Ingresos**.
- Proyectos, viajes y actividades extraordinarias movidos a **Extras**.
- El encabezado ya no cambia al nombre del proyecto activo.
- Favoritos y gastos rápidos se registran como gastos generales para evitar asignaciones accidentales.
- Colores de categorías más discretos: pestaña/borde lateral, sombra suave e ícono.
- Mantiene ingresos, gastos, respaldo JSON, Excel, IndexedDB y personalización de categorías.

## Actualización segura

1. Crear respaldo completo JSON antes de actualizar.
2. Subir todos los archivos al mismo repositorio de GitHub Pages.
3. No borrar datos de Chrome ni desinstalar la app.
4. Esperar el despliegue de GitHub Pages.
5. Cerrar la app y todas las pestañas antiguas.
6. Abrir desde Chrome y verificar el pie: **Control de Presupuesto B6.1**.
7. Entrar a Configuración y ejecutar **Comprobar integridad**.

La B6.1 no cambia el esquema principal de la base. Reorganiza la interfaz y conserva los registros existentes.
