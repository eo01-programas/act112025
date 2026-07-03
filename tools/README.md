# tools — Precompilación de vistas JSX

## ¿Por qué existe esto?

Las vistas escritas en JSX (React) se compilaban **en el navegador** con Babel
standalone (~3 MB) en cada visita. Ahora `trazabilidad_op` se compila **una sola
vez aquí** y la app sirve el resultado plano desde `js/compiled/`, sin descargar
Babel ni compilar nada en el navegador.

## Regla de oro

> **Si editas `js/trazabilidad_op.js`, ejecuta `compilar_vistas.cmd` (doble clic
> o desde terminal) antes de desplegar.** Si no, la app seguirá mostrando la
> versión anterior de la vista.

Después de regenerar, sube también el nuevo `APP_VERSION` en `js/config.js`
para que los navegadores de los usuarios descarguen la versión nueva.

## Archivos

- `compile_jsx.js` — script de compilación (Node). Usa la misma configuración
  de Babel que `app_bootstrap.js` usaba en el navegador (`preset-env` +
  `preset-react` clásico, `sourceType: script`).
- `compilar_vistas.cmd` — lanzador para Windows. Usa Node si está instalado;
  si no, usa el Node embebido de VS Code (`ELECTRON_RUN_AS_NODE`).
- `babel.min.js` — copia local de `@babel/standalone` (para compilar sin
  internet ni `npm install`).

## Para precompilar más vistas en el futuro

1. Agregar la línea correspondiente en `compilar_vistas.cmd`
   (copiar la de `trazabilidad_op` y cambiar el nombre).
2. Registrar la vista en el mapa `compiledViews` de `js/app_bootstrap.js`.
3. Quitar `babel` ya no es necesario: el bootstrap solo carga Babel para las
   vistas que NO están en `compiledViews`.
