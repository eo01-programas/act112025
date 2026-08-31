(() => {
    if (!window.AppRouter || window.AppRouter.isView("home")) {
        // El menú (menu.js) es DOM puro con su propio CSS: no necesita librerías.
        return;
    }

    const view = window.AppRouter.currentView;

    // Versión fija para la caché HTTP: el navegador reutiliza los scripts entre
    // visitas y solo re-descarga cuando se sube APP_VERSION en config.js.
    const VERSION = encodeURIComponent(
        (window.APP_CONFIG && window.APP_CONFIG.APP_VERSION) || "1"
    );
    const withVersion = (src) => `${src}?v=${VERSION}`;

    // ── Librerías CDN ────────────────────────────────────────────────────────
    // Antes vivían como <script defer> en el <head> y TODAS las vistas pagaban
    // su descarga y ejecución (~6 MB) aunque no las usaran. Ahora cada vista
    // declara en VIEW_DEPS solo lo que realmente usa.
    const LIBS = {
        tailwind:  "https://cdn.tailwindcss.com",
        // Versiones exactas: unpkg responde con redirect 302 cuando la versión
        // es parcial (react@18), lo que suma un viaje extra en cada carga fría.
        react:     "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
        reactDom:  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
        babel:     "https://unpkg.com/@babel/standalone/babel.min.js",
        exceljs:   "https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js",
        xlsx:      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
        papaparse: "https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js",
        chartjs:   "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
    };

    // indicadores_calidad y registro_terceros usan CSS propio y gráficos SVG:
    // cero librerías. Babel no se lista aquí: lo agrega solo el camino JSX.
    const VIEW_DEPS = {
        indicadores_calidad:      [],
        registro_terceros:        [],
        consolidado_aprobaciones: ["tailwind", "chartjs", "xlsx"],
        trazabilidad_op:          ["tailwind", "react", "reactDom", "chartjs"],
        trazabilidad:             ["tailwind", "react", "reactDom", "xlsx"],
        principales_defectos:     ["tailwind", "react", "reactDom", "exceljs", "xlsx"],
        defecto_maquina:          ["tailwind", "react", "reactDom", "exceljs", "xlsx"],
        produccion_articulo:      ["tailwind", "react", "reactDom", "exceljs", "xlsx", "papaparse", "chartjs"],
        defectos_inspeccion:      ["tailwind", "react", "reactDom", "exceljs", "xlsx", "chartjs"],
        hoja_evaluacion_textil:   ["tailwind", "react", "reactDom"],
    };

    // Vistas "vanilla": JS clásico (sin JSX) compuesto por varios scripts. El
    // primero monta el esqueleto HTML; el último arranca la app.
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
            "js/chart_tendencia.js",
            "js/consolidado_aprobaciones.js",
        ],
    };

    // Scripts planos propios (sin JSX) que una vista necesita ANTES de su script
    // principal. Se versionan con APP_VERSION igual que el resto.
    const viewPlainScripts = {
        trazabilidad_op: ["js/chart_tendencia.js"],
    };

    // Vistas JSX ya compiladas a JS plano con tools/compilar_vistas.cmd.
    // No descargan Babel ni compilan en el navegador.
    // IMPORTANTE: si editas la fuente (js/<vista>.js) hay que regenerar el
    // compilado, o la app seguirá sirviendo la versión anterior.
    const compiledViews = {
        trazabilidad_op: "js/compiled/trazabilidad_op.js",
    };

    // Vistas JSX que aún se compilan en el navegador con Babel.
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

    // async = false: los scripts inyectados se DESCARGAN en paralelo pero se
    // EJECUTAN en orden de inserción (react antes que react-dom, iq_view antes
    // que iq_data, etc.). Se memoriza cada src para no inyectarlo dos veces.
    const scriptPromises = new Map();
    const loadScript = (src) => {
        if (scriptPromises.has(src)) return scriptPromises.get(src);
        const promise = new Promise((resolve, reject) => {
            const tag = document.createElement("script");
            tag.src = src;
            tag.async = false;
            tag.onload = () => resolve(src);
            tag.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
            document.body.appendChild(tag);
        });
        scriptPromises.set(src, promise);
        return promise;
    };

    const depUrls = (VIEW_DEPS[view] || []).map((name) => LIBS[name]);
    const plainSrcs = (viewPlainScripts[view] || []).map(withVersion);

    // Camino Babel: baja la fuente JSX y la compila en el navegador. Se usa
    // para las vistas sin versión precompilada (o como respaldo si esta falla).
    const bootWithBabel = async () => {
        const scriptSrc = viewScripts[view];
        if (!scriptSrc) {
            console.warn(`[bootstrap] No hay script registrado para la vista "${view}".`);
            return;
        }

        // La fuente se descarga en paralelo con las librerías.
        const sourceReady = fetch(withVersion(scriptSrc)).then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
        });
        const depsReady = Promise.all([...depUrls, ...plainSrcs, LIBS.babel].map(loadScript));
        const [source] = await Promise.all([sourceReady, depsReady]);

        // sourceType "script" + runtime "classic" evitan que Babel genere
        // sentencias `import` (jsx-runtime automático), que rompen al
        // inyectarse como <script> normal (no módulo).
        const compiled = Babel.transform(source, {
            sourceType: "script",
            presets: ["env", ["react", { runtime: "classic" }]],
        }).code;

        const runtime = document.createElement("script");
        runtime.type = "text/javascript";
        runtime.text = compiled;
        document.body.appendChild(runtime);
    };

    (async () => {
        try {
            const vanillaScripts = vanillaViewScripts[view];
            if (vanillaScripts) {
                await Promise.all(
                    [...depUrls, ...vanillaScripts.map(withVersion)].map(loadScript)
                );
                return;
            }

            const compiledSrc = compiledViews[view];
            if (compiledSrc) {
                try {
                    await Promise.all(
                        [...depUrls, ...plainSrcs, withVersion(compiledSrc)].map(loadScript)
                    );
                    return;
                } catch (error) {
                    console.warn(`[bootstrap] Precompilado de "${view}" no disponible; compilando en el navegador.`, error);
                }
            }

            await bootWithBabel();
        } catch (error) {
            console.error(`[bootstrap] No se pudo cargar la vista "${view}":`, error);
        }
    })();
})();
