// iq_view.js — Monta el dashboard "Análisis de Rechazos e Inspección T-Acabada"
// dentro de la app principal: inyecta su hoja de estilos propia y el esqueleto
// HTML en #root. Se carga como PRIMER script de la vista (ver app_bootstrap.js),
// antes que iq_config/iq_data/.../iq_filters, que esperan estos elementos por ID.
(() => {
    // 1) Hoja de estilos propia del dashboard (se inyecta una sola vez).
    if (!document.getElementById("iq-stylesheet")) {
        const link = document.createElement("link");
        link.id   = "iq-stylesheet";
        link.rel  = "stylesheet";
        link.href = "css/indicadores_calidad.css";
        document.head.appendChild(link);
    }

    // 2) Enlace de regreso al menú principal.
    const homeHref = window.AppRouter ? window.AppRouter.href("home") : "index.html";

    // 3) Esqueleto HTML (equivalente al <body> del index.html original de
    //    indicadores_calidad, más un botón "← Menú").
    const root = document.getElementById("root");
    if (!root) return;

    root.innerHTML = `
        <header class="iq-header">
            <div class="iq-header-brand">
                <div class="iq-header-icon">📊</div>
                <div>
                    <h1>Análisis de rechazos e inspección T-ACABADA</h1>
                </div>
            </div>
            <div class="iq-header-actions">
                <a class="btn-primary" href="${homeHref}" title="Volver al menú">← Menú</a>
                <button id="btn-refresh" class="btn-primary btn-icon-only" title="Actualizar datos">↻</button>
            </div>
        </header>

        <div class="iq-filters">
            <div class="filter-group">
                <span class="filter-group-label">Ver por</span>
                <div class="pill-toggle">
                    <button class="pill-btn active" data-mode="semana">Semana</button>
                    <button class="pill-btn"        data-mode="mes">Mes</button>
                </div>
            </div>

            <div class="filter-group">
                <span class="filter-group-label">Año</span>
                <select id="filter-year" class="filter-select"></select>
            </div>

            <div class="filter-group">
                <span class="filter-group-label">Mes</span>
                <select id="filter-month" class="filter-select"></select>
            </div>

            <div class="filter-group" id="filter-week-group">
                <span class="filter-group-label">Semana</span>
                <select id="filter-week" class="filter-select"></select>
            </div>

            <div class="filter-group" id="filter-prev-week-group">
                <span class="filter-group-label">&nbsp;</span>
                <label class="switch-label">
                    <input type="checkbox" id="toggle-prev-week">
                    <span class="switch-track"></span>
                    Semana anterior
                </label>
            </div>

            <div class="filter-group">
                <span class="filter-group-label">Cliente</span>
                <select id="filter-cliente" class="filter-select">
                    <option value="">Todos</option>
                </select>
            </div>

            <div class="filter-group">
                <span class="filter-group-label">Cod. Art.</span>
                <div class="cod-art-combo" id="cod-art-combo">
                    <input type="text" id="filter-cod-art-input" class="filter-select cod-art-input"
                           placeholder="Código o artículo…" autocomplete="off" spellcheck="false">
                    <button id="cod-art-clear" class="cod-art-clear hidden" title="Limpiar">×</button>
                    <div id="cod-art-dropdown" class="cod-art-dropdown hidden"></div>
                </div>
            </div>

            <div class="filter-group">
                <span class="filter-group-label">Tipo Tela</span>
                <select id="filter-tipo-tela" class="filter-select"></select>
            </div>

            <div class="filter-group filter-group-print">
                <span class="filter-group-label">&nbsp;</span>
                <button id="btn-print" class="btn-print">🖨 Imprimir</button>
            </div>
        </div>

        <main class="iq-main">
            <section class="kpi-section">
                <div class="kpi-card kpi-card-clickable" id="kpi-card-auditadas" title="Ver detalle de supervisores y aprobaciones">
                    <span class="kpi-label">Partidas Auditadas</span>
                    <span class="kpi-value" id="kpi-auditadas-value">--</span>
                    <span class="kpi-card-hint">↗</span>
                </div>
                <div class="kpi-card kpi-success">
                    <span class="kpi-label">Aprobadas</span>
                    <div class="kpi-right">
                        <span class="kpi-value" id="kpi-aprobadas-value">--</span>
                        <span class="kpi-sub"   id="kpi-aprobadas-pct">--%</span>
                    </div>
                </div>
                <div class="kpi-card kpi-danger">
                    <span class="kpi-label">Rechazadas</span>
                    <div class="kpi-right">
                        <span class="kpi-value" id="kpi-rechazadas-value">--</span>
                        <span class="kpi-sub"   id="kpi-rechazadas-pct">--%</span>
                    </div>
                </div>
                <div class="kpi-card kpi-warning">
                    <span class="kpi-label">En Evaluación</span>
                    <div class="kpi-right">
                        <span class="kpi-value" id="kpi-evaluacion-value">--</span>
                        <span class="kpi-sub"   id="kpi-evaluacion-pct">--%</span>
                    </div>
                </div>
                <div class="kpi-card kpi-info">
                    <span class="kpi-label">Kg Auditados</span>
                    <span class="kpi-value" id="kpi-kg-value">--</span>
                </div>
            </section>

            <section class="iq-section">
                <div class="section-header">
                    <h2>Matriz de Distribución de Defectos</h2>
                </div>
                <div class="table-scroll-container">
                    <table id="matrix-table" class="iq-table">
                        <thead id="matrix-thead"></thead>
                        <tbody id="matrix-tbody">
                            <tr><td colspan="5" class="empty-state">Cargando datos…</td></tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <div class="two-col-row">
                <section class="iq-section">
                    <div class="section-header">
                        <h2>Top Motivos de Rechazo</h2>
                        <div class="pill-toggle">
                            <button class="pill-btn active" data-chart-mode="freq">Frecuencia</button>
                            <button class="pill-btn"        data-chart-mode="kg">Peso (kg)</button>
                        </div>
                        <button id="btn-pareto" class="btn-secondary">Ver Pareto →</button>
                        <p class="section-sub" id="top-motivos-subtitle"></p>
                    </div>
                    <div id="pareto-summary-inline" class="pareto-summary-inline"></div>
                    <div id="top-motivos-chart">
                        <div class="empty-state">Cargando datos…</div>
                    </div>
                </section>

                <section class="iq-section">
                    <div class="section-header">
                        <h2>Artículos con Rechazo</h2>
                        <p class="section-sub" id="rechazos-articulo-subtitle"></p>
                    </div>
                    <div id="rechazos-por-articulo-chart">
                        <div class="empty-state">Cargando datos…</div>
                    </div>
                </section>
            </div>
        </main>

        <div id="partidas-modal" class="modal-overlay hidden">
            <div class="modal-box partidas-modal-box">
                <div class="modal-header">
                    <h2>Detalle de Partidas Auditadas</h2>
                    <button id="partidas-close" class="modal-close" title="Cerrar">✕</button>
                </div>
                <div class="partidas-modal-body">
                    <section class="iq-section">
                        <div class="section-header">
                            <h2>Gestión de Decisiones por Supervisor</h2>
                        </div>
                        <div class="table-scroll-container">
                            <table id="auditor-table" class="iq-table">
                                <thead>
                                    <tr>
                                        <th class="th-left">Supervisor</th>
                                        <th>Total</th>
                                        <th class="th-rejected">Rechazos</th>
                                        <th class="th-approved">Aprobaciones</th>
                                        <th>% Rechazos</th>
                                        <th class="th-left">Motivo frecuente</th>
                                    </tr>
                                </thead>
                                <tbody id="auditor-tbody">
                                    <tr><td colspan="6" class="empty-state">Cargando datos…</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <p class="table-note">ℹ️ <strong>¿Cómo se calculan estos números?</strong> El <strong>Total</strong> cuenta cada decisión de inspección realizada, no partidas únicas. Si una partida fue rechazada dos veces, suma 2 al total del supervisor que la rechazó. Si fue rechazada por un supervisor y aprobada por otro, ambos la cuentan por separado.</p>
                    </section>

                    <section class="iq-section">
                        <div class="section-header">
                            <h2>Distribución de Aprobaciones</h2>
                        </div>
                        <div class="table-scroll-container">
                            <table id="quien-aprobo-table" class="iq-table">
                                <thead>
                                    <tr>
                                        <th class="th-left">RESPONSABLE</th>
                                        <th class="th-approved">Partidas</th>
                                        <th>% Participación</th>
                                        <th>Kg</th>
                                    </tr>
                                </thead>
                                <tbody id="quien-aprobo-tbody">
                                    <tr><td colspan="4" class="empty-state">Cargando datos…</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>

        <div id="pareto-modal" class="modal-overlay hidden">
            <div class="modal-box pareto-modal-box">
                <div class="modal-header">
                    <div>
                        <h2>Diagrama de Pareto de Motivos de Rechazos</h2>
                    </div>
                    <button id="pareto-close" class="modal-close" title="Cerrar">✕</button>
                </div>
                <div id="pareto-filters-mount" class="pareto-filters-mount"></div>
                <div class="pareto-mode-row">
                    <div class="pill-toggle">
                        <button class="pill-btn active" data-pareto-mode="freq">Frecuencia</button>
                        <button class="pill-btn"        data-pareto-mode="kg">Peso (kg)</button>
                    </div>
                </div>
                <div id="pareto-chart-container"></div>
                <div class="pareto-insights">
                    <div class="pareto-vitals" id="pareto-vitals"></div>
                </div>
            </div>
        </div>

        <div id="bar-tooltip" class="bar-tooltip hidden"></div>

        <div id="loading-overlay" class="loading-overlay">
            <div class="spinner"></div>
            <p style="color:#555;font-size:13px">Cargando datos…</p>
        </div>
    `;
})();
