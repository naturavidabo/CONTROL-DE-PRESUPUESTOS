# Control de Presupuesto B6

Versión enfocada en cerrar el ciclo financiero básico: ingresos, gastos y balance.

## Cambios principales

- Registro de ingresos con fecha y hora automática.
- Categorías de ingresos editables: nombre, color, ícono, orden y visibilidad.
- Balance mensual: ingresos, gastos, balance y disponible real después de ahorro.
- Historial combinado con filtro: todos, solo gastos o solo ingresos.
- Exportación Excel actualizada con columna Tipo, Monto y Balance +/-.
- Respaldo JSON actualizado para incluir ingresos y categorías de ingresos.
- Proyectos muestran ingresos, gastos y balance del proyecto.
- Categorías visuales más discretas: color en pestaña/borde lateral e ícono, no toda la tarjeta pintada.

## Actualización segura

1. Crear respaldo completo JSON desde Configuración.
2. No desinstalar la app ni borrar datos de Chrome.
3. Subir todos los archivos de esta carpeta al mismo repositorio de GitHub Pages.
4. Esperar publicación.
5. Abrir la app desde Chrome y verificar el pie: Control de Presupuesto B6.
6. Entrar a Configuración y ejecutar Comprobar integridad.

## Nota

La B6 migra automáticamente datos de B5.3. Los gastos existentes no se alteran. Los ingresos se agregan como estructura nueva en IndexedDB.
