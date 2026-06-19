/**
 * data_api.js — Carga compartida de datos desde Google Sheets (gviz JSONP).
 * ------------------------------------------------------------------------
 * Antes este código estaba copiado idéntico en cada vista (trazabilidad,
 * defecto_maquina, produccion_articulo, defectos_inspeccion, principales_defectos).
 * Ahora vive en un solo lugar y se expone en window.DataAPI.
 *
 * Uso en las vistas:
 *   const { gvizToObjects, loadSheetJSONP } = window.DataAPI;
 */
(() => {
    const getHeaderRows = () =>
        (window.APP_CONFIG && window.APP_CONFIG.BASE_SHEET_HEADER_ROWS) || 1;

    const gvizToObjects = (resp) => {
        if (!resp || !resp.table) return [];
        const cols = (resp.table.cols || []).map(c => String(c.label || c.id || "").trim());
        return (resp.table.rows || []).map(r => {
            const o = {};
            cols.forEach((h, i) => {
                const cell = r.c && r.c[i];
                o[h] = cell && (cell.v !== null && cell.v !== undefined) ? cell.v : "";
            });
            return o;
        });
    };

    const loadSheetJSONP = (sheetId, sheetName) => {
        const TIMEOUT_MS = 15000;
        return new Promise((resolve, reject) => {
            const cbName = "GVIZ_CB_" + Math.random().toString(36).slice(2);
            let script = document.createElement("script");
            let timer = null;

            function cleanup() {
                if (timer) clearTimeout(timer);
                if (script && script.parentNode) script.parentNode.removeChild(script);
                if (window[cbName]) delete window[cbName];
            }

            timer = setTimeout(() => {
                cleanup();
                reject(new Error(`Tiempo de espera agotado al cargar "${sheetName}".`));
            }, TIMEOUT_MS);

            window[cbName] = function(resp) {
                cleanup();
                if (resp && resp.status === "error") {
                    reject(new Error(resp.errors?.[0]?.detailed_message || "Error al cargar datos."));
                } else {
                    resolve(gvizToObjects(resp));
                }
            };

            const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`;
            const url = `${base}?sheet=${encodeURIComponent(sheetName)}&headers=${getHeaderRows()}&tq=${encodeURIComponent("select *")}&tqx=out:json;responseHandler:${cbName}&nocache=${Date.now()}`;

            script.src = url;
            document.head.appendChild(script);
        });
    };

    window.DataAPI = { gvizToObjects, loadSheetJSONP };
})();
