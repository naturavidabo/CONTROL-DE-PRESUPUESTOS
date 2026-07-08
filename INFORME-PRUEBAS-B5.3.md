# Informe de verificación — B5.3

## Alcance

Se revisaron los cambios de personalización, compatibilidad de datos, exportación y ergonomía móvil. La estructura financiera de IndexedDB conserva el esquema B5 para no introducir una migración destructiva.

## Pruebas aprobadas

- Sintaxis de `app.js` y `sw.js` validada con Node.js.
- Inicio de instalación nueva y activación local.
- Registro de gasto con monto decimal, categoría y detalle.
- Lectura posterior desde la base después de una recarga lógica.
- Aplicación y guardado del tema Rosa suave.
- Edición y persistencia del color e ícono de una categoría.
- Renderizado de color e ícono en el selector de categorías.
- Compatibilidad de integridad con datos B5.2 sin campos visuales: resultado `visual-migration` y asignación segura de valores predeterminados.
- Generación de XLSX con dos gastos.
- Apertura del XLSX con `openpyxl`; categorías, detalles y montos numéricos conservados.
- Validación de identificadores HTML referenciados por JavaScript.
- Revisión del manifiesto, archivos de caché y `version.json`.

## Resultado del Excel de prueba

- Alimentación — Almuerzo — Bs 15,50.
- Transporte local — Micro — Bs 2,50.
- Total numérico: Bs 18,00.

## Estabilización móvil implementada

- Altura de ventanas calculada con `window.visualViewport`.
- Desplazamiento automático del campo enfocado cuando el teclado lo cubre.
- Ventanas inferiores adaptables a la altura visible.
- Botón Guardar adherente en pantallas pequeñas.
- Cierre del teclado al finalizar un gasto en móvil.

## Limitación de la verificación

Las pruebas funcionales se ejecutaron en Chromium con una vista móvil de 390 × 844 y una base IndexedDB simulada para automatización. La prueba final del comportamiento del teclado debe realizarse en el teléfono Android real, porque cada fabricante modifica de forma distinta el teclado y la ventana visible.

## Seguridad de datos

La B5.3 mantiene IndexedDB, revisiones, instantáneas, copia secundaria, validación de integridad y recuperación de la B5. No se trasladó la información financiera a `localStorage`. La preferencia visual usa un registro separado y una copia local únicamente para evitar un destello de color al iniciar.
