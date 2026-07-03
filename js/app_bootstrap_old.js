// COPIA TEMPORAL DEL BOOTSTRAP ANTERIOR — solo para pruebas A/B con index_old.html.
// Borrar al terminar las pruebas.
(() => {
    if (!window.AppRouter || window.AppRouter.isView("home")) {
        return;
    }

    const vanillaViewScripts = {
        indicadores_calidad: [
            "js/iq_view.js",
            "js/iq_data.js",
            "js/iq_matrix.js",
            "js/iq_charts.js",
            "js/iq_auditor.js",
            "js/iq_filters.js",
        ],
        consolidado_aprobaciones: [
            "js/consolidado_aprobaciones.js",
        ],
    };

    const vanillaScripts = vanillaViewScripts[window.AppRouter.currentView];
    if (vanillaScripts) {
        const loadSeq = (i) => {
            if (i >= vanillaScripts.length) return;
            const tag = document.createElement("script");
            tag.src = vanillaScripts[i] + "?v=" + Date.now();
            tag.onload = () => loadSeq(i + 1);
            tag.onerror = () => console.error(`[bootstrap] No se pudo cargar ${vanillaScripts[i]}`);
            document.body.appendChild(tag);
        };
        loadSeq(0);
        return;
    }

    const viewScripts = {
        trazabilidad: "js/trazabilidad.js",
        trazabilidad_op: "js/trazabilidad_op.js",
        principales_defectos: "js/principales_defectos.js",
        defecto_maquina: "js/defecto_maquina.js",
        produccion_articulo: "js/produccion_articulo.js",
        defectos_inspeccion: "js/defectos_inspeccion.js",
        registro_terceros: "js/registro_terceros.js",
        hoja_evaluacion_textil: "js/hoja_evaluacion_textil.js",
    };

    const scriptSrc = viewScripts[window.AppRouter.currentView];
    if (!scriptSrc) {
        console.warn(`[bootstrap] No hay script registrado para la vista "${window.AppRouter.currentView}".`);
        return;
    }

    fetch(scriptSrc + "?v=" + Date.now())
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
        })
        .then(source => {
            try {
                const compiled = Babel.transform(source, {
                    sourceType: "script",
                    presets: ["env", ["react", { runtime: "classic" }]],
                }).code;

                const runtime = document.createElement("script");
                runtime.type = "text/javascript";
                runtime.text = compiled;
                document.body.appendChild(runtime);
            } catch (error) {
                console.error(`[bootstrap] No se pudo compilar ${window.AppRouter.currentView}:`, error);
            }
        })
        .catch(err => {
            console.error(`[bootstrap] No se pudo cargar ${scriptSrc}:`, err);
        });
})();
