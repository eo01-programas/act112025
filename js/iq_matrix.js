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

function iqRenderMatrix(events) {
    const thead = document.getElementById('matrix-thead');
    const tbody = document.getElementById('matrix-tbody');
    if (!thead || !tbody) return;

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

    events.forEach(event => {
        const cliente = String(event.cliente || '').trim() || '(Sin cliente)';
        if (!clienteMap[cliente]) clienteMap[cliente] = { partidas: new Set(), motivos: {} };
        if (event._estado === 'RECHAZADO') {
            clienteMap[cliente].partidas.add(event._record);
            const kg = iqGetKg(event);
            event._motivos.forEach(m => {
                clienteMap[cliente].motivos[m] = (clienteMap[cliente].motivos[m] || 0) + 1;
                motivoKg[m] = (motivoKg[m] || 0) + kg;
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
            return `<td${topCls ? ` class="${topCls}"` : ''}>${val}</td>`;
        }).join('');

        return `
            <tr>
                <td class="td-left td-sticky">${iqEscapeHtml(cliente)}</td>
                <td class="cell-partidas">${partidas}</td>
                ${motivoCells}
                <td class="cell-total">${totalEvents}</td>
            </tr>
        `;
    }).join('');

    const totalMotivoCells = motivos.map((m, i) => {
        const topCls = iqTopColClass(i);
        return `<td${topCls ? ` class="${topCls}"` : ''}><strong>${totMotivos[m] || 0}</strong></td>`;
    }).join('');

    const grandTotalEvents = motivos.reduce((s, m) => s + (totMotivos[m] || 0), 0);
    const grandTotalKg = motivos.reduce((s, m) => s + (motivoKg[m] || 0), 0);

    // ── kg row per motivo
    const kgMotivoCells = motivos.map((m, i) => {
        const topCls = iqTopColClass(i);
        return `<td class="cell-kg${topCls ? ` ${topCls}` : ''}">${iqFmtKg(motivoKg[m] || 0)}</td>`;
    }).join('');

    tbody.innerHTML = bodyRows + `
        <tr class="row-total">
            <td class="td-left td-sticky">TOTAL</td>
            <td class="cell-partidas"><strong>${totPartidas}</strong></td>
            ${totalMotivoCells}
            <td class="cell-total"><strong>${grandTotalEvents}</strong></td>
        </tr>
        <tr class="row-kg">
            <td class="td-left td-sticky row-kg-label">Kg crudo</td>
            <td></td>
            ${kgMotivoCells}
            <td class="cell-total cell-kg">${iqFmtKg(grandTotalKg)}</td>
        </tr>
    `;
}
