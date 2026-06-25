// filters.js — Filter state, UI bindings, and render orchestration

let _codArtOptions = []; // [{cod, art}] built from allEvents after data loads

const IQ_STATE = {
    allRecords: [],
    allEvents:  [],        // expanded from allRecords via iqExpandToEvents
    mode: 'semana',        // 'semana' | 'mes'
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    week: null,            // ISO week number
    prevWeekActive: false,
    cliente: '',
    codArt: '',
    tipoTela: '',
    chartMode: 'freq',     // 'freq' | 'kg'
    paretoMode: 'freq',
    lastUpdated: null
};

// ── Week helpers ──────────────────────────────────────────────────────────────

function iqGetCurrentWeekInfo() {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        week: iqGetISOWeek(now)
    };
}

function iqGetPreviousWeekInfo() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        week: iqGetISOWeek(d)
    };
}

// ── Filtering ─────────────────────────────────────────────────────────────────
// Filters allEvents by the active period, client, and cod_art selectors.
// Uses event._refDate, which is the date of the specific inspection event
// (fecha_rechazo_N for rejections, calidad_fin for approvals).

// Devuelve true si el período seleccionado es la semana ISO actual.
function iqIsCurrentPeriod() {
    if (IQ_STATE.mode !== 'semana') return false;
    const curr = iqGetCurrentWeekInfo();
    return IQ_STATE.year === curr.year && IQ_STATE.week === curr.week;
}

function iqFilterEvents() {
    const currentPeriod = iqIsCurrentPeriod();

    return IQ_STATE.allEvents.filter(event => {
        // EN_EVALUACION en la semana actual: incluir todas las partidas en proceso
        // con la misma regla que "En calidad" del módulo principal (estado y acabado
        // especial ya se validan al expandir eventos), sin importar cuándo iniciaron
        // ni si ya registraron calidad_fin.
        if (currentPeriod && event._estado === 'EN_EVALUACION') {
            if (IQ_STATE.cliente   && String(event.cliente   || '').trim() !== IQ_STATE.cliente)   return false;
            if (IQ_STATE.codArt    && String(event.cod_art   || '').trim() !== IQ_STATE.codArt)    return false;
            if (IQ_STATE.tipoTela  && String(event.tipo_tela || '').trim() !== IQ_STATE.tipoTela)  return false;
            return true;
        }

        const refDate = event._refDate;
        if (!refDate) return false;

        if (refDate.getFullYear() !== IQ_STATE.year) return false;

        if (IQ_STATE.mode === 'semana') {
            if (IQ_STATE.week !== null && iqGetISOWeek(refDate) !== IQ_STATE.week) return false;
        } else {
            if (IQ_STATE.month !== null && refDate.getMonth() + 1 !== IQ_STATE.month) return false;
        }

        if (IQ_STATE.cliente   && String(event.cliente   || '').trim() !== IQ_STATE.cliente)   return false;
        if (IQ_STATE.codArt    && String(event.cod_art   || '').trim() !== IQ_STATE.codArt)    return false;
        if (IQ_STATE.tipoTela  && String(event.tipo_tela || '').trim() !== IQ_STATE.tipoTela)  return false;

        return true;
    });
}

// ── Populate selects ──────────────────────────────────────────────────────────

function iqPopulateYearOptions() {
    const sel = document.getElementById('filter-year');
    if (!sel) return;

    const years = new Set([new Date().getFullYear()]);
    IQ_STATE.allEvents.forEach(e => {
        if (e._refDate) years.add(e._refDate.getFullYear());
    });

    sel.innerHTML = [...years].sort((a, b) => b - a).map(y =>
        `<option value="${y}"${y === IQ_STATE.year ? ' selected' : ''}>${y}</option>`
    ).join('');
}

function iqPopulateMonthOptions() {
    const sel = document.getElementById('filter-month');
    if (!sel) return;

    const months = new Set([new Date().getMonth() + 1]);
    IQ_STATE.allEvents.forEach(e => {
        if (e._refDate && e._refDate.getFullYear() === IQ_STATE.year)
            months.add(e._refDate.getMonth() + 1);
    });

    sel.innerHTML = `<option value=""${IQ_STATE.month === null ? ' selected' : ''}>Todos</option>` +
        [...months].sort((a, b) => a - b).map(m =>
            `<option value="${m}"${m === IQ_STATE.month ? ' selected' : ''}>${MONTH_LABELS[m - 1]}</option>`
        ).join('');
}

