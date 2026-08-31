// filters.js — Filter state, UI bindings, and render orchestration

let _codArtOptions = []; // [{cod, art}] built from allEvents after data loads
let _codArtSet     = new Set(); // espejo de IQ_STATE.codArts para búsquedas O(1)

const IQ_STATE = {
    allRecords: [],
    allEvents:  [],        // expanded from allRecords via iqExpandToEvents
    mode: 'semana',        // 'semana' | 'mes'
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    week: null,            // ISO week number
    prevWeekActive: false,
    cliente: '',
    codArts: [],           // [] = todos; si no, lista de códigos seleccionados
    tipoTela: '',
    chartMode: 'freq',     // 'freq' | 'kg'
    paretoMode: 'freq',
    lastUpdated: null
};

// ── Cod. Art. (multiselección) ────────────────────────────────────────────────

// Sin selección = "Todos". Con selección, el evento pasa si su cod_art está en
// la lista. _codArtSet mantiene la búsqueda en O(1) al filtrar miles de eventos.
function iqCodArtAllows(value) {
    if (_codArtSet.size === 0) return true;
    return _codArtSet.has(String(value || '').trim());
}

function iqSetCodArtSelection(codes) {
    const clean = [...new Set((codes || []).map(c => String(c || '').trim()).filter(Boolean))];
    IQ_STATE.codArts = clean;
    _codArtSet = new Set(clean);
}

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
            if (!iqCodArtAllows(event.cod_art))                                                    return false;
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
        if (!iqCodArtAllows(event.cod_art))                                                    return false;
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

    // Tras recargar datos puede desaparecer un código ya seleccionado: se descarta
    // para que el filtro nunca deje la vista vacía sin explicación.
    if (_codArtSet.size) iqSetCodArtSelection(IQ_STATE.codArts.filter(c => seen.has(c)));

    iqUpdateCodArtTrigger();
}

