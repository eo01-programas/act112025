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

            <div class="menu-list menu-list--2col">
                <div class="menu-col">
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

                    <a class="menu-item" href="${window.AppRouter.href("registro_terceros")}">
                        <div class="icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg></div>
                        <div class="menu-texts">
                            <div class="menu-title">REGISTRO INSP T-CRUDA</div>
                            <div class="menu-subtitle">Registro de inspeccion de Tela cruda</div>
                        </div>
                    </a>
                </div>

                <div class="menu-col">
                    <a class="menu-item" href="${window.AppRouter.href("hoja_evaluacion_textil")}">
                        <div class="icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="M9 3v4a1 1 0 0 0 1 1h4"/><path d="M8 12h8"/><path d="M8 16h8"/><path d="M8 8h1"/></svg></div>
                        <div class="menu-texts">
                            <div class="menu-title">Hoja de Evaluacion Textil</div>
                            <div class="menu-subtitle">Registro, edicion y visualizacion</div>
                        </div>
                    </a>

                    <a class="menu-item" href="${window.AppRouter.href("indicadores_calidad")}">
                        <div class="icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg></div>
                        <div class="menu-texts">
                            <div class="menu-title">ANALISIS RECHAZOS E INSPECCION T-ACABADA</div>
                            <div class="menu-subtitle">Rechazos, aprobaciones y defectos por período</div>
                        </div>
                    </a>

                    <a class="menu-item" href="${window.AppRouter.href("trazabilidad_op")}">
                        <div class="icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="13" width="3" height="5"/><rect x="12" y="9" width="3" height="9"/><rect x="17" y="6" width="3" height="12"/></svg></div>
                        <div class="menu-texts">
                            <div class="menu-title">TRAZABILIDAD OP-PARTIDA</div>
                            <div class="menu-subtitle">Rechazos y aprobaciones por OP-Partida en una vista de grilla</div>
                        </div>
                    </a>

                    <a class="menu-item" href="${window.AppRouter.href("consolidado_aprobaciones")}">
                        <div class="icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
                        <div class="menu-texts">
                            <div class="menu-title">CONSOLIDADO DE APROBACIONES</div>
                            <div class="menu-subtitle">First Pass Yield (FPY): bien a la primera, neto y rechazos por cliente</div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    `;
})();
