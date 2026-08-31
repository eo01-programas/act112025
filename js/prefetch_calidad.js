/**
 * prefetch_calidad.js — Precarga ("warm cache") de los registros de calidad.
 * --------------------------------------------------------------------------
 * Las vistas "Consolidado de Aprobaciones" e "Indicadores de Calidad" leen los
 * datos del Web App de Apps Script (action=list) y los cachean en localStorage
 * bajo la clave IQ.LOCAL_STORAGE_KEY. Ese fetch es lo más lento de todo el flujo
 * (cold-start del contenedor de Apps Script + lectura de toda la hoja).
 *
 * Este script calienta esa caché EN SEGUNDO PLANO apenas carga la app —p. ej.
 * mientras el usuario está en el menú— para que al abrir Consolidado los datos
 * ya estén listos y la vista pinte al instante en lugar de quedarse en el overlay
 * de carga esperando la red.
 *
 * Garantías:
 *  • No bloquea el render: corre en requestIdleCallback (con fallback a setTimeout).
 *  • No cambia la frescura de los datos: escribe en las MISMAS claves que las
 *    vistas, y éstas siguen revalidando contra el servidor al abrirse.
 *  • Es silencioso ante errores: si la red falla, simplemente no actualiza la
 *    caché; las vistas manejan los errores reales con su propio aviso.
 *  • No se repite de más: si la caché se refrescó hace muy poco, no vuelve a pedir.
 */
(() => {
    const IQ = (window.APP_CONFIG && window.APP_CONFIG.IQ) || {};
    const WEB_APP_URL = IQ.WEB_APP_URL;
    const KEY = IQ.LOCAL_STORAGE_KEY;
    if (!WEB_APP_URL || !KEY) return;

    // En las vistas que ya cargan estos datos por su cuenta no tiene sentido
    // precargar (harían doble fetch). La precarga sirve para el resto de páginas
    // (menú, trazabilidad, etc.), donde calienta la caché antes de navegar.
    const SELF_LOADING_VIEWS = ["consolidado_aprobaciones", "indicadores_calidad", "trazabilidad_op"];
    const currentView = (window.AppRouter && window.AppRouter.currentView) || "home";
    if (SELF_LOADING_VIEWS.indexOf(currentView) !== -1) return;

    const TS_KEY = KEY + "-updatedAt";
    // Si la caché se refrescó hace menos de esto, no volvemos a pedir. Evita
    // golpear el Apps Script en cada navegación entre vistas (son recargas de
    // página completas, así que este script corre en cada una).
    const MIN_INTERVAL_MS = 90 * 1000;

    try {
        const lastTs = parseInt(localStorage.getItem(TS_KEY) || "", 10);
        if (!isNaN(lastTs) && (Date.now() - lastTs) < MIN_INTERVAL_MS) return;
    } catch (e) { /* localStorage no disponible → intentamos igual */ }

    const prefetch = () => {
        // gviz primero, Apps Script como respaldo (ver data_api.js).
        Promise.resolve()
            .then(() => window.DataAPI.loadTintoreriaRecords())
            .then(recs => {
                try {
                    localStorage.setItem(KEY, JSON.stringify(recs));
                    localStorage.setItem(TS_KEY, String(Date.now()));
                } catch (e) { /* quota: la vista igual revalidará */ }
            })
            .catch(() => { /* silencioso: las vistas manejan los errores reales */ });
    };

    // No competir con el render inicial: esperar a que el navegador esté ocioso.
    if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(prefetch, { timeout: 3000 });
    } else {
        setTimeout(prefetch, 1200);
    }
})();