function iqPopulateWeekOptions() {
    const sel = document.getElementById('filter-week');
    if (!sel) return;

    const weeks = new Set();
    const now = new Date();
    const nowInScope = now.getFullYear() === IQ_STATE.year &&
        (IQ_STATE.month === null || now.getMonth() + 1 === IQ_STATE.month);
    if (nowInScope) weeks.add(iqGetISOWeek(now));

    IQ_STATE.allEvents.forEach(e => {
        if (!e._refDate) return;
        if (e._refDate.getFullYear() !== IQ_STATE.year) return;
        if (IQ_STATE.month !== null && e._refDate.getMonth() + 1 !== IQ_STATE.month) return;
        weeks.add(iqGetISOWeek(e._refDate));
    });

    const sorted = [...weeks].sort((a, b) => a - b);

    sel.innerHTML = `<option value=""${IQ_STATE.week === null ? ' selected' : ''}>Todos</option>` +
        sorted.map(w =>
            `<option value="${w}"${w === IQ_STATE.week ? ' selected' : ''}>SEM ${w}</option>`
        ).join('');

    if (IQ_STATE.week !== null && !weeks.has(IQ_STATE.week) && sorted.length > 0) {
        IQ_STATE.week = sorted[sorted.length - 1];
        sel.value = IQ_STATE.week;
    }
}

function iqRefreshCodArtOptions() {
    const seen = new Map();
    IQ_STATE.allEvents.forEach(e => {
        const cod = String(e.cod_art  || '').trim();
        const art = String(e.articulo || '').trim();
        if (cod && !seen.has(cod)) seen.set(cod, art);
    });
    _codArtOptions = [...seen.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([cod, art]) => ({ cod, art }));
}

function iqInitCodArtCombo() {
    const input    = document.getElementById('filter-cod-art-input');
    const dropdown = document.getElementById('cod-art-dropdown');
    const clearBtn = document.getElementById('cod-art-clear');
    if (!input || !dropdown || !clearBtn) return;

    let activeIdx = -1;

    function getItems() { return [...dropdown.querySelectorAll('.cod-art-option')]; }

    function renderDropdown(opts) {
        activeIdx = -1;
        if (!opts.length) {
            dropdown.innerHTML = '<div class="cod-art-no-results">Sin resultados</div>';
        } else {
            dropdown.innerHTML = opts.map(o =>
                `<div class="cod-art-option" data-cod="${iqEscapeHtml(o.cod)}">` +
                `<span class="cao-cod">${iqEscapeHtml(o.cod)}</span>` +
                (o.art ? `<span class="cao-art">${iqEscapeHtml(o.art)}</span>` : '') +
                `</div>`
            ).join('');
            dropdown.querySelectorAll('.cod-art-option').forEach(el => {
                el.addEventListener('mousedown', ev => { ev.preventDefault(); pick(el.dataset.cod); });
            });
        }
        dropdown.classList.remove('hidden');
    }

    function filterAndRender() {
        // Contar rechazos por cod_art según el contexto actual (sin aplicar filtro de cod_art)
        const rejectCount = new Map();
        IQ_STATE.allEvents.forEach(e => {
            if (e._estado !== 'RECHAZADO') return;
            const refDate = e._refDate;
            if (!refDate) return;
            if (refDate.getFullYear() !== IQ_STATE.year) return;
            if (IQ_STATE.mode === 'semana') {
                if (IQ_STATE.week !== null && iqGetISOWeek(refDate) !== IQ_STATE.week) return;
            } else {
                if (IQ_STATE.month !== null && refDate.getMonth() + 1 !== IQ_STATE.month) return;
            }
            if (IQ_STATE.cliente && String(e.cliente || '').trim() !== IQ_STATE.cliente) return;
            const cod = String(e.cod_art || '').trim();
            if (cod) rejectCount.set(cod, (rejectCount.get(cod) || 0) + 1);
        });

        const sorted = [..._codArtOptions].sort((a, b) => {
            const diff = (rejectCount.get(b.cod) || 0) - (rejectCount.get(a.cod) || 0);
            return diff !== 0 ? diff : a.cod.localeCompare(b.cod);
        });

        const q = input.value.trim().toLowerCase();
        const matches = q
            ? sorted.filter(o =>
                o.cod.toLowerCase().includes(q) || o.art.toLowerCase().includes(q))
            : sorted;
        renderDropdown(matches.slice(0, 80));
    }

    function pick(cod) {
        const opt = _codArtOptions.find(o => o.cod === cod);
        IQ_STATE.codArt = cod;
        input.value = (opt && opt.art) ? `${cod} — ${opt.art}` : cod;
        clearBtn.classList.remove('hidden');
        dropdown.classList.add('hidden');
        iqRenderAll();
    }

    function clear() {
        IQ_STATE.codArt = '';
        input.value = '';
        clearBtn.classList.add('hidden');
        dropdown.classList.add('hidden');
        iqRenderAll();
    }

    input.addEventListener('focus', () => {
        if (IQ_STATE.codArt) input.select();
        filterAndRender();
    });

    input.addEventListener('input', () => {
        if (IQ_STATE.codArt) {
            IQ_STATE.codArt = '';
            clearBtn.classList.add('hidden');
            iqRenderAll();
        }
        filterAndRender();
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            dropdown.classList.add('hidden');
            if (!IQ_STATE.codArt) input.value = '';
        }, 180);
    });

    input.addEventListener('keydown', e => {
        const items = getItems();
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIdx = Math.min(activeIdx + 1, items.length - 1);
            items.forEach((el, i) => el.classList.toggle('cao-active', i === activeIdx));
            items[activeIdx]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIdx = Math.max(activeIdx - 1, -1);
            items.forEach((el, i) => el.classList.toggle('cao-active', i === activeIdx));
            if (activeIdx >= 0) items[activeIdx]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIdx >= 0 && items[activeIdx]) pick(items[activeIdx].dataset.cod);
        } else if (e.key === 'Escape') {
            dropdown.classList.add('hidden');
            if (!IQ_STATE.codArt) input.value = '';
        }
    });

    clearBtn.addEventListener('click', clear);
}

