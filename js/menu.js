(() => {
    if (!window.AppRouter || !window.AppRouter.isView("home")) {
        return;
    }

    const root = document.getElementById("root");
    if (!root) {
        return;
    }

    root.innerHTML = `
        <div class="card-wrapper">
            <div class="card-header">
                ASEGURAMIENTO CALIDAD TEXTIL
            </div>

            <div class="menu-list">
                <a class="menu-item" href="${window.AppRouter.href("trazabilidad")}">
                    <div class="icon-circle">✓</div>
                    <div class="menu-texts">
                        <div class="menu-title">TRAZABILIDAD TELA CRUDA</div>
                        <div class="menu-subtitle">Reporte de insp. tela cruda OP-Partida</div>
                    </div>
                </a>

                <a class="menu-item" href="${window.AppRouter.href("principales_defectos")}">
                    <div class="icon-circle">✓</div>
                    <div class="menu-texts">
                        <div class="menu-title">REPORTE INSPECCION TELA CRUDA</div>
                        <div class="menu-subtitle">Principales defectos, x maquina, produccion x articulo y defectos de inspeccion</div>
                    </div>
                </a>
            </div>
        </div>
    `;
})();
