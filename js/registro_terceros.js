(() => {
    if (!window.AppRouter || window.AppRouter.currentView !== "registro_terceros") {
        return;
    }

    const root = document.getElementById("root");
    if (!root) {
        return;
    }

    const {
        BASE_SHEET_HEADER_ROWS = 1,
        SOURCE_APPS_SCRIPT_URL,
        SOURCE_SHEET_ID,
        SOURCE_SHEET_NAME = "base",
        SOURCE_TERCEROS_SHEET_NAME = "terceros",
    } = window.APP_CONFIG || {};
    const STORAGE_KEY = "registro_terceros.global_rolls";
    const TURNOS = ["A", "B", "C"];
    const MAQUINAS = ["SRV"];
    const CATEGORIAS = ["PRIMERA", "SEGUNDA", "RECHAZADO"];
    const DEFECT_COLUMNS = [
        "Hueco Con Cordon",
        "Cordon",
        "Hilo Irregular",
        "Polipropileno",
        "Contaminación De Hilado",
        "Hilo Sucio",
        "Cascarillas",
        "Empalme",
        "Caida De Tela",
        "Falla De Lycra",
        "Escapes De Lycra",
        "Falla De Lycra a lo Ancho",
        "Falla De Raport",
        "Hilo Doble",
        "Suciedad En Doblez",
        "Barrado Por Luz Violeta",
        "Barrado Por Maquina",
        "Marca De Doblez",
        "Qebraduras",
        "Quebradura en el Doblez",
        "Jaladuras",
        "Parada De Maquina",
        "Rotura De Aguja",
        "Anillado",
        "Malla Retinada",
        "Malla Rota",
        "Lineas Verticales De Aguja",
        "Cont. Por Ambiente",
        "Lineas De Aceite",
        "Gotas Aceite Dispersas",
        "Hilo Tensionado",
        "Malla Caida/Fuga",
        "Hilo Jaspeado",
        "Hilo Barrado"
    ];
    const FIXED_DEFECT_CATALOG = DEFECT_COLUMNS.map((name, index) => ({
        id: String(index + 1).padStart(2, "0"),
        codigo: String(index + 1).padStart(2, "0"),
        nombre: name,
        sheetHeader: name,
        puntos: 2,
    }));
    const alertTimers = new Map();
    const SHEET_ID = SOURCE_SHEET_ID;
    const SHEET_NAME = SOURCE_SHEET_NAME;
    const CONSULTA_ALLOWED_INSPECTOR = "EDWIN RODRIGUEZ";
    const SIDEBAR_COLLAPSED_KEY = "registro_terceros.sidebar_collapsed";

    const state = {
        currentUser: null,
        isLocked: false,
        defectCatalog: [],
        currentDefects: [],
        sessionRolls: [],
        globalRolls: loadStoredRolls(),
        filteredRolls: [],
        currentEditRoll: null,
        currentEditDefects: [],
        consultaPage: 1,
        consultaLoading: false,
        sidebarCollapsed: loadSidebarCollapsed(),
    };

    const CONSULTA_PAGE_SIZE = 12;
    const CONSULTA_MONTHS = {
        ene: 0,
        feb: 1,
        mar: 2,
        abr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        ago: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dic: 11,
    };

    let consultaAllRowsCache = null;
    let consultaAllRowsPromise = null;

    state.filteredRolls = sortRolls(state.globalRolls);

    root.innerHTML = `
        <div class="rt-app">
            <aside class="rt-sidebar">
                <div class="rt-sidebar-header">
                    <button type="button" class="rt-sidebar-toggle" id="rt-sidebar-toggle" title="Contraer menu" aria-label="Contraer menu">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                    </button>
                    <a class="rt-sidebar-back" href="${window.AppRouter.href("home")}" title="Volver al inicio" aria-label="Volver al inicio">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10.5V20h13V10.5"/><path d="M9 20v-6h6v6"/></svg>
                    </a>
                </div>
                <nav class="rt-nav">
                    <button type="button" class="rt-nav-button active" data-nav-view="login" aria-label="Perfil" title="Perfil"><span class="rt-nav-icon">PF</span><span>Perfil</span></button>
                    <button type="button" class="rt-nav-button" data-nav-view="registro" id="rt-nav-registro" aria-label="Registro" title="Registro" style="display:none;"><span class="rt-nav-icon">RG</span><span>Registro</span></button>
                    <button type="button" class="rt-nav-button" data-nav-view="consulta" id="rt-nav-consulta" aria-label="Consulta" title="Consulta" style="display:none;"><span class="rt-nav-icon">CN</span><span>Consulta</span></button>
                </nav>
                <div class="rt-sidebar-footer">
                    <button type="button" class="rt-logout-button" id="rt-logout-btn" style="display:none;">Cerrar sesion</button>
                </div>
            </aside>

            <div class="rt-main">
                <header class="rt-header" id="rt-header" style="display:none;">
                    <div class="rt-header-title">
                        <h2>Inspeccion T-cruda</h2>
                    </div>
                    <div class="rt-user-box">
                        <span class="rt-user-name" id="rt-user-name">Usuario</span>
                        <span class="rt-user-sep">/</span>
                        <span class="rt-user-detail" id="rt-user-detail">Turno: - | --/--</span>
                    </div>
                </header>

                <main class="rt-content">
                    <section class="view active" id="rt-login-view">
                        <div class="rt-login-shell">
                            <div class="rt-login-card">
                                <div class="rt-login-header">
                                    <div class="rt-login-badge">RT</div>
                                    <h1>Registro Insp T-Cruda</h1>
                                </div>
                                <form class="rt-login-form" id="rt-login-form">
                                    <div class="rt-alert" id="rt-login-alert"></div>
                                    <div class="rt-field"><label for="rt-inspector">Inspector</label><select id="rt-inspector" required><option value="">Cargando...</option></select></div>
                                    <div class="rt-field" style="margin-top:12px;"><label for="rt-fecha">Fecha</label><input type="date" id="rt-fecha" required></div>
                                    <div class="rt-inline-grid" style="margin-top:12px;">
                                        <div class="rt-field"><label for="rt-turno">Turno</label><select id="rt-turno" required><option value="">Seleccionar...</option>${TURNOS.map((v) => `<option value="${v}">${v}</option>`).join("")}</select></div>
                                        <div class="rt-field"><label for="rt-maquina">Maquina</label><select id="rt-maquina" required><option value="">Seleccionar...</option>${MAQUINAS.map((v) => `<option value="${v}">${v}</option>`).join("")}</select></div>
                                    </div>
                                    <div class="rt-field" style="margin-top:12px;"><label for="rt-name-srv">Name SRV</label><select id="rt-name-srv" required><option value="">Cargando...</option></select></div>
                                    <button type="submit" class="rt-button primary full" style="margin-top:16px;">Ingresar</button>
                                </form>
                            </div>
                        </div>
                    </section>

                    <section class="view" id="rt-registro-view">
                        <div class="rt-layout">
                            <div class="rt-alert" id="rt-registro-alert"></div>

                            <div class="rt-card">
                                <div class="rt-card-header">
                                    <div><h3>1. Datos principales</h3><span class="rt-pill" id="rt-lock-badge" style="display:none;">Bloqueado</span></div>
                                    <div class="rt-card-actions">
                                        <button type="button" class="rt-icon-button rt-icon-circle" id="rt-lock-btn" title="Bloquear">🔒</button>
                                        <button type="button" class="rt-icon-button rt-icon-circle" id="rt-clear-main-btn" title="Limpiar">🧹</button>
                                        <button type="button" class="rt-icon-button rt-icon-circle" id="rt-search-main-btn" title="Buscar">🔍</button>
                                    </div>
                                </div>
                                <div class="rt-card-body">
                                    <div class="rt-form-grid rt-form-grid-compact">
                                        <div class="rt-field"><label for="rt-op">OP</label><input type="text" id="rt-op" data-numeric="true"></div>
                                        <div class="rt-field"><label for="rt-partida">Partida</label><input type="text" id="rt-partida" data-numeric="true"></div>
                                        <div class="rt-field"><label for="rt-color">Color</label><input type="text" id="rt-color" class="rt-uppercase"></div>
                                        <div class="rt-field"><label for="rt-cliente">Cliente</label><select id="rt-cliente"><option value="">Cargando...</option></select></div>
                                        <div class="rt-field"><label for="rt-cod-articulo">Cod. articulo</label><input type="text" id="rt-cod-articulo" data-numeric="true"></div>
                                        <div class="rt-field"><label for="rt-descripcion">Descripcion de tela</label><input type="text" id="rt-descripcion" class="rt-uppercase"></div>
                                        <div class="rt-field"><label for="rt-titulo-hilo">Título de Hilo</label><input type="text" id="rt-titulo-hilo"></div>
                                        <div class="rt-field"><label for="rt-lote-hilo">Lote hilo</label><input type="text" id="rt-lote-hilo"></div>
                                        <div class="rt-field"><label for="rt-lote-spandex">Lote spandex</label><input type="text" id="rt-lote-spandex"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="rt-columns">
                                <div class="rt-card">
                                    <div class="rt-card-header"><h3>2. Registro de defectos del rollo</h3></div>
                                    <div class="rt-card-body">
                                        <div class="rt-inspeccion-inner">
                                            <div class="rt-inspeccion-left">
                                                <div class="rt-field"><label for="rt-n-rollo">Nro rollo</label><input type="text" id="rt-n-rollo" data-numeric="true"></div>
                                                <div class="rt-field"><label for="rt-peso">Peso (kg)</label><input type="text" id="rt-peso" data-decimal="true"></div>
                                            </div>
                                            <div class="rt-defect-box">
                                                <div class="rt-defect-inputs">
                                                    <div class="rt-field"><label for="rt-defecto">Defecto</label><select id="rt-defecto"><option value="">Cargando...</option></select></div>
                                                    <div class="rt-field"><label for="rt-ocurrencia">Ocurrencia</label><input type="text" id="rt-ocurrencia" data-numeric="true"></div>
                                                    <button type="button" class="rt-button success" id="rt-add-defect-btn">Anadir</button>
                                                </div>
                                                <div class="rt-field" style="margin-top:14px;"><label for="rt-comentario-defecto">Comentario defecto</label><input type="text" id="rt-comentario-defecto" class="rt-uppercase"></div>
                                            </div>
                                        </div>
                                        <div id="rt-defects-list" style="display:none; margin-top:16px;"><div class="rt-table-wrap"><table class="rt-table"><thead><tr><th>Defecto</th><th>Ocur.</th><th>Pts.</th><th>Accion</th></tr></thead><tbody id="rt-defects-tbody"></tbody></table></div></div>
                                    </div>
                                </div>

                                <div class="rt-card">
                                    <div class="rt-card-header"><h3>3. Evaluacion</h3></div>
                                    <div class="rt-card-body">
                                        <div class="rt-evaluacion-inner">
                                            <div class="rt-field"><label for="rt-categoria">Categoria</label><select id="rt-categoria"><option value="">Seleccionar...</option>${CATEGORIAS.map((v) => `<option value="${v}">${v}</option>`).join("")}</select></div>
                                            <div class="rt-field"><label for="rt-merma">Merma (kg)</label><input type="text" id="rt-merma" data-decimal="true"></div>
                                            <div class="rt-field"><label for="rt-comentario-evaluacion">Comentario evaluacion</label><textarea id="rt-comentario-evaluacion" class="rt-uppercase" placeholder="OPCIONAL..."></textarea></div>
                                        </div>
                                        <button type="button" class="rt-button dark full" id="rt-add-roll-btn" style="margin-top:20px; font-size: 16px; padding: 14px;">Agregar rollo a lista</button>
                                    </div>
                                </div>
                            </div>

                            <div class="rt-card">
                                <div class="rt-card-header" style="background:#dfeccd;"><h3 id="rt-rolls-header">Lista de rollos a guardar (0)</h3></div>
                                <div class="rt-table-wrap"><table class="rt-table"><thead><tr><th>Nro rollo</th><th>OP</th><th>Partida</th><th>Color</th><th>Peso</th><th>Defectos</th><th>Categoria</th><th>Accion</th></tr></thead><tbody id="rt-rolls-tbody"><tr><td colspan="8" class="rt-empty">No hay rollos agregados en esta sesion.</td></tr></tbody></table></div>
                                <div class="rt-card-body" id="rt-submit-section" style="display:none; text-align:right;"><button type="button" class="rt-button primary" id="rt-submit-btn">Subir y guardar informacion</button></div>
                            </div>
                        </div>
                    </section>

                    <section class="view" id="rt-consulta-view">
                        <div class="rt-layout">
                            <div class="rt-card">
                                <div class="rt-card-header"><h3>Filtros de busqueda</h3></div>
                                <div class="rt-card-body">
                                    <div class="rt-filter-row">
                                        <div class="rt-field"><label for="rt-filter-fecha-desde">Fecha desde</label><input type="date" id="rt-filter-fecha-desde"></div>
                                        <div class="rt-field"><label for="rt-filter-fecha-hasta">Fecha hasta</label><input type="date" id="rt-filter-fecha-hasta"></div>
                                        <div class="rt-field"><label for="rt-filter-cliente">Cliente</label><input type="text" id="rt-filter-cliente" class="rt-uppercase"></div>
                                        <div class="rt-field"><label for="rt-filter-op">OP</label><input type="text" id="rt-filter-op" class="rt-uppercase"></div>
                                        <div class="rt-field"><label for="rt-filter-partida">Partida</label><input type="text" id="rt-filter-partida" class="rt-uppercase"></div>
                                        <div class="rt-field"><label for="rt-filter-rollo">Nro rollo</label><input type="text" id="rt-filter-rollo" class="rt-uppercase"></div>
                                        <button type="button" class="rt-icon-button rt-icon-circle" id="rt-clear-filters-btn" title="Limpiar">🧹</button>
                                        <button type="button" class="rt-icon-button rt-icon-circle active" id="rt-apply-filters-btn" title="Buscar">🔍</button>
                                    </div>
                                </div>
                            </div>
                            <div class="rt-card">
                                <div class="rt-table-wrap">
                                    <table class="rt-table rt-table--ultra-compact" id="rt-consulta-table">
                                        <thead>
                                            <tr>
                                                <th>Cliente</th>
                                                <th>OP</th>
                                                <th>Partida</th>
                                                <th>Color</th>
                                                <th>Cod. Art.</th>
                                                <th>Descripción</th>
                                                <th>Rollo</th>
                                                <th>Categoria</th>
                                                <th>Peso</th>
                                                <th>Defectos</th>
                                                <th>Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody id="rt-consulta-tbody">
                                            <tr><td colspan="11" class="rt-empty">Cargando datos reales...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="rt-pagination" id="rt-pagination-controls" style="margin-top:20px; display:flex; justify-content:center; gap:12px; align-items:center;">
                                    <button type="button" class="rt-button secondary" id="rt-prev-page-btn" disabled>Anterior</button>
                                    <span id="rt-page-indicator" style="font-weight:600; color:#475569;">Página 1</span>
                                    <button type="button" class="rt-button secondary" id="rt-next-page-btn">Siguiente</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            <!-- MODAL DE BUSQUEDA POR OP/PARTIDA -->
            <div class="rt-modal-overlay" id="rt-search-modal">
                <div class="rt-modal-content">
                    <div class="rt-modal-header">
                        <h3>Buscar datos de OP/Partida</h3>
                        <button type="button" class="rt-modal-close-icon" id="rt-search-close-x">&times;</button>
                    </div>
                    <div class="rt-modal-body">
                        <div class="rt-field"><label for="rt-search-op">OP</label><input type="text" id="rt-search-op" data-numeric="true" placeholder="Ej: 30500"></div>
                        <div class="rt-field" style="margin-top:12px;"><label for="rt-search-partida">Partida</label><input type="text" id="rt-search-partida" data-numeric="true" placeholder="Ej: 1"></div>
                    </div>
                    <div class="rt-modal-footer">
                        <button type="button" class="rt-button secondary" id="rt-search-cancel-btn">Cancelar</button>
                        <button type="button" class="rt-button primary" id="rt-search-apply-btn">Aplicar</button>
                    </div>
                </div>
            </div>

            <!-- MODAL DE EDICIÓN DE ROLLO -->
            <div class="rt-modal-overlay" id="rt-edit-modal">
                <div class="rt-modal-content rt-modal-content--large">
                    <div class="rt-modal-header">
                        <h3>Editar Registro de Rollo</h3>
                        <button type="button" class="rt-modal-close-icon" id="rt-edit-close-x">&times;</button>
                    </div>
                    <div class="rt-modal-body rt-modal-body--scroll">
                        <form id="rt-edit-form">
                            <input type="hidden" id="rt-edit-id-unico">
                            <div class="rt-form-grid" style="grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px;">
                                <div class="rt-field"><label>Inspector</label><select id="rt-edit-inspector"></select></div>
                                <div class="rt-field"><label>Cliente</label><select id="rt-edit-cliente"></select></div>
                                <div class="rt-field"><label>OP</label><input type="text" id="rt-edit-op" data-numeric="true"></div>
                                <div class="rt-field"><label>Partida</label><input type="text" id="rt-edit-partida" data-numeric="true"></div>
                                <div class="rt-field"><label>Color</label><input type="text" id="rt-edit-color" class="rt-uppercase"></div>
                                <div class="rt-field"><label>Cod. Art.</label><input type="text" id="rt-edit-cod-articulo" data-numeric="true"></div>
                                <div class="rt-field"><label>Descripción</label><input type="text" id="rt-edit-descripcion" class="rt-uppercase"></div>
                                <div class="rt-field"><label>Rollo</label><input type="text" id="rt-edit-n-rollo" data-numeric="true"></div>
                                <div class="rt-field"><label>Categoria</label><select id="rt-edit-categoria">${CATEGORIAS.map(v => `<option value="${v}">${v}</option>`).join("")}</select></div>
                                <div class="rt-field"><label>Peso (kg)</label><input type="text" id="rt-edit-peso" data-decimal="true"></div>
                                <div class="rt-field"><label>Título de Hilo</label><input type="text" id="rt-edit-titulo-hilo"></div>
                                <div class="rt-field"><label>Lote Hilo</label><input type="text" id="rt-edit-lote-hilo"></div>
                                <div class="rt-field"><label>Lote Lycra</label><input type="text" id="rt-edit-lote-spandex"></div>
                                <div class="rt-field"><label>Máquina</label><input type="text" id="rt-edit-maquina" class="rt-uppercase"></div>
                            </div>

                            <div class="rt-card" style="border: 1px solid #c8d8bd; background: #eef5e8; margin-bottom: 0;">
                                <div class="rt-card-header" style="background: #dfeccd; padding: 8px 16px;">
                                    <h4 style="margin:0; font-size: 13px; color: #3f7550;">Gestión de Defectos</h4>
                                </div>
                                <div class="rt-card-body" style="padding: 12px;">
                                    <div class="rt-defect-inputs" style="margin-bottom: 12px;">
                                        <div class="rt-field"><label>Defecto</label><select id="rt-edit-defecto-select"><option value="">Seleccionar...</option></select></div>
                                        <div class="rt-field"><label>Ocur.</label><input type="text" id="rt-edit-defecto-ocurrencia" data-numeric="true"></div>
                                        <button type="button" class="rt-button success" id="rt-edit-add-defect-btn">Añadir</button>
                                    </div>
                                    <div class="rt-table-wrap">
                                        <table class="rt-table rt-table--compact">
                                            <thead>
                                                <tr><th>Defecto</th><th>Ocur.</th><th>Acción</th></tr>
                                            </thead>
                                            <tbody id="rt-edit-defects-tbody"></tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="rt-modal-footer">
                        <button type="button" class="rt-button secondary" id="rt-edit-cancel-btn">Cancelar</button>
                        <button type="button" class="rt-button primary" id="rt-edit-save-btn">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const elements = {
        app: root.querySelector(".rt-app"),
        header: document.getElementById("rt-header"),
        inspector: document.getElementById("rt-inspector"),
        fecha: document.getElementById("rt-fecha"),
        nameSrv: document.getElementById("rt-name-srv"),
        cliente: document.getElementById("rt-cliente"),
        defecto: document.getElementById("rt-defecto"),
        loginForm: document.getElementById("rt-login-form"),
        logoutBtn: document.getElementById("rt-logout-btn"),
        sidebarToggle: document.getElementById("rt-sidebar-toggle"),
        navRegistro: document.getElementById("rt-nav-registro"),
        navConsulta: document.getElementById("rt-nav-consulta"),
        userName: document.getElementById("rt-user-name"),
        userDetail: document.getElementById("rt-user-detail"),
        lockBtn: document.getElementById("rt-lock-btn"),
        lockBadge: document.getElementById("rt-lock-badge"),
        submitBtn: document.getElementById("rt-submit-btn"),
        searchModal: document.getElementById("rt-search-modal"),
        editModal: document.getElementById("rt-edit-modal"),
    };

    bindEvents();
    setDefaultDate();
    renderDefectsTable();
    renderSessionRolls();
    renderConsultaTable();
    loadCatalogs();
    void loadConsultaAllRows().catch(() => {});
    applySidebarState();

    function bindEvents() {
        root.addEventListener("click", handleRootClick);
        root.addEventListener("input", handleInputFormatting);
        elements.loginForm.addEventListener("submit", handleLogin);
        elements.logoutBtn.addEventListener("click", logout);
        elements.sidebarToggle.addEventListener("click", toggleSidebar);
        document.getElementById("rt-clear-main-btn").addEventListener("click", clearMainData);
        elements.lockBtn.addEventListener("click", toggleLock);
        document.getElementById("rt-add-defect-btn").addEventListener("click", addDefect);
        document.getElementById("rt-add-roll-btn").addEventListener("click", addRollToSession);
        elements.submitBtn.addEventListener("click", submitAllRolls);
        document.getElementById("rt-apply-filters-btn").addEventListener("click", () => {
            state.consultaPage = 1;
            fetchConsultaData();
        });
        document.getElementById("rt-clear-filters-btn").addEventListener("click", clearFilters);
        document.getElementById("rt-prev-page-btn").addEventListener("click", () => {
            if (state.consultaPage > 1) {
                state.consultaPage--;
                fetchConsultaData();
            }
        });
        document.getElementById("rt-next-page-btn").addEventListener("click", () => {
            state.consultaPage++;
            fetchConsultaData();
        });
        document.getElementById("rt-search-main-btn").addEventListener("click", () => elements.searchModal.classList.add("active"));
        document.getElementById("rt-search-cancel-btn").addEventListener("click", () => elements.searchModal.classList.remove("active"));
        document.getElementById("rt-search-close-x").addEventListener("click", () => elements.searchModal.classList.remove("active"));
        document.getElementById("rt-search-apply-btn").addEventListener("click", searchAndPopulateMainData);

        // Eventos Modal Edición
        document.getElementById("rt-edit-cancel-btn").addEventListener("click", () => elements.editModal.classList.remove("active"));
        document.getElementById("rt-edit-close-x").addEventListener("click", () => elements.editModal.classList.remove("active"));
        document.getElementById("rt-edit-add-defect-btn").addEventListener("click", addDefectToEdit);
        document.getElementById("rt-edit-save-btn").addEventListener("click", saveEditedRoll);
        window.addEventListener("resize", applySidebarState);
    }

    function handleRootClick(event) {
        const navButton = event.target.closest("[data-nav-view]");
        if (navButton) {
            switchView(navButton.dataset.navView);
            return;
        }

        const removeDefectButton = event.target.closest("[data-remove-defect]");
        if (removeDefectButton) {
            removeDefect(Number(removeDefectButton.dataset.removeDefect));
            return;
        }

        const removeRollButton = event.target.closest("[data-remove-roll]");
        if (removeRollButton) {
            removeRoll(Number(removeRollButton.dataset.removeRoll));
            return;
        }

        const editButton = event.target.closest("[data-edit-roll]");
        if (editButton) {
            openEditModal(editButton.dataset.editIndex, editButton.dataset.editRoll);
            return;
        }

        const removeEditDefectButton = event.target.closest("[data-remove-edit-defect]");
        if (removeEditDefectButton) {
            removeDefectFromEdit(Number(removeEditDefectButton.dataset.removeEditDefect));
            return;
        }
    }

    function handleInputFormatting(event) {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
            return;
        }

        if (target.classList.contains("rt-uppercase")) {
            target.value = target.value.toUpperCase();
        }

        if (target.dataset.numeric === "true") {
            target.value = target.value.replace(/\D/g, "");
        }

        if (target.dataset.decimal === "true") {
            let cleaned = target.value.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
            const firstDot = cleaned.indexOf(".");
            if (firstDot !== -1) {
                cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
            }
            target.value = cleaned;
        }
    }

    // --- FUNCIONES DE CARGA RÁPIDA JSONP ---
    function normalizeHeaderName(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    function findColumnName(columns, patterns) {
        const indexedColumns = columns.map(column => ({
            original: column,
            normalized: normalizeHeaderName(column)
        }));
        for (const pattern of patterns) {
            const normalizedPattern = normalizeHeaderName(pattern);
            const exactMatch = indexedColumns.find(({ normalized }) => normalized === normalizedPattern);
            if (exactMatch) return exactMatch.original;
            const partialMatch = indexedColumns.find(({ normalized }) =>
                normalized.startsWith(normalizedPattern + ' ') ||
                normalized.endsWith(' ' + normalizedPattern) ||
                normalized.includes(normalizedPattern)
            );
            if (partialMatch) return partialMatch.original;
        }
        return null;
    }

    function findExactColumnName(columns, patterns) {
        const indexedColumns = columns.map(column => ({
            original: column,
            normalized: normalizeHeaderName(column)
        }));
        for (const pattern of patterns) {
            const normalizedPattern = normalizeHeaderName(pattern);
            if (!normalizedPattern) continue;
            const exactMatch = indexedColumns.find(({ normalized }) => normalized === normalizedPattern);
            if (exactMatch) return exactMatch.original;
        }
        return null;
    }

    function getAdjacentColumnName(columns, anchorColumn, offset) {
        const anchorIndex = columns.indexOf(anchorColumn);
        const targetIndex = anchorIndex + offset;
        if (anchorIndex === -1 || targetIndex < 0 || targetIndex >= columns.length) return null;

        const targetColumn = columns[targetIndex];
        return String(targetColumn || "").trim() ? targetColumn : null;
    }

    function resolveLotColumns(columns) {
        const resolved = {
            tituloHilo: findColumnName(columns, [
                'Titulo de Hilo',
                'Título de Hilo',
                'Titulo Hilo',
                'Título Hilo',
                'TituloHilo',
                'TitulodeHilo',
                'Yarn Title',
                'Material',
            ]),
            loteHilo: findColumnName(columns, [
                'Lote Hilo',
                'Lote de Hilo',
                'LoteHilo',
                'LotedeHilo',
                'Lote Hilado',
            ]),
            loteSpandex: findColumnName(columns, [
                'Lote Spandex',
                'Lote de Lycra',
                'Lote de Licra',
                'Lote Lycra',
                'Lote Licra',
                'LoteLycra',
                'LotedeLycra',
                'Spandex',
                'Lycra',
                'Licra',
            ]),
        };

        resolved.tituloHilo = resolved.tituloHilo || findExactColumnName(columns, ['U']);
        resolved.loteHilo = resolved.loteHilo || findExactColumnName(columns, ['V']);
        resolved.loteSpandex = resolved.loteSpandex || findExactColumnName(columns, ['W']);

        if (!resolved.tituloHilo && resolved.loteHilo) {
            resolved.tituloHilo = getAdjacentColumnName(columns, resolved.loteHilo, -1);
        }
        if (!resolved.loteHilo && resolved.tituloHilo) {
            resolved.loteHilo = getAdjacentColumnName(columns, resolved.tituloHilo, 1);
        }
        if (!resolved.loteHilo && resolved.loteSpandex) {
            resolved.loteHilo = getAdjacentColumnName(columns, resolved.loteSpandex, -1);
        }
        if (!resolved.tituloHilo && resolved.loteSpandex) {
            resolved.tituloHilo = getAdjacentColumnName(columns, resolved.loteSpandex, -2);
        }
        if (!resolved.loteSpandex && resolved.loteHilo) {
            resolved.loteSpandex = getAdjacentColumnName(columns, resolved.loteHilo, 1);
        }

        return resolved;
    }

    function getLotColumnsForRow(row, preferredColumns = null) {
        const rowObject = row && typeof row === "object" ? row : {};
        const rowColumns = Object.keys(rowObject);
        const resolvedFromRow = resolveLotColumns(rowColumns);

        return {
            tituloHilo: resolvedFromRow.tituloHilo || (preferredColumns && preferredColumns.tituloHilo && Object.prototype.hasOwnProperty.call(rowObject, preferredColumns.tituloHilo) ? preferredColumns.tituloHilo : null),
            loteHilo: resolvedFromRow.loteHilo || (preferredColumns && preferredColumns.loteHilo && Object.prototype.hasOwnProperty.call(rowObject, preferredColumns.loteHilo) ? preferredColumns.loteHilo : null),
            loteSpandex: resolvedFromRow.loteSpandex || (preferredColumns && preferredColumns.loteSpandex && Object.prototype.hasOwnProperty.call(rowObject, preferredColumns.loteSpandex) ? preferredColumns.loteSpandex : null),
        };
    }

    function gvizToObjects(resp) {
        if (!resp || !resp.table) return [];
        const cols = (resp.table.cols || []).map(c => ({
            label: String((c && c.label) || "").trim(),
            id: String((c && c.id) || "").trim(),
        }));
        return (resp.table.rows || []).map(r => {
            const o = {};
            cols.forEach((col, i) => {
                const cell = r.c && r.c[i];
                // Priorizar valor formateado (cell.f) sobre el valor puro (cell.v) 
                // para capturar títulos como "40/1" sin que se interpreten mal
                let val = "";
                if (cell) {
                    if (cell.f !== null && cell.f !== undefined) {
                        val = cell.f;
                    } else if (cell.v !== null && cell.v !== undefined) {
                        val = cell.v;
                    }
                }
                const primaryKey = col.label || col.id || `col_${i}`;
                o[primaryKey] = val;
                if (col.id && col.id !== primaryKey) {
                    o[col.id] = val;
                }
            });
            return o;
        });
    }

    function loadSheetJSONP(sheetId, sheetName, query = "select *") {
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
            const url = `${base}?sheet=${encodeURIComponent(sheetName)}&headers=${BASE_SHEET_HEADER_ROWS}&tq=${encodeURIComponent(query)}&tqx=out:json;responseHandler:${cbName}&nocache=${Date.now()}`;
            script.src = url;
            document.head.appendChild(script);
        });
    }

    async function loadConsultaAllRows() {
        if (Array.isArray(consultaAllRowsCache)) {
            return consultaAllRowsCache;
        }

        if (consultaAllRowsPromise) {
            return consultaAllRowsPromise;
        }

        consultaAllRowsPromise = (async () => {
            const rows = await loadSheetJSONP(SHEET_ID, SHEET_NAME, "select *");
            consultaAllRowsCache = Array.isArray(rows) ? rows : [];
            return consultaAllRowsCache;
        })();

        try {
            return await consultaAllRowsPromise;
        } catch (error) {
            consultaAllRowsCache = null;
            throw error;
        } finally {
            consultaAllRowsPromise = null;
        }
    }

    function isoDateToNum(isoStr) {
        if (!isoStr) return null;
        const parts = String(isoStr).split("-").map(Number);
        if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
            return null;
        }
        return parts[0] * 10000 + parts[1] * 100 + parts[2];
    }

    function parseConsultaDateToNum(dateValue) {
        if (!dateValue) return null;

        if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
            return (
                dateValue.getFullYear() * 10000000000 +
                (dateValue.getMonth() + 1) * 100000000 +
                dateValue.getDate() * 1000000 +
                dateValue.getHours() * 10000 +
                dateValue.getMinutes() * 100 +
                dateValue.getSeconds()
            );
        }

        const str = String(dateValue).trim().toLowerCase();
        if (!str) return null;

        const direct = Date.parse(str);
        if (Number.isFinite(direct)) {
            const parsed = new Date(direct);
            if (!Number.isNaN(parsed.getTime())) {
                return (
                    parsed.getFullYear() * 10000000000 +
                    (parsed.getMonth() + 1) * 100000000 +
                    parsed.getDate() * 1000000 +
                    parsed.getHours() * 10000 +
                    parsed.getMinutes() * 100 +
                    parsed.getSeconds()
                );
            }
        }

        const matchDMY = str.match(/^(\d{1,2})[\/-]([a-z]{3}|\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/i);
        if (matchDMY) {
            const day = Number(matchDMY[1]);
            let month = null;
            const monthToken = String(matchDMY[2]).toLowerCase();
            if (/^\d{1,2}$/.test(monthToken)) {
                month = Number(monthToken) - 1;
            } else {
                month = CONSULTA_MONTHS[monthToken.slice(0, 3)];
            }
            const year = Number(matchDMY[3]);
            const hour = Number(matchDMY[4] || 0);
            const minute = Number(matchDMY[5] || 0);
            const second = Number(matchDMY[6] || 0);

            if (Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)) {
                return (
                    year * 10000000000 +
                    (month + 1) * 100000000 +
                    day * 1000000 +
                    hour * 10000 +
                    minute * 100 +
                    second
                );
            }
        }

        const matchYMD = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[t\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/i);
        if (matchYMD) {
            const year = Number(matchYMD[1]);
            const month = Number(matchYMD[2]) - 1;
            const day = Number(matchYMD[3]);
            const hour = Number(matchYMD[4] || 0);
            const minute = Number(matchYMD[5] || 0);
            const second = Number(matchYMD[6] || 0);

            if (Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)) {
                return (
                    year * 10000000000 +
                    (month + 1) * 100000000 +
                    day * 1000000 +
                    hour * 10000 +
                    minute * 100 +
                    second
                );
            }
        }

        return null;
    }

    function getConsultaColumns(allCols) {
        return {
            machineCol: findColumnName(allCols, ["Maquina", "Máquina", "Machine"]),
            clienteCol: findColumnName(allCols, ["Cliente", "Customer"]),
            opCol: findColumnName(allCols, ["OP"]),
            partidaCol: findColumnName(allCols, ["Partida"]),
            rolloCol: findColumnName(allCols, ["Rollo", "Nro Rollo"]),
            fechaCol: findColumnName(allCols, ["Fecha", "Dia", "Día", "Day"]),
        };
    }

    function filterConsultaRowsLocal(allRecords, filters) {
        const rows = Array.isArray(allRecords) ? allRecords : [];
        if (!rows.length) {
            return [];
        }

        const allCols = Object.keys(rows[0] || {});
        const cols = getConsultaColumns(allCols);
        if (!cols.machineCol || !cols.opCol || !cols.partidaCol || !cols.rolloCol || !cols.fechaCol) {
            return null;
        }
        const fDesdeNum = isoDateToNum(filters.fDesde);
        const fHastaNum = isoDateToNum(filters.fHasta);
        const cliente = String(filters.cliente || "").trim().toUpperCase();
        const op = String(filters.op || "").trim();
        const partida = String(filters.partida || "").trim();
        const nRollo = String(filters.nRollo || "").trim();

        const filtered = rows
            .map((row, index) => ({ row, index }))
            .filter(({ row }) => {
                const machineValue = String(row[cols.machineCol] || "").trim().toUpperCase();
                if (!machineValue.includes("SRV")) return false;

                if (cliente) {
                    if (!cols.clienteCol) return false;
                    const rowCliente = String(row[cols.clienteCol] || "").trim().toUpperCase();
                    if (!rowCliente.includes(cliente)) return false;
                }

                if (op) {
                    const rowOP = String(row[cols.opCol] || "").trim();
                    if (!rowOP.includes(op)) return false;
                }

                if (partida) {
                    const rowPartida = String(row[cols.partidaCol] || "").trim();
                    if (!rowPartida.includes(partida)) return false;
                }

                if (nRollo) {
                    const rowRollo = String(row[cols.rolloCol] || "").trim();
                    if (rowRollo !== nRollo) return false;
                }

                if (fDesdeNum || fHastaNum) {
                    const dateNum = parseConsultaDateToNum(row[cols.fechaCol]);
                    if (!dateNum) return false;
                    if (fDesdeNum && dateNum < fDesdeNum * 1000000) return false;
                    if (fHastaNum && dateNum > fHastaNum * 1000000 + 999999) return false;
                }

                return true;
            })
            .sort((left, right) => {
                const leftDate = parseConsultaDateToNum(left.row[cols.fechaCol]) || 0;
                const rightDate = parseConsultaDateToNum(right.row[cols.fechaCol]) || 0;
                if (leftDate !== rightDate) {
                    return rightDate - leftDate;
                }

                return right.index - left.index;
            })
            .map(({ row }) => row);

        return filtered;
    }

    function normalizeSimpleValues(values) {
        return [...new Set(
            (Array.isArray(values) ? values : [])
                .map((value) => String(value || "").trim())
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    }

    function getColumnsFromRows(rows) {
        const seen = new Set();
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            Object.keys(row || {}).forEach((key) => {
                const cleanKey = String(key || "").trim();
                if (cleanKey) {
                    seen.add(cleanKey);
                }
            });
        });
        return [...seen];
    }

    function collectUniqueValuesFromRows(rows, patterns) {
        const allColumns = getColumnsFromRows(rows);
        const targetColumn = findColumnName(allColumns, patterns);
        if (!targetColumn) {
            return [];
        }

        return normalizeSimpleValues(
            rows.map((row) => row && typeof row === "object" ? row[targetColumn] : "")
        );
    }

    function cleanRegistroTercerosDefectName(value) {
        return String(value || "")
            .trim()
            .replace(/^Suma de\s+/i, "")
            .replace(/^[\d.]+\s+/, "")
            .trim();
    }

    function normalizeDefectCatalog(defects) {
        const normalizedDefects = [];
        const seen = new Set();

        (Array.isArray(defects) ? defects : []).forEach((item, index) => {
            const rawHeader = String(((item || {}).sheetHeader) || ((item || {}).nombre) || item || "").trim();
            const cleanedName = cleanRegistroTercerosDefectName(String(((item || {}).nombre) || rawHeader));

            if (!rawHeader || !cleanedName) {
                return;
            }

            const uniqueKey = `${normalizeHeaderName(rawHeader)}|${normalizeHeaderName(cleanedName)}`;
            if (!uniqueKey || seen.has(uniqueKey)) {
                return;
            }
            seen.add(uniqueKey);

            const rawPoints = Number((item || {}).puntos);
            normalizedDefects.push({
                id: String(((item || {}).id) || index + 1).padStart(2, "0"),
                codigo: String(((item || {}).codigo) || index + 1).padStart(2, "0"),
                nombre: cleanedName,
                sheetHeader: rawHeader,
                puntos: Number.isFinite(rawPoints) && rawPoints > 0 ? rawPoints : 2,
            });
        });

        return normalizedDefects;
    }

    function buildDefectCatalogFromRows(rows) {
        const allColumns = getColumnsFromRows(rows);
        const normalizedCatalog = DEFECT_COLUMNS.map((name) => ({
            original: name,
            normalized: normalizeHeaderName(name),
        }));
        const seen = new Set();

        return allColumns.map((columnName, index) => {
            const rawHeader = String(columnName || "").trim();
            const cleanedHeader = cleanRegistroTercerosDefectName(rawHeader);
            const normalizedHeader = normalizeHeaderName(cleanedHeader || rawHeader);

            if (!rawHeader || !cleanedHeader || /^[\d.]+$/.test(cleanedHeader)) {
                return null;
            }

            const matchedCatalog = normalizedCatalog.find(({ normalized }) =>
                normalizedHeader === normalized ||
                normalizedHeader.includes(normalized) ||
                normalized.includes(normalizedHeader)
            );

            if (!matchedCatalog) {
                return null;
            }

            const uniqueKey = normalizeHeaderName(rawHeader);
            if (seen.has(uniqueKey)) {
                return null;
            }
            seen.add(uniqueKey);

            return {
                id: String(index + 1).padStart(2, "0"),
                codigo: String(index + 1).padStart(2, "0"),
                nombre: matchedCatalog.original,
                sheetHeader: rawHeader,
                puntos: 2,
            };
        }).filter(Boolean);
    }

    function hasUsableCatalogs(catalogs) {
        const defectos = normalizeDefectCatalog((catalogs || {}).defectos);
        const personal = normalizeSimpleValues((catalogs || {}).personal);
        const servicio = normalizeSimpleValues((catalogs || {}).servicio);
        return defectos.length > 0 && personal.length > 0 && servicio.length > 0;
    }

    async function fetchBackendJson(action) {
                    const url = `${SOURCE_APPS_SCRIPT_URL}?action=${encodeURIComponent(action)}&nocache=${Date.now()}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Backend HTTP ${response.status} (${action}).`);
        }

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            throw new Error(`Respuesta invalida del backend para "${action}".`);
        }

        if (!data || data.success !== true) {
            throw new Error((data && (data.error || data.message)) || `No se pudo cargar "${action}".`);
        }

        return data;
    }

    async function loadCatalogsFromBackend() {
        const data = await fetchBackendJson("registroTercerosCatalogos");
        return {
            defectos: normalizeDefectCatalog(data.defectos),
            personal: normalizeSimpleValues(data.personal),
            servicio: normalizeSimpleValues(data.servicio),
            customer: normalizeSimpleValues(data.customer),
        };
    }

    async function loadFirstAvailableSheetRows(sheetNames, query = "select *") {
        const names = Array.isArray(sheetNames) ? sheetNames : [sheetNames];
        let lastError = null;

        for (const sheetName of names) {
            try {
                return await loadSheetJSONP(SHEET_ID, sheetName, query);
            } catch (error) {
                lastError = error;
            }
        }

        if (lastError) {
            throw lastError;
        }

        return [];
    }

    async function loadCatalogsFromSheets() {
        const [, tercerosRows, customerRows] = await Promise.all([
            loadFirstAvailableSheetRows([SHEET_NAME]),
            loadFirstAvailableSheetRows([
                SOURCE_TERCEROS_SHEET_NAME,
                SOURCE_TERCEROS_SHEET_NAME.toUpperCase(),
                "PERSONAL",
                "SERVICIO",
            ]).catch(() => []),
            loadFirstAvailableSheetRows(["CUSTOMER", "customer"]).catch(() => []),
        ]);

        return {
            defectos: [...FIXED_DEFECT_CATALOG],
            personal: collectUniqueValuesFromRows(tercerosRows, ["inspector", "Inspector", "Inspectores", "Personal"]),
            servicio: collectUniqueValuesFromRows(tercerosRows, ["servicio", "Servicio", "Name_SRV", "Name SRV"]),
            customer: normalizeSimpleValues(
                collectUniqueValuesFromRows(customerRows, ["Cliente", "Customer"])
            ),
        };
    }

    async function loadCatalogs() {
            if (!SOURCE_APPS_SCRIPT_URL) {
            showAlert("rt-login-alert", "Error", "No se encontro la URL del backend.", false);
            return;
        }

        state.defectCatalog = [...FIXED_DEFECT_CATALOG];
        populateDefectOptions(state.defectCatalog, "Seleccionar...");

        try {
            let catalogs = null;
            let backendError = null;

            try {
                catalogs = await loadCatalogsFromBackend();
            } catch (error) {
                backendError = error;
                console.warn("Registro terceros: fallo la carga de catalogos por backend, se intentara por hojas.", error);
            }

            if (!hasUsableCatalogs(catalogs)) {
                const sheetCatalogs = await loadCatalogsFromSheets();
                catalogs = {
                    defectos: [...FIXED_DEFECT_CATALOG],
                    personal: normalizeSimpleValues((catalogs && catalogs.personal) || []).length
                        ? normalizeSimpleValues(catalogs.personal)
                        : normalizeSimpleValues(sheetCatalogs.personal),
                    servicio: normalizeSimpleValues((catalogs && catalogs.servicio) || []).length
                        ? normalizeSimpleValues(catalogs.servicio)
                        : normalizeSimpleValues(sheetCatalogs.servicio),
                    customer: normalizeSimpleValues(
                        []
                            .concat((catalogs && catalogs.customer) || [])
                            .concat(sheetCatalogs.customer || [])
                    ),
                };
            }

            if (!hasUsableCatalogs(catalogs)) {
                throw backendError || new Error("No se pudieron cargar los catalogos.");
            }

            state.defectCatalog = [...FIXED_DEFECT_CATALOG];
            state.personalCatalog = normalizeSimpleValues(catalogs.personal);
            state.customerCatalog = normalizeSimpleValues(catalogs.customer);
            populateDefectOptions(state.defectCatalog, "Seleccionar...");
            populateSimpleSelect(elements.inspector, state.personalCatalog, "Seleccionar...");
            populateSimpleSelect(elements.nameSrv, normalizeSimpleValues(catalogs.servicio), "Seleccionar...");
            populateSimpleSelect(elements.cliente, state.customerCatalog, "Seleccionar...");
        } catch (error) {
            console.error("Registro terceros: error final cargando catalogos.", error);
            populateDefectOptions([], "Error al cargar");
            populateSimpleSelect(elements.inspector, [], "Error al cargar");
            populateSimpleSelect(elements.nameSrv, [], "Error al cargar");
            populateSimpleSelect(elements.cliente, [], "Error al cargar");
            showAlert("rt-login-alert", "Error", error.message || "No se pudieron cargar los catalogos.", false);
        }
    }

    function populateSimpleSelect(select, values, placeholder) {
        if (!select) {
            return;
        }
        select.innerHTML = [`<option value="">${escapeHtml(placeholder)}</option>`]
            .concat((values || []).map((value) => {
                const safe = String(value || "").trim();
                return `<option value="${escapeAttribute(safe)}">${escapeHtml(safe)}</option>`;
            }))
            .join("");
    }

    function populateDefectOptions(defects, placeholder) {
        const options = Array.isArray(defects)
            ? defects
                .map((item) => String((item && item.sheetHeader) || "").trim())
                .filter(Boolean)
            : [];

        elements.defecto.innerHTML = [`<option value="">${escapeHtml(placeholder || "Seleccionar...")}</option>`]
            .concat(options.map((name) => `<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`))
            .join("");
    }

    function handleLogin(event) {
        event.preventDefault();

        const inspector = elements.inspector.value.trim().toUpperCase();
        const fecha = elements.fecha.value;
        const turno = document.getElementById("rt-turno").value;
        const maquina = document.getElementById("rt-maquina").value;
        const nameSrv = elements.nameSrv.value.trim().toUpperCase();

        if (!inspector || !fecha || !turno || !maquina || !nameSrv) {
            showAlert("rt-login-alert", "Aviso", "Todos los campos son obligatorios para ingresar.", false);
            return;
        }

        state.currentUser = { inspector, fecha, turno, maquina, nameSrv };
        elements.userName.textContent = inspector;
        const [fy, fm, fd] = fecha.split("-").map(Number);
        elements.userDetail.textContent = `Turno: ${turno} | ${formatShortDate(new Date(fy, fm - 1, fd))}`;
        updateNavigationVisibility(true);
        hideAlert("rt-login-alert");
        switchView("registro");
    }

    function logout() {
        state.currentUser = null;
        state.isLocked = false;
        state.currentDefects = [];
        state.sessionRolls = [];
        elements.lockBtn.textContent = "🔒";
        elements.lockBtn.classList.remove("active");
        elements.lockBadge.style.display = "none";
        clearMainData(true);
        clearCurrentRollForm();
        renderDefectsTable();
        renderSessionRolls();
        updateNavigationVisibility(false);
        switchView("login");
    }

    function updateNavigationVisibility(isLoggedIn) {
        elements.header.style.display = isLoggedIn ? "flex" : "none";
        elements.logoutBtn.style.display = isLoggedIn ? "block" : "none";
        elements.navRegistro.style.display = isLoggedIn ? "flex" : "none";
        elements.navConsulta.style.display = isLoggedIn && canAccessConsulta() ? "flex" : "none";
    }

    function loadSidebarCollapsed() {
        try {
            return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
        } catch (error) {
            return false;
        }
    }

    function saveSidebarCollapsed(collapsed) {
        try {
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
        } catch (error) {
            // Ignore storage failures and keep the current session working.
        }
    }

    function canCollapseSidebar() {
        return window.matchMedia("(min-width: 769px)").matches;
    }

    function applySidebarState() {
        const collapsed = state.sidebarCollapsed && canCollapseSidebar();
        elements.app.classList.toggle("rt-sidebar-collapsed", collapsed);
        elements.sidebarToggle.title = collapsed ? "Expandir menu" : "Contraer menu";
        elements.sidebarToggle.setAttribute("aria-label", collapsed ? "Expandir menu" : "Contraer menu");
        if (!canCollapseSidebar()) {
            elements.app.classList.remove("rt-sidebar-collapsed");
        }
    }

    function toggleSidebar() {
        if (!canCollapseSidebar()) {
            return;
        }

        state.sidebarCollapsed = !state.sidebarCollapsed;
        saveSidebarCollapsed(state.sidebarCollapsed);
        applySidebarState();
    }

    function canAccessConsulta() {
        return String(state.currentUser?.inspector || "").trim().toUpperCase() === CONSULTA_ALLOWED_INSPECTOR;
    }

    function switchView(view) {
        root.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
        root.querySelectorAll("[data-nav-view]").forEach((item) => item.classList.remove("active"));

        if (view === "login" || !state.currentUser) {
            document.getElementById("rt-login-view").classList.add("active");
            root.querySelector('[data-nav-view="login"]').classList.add("active");
            updateNavigationVisibility(false);
            return;
        }

        updateNavigationVisibility(true);
        if (view === "consulta") {
            if (!canAccessConsulta()) {
                view = "registro";
            } else {
                document.getElementById("rt-consulta-view").classList.add("active");
                root.querySelector('[data-nav-view="consulta"]').classList.add("active");
                state.consultaPage = 1;
                fetchConsultaData(); // Carga inicial de datos reales
                return;
            }
        }

        document.getElementById("rt-registro-view").classList.add("active");
        root.querySelector('[data-nav-view="registro"]').classList.add("active");
    }

    function toggleLock() {
        state.isLocked = !state.isLocked;
        elements.lockBtn.textContent = state.isLocked ? "🔓" : "🔒";
        elements.lockBtn.classList.toggle("active", state.isLocked);
        elements.lockBadge.style.display = state.isLocked ? "inline-flex" : "none";
    }

    function clearMainData(force = false) {
        if (state.isLocked && !force) {
            return;
        }

        [
            "rt-op",
            "rt-partida",
            "rt-color",
            "rt-cliente",
            "rt-cod-articulo",
            "rt-descripcion",
            "rt-titulo-hilo",
            "rt-lote-hilo",
            "rt-lote-spandex",
        ].forEach((id) => {
            const field = document.getElementById(id);
            if (field) {
                field.value = "";
            }
        });
    }

    function getMainData() {
        return {
            op: document.getElementById("rt-op").value.trim(),
            partida: document.getElementById("rt-partida").value.trim(),
            color: document.getElementById("rt-color").value.trim().toUpperCase(),
            cliente: document.getElementById("rt-cliente").value.trim().toUpperCase(),
            codArticulo: document.getElementById("rt-cod-articulo").value.trim(),
            descripcion: document.getElementById("rt-descripcion").value.trim().toUpperCase(),
            tituloHilo: document.getElementById("rt-titulo-hilo").value.trim(),
            loteHilo: document.getElementById("rt-lote-hilo").value.trim(),
            loteSpandex: document.getElementById("rt-lote-spandex").value.trim(),
        };
    }

    async function searchAndPopulateMainData() {
        const op = document.getElementById("rt-search-op").value.trim();
        const partida = document.getElementById("rt-search-partida").value.trim();

        if (!op) {
            alert("Debes ingresar una OP.");
            return;
        }

        const btn = document.getElementById("rt-search-apply-btn");
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Buscando...";

        try {
            // Utilizamos carga rápida JSONP para mayor rendimiento
            const allRecords = await loadSheetJSONP(SHEET_ID, SHEET_NAME);
            
            if (!allRecords || allRecords.length === 0) {
                alert("No se pudieron cargar los registros de la base.");
                return;
            }

            const allCols = Object.keys(allRecords[0]);
            const machineCol = findColumnName(allCols, ['Maquina', 'Maq.', 'Maq']);
            const opCol = findColumnName(allCols, ['OP', 'ORDEN']);
            const partidaCol = findColumnName(allCols, ['Partida', 'PART']);
            
            // Columnas adicionales para poblado
            const colorCol = findColumnName(allCols, ['Color']);
            const clienteCol = findColumnName(allCols, ['Cliente', 'Customer']);
            const codArtCol = findColumnName(allCols, ['Cod. Art.', 'Cod Art', 'Codigo', 'Cod. Articulo']);
            const descCol = findColumnName(allCols, ['Descripcion', 'Descripción', 'Articulo', 'Descripcion de tela']);
            const lotCols = resolveLotColumns(allCols);
            const tituloHiloCol = lotCols.tituloHilo;
            const loteHiloCol = lotCols.loteHilo;
            const loteSpandexCol = lotCols.loteSpandex;

            // Filtrar localmente por OP y Máquina que contenga "SRV"
            let filtered = allRecords.filter(r => {
                const rOP = String(r[opCol] || "").trim();
                const rMachine = String(r[machineCol] || "").trim().toUpperCase();
                return rOP === op && rMachine.includes("SRV");
            });

            if (filtered.length === 0) {
                alert(`No se encontraron registros de terceros (SRV) para la OP ${op}.`);
                return;
            }

            // Filtrar por partida si se proporcionó
            let match = null;
            if (partida) {
                match = filtered.find(r => String(r[partidaCol] || "").trim() === partida);
            } else {
                match = filtered[0];
            }

            if (!match) {
                alert(`No se encontró registro para la OP ${op} y Partida ${partida} en máquinas SRV.`);
                return;
            }

            const matchLotCols = getLotColumnsForRow(match, lotCols);

            // Mapear campos
            const dataToSet = {
                "rt-op": match[opCol] || op,
                "rt-partida": match[partidaCol] || partida,
                "rt-color": match[colorCol] || "",
                "rt-cliente": match[clienteCol] || "",
                "rt-cod-articulo": match[codArtCol] || "",
                "rt-descripcion": match[descCol] || "",
                "rt-titulo-hilo": tituloHiloCol ? (match[tituloHiloCol] || "") : (matchLotCols.tituloHilo ? (match[matchLotCols.tituloHilo] || "") : ""),
                "rt-lote-hilo": loteHiloCol ? (match[loteHiloCol] || "") : (matchLotCols.loteHilo ? (match[matchLotCols.loteHilo] || "") : ""),
                "rt-lote-spandex": loteSpandexCol ? (match[loteSpandexCol] || "") : (matchLotCols.loteSpandex ? (match[matchLotCols.loteSpandex] || "") : ""),
            };

            // Poblar campos
            const exactTextFields = new Set(["rt-titulo-hilo", "rt-lote-hilo", "rt-lote-spandex"]);
            Object.entries(dataToSet).forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (!el) return;
                const text = String(val ?? "");
                el.value = exactTextFields.has(id) ? text : text.toUpperCase();
            });

            clearCurrentRollForm();
            state.currentDefects = [];
            renderDefectsTable();

            elements.searchModal.classList.remove("active");
            showAlert("rt-registro-alert", "Éxito", "Datos de OP/Partida (SRV) cargados correctamente.", true);
            
            document.getElementById("rt-search-op").value = "";
            document.getElementById("rt-search-partida").value = "";

        } catch (error) {
            console.error("Error en búsqueda rápida:", error);
            alert("Error al conectar con el servidor: " + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    function addDefect() {
        const defectName = elements.defecto.value;
        const occurrenceText = document.getElementById("rt-ocurrencia").value.trim();
        const comment = document.getElementById("rt-comentario-defecto").value.trim().toUpperCase();

        if (!defectName || !occurrenceText) {
            showAlert("rt-registro-alert", "Aviso", "Selecciona un defecto y registra la ocurrencia.", false);
            return;
        }

        const occurrence = Number(occurrenceText);
        if (!Number.isFinite(occurrence) || occurrence <= 0) {
            showAlert("rt-registro-alert", "Aviso", "La ocurrencia debe ser mayor que cero.", false);
            return;
        }

        const catalogMatch = state.defectCatalog.find((item) =>
            String((item && item.sheetHeader) || "").trim() === defectName ||
            String((item && item.nombre) || "").trim() === defectName
        );
        const sheetHeader = catalogMatch ? (catalogMatch.sheetHeader || defectName) : defectName;

        state.currentDefects.push({
            nombre: sheetHeader,
            sheetHeader: sheetHeader,
            codigo: catalogMatch ? (catalogMatch.codigo || "") : "",
            ocurrencia: occurrence,
            comentario: comment,
            puntajeUnitario: 2,
            puntajeTotal: 2 * occurrence,
            hora: formatTime(new Date()),
            fechaReg: formatShortDate(new Date()),
        });

        elements.defecto.value = "";
        document.getElementById("rt-ocurrencia").value = "";
        document.getElementById("rt-comentario-defecto").value = "";
        hideAlert("rt-registro-alert");
        renderDefectsTable();
    }

    function removeDefect(index) {
        state.currentDefects.splice(index, 1);
        renderDefectsTable();
    }

    function renderDefectsTable() {
        const container = document.getElementById("rt-defects-list");
        const tbody = document.getElementById("rt-defects-tbody");

        if (!state.currentDefects.length) {
            container.style.display = "none";
            tbody.innerHTML = "";
            return;
        }

        container.style.display = "block";
        tbody.innerHTML = state.currentDefects.map((defect, index) => `
            <tr>
                <td><strong>${escapeHtml(formatDefectLabel(defect))}</strong></td>
                <td>${escapeHtml(String(defect.ocurrencia))}</td>
                <td>${escapeHtml(String(defect.puntajeTotal))}</td>
                <td><button type="button" class="rt-icon-button danger" data-remove-defect="${index}">X</button></td>
            </tr>
        `).join("");
    }

    function addRollToSession() {
        if (!state.currentUser) {
            showAlert("rt-registro-alert", "Aviso", "Primero debes iniciar sesion.", false);
            return;
        }

        const mainData = getMainData();
        const nRollo = document.getElementById("rt-n-rollo").value.trim();
        const peso = document.getElementById("rt-peso").value.trim();
        const categoria = document.getElementById("rt-categoria").value;

        if (!mainData.op || !mainData.partida || !mainData.cliente) {
            showAlert("rt-registro-alert", "Aviso", "Completa OP, Partida y Cliente.", false);
            return;
        }

        if (!nRollo || !peso || !categoria) {
            showAlert("rt-registro-alert", "Aviso", "Completa Nro rollo, Peso y Categoria.", false);
            return;
        }

        const now = new Date();
        state.sessionRolls.push({
            idUnico: `roll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            timestamp: Date.now(),
            dia: formatShortDate(now),
            mes: getMonthAbbr(now),
            semana: getWeekNumber(now),
            user: { ...state.currentUser },
            datosPrincipales: { ...mainData },
            detalle: {
                nRollo,
                peso,
                categoria,
                merma: document.getElementById("rt-merma").value.trim(),
                comentarioEvaluacion: document.getElementById("rt-comentario-evaluacion").value.trim().toUpperCase(),
            },
            defectos: state.currentDefects.map((defect) => ({ ...defect })),
            totalDefectos: state.currentDefects.reduce((sum, defect) => sum + Number(defect.ocurrencia || 0), 0),
        });

        clearCurrentRollForm();
        state.currentDefects = [];
        renderDefectsTable();
        renderSessionRolls();
        hideAlert("rt-registro-alert");
    }

    function clearCurrentRollForm() {
        [
            "rt-n-rollo",
            "rt-peso",
            "rt-categoria",
            "rt-merma",
            "rt-comentario-evaluacion",
            "rt-ocurrencia",
            "rt-comentario-defecto",
        ].forEach((id) => {
            const field = document.getElementById(id);
            if (field) {
                field.value = "";
            }
        });
        elements.defecto.value = "";
    }

    function removeRoll(index) {
        state.sessionRolls.splice(index, 1);
        renderSessionRolls();
    }

    function renderSessionRolls() {
        const tbody = document.getElementById("rt-rolls-tbody");
        const header = document.getElementById("rt-rolls-header");
        const submitSection = document.getElementById("rt-submit-section");

        header.textContent = `Lista de rollos a guardar (${state.sessionRolls.length})`;

        if (!state.sessionRolls.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="rt-empty">No hay rollos agregados en esta sesion.</td></tr>`;
            submitSection.style.display = "none";
            return;
        }

        submitSection.style.display = "block";
        tbody.innerHTML = state.sessionRolls.map((roll, index) => `
            <tr>
                <td><strong>${escapeHtml(roll.detalle.nRollo)}</strong></td>
                <td>${escapeHtml(roll.datosPrincipales.op)}</td>
                <td>${escapeHtml(roll.datosPrincipales.partida)}</td>
                <td>${escapeHtml(roll.datosPrincipales.color)}</td>
                <td>${escapeHtml(String(roll.detalle.peso))}</td>
                <td><span class="rt-badge red">${escapeHtml(String(roll.totalDefectos))} ocurr.</span></td>
                <td>${escapeHtml(roll.detalle.categoria)}</td>
                <td><button type="button" class="rt-icon-button danger" data-remove-roll="${index}">X</button></td>
            </tr>
        `).join("");
    }

    async function submitAllRolls() {
        if (!state.sessionRolls.length) {
            showAlert("rt-registro-alert", "Aviso", "No hay rollos registrados para subir.", false);
            return;
        }

            if (!SOURCE_APPS_SCRIPT_URL) {
            showAlert("rt-registro-alert", "Error", "No se encontro la URL del backend.", false);
            return;
        }

        const originalLabel = elements.submitBtn.textContent;
        elements.submitBtn.disabled = true;
        elements.submitBtn.textContent = "Enviando...";

        try {
            const response = await fetch(SOURCE_APPS_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: "registroTercerosGuardar",
                    rolls: state.sessionRolls,
                }),
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: HTTP ${response.status}`);
            }
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || "No se pudo guardar la informacion.");
            }

            state.globalRolls = sortRolls([...state.sessionRolls, ...state.globalRolls]);
            persistRolls();
            consultaAllRowsCache = null;

            state.sessionRolls = [];
            state.currentDefects = [];
            renderDefectsTable();
            renderSessionRolls();

            if (!state.isLocked) {
                clearMainData();
            }
            clearCurrentRollForm();

            const detailMessage = (data.results || [])
                .filter((result) => result.success)
                .map((result) => `Rollo ${result.nRollo}: ${result.message}`)
                .join("\n");

            showAlert(
                "rt-registro-alert",
                "Exito",
                `${data.message || "Informacion guardada correctamente."}${detailMessage ? `\n\n${detailMessage}` : ""}`,
                true,
                9000
            );
        } catch (error) {
            showAlert("rt-registro-alert", "Error", error.message || "No se pudo guardar la informacion.", false);
        } finally {
            elements.submitBtn.disabled = false;
            elements.submitBtn.textContent = originalLabel;
        }
    }

    async function fetchConsultaData() {
        if (state.consultaLoading) return;

        const tbody = document.getElementById("rt-consulta-tbody");
        const prevBtn = document.getElementById("rt-prev-page-btn");
        const nextBtn = document.getElementById("rt-next-page-btn");
        const pageInd = document.getElementById("rt-page-indicator");

        state.consultaLoading = true;
        tbody.innerHTML = `<tr><td colspan="11" class="rt-empty">Buscando registros en la nube...</td></tr>`;
        
        // Deshabilitar botones mientras carga
        prevBtn.disabled = true;
        nextBtn.disabled = true;

        try {
            const pageSize = CONSULTA_PAGE_SIZE;
            const filters = {
                fDesde: document.getElementById("rt-filter-fecha-desde").value,
                fHasta: document.getElementById("rt-filter-fecha-hasta").value,
                cliente: document.getElementById("rt-filter-cliente").value.trim().toUpperCase(),
                op: document.getElementById("rt-filter-op").value.trim(),
                partida: document.getElementById("rt-filter-partida").value.trim(),
                nRollo: document.getElementById("rt-filter-rollo").value.trim(),
            };

            try {
                const cachedRows = await loadConsultaAllRows();
                if (Array.isArray(cachedRows) && cachedRows.length > 0) {
                    const filteredAll = filterConsultaRowsLocal(cachedRows, filters);
                    if (filteredAll === null) {
                        throw new Error("No se pudieron identificar las columnas de consulta.");
                    }
                    const totalRows = filteredAll.length;
                    const totalPages = totalRows > 0 ? Math.ceil(totalRows / pageSize) : 0;

                    if (totalPages > 0 && state.consultaPage > totalPages) {
                        state.consultaPage = totalPages;
                    }

                    const offset = (state.consultaPage - 1) * pageSize;
                    const pageRows = filteredAll.slice(offset, offset + pageSize);
                    state.filteredRolls = mapSheetRecordsToRolls(pageRows, pageRows[0] || cachedRows[0]);

                    renderConsultaTable();
                    pageInd.textContent = `Pág. ${state.consultaPage}${totalPages > 0 ? ` de ${totalPages}` : ""}`;
                    prevBtn.disabled = state.consultaPage <= 1;
                    nextBtn.disabled = totalPages === 0 ? true : (state.consultaPage * pageSize >= totalRows);
                    return;
                }
            } catch (cacheError) {
                console.warn("Registro terceros: no se pudo usar la caché de consulta, se usará el modo remoto.", cacheError);
            }

            // 1. Obtener encabezados para mapear letras de columnas si es necesario
            const allRecords = await loadSheetJSONP(SHEET_ID, SHEET_NAME, "select * limit 1");
            if (!allRecords || allRecords.length === 0) throw new Error("No se pudo conectar con la base.");

            const allCols = Object.keys(allRecords[0]);
            const getColLetter = (index) => String.fromCharCode(65 + index); // A, B, C...

            const colMap = {};
            allCols.forEach((h, i) => {
                const normalized = normalizeHeaderName(h);
                colMap[normalized] = getColLetter(i);
            });

            // Encontrar letras de columnas clave
            const letters = {
                maquina: colMap[normalizeHeaderName(findColumnName(allCols, ['Maquina', 'Máquina']))] || "I",
                cliente: colMap[normalizeHeaderName(findColumnName(allCols, ['Cliente', 'Customer']))] || "B",
                op: colMap[normalizeHeaderName(findColumnName(allCols, ['OP']))] || "C",
                partida: colMap[normalizeHeaderName(findColumnName(allCols, ['Partida']))] || "D",
                rollo: colMap[normalizeHeaderName(findColumnName(allCols, ['Rollo', 'Nro Rollo']))] || "L",
                fecha: colMap[normalizeHeaderName(findColumnName(allCols, ['Fecha', 'Dia']))] || "G",
            };

            // 2. Construir Filtros
            const fDesde = document.getElementById("rt-filter-fecha-desde").value;
            const fHasta = document.getElementById("rt-filter-fecha-hasta").value;
            const cliente = document.getElementById("rt-filter-cliente").value.trim().toUpperCase();
            const op = document.getElementById("rt-filter-op").value.trim();
            const partida = document.getElementById("rt-filter-partida").value.trim();
            const nRollo = document.getElementById("rt-filter-rollo").value.trim();

            let whereParts = [`${letters.maquina} contains 'SRV'`]; // Filtro base requerido por usuario

            if (fDesde) whereParts.push(`${letters.fecha} >= date '${fDesde}'`);
            if (fHasta) whereParts.push(`${letters.fecha} <= date '${fHasta}'`);
            if (cliente) whereParts.push(`upper(${letters.cliente}) contains '${cliente}'`);
            if (op) whereParts.push(`${letters.op} contains '${op}'`);
            if (partida) whereParts.push(`${letters.partida} contains '${partida}'`);
            if (nRollo) whereParts.push(`${letters.rollo} = ${nRollo}`);

            const whereClause = whereParts.join(" and ");
            const limit = 12;
            const offset = (state.consultaPage - 1) * limit;

            // Ordenar por Columna A (Timestamp/Fila) descendente
            const query = `select * where ${whereClause} order by A desc limit ${limit} offset ${offset}`;
            
            const results = await loadSheetJSONP(SHEET_ID, SHEET_NAME, query);
            
            // 3. Mapear resultados a objetos Roll
            state.filteredRolls = mapSheetRecordsToRolls(results, allRecords[0]); 
            // Usamos allRecords[0] solo para obtener los nombres originales de columnas si es necesario

            renderConsultaTable();

            // 4. Actualizar estado de paginación
            pageInd.textContent = `Página ${state.consultaPage}`;
            prevBtn.disabled = state.consultaPage <= 1;
            // Hack para el botón Siguiente: Solo habilitar si trajo 12 registros (indica que puede haber más)
            nextBtn.disabled = results.length < limit;

        } catch (error) {
            console.error("Fetch Cloud Error:", error);
            tbody.innerHTML = `<tr><td colspan="11" class="rt-empty" style="color:#ef4444;">Error: ${escapeHtml(error.message)}</td></tr>`;
        } finally {
            state.consultaLoading = false;
        }
    }

    function mapSheetRecordsToRolls(records, sampleRow) {
        const allCols = Object.keys(sampleRow || {});
        const lotCols = resolveLotColumns(allCols);
        const cols = {
            op: findColumnName(allCols, ['OP']),
            partida: findColumnName(allCols, ['Partida']),
            color: findColumnName(allCols, ['Color']),
            cliente: findColumnName(allCols, ['Cliente']),
            codArt: findColumnName(allCols, ['Cod. Art.']),
            desc: findColumnName(allCols, ['Descripcion']),
            nRollo: findColumnName(allCols, ['Rollo']),
            peso: findColumnName(allCols, ['Peso']),
            cat: findColumnName(allCols, ['Categoria']),
            merma: findColumnName(allCols, ['Merma']),
            inspector: findColumnName(allCols, ['Inspector']),
            maquinaFull: findColumnName(allCols, ['Maquina', 'Máquina', 'I']),
            loteHilo: lotCols.loteHilo,
            loteSpandex: lotCols.loteSpandex,
            tituloHilo: lotCols.tituloHilo,
            timestamp: "Timestamp", 
        };

        // Fallback robusto para Título de Hilo: si no se encuentra por nombre, 
        // intentar encontrar el que está a la izquierda de "Lote de Hilo" (Columna U vs V)
        if (!cols.tituloHilo && cols.loteHilo) {
            const loteIdx = allCols.indexOf(cols.loteHilo);
            if (loteIdx > 0) {
                cols.tituloHilo = allCols[loteIdx - 1];
            }
        }

        const defectHeaderMap = {};
        DEFECT_COLUMNS.forEach(d => {
            const actual = findColumnName(allCols, [d]);
            if (actual) defectHeaderMap[d] = actual;
        });

        return (records || []).map(r => {
            const rowLotCols = getLotColumnsForRow(r, lotCols);
            // Intentar extraer maquina y nameSrv del valor compuesto (ej. SRV-BANANA)
            const fullMaq = String(r[cols.maquinaFull] || "");
            const maqParts = fullMaq.split("-");
            
            return {
                idUnico: buildRegistroTercerosKey(r[cols.op], r[cols.partida], r[cols.nRollo], r[cols.codArt]),
                datosPrincipales: {
                    op: String(r[cols.op] || ""),
                    partida: String(r[cols.partida] || ""),
                    color: String(r[cols.color] || ""),
                    cliente: String(r[cols.cliente] || ""),
                    codArticulo: String(r[cols.codArt] || ""),
                    descripcion: String(r[cols.desc] || ""),
                    tituloHilo: String(rowLotCols.tituloHilo ? (r[rowLotCols.tituloHilo] || "") : ""),
                    loteHilo: String(rowLotCols.loteHilo ? (r[rowLotCols.loteHilo] || "") : ""),
                    loteSpandex: String(rowLotCols.loteSpandex ? (r[rowLotCols.loteSpandex] || "") : ""),
                },
                detalle: {
                    nRollo: String(r[cols.nRollo] || ""),
                    peso: String(r[cols.peso] || ""),
                    categoria: String(r[cols.cat] || ""),
                    merma: String(r[cols.merma] || ""),
                },
                user: {
                    inspector: String(r[cols.inspector] || ""),
                    maquina: maqParts[0] || "",
                    nameSrv: maqParts.slice(1).join("-") || "",
                },
                defectos: parseDefectsFromCloud(r, defectHeaderMap),
                timestamp: new Date(r[cols.timestamp] || Date.now()).getTime(),
            };
        });
    }

    function parseDefectsFromCloud(row, headerMap) {
        const found = [];
        Object.entries(headerMap).forEach(([origName, sheetName]) => {
            const val = Number(row[sheetName] || 0);
            if (val > 0) {
                found.push({
                    sheetHeader: sheetName,
                    ocurrencia: val,
                });
            }
        });
        return found;
    }

    function buildRegistroTercerosKey(op, part, roll, art) {
        return `${String(op || "").trim()}|${String(part || "").trim()}|${String(roll || "").trim()}|${String(art || "").trim()}`;
    }

    function applyFilters() {
        // Redirigir a fetchConsultaData reseteando a pagina 1
        state.consultaPage = 1;
        fetchConsultaData();
    }

    function clearFilters() {
        [
            "rt-filter-fecha-desde",
            "rt-filter-fecha-hasta",
            "rt-filter-cliente",
            "rt-filter-op",
            "rt-filter-partida",
            "rt-filter-rollo",
        ].forEach((id) => {
            const field = document.getElementById(id);
            if (field) {
                field.value = "";
            }
        });

        state.consultaPage = 1;
        fetchConsultaData();
    }

    function renderConsultaTable() {
        const tbody = document.getElementById("rt-consulta-tbody");
        // No filtramos localmente aqui porque ya viene filtrado de la nube
        const rows = state.filteredRolls;

        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="11" class="rt-empty">No se encontraron rollos con los filtros actuales en la base de datos.</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map((roll, index) => {
            const defectosStr = (roll.defectos || [])
                .map(d => `${formatDefectLabel(d)}: ${d.ocurrencia}`)
                .join(", ");

            return `
                <tr>
                    <td>${escapeHtml(roll.datosPrincipales.cliente || "-")}</td>
                    <td>${escapeHtml(roll.datosPrincipales.op || "-")}</td>
                    <td>${escapeHtml(roll.datosPrincipales.partida || "-")}</td>
                    <td>${escapeHtml(roll.datosPrincipales.color || "-")}</td>
                    <td>${escapeHtml(roll.datosPrincipales.codArticulo || "-")}</td>
                    <td><div class="rt-text-truncate" title="${escapeAttribute(roll.datosPrincipales.descripcion || "")}">${escapeHtml(roll.datosPrincipales.descripcion || "")}</div></td>
                    <td><strong>${escapeHtml(roll.detalle.nRollo || "")}</strong></td>
                    <td>${escapeHtml(roll.detalle.categoria || "")}</td>
                    <td>${escapeHtml(String(roll.detalle.peso || ""))}</td>
                    <td><div class="rt-defect-summary" title="${escapeAttribute(defectosStr)}">${escapeHtml(defectosStr || "-")}</div></td>
                    <td>
                        <div class="rt-action-cell">
                            <button type="button" class="rt-icon-button primary" data-edit-roll="${escapeAttribute(roll.idUnico)}" title="Editar">✏️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        Array.from(tbody.querySelectorAll("[data-edit-roll]")).forEach((button, index) => {
            button.dataset.editIndex = String(index);
        });
    }

    function setDefaultDate() {
        const d = new Date();
        const y = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        elements.fecha.value = `${y}-${mo}-${day}`;
    }

    function loadStoredRolls() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (_error) {
            return [];
        }
    }

    function persistRolls() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.globalRolls));
    }

    function sortRolls(rolls) {
        return [...(rolls || [])].sort((left, right) => Number(right.timestamp || 0) - Number(left.timestamp || 0));
    }

    function formatDefectLabel(defect) {
        return String((defect && defect.sheetHeader) || (defect && defect.nombre) || "").trim();
    }

    function formatTime(date) {
        return date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    }

    function formatDate(date) {
        return date.toLocaleDateString("es-PE");
    }

    function formatShortDate(date) {
        const day = String(date.getDate()).padStart(2, "0");
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return `${day}-${months[date.getMonth()]}`;
    }

    function getMonthAbbr(date) {
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return months[date.getMonth()];
    }

    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    function showAlert(elementId, title, message, isSuccess, timeout = 6000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        clearTimeout(alertTimers.get(elementId));
        element.classList.toggle("success", Boolean(isSuccess));
        element.innerHTML = `<strong>${escapeHtml(title)}</strong>${String(message || "")
            .split("\n")
            .filter(Boolean)
            .map((line) => `<div>${escapeHtml(line)}</div>`)
            .join("")}`;
        element.style.display = "block";
        alertTimers.set(elementId, window.setTimeout(() => hideAlert(elementId), timeout));
    }

    function hideAlert(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        clearTimeout(alertTimers.get(elementId));
        element.style.display = "none";
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, "&#96;");
    }

    // --- FUNCIONES DE EDICIÓN (MODAL) ---

    function openEditModal(editIndex, idUnico) {
        // Buscar en filteredRolls ya que ahora los datos vienen de la nube
        const parsedIndex = Number(editIndex);
        const roll = Number.isInteger(parsedIndex) && parsedIndex >= 0 && parsedIndex < state.filteredRolls.length
            ? state.filteredRolls[parsedIndex]
            : state.filteredRolls.find(r => r.idUnico === idUnico);
        if (!roll) {
            alert("No se encontró el registro para editar en la vista actual.");
            return;
        }

        state.currentEditRoll = JSON.parse(JSON.stringify(roll)); // Clonar para deshacer cambios si cancela
        state.currentEditDefects = [...(state.currentEditRoll.defectos || [])];

        // Poblar campos del modal
        document.getElementById("rt-edit-id-unico").value = roll.idUnico;
        document.getElementById("rt-edit-op").value = roll.datosPrincipales.op || "";
        document.getElementById("rt-edit-partida").value = roll.datosPrincipales.partida || "";
        document.getElementById("rt-edit-color").value = roll.datosPrincipales.color || "";
        document.getElementById("rt-edit-cod-articulo").value = roll.datosPrincipales.codArticulo || "";
        document.getElementById("rt-edit-descripcion").value = roll.datosPrincipales.descripcion || "";
        document.getElementById("rt-edit-n-rollo").value = roll.detalle.nRollo || "";
        document.getElementById("rt-edit-categoria").value = roll.detalle.categoria || "";
        document.getElementById("rt-edit-peso").value = roll.detalle.peso || "";
        document.getElementById("rt-edit-titulo-hilo").value = roll.datosPrincipales.tituloHilo || "";
        document.getElementById("rt-edit-lote-hilo").value = roll.datosPrincipales.loteHilo || "";
        document.getElementById("rt-edit-lote-spandex").value = roll.datosPrincipales.loteSpandex || "";
        
        // Mostrar Maquina completo (Maquina-Servicio)
        const combinedMaquina = roll.user?.nameSrv 
            ? `${roll.user.maquina}-${roll.user.nameSrv}` 
            : (roll.user?.maquina || "");
        document.getElementById("rt-edit-maquina").value = combinedMaquina;

        // Poblar select de inspectores
        const inspectorSelect = document.getElementById("rt-edit-inspector");
        inspectorSelect.innerHTML = [`<option value="">Seleccionar...</option>`]
            .concat((state.personalCatalog || [])
                .map(p => `<option value="${escapeAttribute(p)}">${escapeHtml(p)}</option>`))
            .join("");
        inspectorSelect.value = roll.user?.inspector || "";

        // Poblar select de clientes
        const clienteSelect = document.getElementById("rt-edit-cliente");
        clienteSelect.innerHTML = [`<option value="">Seleccionar...</option>`]
            .concat((state.customerCatalog || []).map(c => `<option value="${escapeAttribute(c)}">${escapeHtml(c)}</option>`))
            .join("");
        clienteSelect.value = roll.datosPrincipales.cliente || "";

        // Poblar select de defectos en el modal
        populateDefectOptionsInEdit();
        renderEditDefectsTable();

        elements.editModal.classList.add("active");
    }

    function populateDefectOptionsInEdit() {
        const select = document.getElementById("rt-edit-defecto-select");
        const placeholder = "Seleccionar...";
        const options = Array.isArray(state.defectCatalog)
            ? state.defectCatalog
                .map((item) => String((item && item.sheetHeader) || "").trim())
                .filter(Boolean)
            : [];

        select.innerHTML = [`<option value="">${escapeHtml(placeholder)}</option>`]
            .concat(options.map((name) => `<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`))
            .join("");
    }

    function addDefectToEdit() {
        const select = document.getElementById("rt-edit-defecto-select");
        const occurrenceInput = document.getElementById("rt-edit-defecto-ocurrencia");
        
        const defectName = select.value;
        const occurrenceText = occurrenceInput.value.trim();

        if (!defectName || !occurrenceText) {
            alert("Selecciona un defecto y registra la ocurrencia.");
            return;
        }

        const occurrence = Number(occurrenceText);
        if (!Number.isFinite(occurrence) || occurrence <= 0) {
            alert("La ocurrencia debe ser mayor que cero.");
            return;
        }

        const catalogMatch = state.defectCatalog.find((item) =>
            String((item && item.sheetHeader) || "").trim() === defectName ||
            String((item && item.nombre) || "").trim() === defectName
        );
        const sheetHeader = catalogMatch ? (catalogMatch.sheetHeader || defectName) : defectName;

        state.currentEditDefects.push({
            nombre: sheetHeader,
            sheetHeader: sheetHeader,
            codigo: catalogMatch ? (catalogMatch.codigo || "") : "",
            ocurrencia: occurrence,
            puntajeUnitario: 2,
            puntajeTotal: 2 * occurrence,
            hora: formatTime(new Date()),
            fechaReg: formatShortDate(new Date()),
        });

        select.value = "";
        occurrenceInput.value = "";
        renderEditDefectsTable();
    }

    function removeDefectFromEdit(index) {
        state.currentEditDefects.splice(index, 1);
        renderEditDefectsTable();
    }

    function renderEditDefectsTable() {
        const tbody = document.getElementById("rt-edit-defects-tbody");
        if (!state.currentEditDefects.length) {
            tbody.innerHTML = `<tr><td colspan="3" class="rt-empty">Sin defectos.</td></tr>`;
            return;
        }

        tbody.innerHTML = state.currentEditDefects.map((defect, index) => `
            <tr>
                <td><strong>${escapeHtml(formatDefectLabel(defect))}</strong></td>
                <td>${escapeHtml(String(defect.ocurrencia))}</td>
                <td><button type="button" class="rt-icon-button danger" data-remove-edit-defect="${index}">X</button></td>
            </tr>
        `).join("");
    }

    async function saveEditedRoll() {
        if (!state.currentEditRoll) return;

        const btn = document.getElementById("rt-edit-save-btn");
        const originalText = btn.textContent;
        
        const fullMaquina = document.getElementById("rt-edit-maquina").value.trim().toUpperCase();
        let maquinaPart = state.currentEditRoll.user?.maquina || "";
        let nameSrvPart = state.currentEditRoll.user?.nameSrv || "";

        if (fullMaquina.includes("-")) {
            const parts = fullMaquina.split("-");
            maquinaPart = parts[0].trim();
            nameSrvPart = parts.slice(1).join("-").trim();
        } else {
            // Si no hay guión, asumimos que es solo la máquina principal
            maquinaPart = fullMaquina;
            nameSrvPart = "";
        }

        const updatedRoll = {
            ...state.currentEditRoll,
            user: {
                ...state.currentEditRoll.user,
                inspector: document.getElementById("rt-edit-inspector").value,
                maquina: maquinaPart,
                nameSrv: nameSrvPart,
            },
            datosPrincipales: {
                ...state.currentEditRoll.datosPrincipales,
                cliente: document.getElementById("rt-edit-cliente").value.trim().toUpperCase(),
                op: document.getElementById("rt-edit-op").value.trim(),
                partida: document.getElementById("rt-edit-partida").value.trim(),
                color: document.getElementById("rt-edit-color").value.trim().toUpperCase(),
                codArticulo: document.getElementById("rt-edit-cod-articulo").value.trim(),
                descripcion: document.getElementById("rt-edit-descripcion").value.trim().toUpperCase(),
                tituloHilo: document.getElementById("rt-edit-titulo-hilo").value.trim(),
                loteHilo: document.getElementById("rt-edit-lote-hilo").value.trim(),
                loteSpandex: document.getElementById("rt-edit-lote-spandex").value.trim(),
            },
            detalle: {
                ...state.currentEditRoll.detalle,
                nRollo: document.getElementById("rt-edit-n-rollo").value.trim(),
                categoria: document.getElementById("rt-edit-categoria").value,
                peso: document.getElementById("rt-edit-peso").value.trim(),
            },
            defectos: [...state.currentEditDefects],
            totalDefectos: state.currentEditDefects.reduce((sum, d) => sum + Number(d.ocurrencia || 0), 0)
        };

        if (!updatedRoll.datosPrincipales.op || !updatedRoll.detalle.nRollo) {
            alert("OP y Nro de Rollo son obligatorios.");
            return;
        }

        btn.disabled = true;
        btn.textContent = "Guardando...";

        try {
            const response = await fetch(SOURCE_APPS_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: "registroTercerosGuardar",
                    rolls: [updatedRoll],
                }),
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: HTTP ${response.status}`);
            }
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || "No se pudo guardar la información.");
            }

            // Actualizar estado local
            const index = state.globalRolls.findIndex(r => r.idUnico === updatedRoll.idUnico);
            if (index !== -1) {
                state.globalRolls[index] = updatedRoll;
            } else {
                state.globalRolls = [updatedRoll, ...state.globalRolls];
            }
            
            persistRolls();
            consultaAllRowsCache = null;
            await fetchConsultaData();

            elements.editModal.classList.remove("active");
            alert("✓ Registro actualizado correctamente.");
            
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
})();