function iqPopulateClienteOptions() {
    const sel = document.getElementById('filter-cliente');
    if (!sel) return;

    const clientes = new Set(
        IQ_STATE.allEvents
            .map(e => String(e.cliente || '').trim())
            .filter(Boolean)
    );

    sel.innerHTML = '<option value="">Todos</option>' +
        [...clientes].sort().map(c =>
            `<option value="${c}"${c === IQ_STATE.cliente ? ' selected' : ''}>${iqEscapeHtml(c)}</option>`
        ).join('');
}

function iqPopulateTipoTelaOptions() {
    const sel = document.getElementById('filter-tipo-tela');
    if (!sel) return;

    // Solo los códigos presentes en los eventos del período actual
    const filtered = iqFilterEvents();
    const codes = new Set(
        filtered.map(e => String(e.tipo_tela || '').trim()).filter(Boolean)
    );

    sel.innerHTML = '<option value="">Todos</option>' +
        [...codes].sort().map(code => {
            const raw   = String(code || '').trim();
            const num   = raw.includes('→') ? raw.split('→')[0].trim() : raw;
            const label = iqGetTipoTelaLabel(raw);
            const display = `${num} → ${label}`;
            return `<option value="${raw}"${raw === IQ_STATE.tipoTela ? ' selected' : ''}>${iqEscapeHtml(display)}</option>`;
        }).join('');
}

// ── Mode switch ───────────────────────────────────────────────────────────────

function iqSetMode(mode) {
    IQ_STATE.mode = mode;

    const weekGroup = document.getElementById('filter-week-group');
    const prevGroup = document.getElementById('filter-prev-week-group');

    document.querySelectorAll('[data-mode]').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.mode === mode)
    );

    if (mode === 'semana') {
        weekGroup && weekGroup.classList.remove('hidden');
        prevGroup && prevGroup.classList.remove('hidden');
        iqPopulateWeekOptions();
    } else {
        weekGroup && weekGroup.classList.add('hidden');
        prevGroup && prevGroup.classList.add('hidden');
        IQ_STATE.prevWeekActive = false;
        const toggle = document.getElementById('toggle-prev-week');
        if (toggle) toggle.checked = false;
    }
}

// ── Status bar ────────────────────────────────────────────────────────────────

function iqUpdateStatus(text, type) {
    const el = document.getElementById('data-status');
    if (!el) return;
    el.textContent = text;
    el.className = 'data-status' + (type ? ` ${type}` : '');
}

function iqShowLoading(show) {
    const el = document.getElementById('loading-overlay');
    if (el) el.classList.toggle('hidden', !show);
}

// ── Render all ────────────────────────────────────────────────────────────────

