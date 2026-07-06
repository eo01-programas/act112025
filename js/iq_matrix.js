// matrix.js — Defect distribution matrix by client

function iqBuildMotivoStats(events) {
    const stats = {};
    events.forEach(event => {
        if (!event._motivos.length) return;
        const kg = iqGetKg(event);
        event._motivos.forEach(m => {
            if (!stats[m]) stats[m] = { motivo: m, count: 0, kg: 0 };
            stats[m].count++;
            stats[m].kg += kg;
        });
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
}

function iqTopColClass(index) {
    return index < 3 ? `col-top-${index + 1}` : '';
}

function iqFmtKg(kg) {
    if (kg === 0) return '—';
    return kg % 1 === 0 ? kg.toLocaleString('es') : kg.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// Registro de selecciones clicables de la matriz: cada celda con datos guarda
// aquí el título y las partidas (registros únicos) que la componen. El índice
// viaja en el atributo data-mx de la celda.
let IQ_MATRIX_SELECTIONS = [];

function iqRenderMatrix(events) {
    const thead = document.getElementById('matrix-thead');
    const tbody = document.getElementById('matrix-tbody');
    if (!thead || !tbody) return;

    IQ_MATRIX_SELECTIONS = [];
    const mxReg = (title, recordsSet) => {
        IQ_MATRIX_SELECTIONS.push({ title, records: [...recordsSet] });
        return ` data-mx="${IQ_MATRIX_SELECTIONS.length - 1}"`;
    };

    if (events.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Sin datos para el período seleccionado.</td></tr>';
        return;
    }

    // Motivos presentes en el período (ordenados por frecuencia desc)
    const periodMotivoStats = iqBuildMotivoStats(events);
    const periodMotivoSet   = new Set(periodMotivoStats.map(s => s.motivo));

    // Motivos del catálogo canónico que NO aparecen en el período → columnas en cero
    // Se usa el catálogo de IQ_CONFIG (= mobile_calidad MOTIVOS_RECHAZO_OPTIONS)
    // para no mostrar motivos legacy/erróneos del historial de la hoja.
    const zeroMotivos = (IQ_CONFIG.MOTIVOS_RECHAZO || []).filter(m => !periodMotivoSet.has(m));

    // Columnas: activos del período primero, luego los canónicos con cero
    const motivos = [...periodMotivoStats.map(s => s.motivo), ...zeroMotivos];

    const clienteMap = {};
    const motivoKg = {};
    const motivoRecsTotal = {};   // motivo → Set de registros (todos los clientes)
    const allRechazadas = new Set();

    events.forEach(event => {
        const cliente = String(event.cliente || '').trim() || '(Sin cliente)';
        if (!clienteMap[cliente]) clienteMap[cliente] = { partidas: new Set(), motivos: {}, motivoRecs: {} };
        if (event._estado === 'RECHAZADO') {
            clienteMap[cliente].partidas.add(event._record);
            allRechazadas.add(event._record);
            const kg = iqGetKg(event);
            event._motivos.forEach(m => {
                clienteMap[cliente].motivos[m] = (clienteMap[cliente].motivos[m] || 0) + 1;
                motivoKg[m] = (motivoKg[m] || 0) + kg;
                if (!clienteMap[cliente].motivoRecs[m]) clienteMap[cliente].motivoRecs[m] = new Set();
                clienteMap[cliente].motivoRecs[m].add(event._record);
                if (!motivoRecsTotal[m]) motivoRecsTotal[m] = new Set();
                motivoRecsTotal[m].add(event._record);
            });
        }
    });

    const totMotivos = {};
    motivos.forEach(m => {
        totMotivos[m] = Object.values(clienteMap).reduce((s, d) => s + (d.motivos[m] || 0), 0);
    });

    const totPartidas = new Set(
        events.filter(e => e._estado === 'RECHAZADO').map(e => e._record)
    ).size;

    // ── Header
    const motivoHeaderCells = motivos.map((m, i) => {
        const topCls = iqTopColClass(i);
        const cls = topCls ? `th-motivo ${topCls}` : 'th-motivo';
        return `<th title="${iqEscapeHtml(m)}" class="${cls}">${iqEscapeHtml(m)}</th>`;
    }).join('');

    thead.innerHTML = `
        <tr>
            <th class="th-left th-sticky">Cliente</th>
            <th>Ptdas</th>
            ${motivoHeaderCells}
            <th>Total</th>
        </tr>
    `;

    // ── Body rows
    const sortedClientes = Object.entries(clienteMap)
        .map(([cliente, data]) => ({
            cliente, data,
            partidas: data.partidas.size,
            totalEvents: motivos.reduce((s, m) => s + (data.motivos[m] || 0), 0),
        }))
        .sort((a, b) => b.totalEvents - a.totalEvents);

    const bodyRows = sortedClientes.map(({ cliente, data, partidas, totalEvents }) => {
        const motivoCells = motivos.map((m, i) => {
            const val    = data.motivos[m] || 0;
            const topCls = iqTopColClass(i);
            if (val === 0) return `<td class="${topCls ? `cell-zero ${topCls}` : 'cell-zero'}">—</td>`;
            const mx = mxReg(`${m} — ${cliente}`, data.motivoRecs[m]);
            return `<td class="cell-click${topCls ? ` ${topCls}` : ''}"${mx} title="Ver partidas">${val}</td>`;
        }).join('');

        const mxPtdas = partidas > 0 ? mxReg(`Partidas con rechazo — ${cliente}`, data.partidas) : '';
        const mxTotal = totalEvents > 0 ? mxReg(`Todos los rechazos — ${cliente}`, data.partidas) : '';

        return `
            <tr>
                <td class="td-left td-sticky">${iqEscapeHtml(cliente)}</td>
                <td class="cell-partidas${mxPtdas ? ' cell-click' : ''}"${mxPtdas}${mxPtdas ? ' title="Ver partidas"' : ''}>${partidas}</td>
                ${motivoCells}
                <td class="cell-total${mxTotal ? ' cell-click' : ''}"${mxTotal}${mxTotal ? ' title="Ver partidas"' : ''}>${totalEvents}</td>
            </tr>
        `;
    }).join('');

    const totalMotivoCells = motivos.map((m, i) => {
        const topCls = iqTopColClass(i);
        const val = totMotivos[m] || 0;
        if (val === 0) return `<td${topCls ? ` class="${topCls}"` : ''}><strong>0</strong></td>`;
        const mx = mxReg(`${m} — Todos los clientes`, motivoRecsTotal[m]);
        return `<td class="cell-click${topCls ? ` ${topCls}` : ''}"${mx} title="Ver partidas"><strong>${val}</strong></td>`;
    }).join('');

    const grandTotalEvents = motivos.reduce((s, m) => s + (totMotivos[m] || 0), 0);
    const grandTotalKg = motivos.reduce((s, m) => s + (motivoKg[m] || 0), 0);

    // ── kg row per motivo
    const kgMotivoCells = motivos.map((m, i) => {
        const topCls = iqTopColClass(i);
        const kg = motivoKg[m] || 0;
        const mx = kg > 0 ? mxReg(`${m} — Todos los clientes`, motivoRecsTotal[m]) : '';
        return `<td class="cell-kg${mx ? ' cell-click' : ''}${topCls ? ` ${topCls}` : ''}"${mx}${mx ? ' title="Ver partidas"' : ''}>${iqFmtKg(kg)}</td>`;
    }).join('');

    const mxTotPtdas  = totPartidas > 0 ? mxReg('Todas las partidas con rechazo', allRechazadas) : '';
    const mxGrandTot  = grandTotalEvents > 0 ? mxReg('Todas las partidas con rechazo', allRechazadas) : '';

    tbody.innerHTML = bodyRows + `
        <tr class="row-total">
            <td class="td-left td-sticky">TOTAL</td>
            <td class="cell-partidas${mxTotPtdas ? ' cell-click' : ''}"${mxTotPtdas}${mxTotPtdas ? ' title="Ver partidas"' : ''}><strong>${totPartidas}</strong></td>
            ${totalMotivoCells}
            <td class="cell-total${mxGrandTot ? ' cell-click' : ''}"${mxGrandTot}${mxGrandTot ? ' title="Ver partidas"' : ''}><strong>${grandTotalEvents}</strong></td>
        </tr>
        <tr class="row-kg">
            <td class="td-left td-sticky row-kg-label">Kg crudo</td>
            <td></td>
            ${kgMotivoCells}
            <td class="cell-total cell-kg">${iqFmtKg(grandTotalKg)}</td>
        </tr>
    `;

    iqWireMatrixClicks();
}

// ── Modal de detalle de partidas de la matriz ─────────────────────────────────

function iqWireMatrixClicks() {
    const table = document.getElementById('matrix-table');
    if (!table) return;
    // Asignación directa (no addEventListener): idempotente entre re-renders.
    table.onclick = (e) => {
        const cell = e.target.closest('[data-mx]');
        if (!cell) return;
        const sel = IQ_MATRIX_SELECTIONS[parseInt(cell.dataset.mx, 10)];
        if (sel) iqOpenMatrizModal(sel);
    };
    iqInitMatrizModalClose();
}

function iqOpenMatrizModal(sel) {
    const modal = document.getElementById('matriz-modal');
    const title = document.getElementById('matriz-modal-title');
    const sub   = document.getElementById('matriz-modal-sub');
    const tbody = document.getElementById('matriz-detail-tbody');
    if (!modal || !tbody) return;

    const txt = (v) => String(v == null ? '' : v).trim();
    const rows = [...sel.records].sort((a, b) => {
        const ca = txt(a.cliente).localeCompare(txt(b.cliente));
        if (ca !== 0) return ca;
        return `${txt(a.op_tela)}-${txt(a.partida)}`.localeCompare(`${txt(b.op_tela)}-${txt(b.partida)}`, 'es', { numeric: true });
    });

    const totalKg = rows.reduce((s, r) => s + iqGetKg(r), 0);
    if (title) title.textContent = sel.title;
    if (sub)   sub.textContent = `${rows.length} partida${rows.length === 1 ? '' : 's'} · ${iqFmtKg(totalKg)} kg crudo`;

    // Cebra por grupo: filas con el mismo OP-PTDA comparten tono y el tono
    // alterna al cambiar de OP-PTDA (las filas ya vienen ordenadas).
    let shade = 0;
    let prevKey = null;
    tbody.innerHTML = rows.map(r => {
        const key = `${txt(r.op_tela)}-${txt(r.partida)}`;
        if (prevKey !== null && key !== prevKey) shade++;
        prevKey = key;
        return `
        <tr${shade % 2 ? ' class="mx-row-alt"' : ''}>
            <td class="td-left">${iqEscapeHtml(txt(r.cliente) || '—')}</td>
            <td class="td-left">${iqEscapeHtml(iqGetTipoTelaLabel(r.tipo_tela) || '—')}</td>
            <td>${iqEscapeHtml(key)}</td>
            <td>${iqEscapeHtml(txt(r.cod_art) || '—')}</td>
            <td class="td-left">${iqEscapeHtml(txt(r.articulo) || '—')}</td>
            <td class="td-left">${iqEscapeHtml(txt(r.color) || '—')}</td>
            <td>${iqFmtKg(iqGetKg(r))}</td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" class="empty-state">Sin partidas.</td></tr>';

    modal.classList.remove('hidden');
}

function iqInitMatrizModalClose() {
    if (window.__iqMatrizModalWired) return;
    window.__iqMatrizModalWired = true;
    const close = () => document.getElementById('matriz-modal')?.classList.add('hidden');
    document.getElementById('matriz-close')?.addEventListener('click', close);
    document.getElementById('matriz-modal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('matriz-modal')) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}
