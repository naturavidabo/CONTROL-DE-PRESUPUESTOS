# Informe de verificación — Control de Presupuesto B6.1

## Objetivo

Corregir la organización visual de la B6 para que la aplicación se use primero como control de gastos diarios, separando ingresos, balance y actividades extraordinarias en pantallas propias.

## Cambios verificados

- La pestaña inicial ahora es **Gastos**.
- El balance mensual ya no aparece en la parte superior de la pantalla principal.
- El formulario de gasto ya no muestra el campo visible **Asignar a**.
- La pestaña **Ingresos** contiene el registro de ingresos, balance mensual, ingresos por categoría y ritmo financiero.
- La pestaña **Extras** concentra proyectos o viajes.
- El encabezado permanece como **Registro diario de gastos**, aunque exista un proyecto activo.
- Los favoritos registran gastos generales por defecto para evitar asignaciones accidentales.
- Las categorías usan color discreto mediante borde/pestaña lateral e ícono, evitando tarjetas completamente pintadas.
- Se mantiene la compatibilidad con IndexedDB, respaldos, Excel y personalización visual.

## Verificaciones técnicas

- Validación de sintaxis JavaScript con `node --check app.js`.
- Revisión de identificadores HTML duplicados: sin duplicados.
- Revisión de referencias directas `$('id')`: sin faltantes críticos. El único identificador no estático es `undoToastBtn`, creado dinámicamente al mostrar el botón Deshacer.
- Actualización de `APP_RELEASE` a 6.1.
- Actualización de `version.json` a 6.1.
- Actualización de caché del `service worker` a `control-presupuesto-b6-1-shell-v1`.
- Actualización de referencias `app.js`, `styles.css` y `manifest.json` con versión 6.1.

## Observación

No se cambió el esquema principal de datos. Los gastos, ingresos, categorías, proyectos, presupuestos, respaldos e integridad se conservan. La prueba final debe realizarse en el celular instalado para comprobar teclado, actualización de caché y visualización real.