function iqRenderAll() {
    const filtered = iqFilterEvents();
    iqRenderKPIs(filtered);
    iqRenderMatrix(filtered);
    iqRenderTopMotivos(filtered, IQ_STATE.chartMode);
    iqRenderAuditorTable(filtered);
    iqRenderQuienAproboTable(filtered);
    iqPopulateTipoTelaOptions();
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function iqLoadData(forceRefresh) {
    iqShowLoading(true);

    try {
        let records = forceRefresh ? null : iqLoadFromLocalStorage();

        if (!records) {
            iqUpdateStatus('Conectando al servidor…', '');
            records = await iqLoadFromAPI();
            IQ_STATE.lastUpdated = new Date();
        } else if (!IQ_STATE.lastUpdated) {
            IQ_STATE.lastUpdated = new Date();
        }

        IQ_STATE.allRecords = records;
        IQ_STATE.allEvents  = iqExpandToEvents(records);

        iqPopulateYearOptions();
        iqPopulateMonthOptions();
        if (IQ_STATE.mode === 'semana') iqPopulateWeekOptions();
        iqPopulateClienteOptions();
        iqRefreshCodArtOptions();

        const uniquePartidas = new Set(IQ_STATE.allEvents.map(e => iqGetOpPtdaKey(e)).filter(Boolean)).size;
        iqUpdateStatus(
            `${uniquePartidas} partidas auditadas · Datos al ${iqFormatDateTime(IQ_STATE.lastUpdated)}`,
            'connected'
        );

        iqRenderAll();
    } catch (error) {
        console.error('Error loading data:', error);

        // Fallback to localStorage
        const cached = iqLoadFromLocalStorage();
        if (cached && cached.length > 0) {
            IQ_STATE.allRecords = cached;
            IQ_STATE.allEvents  = iqExpandToEvents(cached);
            if (!IQ_STATE.lastUpdated) IQ_STATE.lastUpdated = new Date();
            iqPopulateYearOptions();
            iqPopulateMonthOptions();
            if (IQ_STATE.mode === 'semana') iqPopulateWeekOptions();
            iqPopulateClienteOptions();
            iqRefreshCodArtOptions();
            iqRenderAll();
            iqUpdateStatus('Datos en caché local · Sin conexión al servidor', 'error');
        } else {
            iqUpdateStatus('Sin datos disponibles · ' + (error.message || 'Error de conexión'), 'error');
            iqRenderAll(); // render empty state
        }
    } finally {
        iqShowLoading(false);
    }
}

// ── Event bindings ────────────────────────────────────────────────────────────

function iqInitFilters() {
    // Set initial state to current week
    const curr = iqGetCurrentWeekInfo();
    IQ_STATE.year = curr.year;
    IQ_STATE.month = curr.month;
    IQ_STATE.week = curr.week;

    // Mode toggle (SEMANA / MES)
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (IQ_STATE.mode === btn.dataset.mode) return;
            IQ_STATE.mode = btn.dataset.mode;
            iqSetMode(IQ_STATE.mode);
            iqRenderAll();
        });
    });

    // Year
    document.getElementById('filter-year')?.addEventListener('change', e => {
        IQ_STATE.year = parseInt(e.target.value, 10);
        iqPopulateMonthOptions();
        if (IQ_STATE.mode === 'semana') iqPopulateWeekOptions();
        iqRenderAll();
    });

    // Month
    document.getElementById('filter-month')?.addEventListener('change', e => {
        IQ_STATE.month = e.target.value ? parseInt(e.target.value, 10) : null;
        if (IQ_STATE.month === null) {
            // Mes=Todos → Semana forzada a Todos
            IQ_STATE.week = null;
            const weekSel = document.getElementById('filter-week');
            if (weekSel) weekSel.value = '';
        }
        if (IQ_STATE.mode === 'semana') iqPopulateWeekOptions();
        iqRenderAll();
    });

    // Week
    document.getElementById('filter-week')?.addEventListener('change', e => {
        IQ_STATE.week = e.target.value ? parseInt(e.target.value, 10) : null;
        IQ_STATE.prevWeekActive = false;
        const toggle = document.getElementById('toggle-prev-week');
        if (toggle) toggle.checked = false;
        iqRenderAll();
    });

    // Semana anterior toggle
    document.getElementById('toggle-prev-week')?.addEventListener('change', e => {
        IQ_STATE.prevWeekActive = e.target.checked;

        const target = e.target.checked ? iqGetPreviousWeekInfo() : iqGetCurrentWeekInfo();
        IQ_STATE.year = target.year;
        IQ_STATE.month = target.month;
        IQ_STATE.week = target.week;

        const yearSel = document.getElementById('filter-year');
        if (yearSel) yearSel.value = target.year;
        iqPopulateMonthOptions();
        const monthSel = document.getElementById('filter-month');
        if (monthSel) monthSel.value = target.month;
        iqPopulateWeekOptions();
        const weekSel = document.getElementById('filter-week');
        if (weekSel) weekSel.value = target.week;

        iqRenderAll();
    });

    // Client
    document.getElementById('filter-cliente')?.addEventListener('change', e => {
        IQ_STATE.cliente = e.target.value;
        iqRenderAll();
    });

    // Tipo Tela
    document.getElementById('filter-tipo-tela')?.addEventListener('change', e => {
        IQ_STATE.tipoTela = e.target.value;
        iqRenderAll();
    });

    // Cod. Art. combobox
    iqInitCodArtCombo();

    // Chart mode toggle (Frecuencia / Peso)
    document.querySelectorAll('[data-chart-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            IQ_STATE.chartMode = btn.dataset.chartMode;
            document.querySelectorAll('[data-chart-mode]').forEach(b =>
                b.classList.toggle('active', b.dataset.chartMode === IQ_STATE.chartMode)
            );
            iqRenderTopMotivos(iqFilterEvents(), IQ_STATE.chartMode);
        });
    });

    // Refresh button
    document.getElementById('btn-refresh')?.addEventListener('click', () => iqLoadData(true));

    // Print button
    document.getElementById('btn-print')?.addEventListener('click', () => window.print());

    // Pareto button
    document.getElementById('btn-pareto')?.addEventListener('click', () =>
        iqOpenParetoModal(iqFilterEvents(), IQ_STATE.paretoMode)
    );

    // Pareto close
    document.getElementById('pareto-close')?.addEventListener('click', iqCloseParetoModal);
    document.getElementById('pareto-modal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('pareto-modal')) iqCloseParetoModal();
    });

    // Partidas modal
    document.getElementById('kpi-card-auditadas')?.addEventListener('click', () => {
        document.getElementById('partidas-modal')?.classList.remove('hidden');
    });
    document.getElementById('partidas-close')?.addEventListener('click', () => {
        document.getElementById('partidas-modal')?.classList.add('hidden');
    });
    document.getElementById('partidas-modal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('partidas-modal'))
            document.getElementById('partidas-modal').classList.add('hidden');
    });

    // Pareto mode toggle
    document.querySelectorAll('[data-pareto-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            IQ_STATE.paretoMode = btn.dataset.paretoMode;
            document.querySelectorAll('[data-pareto-mode]').forEach(b =>
                b.classList.toggle('active', b.dataset.paretoMode === IQ_STATE.paretoMode)
            );
            iqRenderParetoChart(iqFilterEvents(), IQ_STATE.paretoMode);
        });
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            iqCloseParetoModal();
            document.getElementById('partidas-modal')?.classList.add('hidden');
        }
    });

    iqInitBarTooltip();
}

