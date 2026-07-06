// auditor.js — Supervisor decisions + Quien aprobó tables

function iqRenderAuditorTable(events) {
    const tbody = document.getElementById('auditor-tbody');
    if (!tbody) return;

    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Sin datos para el período seleccionado.</td></tr>';
        return;
    }

    // Each event represents one inspection decision — rejection or approval.
    const supervisorMap = {};

    function getOrCreate(name) {
        const key = name.toUpperCase();
        if (!supervisorMap[key]) {
            supervisorMap[key] = { name: key, rechazos: 0, aprobaciones: 0, motivos: {} };
        }
        return supervisorMap[key];
    }

    events.forEach(event => {
        const sup = event._supervisor;
        if (!sup) return;
        const entry = getOrCreate(sup);

        if (event._estado === 'RECHAZADO') {
            entry.rechazos++;
            const motivo = event._motivos[0] || '';
            if (motivo) entry.motivos[motivo] = (entry.motivos[motivo] || 0) + 1;
        } else if (event._estado === 'OK') {
            entry.aprobaciones++;
        }
    });

    const rows = Object.values(supervisorMap)
        .map(d => ({ ...d, total: d.rechazos + d.aprobaciones }))
        .filter(d => d.total > 0)
        .sort((a, b) => b.total - a.total)
        .map(d => {
            const pctRe = d.total > 0 ? Math.round((d.rechazos / d.total) * 100) : 0;
            const pctReClass = pctRe >= 60 ? 'cell-rejected' : pctRe >= 30 ? 'cell-warning' : 'cell-approved';

            const topMotivo = Object.entries(d.motivos).sort((a, b) => b[1] - a[1])[0];
            const motivoLabel = topMotivo
                ? `${iqEscapeHtml(topMotivo[0])} <span class="motivo-count">(${topMotivo[1]})</span>`
                : '<span class="cell-zero">—</span>';

            const pctBar = `
                <div class="pct-bar-wrap">
                    <div class="pct-bar pct-bar-reject" style="width:${pctRe}%" title="${pctRe}% rechazos"></div>
                    <span class="${pctReClass}">${pctRe}%</span>
                </div>
            `;

            return `
                <tr>
                    <td class="td-left td-auditor">${iqEscapeHtml(d.name)}</td>
                    <td>${d.total}</td>
                    <td class="cell-rejected">${d.rechazos}</td>
                    <td class="cell-approved">${d.aprobaciones}</td>
                    <td>${pctBar}</td>
                    <td class="td-left td-motivo">${motivoLabel}</td>
                </tr>
            `;
        }).join('');

    tbody.innerHTML = rows || '<tr><td colspan="6" class="empty-state">Sin supervisores registrados en el período.</td></tr>';
}

function iqRenderQuienAproboTable(events) {
    const tbody = document.getElementById('quien-aprobo-tbody');
    if (!tbody) return;

    // Only approval events
    const aprobadas = events.filter(e => e._estado === 'OK');

    if (aprobadas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Sin aprobaciones registradas en el período.</td></tr>';
        return;
    }

    const map = {};
    const MERGE_ASEG = new Set(['CLIENTE', 'SUPERVISOR']);

    aprobadas.forEach(e => {
        const raw = String(e.quien_aprobo || '').trim().toUpperCase();
        const quien = (!raw || MERGE_ASEG.has(raw)) ? 'ASEG CALIDAD TEXTIL' : raw;
        if (!map[quien]) map[quien] = { name: quien, partidas: 0, kg: 0 };
        map[quien].partidas++;
        map[quien].kg += iqGetKg(e);
    });

    const total = aprobadas.length;

    const rows = Object.values(map)
        .sort((a, b) => b.partidas - a.partidas)
        .map(d => {
            const pct = total > 0 ? ((d.partidas / total) * 100).toFixed(1) : '0.0';
            const kgLabel = d.kg >= 1000
                ? `${(d.kg / 1000).toFixed(1)} t`
                : `${d.kg.toLocaleString('es-PE', { maximumFractionDigits: 1 })} kg`;

            return `
                <tr>
                    <td class="td-left td-auditor">${iqEscapeHtml(d.name)}</td>
                    <td class="cell-approved">${d.partidas}</td>
                    <td>${pct}%</td>
                    <td class="cell-kg">${iqEscapeHtml(kgLabel)}</td>
                </tr>
            `;
        }).join('');

    const totalKg = aprobadas.reduce((s, e) => s + iqGetKg(e), 0);
    const totalKgLabel = totalKg >= 1000
        ? `${(totalKg / 1000).toFixed(1)} t`
        : `${totalKg.toLocaleString('es-PE', { maximumFractionDigits: 1 })} kg`;

    const totalRow = `
        <tr class="row-no-hover" style="background:#2e7d32;color:#fff;">
            <td class="td-left td-auditor"><strong>TOTAL</strong></td>
            <td><strong>${total}</strong></td>
            <td><strong>100%</strong></td>
            <td><strong>${iqEscapeHtml(totalKgLabel)}</strong></td>
        </tr>
    `;

    tbody.innerHTML = rows + totalRow;
}
