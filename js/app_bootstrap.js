(() => {
    if (!window.AppRouter || window.AppRouter.isView("home")) {
        return;
    }

    const viewScripts = {
        trazabilidad: "js/trazabilidad.js",
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
                    presets: ["env", "react"],
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