// ── Period comparison helpers ─────────────────────────────────────────────────

function iqFilterEventsForPeriod(year, month, week, mode, cliente, codArt) {
    return IQ_STATE.allEvents.filter(event => {
        const refDate = event._refDate;
        if (!refDate) return false;
        if (refDate.getFullYear() !== year) return false;
        if (mode === 'semana') {
            if (week !== null && iqGetISOWeek(refDate) !== week) return false;
        } else {
            if (month !== null && refDate.getMonth() + 1 !== month) return false;
        }
        if (cliente && String(event.cliente || '').trim() !== cliente) return false;
        if (codArt  && String(event.cod_art  || '').trim() !== codArt)  return false;
        return true;
    });
}

function iqGetPreviousPeriodEvents() {
    if (IQ_STATE.mode === 'semana') {
        if (IQ_STATE.week === null) return [];
        let prevYear = IQ_STATE.year;
        let prevWeek = IQ_STATE.week - 1;
        if (prevWeek < 1) {
            prevYear--;
            prevWeek = iqGetISOWeek(new Date(prevYear, 11, 28)); // 28-dic siempre en última semana ISO
        }
        return iqFilterEventsForPeriod(prevYear, null, prevWeek, 'semana', IQ_STATE.cliente, IQ_STATE.codArt);
    } else {
        if (IQ_STATE.month === null) return [];
        let prevYear = IQ_STATE.year;
        let prevMonth = IQ_STATE.month - 1;
        if (prevMonth < 1) { prevMonth = 12; prevYear--; }
        return iqFilterEventsForPeriod(prevYear, prevMonth, null, 'mes', IQ_STATE.cliente, IQ_STATE.codArt);
    }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
// Integrado en la app principal, estos scripts se cargan dinámicamente (después
// de DOMContentLoaded), por lo que se arranca de inmediato si el DOM ya está listo.

function iqBootstrap() {
    iqInitFilters();
    iqSetMode('semana');
    iqLoadData(false);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iqBootstrap);
} else {
    iqBootstrap();
}
