(() => {
    const VIEW_PARAM = "view";

    const routes = {
        home: {
            title: "Aseguramiento Calidad Textil",
            pageStyle: "@page { size: auto; margin: 12mm; }",
        },
        trazabilidad: {
            title: "Trazabilidad Tela Cruda",
            pageStyle: "@page { size: portrait; margin: 1.5cm 3mm 5mm 3mm; }",
        },
        principales_defectos: {
            title: "Principales Defectos",
            pageStyle: "@page { size: landscape; margin: 1.5cm; }",
        },
        defecto_maquina: {
            title: "Defectos por Maquina",
            pageStyle: "@page { size: landscape; margin: 1cm; }",
        },
        produccion_articulo: {
            title: "Produccion por Articulo",
            pageStyle: "@page { size: portrait; margin: 1.5cm; }",
        },
        defectos_inspeccion: {
            title: "Defectos Inspeccion",
            pageStyle: "@page { size: landscape; margin: 0.8cm; }",
        },
    };

    const resolveView = () => {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get(VIEW_PARAM) || "home";
        return routes[requested] ? requested : "home";
    };

    const href = (view = "home") => {
        const url = new URL(window.location.href);
        url.search = "";
        url.hash = "";
        if (view && view !== "home") {
            url.searchParams.set(VIEW_PARAM, view);
        }
        return url.toString();
    };

    const ensurePrintProfile = () => {
        let styleTag = document.getElementById("print-profile");
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = "print-profile";
            document.head.appendChild(styleTag);
        }
        return styleTag;
    };

    const currentView = resolveView();
    document.body.dataset.view = currentView;
    document.title = routes[currentView].title;
    ensurePrintProfile().textContent = routes[currentView].pageStyle;

    window.AppRouter = {
        currentView,
        routes,
        href,
        isView(view) {
            return currentView === view;
        },
    };
})();
