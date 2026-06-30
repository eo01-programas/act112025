(() => {
    if (!window.AppRouter || window.AppRouter.currentView !== 'consolidado_aprobaciones') {
        return;
    }

    // ── Estilos (paleta Sc8_Ceropegia) ──
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        /* ── Paleta Scriptcase Sc8_Ceropegia (consistente con el proyecto) ── */
        :root {
            --sc8-bg: #f4f7ef;
            --sc8-surface: #ffffff;
            --sc8-surface-soft: #eef5e8;
            --sc8-header: #dfeccd;
            --sc8-header-strong: #c7d9ad;
            --sc8-primary: #4f8f62;
            --sc8-primary-dark: #3f7550;
            --sc8-primary-soft: #d9ead3;
            --sc8-secondary: #8aa76d;
            --sc8-accent: #6fa37f;
            --sc8-border: #c8d8bd;
            --sc8-border-strong: #a9bf9a;
            --sc8-text: #2f3b2f;
            --sc8-text-muted: #667466;
            --sc8-danger: #b65b5b;
            --sc8-warning: #d39b36;
            --sc8-info: #4c8ca8;
            --sc8-success: #4f8f62;
            --sc8-shadow: 0 8px 22px rgba(47, 59, 47, .10);
            --sc8-radius: 12px;
            --sc8-radius-sm: 8px;
            --sc8-font: Arial, Helvetica, sans-serif;
        }

        body {
            font-family: var(--sc8-font);
            background-color: var(--sc8-bg);
            color: var(--sc8-text);
        }

        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background-color: #ffffff;
                color: #000000;
                padding: 0;
            }
            .print-card {
                box-shadow: none !important;
                border: 1px solid var(--sc8-border) !important;
            }
        }

        .glass-card {
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(12px);
            border: 1px solid var(--sc8-border);
        }

        .transition-all-300 {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Estilos específicos para el switch/toggle */
        .switch-checkbox:checked + .switch-label {
            background-color: var(--sc8-primary);
        }
        .switch-checkbox:checked + .switch-label .switch-ball {
            transform: translateX(1.25rem);
        }
    `;
    document.head.appendChild(styleTag);

    const root = document.getElementById('root');
    if (!root) return;
    root.innerHTML = `

    <div class="w-full px-4 sm:px-6 lg:px-8 pt-3 pb-10">
        
        <!-- ENCABEZADO PRINCIPAL + FILTROS -->
        <header class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2f5a3c] via-[#3f7550] to-[#4f8f62] text-white px-5 sm:px-6 py-3 mb-3 shadow-xl shadow-[#2f3b2f]/10">
            <div class="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <!-- TÍTULO -->
                <div class="xl:flex-1 min-w-0">
                    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Consolidado de Aprobaciones</h1>
                    <p class="text-[#eef5e8]/85 text-sm mt-1 font-medium">Análisis de Desviaciones, Rechazos y Eficiencia de Producción</p>
                    <p id="data-freshness" class="text-[11px] mt-1 font-medium flex items-center gap-1.5 text-[#eef5e8]/70"></p>
                </div>

                <!-- FILTROS INTERACTIVOS -->
                <section class="shrink-0 glass-card rounded-2xl p-4 shadow-sm no-print">
                    <div class="flex flex-wrap items-end gap-3">

                        <!-- VER POR (Semana / Mes) — sin etiqueta -->
                        <div class="w-28">
                            <div class="inline-flex bg-slate-100 p-1 rounded-xl w-full">
                                <button id="btn-ver-semana" onclick="setVerPor('semana')" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all-300 bg-[#4f8f62] text-white shadow-sm">Semana</button>
                                <button id="btn-ver-mes" onclick="setVerPor('mes')" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all-300 text-slate-600 hover:text-slate-900">Mes</button>
                            </div>
                        </div>

                        <!-- AÑO -->
                        <div class="w-[4.5rem]">
                            <label for="select-ano" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">AÑO</label>
                            <div class="relative">
                                <select id="select-ano" onchange="actualizarVisualizacion()" class="w-full bg-slate-50 border border-[#c8d8bd] rounded-xl pl-2 pr-6 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4f8f62] appearance-none">
                                    <option value="Todos">Todos</option>
                                </select>
                                <i data-lucide="chevron-down" class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>

                        <!-- MES -->
                        <div class="w-[4.5rem]">
                            <label for="select-mes" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">MES</label>
                            <div class="relative">
                                <select id="select-mes" onchange="actualizarVisualizacion()" class="w-full bg-slate-50 border border-[#c8d8bd] rounded-xl pl-2 pr-6 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4f8f62] appearance-none">
                                    <option value="Todos">Todos</option>
                                </select>
                                <i data-lucide="chevron-down" class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>

                        <!-- SEMANA -->
                        <div id="container-filtro-semana" class="w-[5.5rem]">
                            <label for="select-semana" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">SEMANA</label>
                            <div class="relative">
                                <select id="select-semana" onchange="actualizarVisualizacion()" class="w-full bg-slate-50 border border-[#c8d8bd] rounded-xl pl-2 pr-6 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4f8f62] appearance-none">
                                    <option value="Todos">Todos</option>
                                </select>
                                <i data-lucide="chevron-down" class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>

                        <!-- SEMANA ANTERIOR TOGGLE -->
                        <div class="shrink-0">
                            <span id="label-anterior" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center whitespace-nowrap">Sem. Ant.</span>
                            <div class="relative inline-flex items-center justify-center select-none w-full py-1">
                                <input type="checkbox" id="toggle-semana-anterior" onchange="toggleSemanaAnterior()" class="switch-checkbox sr-only"/>
                                <label for="toggle-semana-anterior" class="switch-label flex items-center w-11 h-6 px-0.5 rounded-full bg-slate-300 cursor-pointer transition-colors duration-300">
                                    <span class="switch-ball block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300"></span>
                                </label>
                            </div>
                        </div>

                        <!-- CLIENTE -->
                        <div class="w-28">
                            <label for="select-cliente" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">CLIENTE</label>
                            <div class="relative">
                                <select id="select-cliente" onchange="actualizarVisualizacion()" class="w-full bg-slate-50 border border-[#c8d8bd] rounded-xl pl-2 pr-6 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4f8f62] appearance-none">
                                    <option value="Todos">Todos</option>
                                </select>
                                <i data-lucide="chevron-down" class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>

                        <!-- COD. ART. -->
                        <div class="w-[5.5rem]">
                            <label for="select-articulo" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">COD. ART.</label>
                            <div class="relative">
                                <select id="select-articulo" onchange="actualizarVisualizacion()" class="w-full bg-slate-50 border border-[#c8d8bd] rounded-xl pl-2 pr-6 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4f8f62] appearance-none">
                                    <option value="Todos">Todos</option>
                                </select>
                                <i data-lucide="chevron-down" class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>

                        <!-- ACCIONES -->
                        <div class="flex items-center gap-2 shrink-0">
                            <button onclick="cargarDatosDesdeSheet(true)" title="Actualizar datos" class="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all-300">
                                <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                            </button>
                            <button onclick="window.print()" title="Imprimir" class="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all-300">
                                <i data-lucide="printer" class="w-4 h-4"></i>
                            </button>
                            <a href="${window.AppRouter.href('home')}" title="Volver al menú" class="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-[#3f7550] hover:bg-[#2f5a3c] text-white no-underline transition-all-300">
                                <i data-lucide="home" class="w-4 h-4"></i>
                            </a>
                        </div>

                    </div>
                </section>
            </div>
        </header>

        <!-- SECCIÓN DE CARDS DE INDICADORES (KPIs) -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            
            <!-- KPI 1: PARTIDAS APROBADAS -->
            <div class="print-card bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center justify-between transition-all-300 hover:shadow-md">
                <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Partidas Aprobadas</p>
                    <div class="flex items-baseline gap-2">
                        <h3 id="kpi-aprobadas-totales" class="text-3xl font-extrabold text-[#4c8ca8]">–</h3>
                        <span id="kg-aprobadas" class="text-sm font-semibold text-slate-400"></span>
                        <span id="pct-aprobadas" class="text-xs font-bold bg-[#e3eef3] text-[#2c6178] px-1.5 py-0.5 rounded-md"></span>
                    </div>
                    <p class="text-[11px] font-medium text-[#4c8ca8]/80 mt-1">Aprobado + Tolerancia + Autorizacion</p>
                </div>
                <div class="p-3 bg-[#e3eef3] text-[#4c8ca8] rounded-xl">
                    <i data-lucide="layers" class="w-6 h-6"></i>
                </div>
            </div>

            <!-- KPI 2: PARTIDAS RECHAZADAS -->
            <div class="print-card bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center justify-between transition-all-300 hover:shadow-md">
                <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Partidas Rechazadas</p>
                    <div class="flex items-baseline gap-2">
                        <h3 id="kpi-rechazos" class="text-3xl font-extrabold text-[#b65b5b]">–</h3>
                        <span id="kg-rechazos" class="text-sm font-semibold text-slate-400"></span>
                        <span id="pct-rechazos" class="text-xs font-bold bg-[#f6e8e8] text-[#8a2f2f] px-1.5 py-0.5 rounded-md"></span>
                    </div>
                    <p class="text-[11px] font-medium text-[#b65b5b]/80 mt-1">Partidas no aprobadas (rechazadas)</p>
                </div>
                <div class="p-3 bg-[#f6e8e8] text-[#b65b5b] rounded-xl">
                    <i data-lucide="alert-triangle" class="w-6 h-6"></i>
                </div>
            </div>

            <!-- KPI 3: TOTAL DE PARTIDAS AUDITADAS -->
            <div class="print-card bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center justify-between transition-all-300 hover:shadow-md">
                <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total de partidas auditadas</p>
                    <div class="flex items-baseline gap-2">
                        <h3 id="kpi-partidas-totales" class="text-3xl font-extrabold text-slate-900">–</h3>
                        <span id="kg-auditadas" class="text-sm font-semibold text-slate-400"></span>
                        <span id="pct-auditadas" class="text-xs font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md"></span>
                    </div>
                    <p class="text-[11px] font-medium text-slate-500 mt-1">Partidas que entraron a calidad</p>
                </div>
                <div class="p-3 bg-slate-100 text-slate-600 rounded-xl">
                    <i data-lucide="clipboard-list" class="w-6 h-6"></i>
                </div>
            </div>

            <!-- KPI 4: BIEN A LA PRIMERA NETO -->
            <div class="print-card bg-[#2f5a3c] rounded-2xl p-3 border border-[#2f5a3c] shadow-sm flex items-center justify-between transition-all-300 hover:shadow-md">
                <div>
                    <p class="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Bien a la 1ª Neto</p>
                    <div class="flex items-baseline gap-2">
                        <h3 id="kpi-neto-bien" class="text-3xl font-extrabold text-white">–</h3>
                        <span id="kg-neto-bien" class="text-sm font-semibold text-white/70"></span>
                        <span id="pct-bien" class="text-xs font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-md"></span>
                    </div>
                    <p class="text-[11px] font-medium text-white/75 mt-1">Aprobado + Tolerancia - Rechazos</p>
                </div>
                <div class="p-3 bg-white/15 text-white rounded-xl">
                    <i data-lucide="check-circle" class="w-6 h-6"></i>
                </div>
            </div>

        </section>

        <!-- CONTENIDO PRINCIPAL: 1 FILA, 3 COLUMNAS -->
        <main class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            <!-- GRÁFICO INTERATIVO DE DESEMPENHO -->
            <div class="print-card bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col h-[350px]">
                <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="bar-chart-3" class="w-4.5 h-4.5 text-[#3f7550]"></i>
                        <h3 class="font-bold text-sm text-slate-700 uppercase tracking-wider">Resultados Netos por Cliente</h3>
                    </div>
                </div>
                <div class="flex-1 relative">
                    <canvas id="chart-clientes-dinamico"></canvas>
                </div>
            </div>

            <!-- TABLA: DETALLE BIEN A LA PRIMERA -->
            <div class="print-card bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div class="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#4f8f62] animate-pulse"></span>
                    <h3 class="font-bold text-xs text-slate-700 uppercase tracking-wider">BIEN A LA PRIMERA (Aprobado + Tolerancia)</h3>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50/70 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-100">
                                <th class="py-2.5 px-3 rounded-l-xl">Cliente</th>
                                <th class="py-2.5 px-3 text-right">Partidas</th>
                                <th class="py-2.5 px-3 text-right text-[#b65b5b]">Rechazos</th>
                                <th class="py-2.5 px-3 text-right rounded-r-xl text-[#3f7550]">NETO</th>
                            </tr>
                        </thead>
                        <tbody id="tbl-bien-primera-body" class="text-xs font-medium">
                            <!-- Filas inyectadas dinámicamente -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- TABLA: DETALLE APROBADO CON AUTORIZACIÓN -->
            <div class="print-card bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div class="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#4c8ca8] animate-pulse"></span>
                    <h3 class="font-bold text-xs text-slate-700 uppercase tracking-wider">APROBADO C/AUTORIZACIÓN</h3>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50/70 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-100">
                                <th class="py-2.5 px-3 rounded-l-xl">Cliente</th>
                                <th class="py-2.5 px-3 text-right">Partidas</th>
                                <th class="py-2.5 px-3 text-right text-[#b65b5b]">Rechazos</th>
                                <th class="py-2.5 px-3 text-right rounded-r-xl text-[#4c8ca8]">NETO</th>
                            </tr>
                        </thead>
                        <tbody id="tbl-autorizados-body" class="text-xs font-medium">
                            <!-- Filas inyectadas dinámicamente -->
                        </tbody>
                    </table>
                </div>
            </div>

        </main>
    </div>

    <!-- OVERLAY DE CARGA (visible hasta que llegan los primeros datos) -->
    <div id="loading-overlay" class="fixed inset-0 z-40 flex items-center justify-center bg-[#f4f7ef]/75 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-4 border-[#c8d8bd] border-t-[#3f7550] rounded-full animate-spin"></div>
            <p class="text-sm font-bold text-[#3f7550]">Cargando datos…</p>
        </div>
    </div>

    <!-- MODAL DE NOTIFICACIÓN DE CARGA -->
    <div id="alert-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 transform scale-95 transition-all">
            <div id="alert-icon-container" class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#d9ead3] text-[#3f7550] mb-4">
                <i id="alert-icon" data-lucide="check" class="w-6 h-6"></i>
            </div>
            <h3 id="alert-title" class="text-lg font-bold text-slate-900 text-center mb-1">¡Carga completa!</h3>
            <p id="alert-msg" class="text-xs text-slate-500 text-center mb-6">El archivo se cargó correctamente y los cálculos se han actualizado.</p>
            <button onclick="cerrarAlerta()" class="w-full py-2.5 px-4 bg-[#3f7550] hover:bg-[#4f8f62] text-white font-bold rounded-xl transition-all duration-300">
                Aceptar
            </button>
        </div>
    </div>

    `;

    // Lucide no está en index.html → cargar bajo demanda y pintar íconos
    if (window.lucide) {
        lucide.createIcons();
    } else {
        const lu = document.createElement('script');
        lu.src = 'https://unpkg.com/lucide@latest';
        lu.onload = () => { if (window.lucide) lucide.createIcons(); };
        document.head.appendChild(lu);
    }

    // ───────────────────────── Lógica de la vista ─────────────────────────

        // Configuración de visualización por defecto
        let state = {
            verPor: 'semana', // 'semana' o 'mes'
            ano: 'Todos',
            mes: 'Todos',
            semana: 'Todos',
            semanaAnterior: false,
            cliente: 'Todos',
            articulo: 'Todos'
        };

        // Auxiliares de DOM seguros para evitar crashes de referencias nulas
        const safeSetText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        const safeSetHTML = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = val;
        };

        const safeSetStyleDisplay = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.style.display = val;
        };

        const safeRemoveClass = (id, className) => {
            const el = document.getElementById(id);
            if (el) el.classList.remove(className);
        };

        const safeAddClass = (id, className) => {
            const el = document.getElementById(id);
            if (el) el.classList.add(className);
        };

        // Normalización inteligente de cadenas de texto para cabeceras y valores
        function normalizeString(str) {
            if (!str) return "";
            return str.toString()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "");     // Eliminar caracteres especiales, guiones y espacios
        }

        // Memo de normalizeString: cabeceras y objetivos son un conjunto acotado y se
        // repiten en cada carga (caché + red), así el normalize("NFD")+regex corre 1 vez.
        const _normCache = new Map();
        function normCached(s) {
            const k = typeof s === "string" ? s : String(s);
            let v = _normCache.get(k);
            if (v === undefined) { v = normalizeString(k); _normCache.set(k, v); }
            return v;
        }

        // Cabeceras normalizadas por fila, calculadas UNA sola vez (WeakMap → no muta
        // la fila y se libera con el GC). Antes getExcelField re-normalizaba todas las
        // columnas en cada una de sus ~20 llamadas por fila.
        const _rowNormCache = new WeakMap();
        function getRowNormEntries(row) {
            let entries = _rowNormCache.get(row);
            if (!entries) {
                entries = [];
                for (const key in row) {
                    if (Object.prototype.hasOwnProperty.call(row, key)) {
                        entries.push([normCached(key), row[key]]);
                    }
                }
                _rowNormCache.set(row, entries);
            }
            return entries;
        }

        // Recuperar dinámicamente un campo de un objeto (fila de Excel) usando búsqueda difusa.
        // Conserva la preferencia original: gana la primera columna de la fila que coincida.
        function getExcelField(row, targets) {
            if (!row || typeof row !== "object") return null;
            const normalizedTargets = targets.map(normCached);
            const entries = getRowNormEntries(row);
            for (let i = 0; i < entries.length; i++) {
                if (normalizedTargets.indexOf(entries[i][0]) !== -1) {
                    return entries[i][1];
                }
            }
            return null;
        }

        // Parseador inteligente de fecha para soportar formatos diversos o fecha serial Excel
        function parsearFechaExcel(fechaVal) {
            if (!fechaVal) return null;
            if (typeof fechaVal === 'number') {
                const dateObj = XLSX.SSF.parse_date_code(fechaVal);
                return new Date(dateObj.y, dateObj.m - 1, dateObj.d);
            }
            const dateStr = fechaVal.toString().trim();
            const parts = dateStr.split(/[\/\s:-]/);
            if (parts.length >= 3) {
                let dia = parseInt(parts[0], 10);
                let mesStr = parts[1];
                let anio = parseInt(parts[2], 10);

                const mapaMeses = {
                    jan: 0, ene: 0, feb: 1, mar: 2, apr: 3, abr: 3, may: 4, jun: 5,
                    jul: 6, aug: 7, ago: 7, sep: 8, oct: 9, nov: 10, dec: 11, dic: 11
                };

                let mesIndex = parseInt(mesStr, 10) - 1;
                if (isNaN(mesIndex)) {
                    const normMes = normalizeString(mesStr).substring(0, 3);
                    mesIndex = mapaMeses[normMes] !== undefined ? mapaMeses[normMes] : 0;
                }

                if (!isNaN(dia) && !isNaN(mesIndex) && !isNaN(anio)) {
                    if (anio < 100) anio += 2000;
                    return new Date(anio, mesIndex, dia);
                }
            }
            const dateParsed = new Date(dateStr);
            return isNaN(dateParsed.getTime()) ? null : dateParsed;
        }

        // Extrae la fecha válida analizando la fila de manera secuencial para evitar celdas nulas intermitentes
        function extraerFechaDeFila(row) {
            const columnasFecha = [
                "Fecha_aprobacion", "Fecha_aprobación", "fechaaprobacion", "fecha_aprobacion",
                "calidad_fin",
                "fecha_rechazo_1", "fecha_rechazo_2", "fecha_rechazo_3", "fecha_rechazo_4"
            ];
            for (let col of columnasFecha) {
                let val = getExcelField(row, [col]);
                if (val !== undefined && val !== null && val.toString().trim() !== "") {
                    let fechaObj = parsearFechaExcel(val);
                    if (fechaObj && !isNaN(fechaObj.getTime())) {
                        return fechaObj;
                    }
                }
            }
            return null;
        }

        // Calcula el número de semana ISO de una fecha dada
        function obtenerNumeroSemana(fecha) {
            const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            return weekNo;
        }

        // ─── Origen de datos: misma hoja de cálculo que consume trazabilidad_op.js ───
        // En modo integrado se lee de window.APP_CONFIG.IQ; como página suelta usa
        // el mismo Web App y la misma clave de caché para compartir datos.
        const IQ_CFG = (window.APP_CONFIG && window.APP_CONFIG.IQ) || {};
        const WEB_APP_URL       = IQ_CFG.WEB_APP_URL || "https://script.google.com/macros/s/AKfycbyDasMwI_A94gpo6goCHPIYfw2NsjPlgfNkMKf2klpIv_UGYaRMeh7X_OHCcPObmDZA/exec";
        const LOCAL_STORAGE_KEY = IQ_CFG.LOCAL_STORAGE_KEY || "tintoreria-records";
        // Marca de tiempo de la última sincronización con la hoja (frescura del caché)
        const LOCAL_STORAGE_TS_KEY = LOCAL_STORAGE_KEY + "-updatedAt";
        // Pasado este lapso, el dato cacheado se muestra como "posiblemente desactualizado"
        const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
        const MAX_MOTIVOS = 7;

        // ¿La partida registró al menos un rechazo? (motivo_rechazo_1..7 o cantidad_rechazos)
        function tieneRechazo(row) {
            for (let i = 1; i <= MAX_MOTIVOS; i++) {
                const m = getExcelField(row, [`motivo_rechazo_${i}`]);
                if (m !== undefined && m !== null && m.toString().trim() !== "") return true;
            }
            const cant = getExcelField(row, ["cantidad_rechazos", "cantidad_rechazo", "cantidadrechazos", "rechazos"]);
            return (cant !== undefined && cant !== null && cant !== "" && cant !== 0 && cant !== "0");
        }

        // Peso en crudo de la partida (kg). Soporta coma o punto decimal.
        function obtenerKg(row) {
            const raw = getExcelField(row, ["peso_kg_crudo", "pesokgcrudo", "peso_crudo", "peso_kg", "pesokg"]);
            if (raw === undefined || raw === null || raw === "") return 0;
            const val = parseFloat(raw.toString().replace(",", "."));
            return isNaN(val) ? 0 : val;
        }

        // ─── Identidad de partida: igual que T-ACABADA (iq_data.js) ───
        // Solo se considera la fila si tiene dato en calidad_inicio (partida que entró a calidad)
        function esElegible(row) {
            const ci = getExcelField(row, ["calidad_inicio", "calidadinicio"]);
            return ci !== undefined && ci !== null && ci.toString().trim() !== "";
        }

        // Clave única por OP-PTDA (op_tela|partida); null si falta cualquiera de las dos
        function obtenerClaveOpPtda(row) {
            const op   = getExcelField(row, ["op_tela", "optela", "op"]);
            const ptda = getExcelField(row, ["partida", "ptda"]);
            const opS   = op   != null ? op.toString().trim()   : "";
            const ptdaS = ptda != null ? ptda.toString().trim() : "";
            return (opS && ptdaS) ? `${opS}|${ptdaS}` : null;
        }

        // Convierte un registro crudo del sheet al modelo interno de esta vista
        // Normaliza variantes del nombre de cliente a una etiqueta canónica
        function normalizarCliente(nombre) {
            const s = (nombre || "").toString().trim();
            const up = s.toUpperCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
            if (up === "AM RETAIL" || up === "AM RETAIL SAC" || up === "AM RETAIL S A C") return "AM RETAIL";
            if (up === "COFACO INDUSTRIES" || up === "COFACO") return "COFACO";
            return s;
        }

        function mapearRegistro(row) {
            const mesesLetras = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

            let rawTipoVal = getExcelField(row, ["Tipo_aprobacion", "tipo_aprobacion", "tipoaprobacion", "tipo"]);
            let rawTipo = rawTipoVal ? rawTipoVal.toString().trim().toUpperCase() : "";

            if (rawTipo.includes("TOLERANCIA")) {
                rawTipo = "APROBADO C/TOLERANCIA";
            } else if (rawTipo.includes("AUTORIZACION") || rawTipo.includes("AUTORIZACIÓN")) {
                rawTipo = "APROBADO C/AUTORIZACION";
            } else if (rawTipo) {
                // Cualquier tipo_aprobacion no vacío y no clasificado se considera APROBADO
                rawTipo = "APROBADO";
            } else {
                // Sin tipo_aprobacion → la partida no fue aprobada
                rawTipo = "RECHAZADO";
            }

            let fechaObj = extraerFechaDeFila(row);
            let anioParsed = 2026;
            let mesParsed = "Jun";
            let semParsed = "SEM 24";
            if (fechaObj) {
                anioParsed = fechaObj.getFullYear();
                mesParsed = mesesLetras[fechaObj.getMonth()];
                semParsed = "SEM " + obtenerNumeroSemana(fechaObj);
            }

            let clienteVal = getExcelField(row, ["cliente", "client", "clientes"]);
            let clienteFinal = normalizarCliente(clienteVal ? clienteVal.toString().trim() : "Otros");

            let articuloVal = getExcelField(row, ["cod_art", "codart", "articulo"]);
            let articuloFinal = articuloVal ? articuloVal.toString().trim() : "Otros";

            return {
                cliente: clienteFinal,
                articulo: articuloFinal,
                tipo: rawTipo,
                partidas: 1,
                rechazos: tieneRechazo(row) ? 1 : 0,
                peso: obtenerKg(row),
                anio: anioParsed,
                mes: mesParsed,
                semana: semParsed
            };
        }

        // Deduplica por OP-PTDA: cada partida única cuenta como 1 (no por fila).
        // Solo entran filas elegibles (con calidad_inicio), igual que T-ACABADA.
        function mapearRegistros(records) {
            const mapa = new Map(); // clave OP-PTDA → ítem único
            (records || []).forEach(row => {
                if (!esElegible(row)) return;            // sin calidad_inicio → fuera del volumen
                const key = obtenerClaveOpPtda(row);
                if (!key) return;                        // sin OP o sin PARTIDA no se puede identificar

                const item = mapearRegistro(row);
                const previo = mapa.get(key);
                if (!previo) {
                    mapa.set(key, item);
                    return;
                }
                // Fusión de filas de una misma partida:
                // • marca rechazo si CUALQUIER fila tuvo rechazo
                previo.rechazos = (previo.rechazos || item.rechazos) ? 1 : 0;
                // • conserva el peso si la primera fila vino sin dato
                if (!previo.peso && item.peso) previo.peso = item.peso;
                // • la aprobación gana sobre el rechazo total (adopta tipo y su período)
                if (previo.tipo === "RECHAZADO" && item.tipo !== "RECHAZADO") {
                    previo.tipo     = item.tipo;
                    previo.anio     = item.anio;
                    previo.mes      = item.mes;
                    previo.semana   = item.semana;
                    previo.cliente  = item.cliente;
                    previo.articulo = item.articulo;
                }
            });
            return Array.from(mapa.values());
        }

        let activeData = [];
        let chartInstance = null;

        // Oculta el overlay de carga (idempotente): ya hay algo que mostrar
        function ocultarCargando() {
            safeAddClass('loading-overlay', 'hidden');
        }

        // ─── Frescura del caché ───
        function leerTimestampCache() {
            const raw = localStorage.getItem(LOCAL_STORAGE_TS_KEY);
            const ts = raw ? parseInt(raw, 10) : NaN;
            return isNaN(ts) ? null : ts;
        }

        function formatearAntiguedad(ms) {
            const seg = Math.floor(ms / 1000);
            if (seg < 60) return "hace un momento";
            const min = Math.floor(seg / 60);
            if (min < 60) return `hace ${min} min`;
            const hrs = Math.floor(min / 60);
            if (hrs < 24) return `hace ${hrs} h`;
            const dias = Math.floor(hrs / 24);
            return `hace ${dias} día${dias > 1 ? "s" : ""}`;
        }

        // estado: 'loading' (conectando sin caché), 'ok' (recién sincronizado), 'cache' (mostrando caché), 'error' (red falló)
        let estadoFrescura = 'cache';
        function actualizarFrescura(estado) {
            if (estado) estadoFrescura = estado;
            const el = document.getElementById('data-freshness');
            if (!el) return;
            const ts = leerTimestampCache();

            if (!ts) {
                if (estadoFrescura === 'loading') {
                    el.className = 'text-[11px] mt-1 font-medium flex items-center gap-1.5 text-[#eef5e8]/70';
                    el.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-[#9fe0a0] animate-ping"></span>Conectando con el servidor…`;
                } else {
                    el.innerHTML = '';
                }
                return;
            }

            const edad = Date.now() - ts;
            const fechaAbs = new Date(ts).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const viejo = edad > CACHE_TTL_MS;

            let dot, texto, cls;
            if (estadoFrescura === 'loading') {
                dot = '#9fe0a0'; cls = 'text-[#eef5e8]/70';
                texto = `Actualizando datos (${formatearAntiguedad(edad)})`;
            } else if (estadoFrescura === 'error') {
                dot = '#d39b36'; cls = 'text-[#ffe6b0]';
                texto = `Sin conexión · datos de ${formatearAntiguedad(edad)}`;
            } else if (estadoFrescura === 'ok' && !viejo) {
                dot = '#9fe0a0'; cls = 'text-[#eef5e8]/70';
                texto = `Actualizado ${formatearAntiguedad(edad)}`;
            } else {
                dot = viejo ? '#d39b36' : '#cfe3cf'; cls = viejo ? 'text-[#ffe6b0]' : 'text-[#eef5e8]/70';
                texto = `Datos de ${formatearAntiguedad(edad)}`;
            }
            el.className = `text-[11px] mt-1 font-medium flex items-center gap-1.5 ${cls}`;
            el.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full" style="background:${dot}"></span>${texto} (${fechaAbs})`;
        }

        // Mantiene viva la etiqueta relativa ("hace X min") sin depender de un refresh de datos.
        // Guard a nivel de ventana para no acumular timers si el router reinyecta el script.
        if (window.__caFreshnessTimer) clearInterval(window.__caFreshnessTimer);
        window.__caFreshnessTimer = setInterval(() => actualizarFrescura(), 60 * 1000);

        // Aplica un conjunto de registros crudos a la vista
        function aplicarRegistros(records) {
            activeData = mapearRegistros(records);
            inicializarSelectoresFiltros();
            if (!defaultsAplicados && activeData.length) {
                aplicarDefaultsActuales();
                defaultsAplicados = true;
            }
            actualizarVisualizacion();
            ocultarCargando();
        }

        // Carga desde la hoja: muestra al instante lo cacheado y luego refresca del servidor
        async function cargarDatosDesdeSheet(forzar = false) {
            let hayCache = false;
            if (!forzar) {
                try {
                    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed) && parsed.length) {
                            aplicarRegistros(parsed);
                            actualizarFrescura('cache');
                            hayCache = true;
                        }
                    }
                } catch (e) { /* ignore */ }
            }
            // Indicar en el header que se está actualizando (no bloquea la UI)
            if (!hayCache || forzar) actualizarFrescura('loading');
            try {
                const url = new URL(WEB_APP_URL);
                url.searchParams.set('action', 'list');
                const res = await fetch(url.toString(), { method: 'GET', headers: { Accept: 'application/json' } });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = JSON.parse(await res.text());
                if (!data.success) throw new Error(data.message || 'Error de API');
                const recs = data.records || [];
                try {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recs));
                    localStorage.setItem(LOCAL_STORAGE_TS_KEY, String(Date.now()));
                } catch (e) { /* quota */ }
                aplicarRegistros(recs);
                actualizarFrescura('ok');
                if (forzar) mostrarAlerta("Datos actualizados", `${recs.length} registros sincronizados desde la hoja.`, "success");
            } catch (e) {
                console.error('[FPY] Error cargando datos:', e);
                if (!activeData.length) {
                    mostrarAlerta("Error de carga", "No se pudieron cargar los datos de la hoja. Verifique su conexión y vuelva a intentar.", "error");
                    actualizarFrescura('error');
                } else {
                    // Hay datos en caché: aviso discreto en el encabezado, sin modal
                    actualizarFrescura('error');
                }
            }
        }

        // Selecciona por defecto el año, mes y semana actuales (solo la primera vez
        // que llegan datos y siempre que esos valores existan en el conjunto cargado)
        let defaultsAplicados = false;
        function aplicarDefaultsActuales() {
            const ahora = new Date();
            const mesesLetras = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const setIfPresent = (id, valor) => {
                const sel = document.getElementById(id);
                if (sel && Array.from(sel.options).some(o => o.value === valor)) sel.value = valor;
            };
            setIfPresent('select-ano', String(ahora.getFullYear()));
            setIfPresent('select-mes', mesesLetras[ahora.getMonth()]);
            setIfPresent('select-semana', "SEM " + obtenerNumeroSemana(ahora));
        }

        // Alternar visualización interactiva de VER POR (Semana / Mes)
        function setVerPor(modo) {
            state.verPor = modo;
            const btnSemana = document.getElementById('btn-ver-semana');
            const btnMes = document.getElementById('btn-ver-mes');

            // El toggle "anterior" cambia de etiqueta y se apaga al cambiar de vista
            const labelAnterior = document.getElementById('label-anterior');
            const toggleSA = document.getElementById('toggle-semana-anterior');
            state.semanaAnterior = false;
            if (toggleSA) toggleSA.checked = false;

            if (modo === 'semana') {
                if (btnSemana) btnSemana.className = "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all-300 bg-[#4f8f62] text-white shadow-sm";
                if (btnMes) btnMes.className = "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all-300 text-slate-600 hover:text-slate-900";
                safeSetStyleDisplay('container-filtro-semana', 'block');
                if (labelAnterior) labelAnterior.textContent = 'Sem. Ant.';
            } else {
                if (btnMes) btnMes.className = "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all-300 bg-[#4f8f62] text-white shadow-sm";
                if (btnSemana) btnSemana.className = "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all-300 text-slate-600 hover:text-slate-900";
                safeSetStyleDisplay('container-filtro-semana', 'none');
                state.semana = 'Todos';
                const selectSemana = document.getElementById('select-semana');
                if (selectSemana) selectSemana.value = 'Todos';
                if (labelAnterior) labelAnterior.textContent = 'Mes Ant.';
            }
            // Al cambiar de vista el toggle queda apagado → período actual
            aplicarPeriodo(false);
            actualizarVisualizacion();
        }

        // Garantiza que un <select> tenga una opción con cierto valor (aunque no haya datos)
        function asegurarOpcion(select, valor) {
            if (!select) return;
            if (!Array.from(select.options).some(o => o.value === valor)) {
                const opt = document.createElement('option');
                opt.value = valor;
                opt.textContent = valor;
                select.appendChild(opt);
            }
        }

        // Fija en los selects el período ACTUAL o el ANTERIOR (según la vista activa).
        // 'previo' = true → mes/semana anterior; false → mes/semana actual.
        function aplicarPeriodo(previo) {
            const ahora = new Date();
            const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const selAno = document.getElementById('select-ano');
            const selMes = document.getElementById('select-mes');
            const selSem = document.getElementById('select-semana');

            if (state.verPor === 'mes') {
                let idx  = ahora.getMonth();
                let anio = ahora.getFullYear();
                if (previo) { idx -= 1; if (idx < 0) { idx = 11; anio -= 1; } }
                if (selAno) { asegurarOpcion(selAno, String(anio)); selAno.value = String(anio); state.ano = String(anio); }
                if (selMes) { asegurarOpcion(selMes, meses[idx]); selMes.value = meses[idx]; state.mes = meses[idx]; }
            } else {
                // En vista Semana fijamos también año y mes actuales (coherente con el default)
                if (selAno) { asegurarOpcion(selAno, String(ahora.getFullYear())); selAno.value = String(ahora.getFullYear()); state.ano = String(ahora.getFullYear()); }
                if (selMes) { asegurarOpcion(selMes, meses[ahora.getMonth()]); selMes.value = meses[ahora.getMonth()]; state.mes = meses[ahora.getMonth()]; }
                let num = obtenerNumeroSemana(ahora);
                if (previo) num -= 1;
                const sem = "SEM " + num;
                if (selSem) { asegurarOpcion(selSem, sem); selSem.value = sem; state.semana = sem; }
            }
        }

        // Alternador de período anterior (Semana / Mes según la vista)
        function toggleSemanaAnterior() {
            const toggle = document.getElementById('toggle-semana-anterior');
            state.semanaAnterior = toggle ? toggle.checked : false;
            aplicarPeriodo(state.semanaAnterior);
            actualizarVisualizacion();
        }

        // Inicialización estática
        function inicializarSelectoresFiltros() {
            poblarSelector('select-ano', 'anio', 'ano');
            poblarSelector('select-mes', 'mes', 'mes');
            poblarSelector('select-semana', 'semana', 'semana');
            poblarSelector('select-cliente', 'cliente', 'cliente');
            poblarSelector('select-articulo', 'articulo', 'articulo');
        }

        // Poblador dinámico en cascada (Cascading Filters) para evitar combinaciones vacías
        function poblarSelector(id, campo, excludeField) {
            const select = document.getElementById(id);
            if (!select) return;
            
            const valorActual = select.value || "Todos";
            
            let tempDataset = [...activeData];
            if (excludeField !== 'ano' && state.ano !== 'Todos') {
                tempDataset = tempDataset.filter(item => item.anio.toString() === state.ano);
            }
            if (excludeField !== 'mes' && state.mes !== 'Todos') {
                tempDataset = tempDataset.filter(item => item.mes === state.mes);
            }
            if (excludeField !== 'semana' && state.semana !== 'Todos' && state.verPor === 'semana') {
                tempDataset = tempDataset.filter(item => item.semana === state.semana);
            }
            if (excludeField !== 'cliente' && state.cliente !== 'Todos') {
                tempDataset = tempDataset.filter(item => item.cliente === state.cliente);
            }
            if (excludeField !== 'articulo' && state.articulo !== 'Todos') {
                tempDataset = tempDataset.filter(item => item.articulo === state.articulo);
            }
            
            const valoresUnicos = Array.from(new Set(tempDataset.map(item => item[campo]))).sort((a, b) => {
                if (campo === 'semana') {
                    return parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, ''));
                }
                return a.toString().localeCompare(b.toString());
            });

            // El año actual siempre debe estar disponible como opción (default por defecto)
            if (campo === 'anio') {
                const anioActual = new Date().getFullYear();
                if (!valoresUnicos.some(v => v.toString() === anioActual.toString())) {
                    valoresUnicos.push(anioActual);
                    valoresUnicos.sort((a, b) => a - b);
                }
            }

            select.innerHTML = `<option value="Todos">Todos</option>` + valoresUnicos.map(v => `<option value="${v}">${v}</option>`).join('');

            // Conservar la selección si sigue disponible (comparando como texto: el año
            // se almacena como número en los datos pero select.value siempre es string)
            if (valoresUnicos.some(v => v.toString() === valorActual.toString())) {
                select.value = valorActual;
            } else {
                select.value = "Todos";
            }
        }

        // Procesamiento e Interacción total
        function actualizarVisualizacion() {
            const selectAno = document.getElementById('select-ano');
            const selectMes = document.getElementById('select-mes');
            const selectSemana = document.getElementById('select-semana');
            const selectCliente = document.getElementById('select-cliente');
            const selectArticulo = document.getElementById('select-articulo');

            state.ano = selectAno ? selectAno.value : "Todos";
            state.mes = selectMes ? selectMes.value : "Todos";
            state.semana = selectSemana ? selectSemana.value : "Todos";
            state.cliente = selectCliente ? selectCliente.value : "Todos";
            state.articulo = selectArticulo ? selectArticulo.value : "Todos";

            // Cascada de "Todos": un filtro superior en "Todos" fuerza los inferiores a "Todos"
            if (state.ano === "Todos") {
                state.mes = "Todos";
                if (selectMes) selectMes.value = "Todos";
            }
            if (state.mes === "Todos") {
                state.semana = "Todos";
                if (selectSemana) selectSemana.value = "Todos";
            }

            // Cascada de filtros: actualiza las opciones disponibles de forma reactiva
            poblarSelector('select-ano', 'anio', 'ano');
            poblarSelector('select-mes', 'mes', 'mes');
            poblarSelector('select-semana', 'semana', 'semana');
            poblarSelector('select-cliente', 'cliente', 'cliente');
            poblarSelector('select-articulo', 'articulo', 'articulo');

            let dataset = [...activeData];

            if (state.ano !== "Todos") {
                dataset = dataset.filter(item => item.anio.toString() === state.ano);
            }
            if (state.mes !== "Todos") {
                dataset = dataset.filter(item => item.mes === state.mes);
            }
            if (state.semana !== "Todos" && state.verPor === "semana") {
                dataset = dataset.filter(item => item.semana === state.semana);
            }
            if (state.cliente !== "Todos") {
                dataset = dataset.filter(item => item.cliente === state.cliente);
            }
            if (state.articulo !== "Todos") {
                dataset = dataset.filter(item => item.articulo === state.articulo);
            }

            safeSetText('record-count', `${dataset.length} registros`);

            const dataBien = dataset.filter(item => item.tipo === "APROBADO" || item.tipo === "APROBADO C/TOLERANCIA");
            const dataAuto = dataset.filter(item => item.tipo === "APROBADO C/AUTORIZACION");

            const tblBien = document.getElementById('tbl-bien-primera-body');
            let sumaPartidasBien = 0;
            let sumaRechazosBien = 0;
            let sumaNetoBien = 0;

            if (tblBien) {
                tblBien.innerHTML = '';
                const agrupadoBien = agruparPorCliente(dataBien);
                Object.keys(agrupadoBien)
                    .sort((a, b) => agrupadoBien[b].partidas - agrupadoBien[a].partidas)
                    .forEach(cli => {
                    const item = agrupadoBien[cli];
                    const neto = item.partidas - item.rechazos;
                    
                    sumaPartidasBien += item.partidas;
                    sumaRechazosBien += item.rechazos;
                    sumaNetoBien += neto;

                    tblBien.innerHTML += `
                        <tr class="border-b border-slate-100 hover:bg-[#eef5e8]/20 transition-all-300">
                            <td class="py-2.5 px-3 text-slate-700 font-semibold">${cli}</td>
                            <td class="py-2.5 px-3 text-right text-slate-600">${item.partidas}</td>
                            <td class="py-2.5 px-3 text-right text-[#b65b5b] font-medium">${item.rechazos || '-'}</td>
                            <td class="py-2.5 px-3 text-right text-[#3f7550] font-extrabold bg-[#eef5e8]/10">${neto}</td>
                        </tr>
                    `;
                });
                tblBien.innerHTML += `
                    <tr class="bg-[#eef5e8] text-[#2f5a3c] font-extrabold border-t border-[#c7d9ad]">
                        <td class="py-2.5 px-3 rounded-l-xl">Total general</td>
                        <td class="py-2.5 px-3 text-right">${sumaPartidasBien}</td>
                        <td class="py-2.5 px-3 text-right text-[#8a2f2f]">${sumaRechazosBien}</td>
                        <td class="py-2.5 px-3 text-right bg-[#d9ead3]/60 rounded-r-xl">${sumaNetoBien}</td>
                    </tr>
                `;
            }

            const tblAuto = document.getElementById('tbl-autorizados-body');
            let sumaPartidasAuto = 0;
            let sumaRechazosAuto = 0;
            let sumaNetoAuto = 0;

            if (tblAuto) {
                tblAuto.innerHTML = '';
                const agrupadoAuto = agruparPorCliente(dataAuto);
                Object.keys(agrupadoAuto)
                    .sort((a, b) => agrupadoAuto[b].partidas - agrupadoAuto[a].partidas)
                    .forEach(cli => {
                    const item = agrupadoAuto[cli];
                    const neto = item.partidas - item.rechazos;

                    sumaPartidasAuto += item.partidas;
                    sumaRechazosAuto += item.rechazos;
                    sumaNetoAuto += neto;

                    tblAuto.innerHTML += `
                        <tr class="border-b border-slate-100 hover:bg-[#e3eef3]/20 transition-all-300">
                            <td class="py-2.5 px-3 text-slate-700 font-semibold">${cli}</td>
                            <td class="py-2.5 px-3 text-right text-slate-600">${item.partidas}</td>
                            <td class="py-2.5 px-3 text-right text-[#b65b5b] font-medium">${item.rechazos || '-'}</td>
                            <td class="py-2.5 px-3 text-right text-[#4c8ca8] font-extrabold bg-[#e3eef3]/10">${neto}</td>
                        </tr>
                    `;
                });
                tblAuto.innerHTML += `
                    <tr class="bg-[#e3eef3] text-[#2c6178] font-extrabold border-t border-[#a7cddd]">
                        <td class="py-2.5 px-3 rounded-l-xl">Total general</td>
                        <td class="py-2.5 px-3 text-right">${sumaPartidasAuto}</td>
                        <td class="py-2.5 px-3 text-right text-[#8a2f2f]">${sumaRechazosAuto}</td>
                        <td class="py-2.5 px-3 text-right bg-[#cfe3ec]/60 rounded-r-xl">${sumaNetoAuto}</td>
                    </tr>
                `;
            }

            safeSetText('kpi-neto-bien', sumaNetoBien);
            
            const partidasAprobadasTotales = sumaPartidasBien + sumaPartidasAuto;
            safeSetText('kpi-aprobadas-totales', partidasAprobadasTotales);

            const totalPartidasRegistradas = dataset.length;
            safeSetText('kpi-partidas-totales', totalPartidasRegistradas);

            // "Cantidad Rechazos" = partidas NO aprobadas (rechazadas totales): tienen
            // calidad_inicio pero sin tipo_aprobacion. Son disjuntas de las aprobadas,
            // por eso se cumple  Aprobadas + Rechazos = Volumen de Partidas.
            const totalRechazos = dataset.filter(item => item.tipo === "RECHAZADO").length;

            safeSetText('kpi-rechazos', totalRechazos);

            if (sumaPartidasBien > 0) {
                const pctB = Math.round((sumaNetoBien / sumaPartidasBien) * 100);
                safeSetText('pct-bien', `${pctB}%`);
            } else {
                safeSetText('pct-bien', "0%");
            }

            if (totalPartidasRegistradas > 0) {
                const pctR = Math.round((totalRechazos / totalPartidasRegistradas) * 100);
                safeSetText('pct-rechazos', `${pctR}%`);
            } else {
                safeSetText('pct-rechazos', "0%");
            }

            // Partidas Aprobadas: % sobre el total de partidas auditadas
            if (totalPartidasRegistradas > 0) {
                const pctA = Math.round((partidasAprobadasTotales / totalPartidasRegistradas) * 100);
                safeSetText('pct-aprobadas', `${pctA}%`);
            } else {
                safeSetText('pct-aprobadas', "0%");
            }
            // Total de partidas auditadas: es la base → siempre 100%
            safeSetText('pct-auditadas', "100%");

            // ── Suma de peso en crudo (kg) por tarjeta, sobre el mismo conjunto que el número ──
            const sumaPeso = (arr) => arr.reduce((acc, it) => acc + (it.peso || 0), 0);
            const fmtKg    = (kg) => `(${Math.round(kg).toLocaleString('es-PE')} kg)`;

            const kgNetoBien   = sumaPeso(dataBien.filter(it => !it.rechazos)); // bien a la 1ª "neto" (sin rechazo)
            const kgAprobadas  = sumaPeso(dataBien) + sumaPeso(dataAuto);
            const kgAuditadas  = sumaPeso(dataset);
            const kgRechazadas = sumaPeso(dataset.filter(it => it.tipo === "RECHAZADO"));

            safeSetText('kg-neto-bien', fmtKg(kgNetoBien));
            safeSetText('kg-aprobadas', fmtKg(kgAprobadas));
            safeSetText('kg-auditadas', fmtKg(kgAuditadas));
            safeSetText('kg-rechazos',  fmtKg(kgRechazadas));

            const agrupadoBien = agruparPorCliente(dataBien);
            const agrupadoAuto = agruparPorCliente(dataAuto);
            actualizarGraficosNetos(agrupadoBien, agrupadoAuto);
        }

        function agruparPorCliente(subdata) {
            const map = {};
            subdata.forEach(row => {
                if (!map[row.cliente]) {
                    map[row.cliente] = { partidas: 0, rechazos: 0 };
                }
                map[row.cliente].partidas += row.partidas;
                map[row.cliente].rechazos += row.rechazos;
            });
            return map;
        }

        function actualizarGraficosNetos(bienMap, autoMap) {
            const canvasEl = document.getElementById('chart-clientes-dinamico');
            if (!canvasEl) return;
            const ctx = canvasEl.getContext('2d');

            // Neto "Bien a la Primera" por cliente, usado para ordenar (mayor primero)
            const netoBienDe = (cli) => {
                const item = bienMap[cli];
                return item ? (item.partidas - item.rechazos) : 0;
            };
            const todosClientes = Array.from(new Set([
                ...Object.keys(bienMap),
                ...Object.keys(autoMap)
            ])).sort((a, b) => netoBienDe(b) - netoBienDe(a));

            const netosBien = todosClientes.map(cli => {
                const item = bienMap[cli];
                return item ? (item.partidas - item.rechazos) : 0;
            });

            const netosAuto = todosClientes.map(cli => {
                const item = autoMap[cli];
                return item ? (item.partidas - item.rechazos) : 0;
            });

            if (chartInstance) {
                chartInstance.destroy();
            }

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: todosClientes,
                    datasets: [
                        {
                            label: 'Bien a la Primera (Neto)',
                            data: netosBien,
                            backgroundColor: 'rgba(79, 143, 98, 0.85)',
                            borderColor: 'rgb(63, 117, 80)',
                            borderWidth: 1.5,
                            borderRadius: 6,
                            barPercentage: 0.65,
                            categoryPercentage: 0.55
                        },
                        {
                            label: 'Aprobado con Autorización (Neto)',
                            data: netosAuto,
                            backgroundColor: 'rgba(76, 140, 168, 0.85)',
                            borderColor: 'rgb(76, 140, 168)',
                            borderWidth: 1.5,
                            borderRadius: 6,
                            barPercentage: 0.65,
                            categoryPercentage: 0.55
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: { family: 'Arial', size: 11, weight: '600' },
                                color: '#2f3b2f',
                                boxWidth: 10,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: '#2f3b2f',
                            titleFont: { family: 'Arial', size: 12, weight: '700' },
                            bodyFont: { family: 'Arial', size: 12 },
                            padding: 10,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: '#667466',
                                font: { family: 'Arial', size: 10, weight: '600' }
                            }
                        },
                        y: {
                            grid: { color: '#e3ecd9' },
                            ticks: {
                                color: '#667466',
                                font: { family: 'Arial', size: 10 }
                            }
                        }
                    }
                }
            });
        }

        function mostrarAlerta(titulo, mensaje, tipo = "success") {
            const alertModal = document.getElementById('alert-modal');
            if (!alertModal) return;

            safeSetText('alert-title', titulo);
            safeSetText('alert-msg', mensaje);
            
            const iconContainer = document.getElementById('alert-icon-container');

            if (iconContainer) {
                if (tipo === "success") {
                    iconContainer.className = "mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#d9ead3] text-[#3f7550] mb-4";
                    iconContainer.innerHTML = `<i data-lucide="check" class="w-6 h-6"></i>`;
                } else {
                    iconContainer.className = "mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#f6e8e8] text-[#b65b5b] mb-4";
                    iconContainer.innerHTML = `<i data-lucide="alert-triangle" class="w-6 h-6"></i>`;
                }
            }
            if (window.lucide) lucide.createIcons();
            safeRemoveClass('alert-modal', 'hidden');
        }

        // Cerrar modal
        function cerrarAlerta() {
            safeAddClass('alert-modal', 'hidden');
        }

    // Exponer handlers usados por onclick inline del markup
    window.setVerPor = setVerPor;
    window.actualizarVisualizacion = actualizarVisualizacion;
    window.toggleSemanaAnterior = toggleSemanaAnterior;
    window.cargarDatosDesdeSheet = cargarDatosDesdeSheet;
    window.cerrarAlerta = cerrarAlerta;

    // Arranque: mostrar la UI de inmediato (KPIs con "–") sin bloquear con el overlay.
    // Los datos llegan del servidor y actualizan la vista en cuanto están disponibles.
    inicializarSelectoresFiltros();
    ocultarCargando();
    actualizarFrescura('loading');
    cargarDatosDesdeSheet(false);
})();
