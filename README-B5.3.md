# Control de Presupuesto B5.3

Versión enfocada en **personalización visual y estabilización móvil**, sin cambiar la lógica financiera ni borrar los datos de B5/B5.1/B5.2.

## Novedades

- Cinco temas: Azul elegante, Rosa suave, Claro moderno, Oscuro elegante y Juvenil pastel.
- Tema automático según el modo claro/oscuro del celular.
- Vista compacta y opción para reducir animaciones.
- Colores e íconos por categoría.
- Edición de nombre, ícono, color, orden y visibilidad de categorías.
- Categorías identificadas visualmente en favoritos, selector, historial y resumen.
- Formularios y ventanas adaptados al teclado móvil mediante `VisualViewport`.
- Botón Guardar del gasto visible en móvil mediante posición adherente.
- Comprobación de actualización mediante `version.json` sin caché.
- Migración compatible con la integridad de B5.2: agrega colores e íconos sin modificar gastos ni montos.
- Exportación XLSX conservada y verificada.

## Actualización segura

1. No desinstales la app ni borres los datos del navegador.
2. Crea un respaldo JSON desde Configuración.
3. Sube todos los archivos de esta carpeta a la raíz del mismo repositorio.
4. Espera a que GitHub Pages termine.
5. Abre el enlace en Chrome, cierra las pestañas antiguas y vuelve a abrir la app.
6. Verifica en el pie: `Control de Presupuesto B5.3`.
7. En Configuración, pulsa **Comprobar integridad**.

La apariencia se guarda por dispositivo y no modifica el respaldo financiero.
