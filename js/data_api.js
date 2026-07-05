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

    // ── Registros de calidad (tintoreria-records) ───────────────────────────
    // El Web App de Apps Script (action=list) se degradó con el crecimiento de
    // la hoja: respuestas de 15-70s e incluso HTTP 404 intermitentes. La lectura
    // gviz directa de la misma hoja responde en ~3s, así que se usa primero y el
    // Web App queda solo como respaldo (misma estrategia que modulo_principal).

    // Igual que gvizCellToDisplayValue en modulo_principal: prioriza el valor
    // formateado (cell.f) para que las fechas lleguen como "3/Jul/2026 10:15 AM",
    // el formato que ya entienden las vistas.
    const gvizCellText = (cell) => {
        if (!cell) return "";
        if (cell.f !== undefined && cell.f !== null) return String(cell.f);
        if (cell.v === null || cell.v === undefined) return "";
        return typeof cell.v === "string" ? cell.v : String(cell.v);
    };

    const gvizToRecords = (resp) => {
        const table = resp && resp.table;
        if (!table || !Array.isArray(table.cols)) {
            throw new Error("Respuesta inválida de la hoja compartida (gviz).");
        }

        let headers = table.cols.map(c => String((c && c.label) || "").trim());
        let rows = Array.isArray(table.rows) ? table.rows : [];

        // Si gviz no detectó la fila de encabezados, llega como primera fila de datos.
        if (!headers.includes("id_registro")) {
            const firstCells = rows[0] && Array.isArray(rows[0].c) ? rows[0].c : [];
            headers = table.cols.map((_, i) => gvizCellText(firstCells[i]).trim());
            rows = rows.slice(1);
        }
        if (!headers.includes("id_registro")) {
            throw new Error("No se encontraron encabezados válidos en la hoja (gviz).");
        }

        const records = [];
        rows.forEach(row => {
            const cells = row && Array.isArray(row.c) ? row.c : [];
            const record = {};
            let hasContent = false;
            headers.forEach((header, i) => {
                if (!header) return;
                const value = gvizCellText(cells[i]);
                record[header] = value;
                if (!hasContent && String(value).trim() !== "") hasContent = true;
            });
            if (hasContent) records.push(record);
        });
        return records;
    };

    const loadRecordsViaGviz = (sheetId, sheetName) => {
        const TIMEOUT_MS = 15000;
        return new Promise((resolve, reject) => {
            const cbName = "GVIZ_REC_CB_" + Math.random().toString(36).slice(2);
            const script = document.createElement("script");
            let timer = null;

            function cleanup() {
                if (timer) clearTimeout(timer);
                if (script.parentNode) script.parentNode.removeChild(script);
                if (window[cbName]) delete window[cbName];
            }

            timer = setTimeout(() => {
                cleanup();
                reject(new Error("Tiempo de espera agotado leyendo la hoja (gviz)."));
            }, TIMEOUT_MS);

            window[cbName] = (resp) => {
                cleanup();
                try {
                    resolve(gvizToRecords(resp));
                } catch (e) {
                    reject(e);
                }
            };

            script.onerror = () => {
                cleanup();
                reject(new Error("No se pudo leer la hoja compartida (gviz)."));
            };

            const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`;
            script.src = `${base}?sheet=${encodeURIComponent(sheetName)}&headers=1&tqx=responseHandler:${cbName}&nocache=${Date.now()}`;
            document.head.appendChild(script);
        });
    };

    const loadRecordsViaWebApp = async (webAppUrl) => {
        const url = new URL(webAppUrl);
        url.searchParams.set("action", "list");
        const res = await fetch(url.toString(), { method: "GET", headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = JSON.parse(await res.text());
        if (!data || !data.success) throw new Error((data && data.message) || "Error de API");
        return data.records || [];
    };

    // Punto de entrada único para las vistas de calidad y el prefetch.
    const loadTintoreriaRecords = async () => {
        const IQ = (window.APP_CONFIG && window.APP_CONFIG.IQ) || {};
        if (IQ.RECORDS_SHEET_ID && IQ.RECORDS_SHEET_NAME) {
            try {
                return await loadRecordsViaGviz(IQ.RECORDS_SHEET_ID, IQ.RECORDS_SHEET_NAME);
            } catch (e) {
                console.warn("[DataAPI] Lectura gviz no disponible; usando Apps Script.", e);
            }
        }
        if (!IQ.WEB_APP_URL) throw new Error("No hay fuente de datos configurada.");
        return loadRecordsViaWebApp(IQ.WEB_APP_URL);
    };

    window.DataAPI = { gvizToObjects, loadSheetJSONP, loadTintoreriaRecords };
})();