// Texto en minúsculas y sin acentos, para que "algodon" encuentre "ALGODÓN".
function iqNormText(str) {
    return String(str == null ? '' : str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function iqCodArtLabel(cod) {
    const opt = _codArtOptions.find(o => o.cod === cod);
    return opt && opt.art ? `${cod} — ${opt.art}` : cod;
}

// Refleja la selección en el botón del filtro (texto, tooltip, botón limpiar).
function iqUpdateCodArtTrigger() {
    const trigger  = document.getElementById('cod-art-trigger');
    const textEl   = document.getElementById('cod-art-trigger-text');
    const caret    = document.getElementById('cod-art-caret');
    const clearBtn = document.getElementById('cod-art-clear');
    if (!trigger || !textEl) return;

    const sel = IQ_STATE.codArts;
    if (sel.length === 0) {
        textEl.textContent = 'Todos';
        trigger.title = 'Seleccionar uno o varios códigos de artículo';
    } else if (sel.length === 1) {
        textEl.textContent = iqCodArtLabel(sel[0]);
        trigger.title = iqCodArtLabel(sel[0]);
    } else {
        textEl.textContent = `${sel.length} códigos`;
        trigger.title = sel.map(iqCodArtLabel).join('\n');
    }

    trigger.classList.toggle('has-selection', sel.length > 0);
    caret    && caret.classList.toggle('hidden', sel.length > 0);
    clearBtn && clearBtn.classList.toggle('hidden', sel.length === 0);
}

// Filtro de Cod. Art. con multiselección tipo Excel: buscador, casillas,
// "(Seleccionar todo)" sobre los resultados visibles, rango con Shift y
// confirmación con Aceptar / Cancelar.
function iqInitCodArtCombo() {
    const combo     = document.getElementById('cod-art-combo');
    const trigger   = document.getElementById('cod-art-trigger');
    const clearBtn  = document.getElementById('cod-art-clear');
    const dropdown  = document.getElementById('cod-art-dropdown');
    const search    = document.getElementById('cod-art-search');
    const searchX   = document.getElementById('cod-art-search-clear');
    const selAll    = document.getElementById('cod-art-select-all');
    const selAllLbl = document.getElementById('cod-art-select-all-label');
    const listEl    = document.getElementById('cod-art-list');
    const countEl   = document.getElementById('cod-art-count');
    const btnReset  = document.getElementById('cod-art-reset');
    const btnCancel = document.getElementById('cod-art-cancel');
    const btnApply  = document.getElementById('cod-art-apply');
    if (!combo || !trigger || !dropdown || !listEl || !search) return;

    let isOpen    = false;
    let pending   = new Set(); // selección en edición; se confirma con Aceptar
    let ordered   = [];        // orden congelado mientras el panel está abierto
    let visible   = [];        // subconjunto que pasa el buscador
    let stats     = new Map(); // cod → { total, rech } en el contexto actual
    let activeIdx = -1;        // fila resaltada por teclado
    let anchorIdx = -1;        // ancla para la selección de rango con Shift

    // ── Conteos de apoyo ──────────────────────────────────────────────────────
    // Inspecciones y rechazos por código en el período/cliente/tipo de tela
    // activos, ignorando el propio filtro de Cod. Art. para que el usuario vea
    // el impacto real de cada opción antes de marcarla.
    function computeStats() {
        const map = new Map();
        const currentPeriod = iqIsCurrentPeriod();

        IQ_STATE.allEvents.forEach(e => {
            const cod = String(e.cod_art || '').trim();
            if (!cod) return;
            if (IQ_STATE.cliente  && String(e.cliente   || '').trim() !== IQ_STATE.cliente)  return;
            if (IQ_STATE.tipoTela && String(e.tipo_tela || '').trim() !== IQ_STATE.tipoTela) return;

            // Misma excepción que iqFilterEvents: en la semana actual las
            // partidas en evaluación entran sin importar su fecha de referencia.
            if (!(currentPeriod && e._estado === 'EN_EVALUACION')) {
                const d = e._refDate;
                if (!d) return;
                if (d.getFullYear() !== IQ_STATE.year) return;
                if (IQ_STATE.mode === 'semana') {
                    if (IQ_STATE.week !== null && iqGetISOWeek(d) !== IQ_STATE.week) return;
                } else {
                    if (IQ_STATE.month !== null && d.getMonth() + 1 !== IQ_STATE.month) return;
                }
            }

            const row = map.get(cod) || { total: 0, rech: 0 };
            row.total++;
            if (e._estado === 'RECHAZADO') row.rech++;
            map.set(cod, row);
        });

        return map;
    }

    // Orden fijado al abrir (no se reordena al marcar): primero lo ya
    // seleccionado, luego lo que más rechazos aporta en el período.
    function freezeOrder() {
        ordered = [..._codArtOptions].sort((a, b) => {
            const selA = pending.has(a.cod) ? 0 : 1;
            const selB = pending.has(b.cod) ? 0 : 1;
            if (selA !== selB) return selA - selB;
            const sa = stats.get(a.cod) || { total: 0, rech: 0 };
            const sb = stats.get(b.cod) || { total: 0, rech: 0 };
            if (sb.rech  !== sa.rech)  return sb.rech  - sa.rech;
            if (sb.total !== sa.total) return sb.total - sa.total;
            return a.cod.localeCompare(b.cod);
        });
    }

    // ── Buscador ──────────────────────────────────────────────────────────────
    // Coma, punto y coma, barra o salto de línea ⇒ lista pegada desde Excel: se
    // muestran los códigos que coincidan con CUALQUIER término. Espacios ⇒ deben
    // coincidir TODOS los términos.
    function buildMatcher(query) {
        const q = String(query || '').trim();
        if (!q) return null;

        const isList = /[,;\n|]/.test(q);
        const terms = q.split(isList ? /[,;\n|]+/ : /\s+/)
            .map(t => iqNormText(t).trim())
            .filter(Boolean);
        if (!terms.length) return null;

        return o => {
            const hay = iqNormText(o.cod + ' ' + o.art);
            return isList ? terms.some(t => hay.includes(t)) : terms.every(t => hay.includes(t));
        };
    }

    // ── Pintado ───────────────────────────────────────────────────────────────
    function renderList() {
        const test = buildMatcher(search.value);
        visible   = test ? ordered.filter(test) : ordered;
        activeIdx = -1;
        anchorIdx = -1;

        if (!visible.length) {
            listEl.innerHTML = '<div class="cad-empty">Sin resultados</div>';
        } else {
            listEl.innerHTML = visible.map((o, i) => {
                const st = stats.get(o.cod) || { total: 0, rech: 0 };
                const on = pending.has(o.cod);
                return `<div class="cad-row${on ? ' cad-on' : ''}" role="option"` +
                       ` aria-selected="${on}" data-i="${i}" data-cod="${iqEscapeHtml(o.cod)}">` +
                           `<span class="cad-check" aria-hidden="true"></span>` +
                           `<span class="cad-labels">` +
                               `<span class="cad-cod">${iqEscapeHtml(o.cod)}</span>` +
                               (o.art ? `<span class="cad-art">${iqEscapeHtml(o.art)}</span>` : '') +
                           `</span>` +
                           `<span class="cad-stats">` +
                               (st.rech
                                   ? `<span class="cad-badge cad-badge-rej" title="${st.rech} rechazo(s) en el período">${st.rech}</span>`
                                   : '') +
                               (st.total
                                   ? `<span class="cad-badge" title="${st.total} inspección(es) en el período">${st.total}</span>`
                                   : `<span class="cad-badge cad-badge-none" title="Sin movimientos en el período">–</span>`) +
                           `</span>` +
                           `<button type="button" class="cad-only" tabindex="-1"` +
                           ` data-only="${iqEscapeHtml(o.cod)}" title="Filtrar solo por este código">solo</button>` +
                       `</div>`;
            }).join('');
        }

        syncHeader();
    }

    // Marca/desmarca una fila sin repintar la lista completa.
    function setRowState(cod, on) {
        const sel = (window.CSS && CSS.escape) ? CSS.escape(cod) : cod;
        const row = listEl.querySelector(`.cad-row[data-cod="${sel}"]`);
        if (!row) return;
        row.classList.toggle('cad-on', on);
        row.setAttribute('aria-selected', String(on));
    }

    function syncHeader() {
        const shown  = visible.length;
        const marked = visible.reduce((n, o) => n + (pending.has(o.cod) ? 1 : 0), 0);

        if (selAll) {
            selAll.checked       = shown > 0 && marked === shown;
            selAll.indeterminate = marked > 0 && marked < shown;
            selAll.disabled      = shown === 0;
        }
        if (selAllLbl) {
            selAllLbl.textContent = search.value.trim()
                ? `(Seleccionar ${shown} resultado${shown === 1 ? '' : 's'})`
                : '(Seleccionar todo)';
        }
        if (countEl) {
            countEl.textContent = pending.size
                ? `${pending.size} de ${_codArtOptions.length} seleccionados`
                : `Todos (${_codArtOptions.length})`;
        }
        if (btnApply) btnApply.textContent = pending.size ? `Aceptar (${pending.size})` : 'Aceptar';
    }

    function toggle(cod) {
        if (pending.has(cod)) pending.delete(cod); else pending.add(cod);
        setRowState(cod, pending.has(cod));
        syncHeader();
    }

    function setActive(idx) {
        const rows = listEl.querySelectorAll('.cad-row');
        if (!rows.length) { activeIdx = -1; return; }
        activeIdx = Math.max(0, Math.min(idx, rows.length - 1));
        rows.forEach((el, i) => el.classList.toggle('cad-active', i === activeIdx));
        rows[activeIdx].scrollIntoView({ block: 'nearest' });
    }

    // ── Apertura / cierre ─────────────────────────────────────────────────────
    // El panel se ancla en coordenadas de viewport (position:fixed) para que no
    // lo recorte el modal de Pareto, que tiene overflow-y:auto y recibe esta
    // misma barra de filtros mientras está abierto.
    function place() {
        const r      = trigger.getBoundingClientRect();
        const margin = 8;
        const width  = Math.max(r.width, 340);
        dropdown.style.width = width + 'px';

        let left = r.left;
        if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
        dropdown.style.left = Math.max(margin, left) + 'px';

        const below  = window.innerHeight - r.bottom - margin;
        const above  = r.top - margin;
        const flipUp = below < 260 && above > below;

        dropdown.style.maxHeight = Math.min(520, Math.max(200, flipUp ? above : below)) + 'px';
        if (flipUp) {
            dropdown.style.top    = 'auto';
            dropdown.style.bottom = (window.innerHeight - r.top + 4) + 'px';
        } else {
            dropdown.style.bottom = 'auto';
            dropdown.style.top    = (r.bottom + 4) + 'px';
        }
    }

    function onScrollReposition(ev) {
        if (ev.target && ev.target.nodeType === 1 && dropdown.contains(ev.target)) return;
        place();
    }

    function onDocPointerDown(ev) {
        if (combo.contains(ev.target) || dropdown.contains(ev.target)) return;
        commit(true); // clic fuera = aceptar lo marcado (Cancelar o Esc descarta)
    }

    function openPanel() {
        if (isOpen) return;
        isOpen  = true;
        pending = new Set(IQ_STATE.codArts);
        stats   = computeStats();
        freezeOrder();

        search.value = '';
        searchX && searchX.classList.add('hidden');
        dropdown.classList.remove('hidden');
        combo.classList.add('cad-open');
        trigger.setAttribute('aria-expanded', 'true');

        renderList();
        place();
        listEl.scrollTop = 0;
        search.focus();

        document.addEventListener('mousedown', onDocPointerDown, true);
        window.addEventListener('resize', place);
        window.addEventListener('scroll', onScrollReposition, true);
    }

    function closePanel() {
        if (!isOpen) return;
        isOpen = false;
        dropdown.classList.add('hidden');
        combo.classList.remove('cad-open');
        trigger.setAttribute('aria-expanded', 'false');

        document.removeEventListener('mousedown', onDocPointerDown, true);
        window.removeEventListener('resize', place);
        window.removeEventListener('scroll', onScrollReposition, true);
    }

    // Confirma la selección; sólo repinta el tablero si algo cambió realmente.
    function commit(deferRender) {
        const before = [...IQ_STATE.codArts].sort().join('|');
        const after  = [...pending].sort().join('|');

        iqSetCodArtSelection([...pending]);
        iqUpdateCodArtTrigger();
        closePanel();
        if (before === after) return;

        if (deferRender) setTimeout(iqRenderAll, 0);
        else iqRenderAll();
    }

    function clearFilter() {
        closePanel();
        if (!IQ_STATE.codArts.length) return;
        iqSetCodArtSelection([]);
        iqUpdateCodArtTrigger();
        iqRenderAll();
    }

    // ── Eventos ───────────────────────────────────────────────────────────────
    trigger.addEventListener('click', () => { isOpen ? commit() : openPanel(); });
    trigger.addEventListener('keydown', ev => {
        if (ev.key === 'ArrowDown') { ev.preventDefault(); openPanel(); }
    });

    clearBtn  && clearBtn.addEventListener('click', ev => { ev.stopPropagation(); clearFilter(); });
    btnReset  && btnReset.addEventListener('click', clearFilter);
    btnCancel && btnCancel.addEventListener('click', closePanel);
    btnApply  && btnApply.addEventListener('click', () => commit());

    search.addEventListener('input', () => {
        searchX && searchX.classList.toggle('hidden', !search.value);
        renderList();
        listEl.scrollTop = 0;
    });

    searchX && searchX.addEventListener('click', () => {
        search.value = '';
        searchX.classList.add('hidden');
        renderList();
        listEl.scrollTop = 0;
        search.focus();
    });

    selAll && selAll.addEventListener('change', () => {
        const on = selAll.checked;
        visible.forEach(o => {
            if (on) pending.add(o.cod); else pending.delete(o.cod);
            setRowState(o.cod, on);
        });
        syncHeader();
    });

    // El foco se queda en el buscador para poder seguir escribiendo tras marcar.
    // Sólo sobre las filas: si no, se rompe el arrastre de la barra de scroll.
    listEl.addEventListener('mousedown', ev => {
        if (ev.target.closest('.cad-row')) ev.preventDefault();
    });

    listEl.addEventListener('click', ev => {
        const only = ev.target.closest('.cad-only');
        if (only) {
            pending = new Set([only.dataset.only]);
            commit();
            return;
        }

        const row = ev.target.closest('.cad-row');
        if (!row) return;
        const idx = Number(row.dataset.i);

        // Shift + clic marca (o desmarca) todo el rango desde la última fila
        // tocada, igual que en una hoja de cálculo.
        if (ev.shiftKey && anchorIdx >= 0 && anchorIdx < visible.length) {
            const on   = !pending.has(row.dataset.cod);
            const from = Math.min(anchorIdx, idx);
            const to   = Math.max(anchorIdx, idx);
            for (let i = from; i <= to; i++) {
                if (on) pending.add(visible[i].cod); else pending.delete(visible[i].cod);
                setRowState(visible[i].cod, on);
            }
            syncHeader();
        } else {
            toggle(row.dataset.cod);
        }

        anchorIdx = idx;
        setActive(idx);
    });

    dropdown.addEventListener('keydown', ev => {
        if (ev.key === 'ArrowDown') {
            ev.preventDefault();
            setActive(activeIdx + 1);
        } else if (ev.key === 'ArrowUp') {
            ev.preventDefault();
            setActive(activeIdx - 1);
        } else if (ev.key === ' ' && activeIdx >= 0 && visible[activeIdx]) {
            ev.preventDefault();
            toggle(visible[activeIdx].cod);
            anchorIdx = activeIdx;
        } else if (ev.key === 'Enter') {
            ev.preventDefault();
            // Enter marca la fila resaltada (o el primer resultado de la
            // búsqueda) y aplica; sin nada resaltado sólo aplica lo marcado.
            const idx = activeIdx >= 0 ? activeIdx : (search.value.trim() && visible.length ? 0 : -1);
            if (idx >= 0 && visible[idx] && !pending.has(visible[idx].cod)) toggle(visible[idx].cod);
            commit();
        } else if (ev.key === 'Escape') {
            ev.preventDefault();
            ev.stopPropagation(); // no cerrar además el modal de Pareto
            closePanel();
            trigger.focus();
        }
    });

    iqUpdateCodArtTrigger();
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
    iqRenderRechazosArticulo(filtered, IQ_STATE.chartMode);
    iqRenderAuditorTable(filtered);
    iqRenderQuienAproboTable(filtered);
    iqPopulateTipoTelaOptions();

    // Si el modal de Pareto está abierto, mantener su gráfica sincronizada con
    // los mismos datos filtrados de la página principal.
    const paretoModal = document.getElementById('pareto-modal');
    if (paretoModal && !paretoModal.classList.contains('hidden')) {
        iqRenderParetoChart(filtered, IQ_STATE.paretoMode);
    }
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
            const evts = iqFilterEvents();
            iqRenderTopMotivos(evts, IQ_STATE.chartMode);
            iqRenderRechazosArticulo(evts, IQ_STATE.chartMode);
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

function iqFilterEventsForPeriod(year, month, week, mode, cliente) {
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
        if (!iqCodArtAllows(event.cod_art)) return false;
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
        return iqFilterEventsForPeriod(prevYear, null, prevWeek, 'semana', IQ_STATE.cliente);
    } else {
        if (IQ_STATE.month === null) return [];
        let prevYear = IQ_STATE.year;
        let prevMonth = IQ_STATE.month - 1;
        if (prevMonth < 1) { prevMonth = 12; prevYear--; }
        return iqFilterEventsForPeriod(prevYear, prevMonth, null, 'mes', IQ_STATE.cliente);
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
