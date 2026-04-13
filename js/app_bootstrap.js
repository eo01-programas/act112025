(() => {
    if (!window.AppRouter || window.AppRouter.isView("home")) {
        return;
    }

    const viewScripts = {
        trazabilidad: "js/view_sources/trazabilidad.source.js",
        principales_defectos: "js/view_sources/principales_defectos.source.js",
        defecto_maquina: "js/view_sources/defecto_maquina.source.js",
        produccion_articulo: "js/view_sources/produccion_articulo.source.js",
        defectos_inspeccion: "js/view_sources/defectos_inspeccion.source.js",
        registro_terceros: "js/view_sources/registro_terceros.source.js",
        hoja_evaluacion_textil: "js/view_sources/hoja_evaluacion_textil.source.js",
    };

    const scriptSrc = viewScripts[window.AppRouter.currentView];
    if (!scriptSrc) {
        console.warn(`[bootstrap] No hay script registrado para la vista "${window.AppRouter.currentView}".`);
        return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = false;
    script.setAttribute("data-source", scriptSrc);
    script.onload = () => {
        const source = window.__VIEW_SOURCE__;
        window.__VIEW_SOURCE__ = null;

        if (!source) {
            console.error(`[bootstrap] ${scriptSrc} no expuso código fuente.`);
            return;
        }

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
    };
    script.onerror = () => {
        console.error(`[bootstrap] No se pudo cargar ${scriptSrc}`);
    };

    document.body.appendChild(script);
})();
