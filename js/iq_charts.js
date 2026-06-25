// charts.js — Horizontal bar chart (Top Motivos) + Pareto modal (SVG)

// Build sorted motivo data — only rejected events.
// Each item includes clients[] (sorted by mode) and topClient for the badge.
function iqBuildChartData(events, mode) {
    const stats = {};
    const clientMap = {}; // motivo → { cliente → { count, kg } }

    events.forEach(event => {
        if (event._estado !== 'RECHAZADO') return;
        if (!event._motivos.length) return;
        const kg = iqGetKg(event);
        const cliente = String(event.cliente || '').trim() || '(Sin cliente)';
        event._motivos.forEach(m => {
            if (!stats[m]) stats[m] = { motivo: m, count: 0, kg: 0 };
            stats[m].count++;
            stats[m].kg += kg;
            if (!clientMap[m]) clientMap[m] = {};
            if (!clientMap[m][cliente]) clientMap[m][cliente] = { count: 0, kg: 0 };
            clientMap[m][cliente].count++;
            clientMap[m][cliente].kg += kg;
        });
    });

    return Object.values(stats)
        .sort((a, b) => mode === 'kg' ? b.kg - a.kg : b.count - a.count)
        .map(item => {
            const sortedClients = Object.entries(clientMap[item.motivo] || {})
                .sort((a, b) => mode === 'kg' ? b[1].kg - a[1].kg : b[1].count - a[1].count)
                .map(([name, data]) => {
                    const val = mode === 'kg' ? data.kg : data.count;
                    const tot = mode === 'kg' ? item.kg  : item.count;
                    return { name, val, pct: tot > 0 ? Math.round((val / tot) * 100) : 0 };
                });
            return {
                ...item,
                clients:   sortedClients,
                topClient: sortedClients[0] ? { name: sortedClients[0].name, pct: sortedClients[0].pct } : null
            };
        });
}

// ── Horizontal bar chart ──────────────────────────────────────────────────────

function iqRenderTopMotivos(events, mode) {
    const container  = document.getElementById('top-motivos-chart');
    const subtitle   = document.getElementById('top-motivos-subtitle');
    const summaryEl  = document.getElementById('pareto-summary-inline');
    if (!container) return;

    const data = iqBuildChartData(events, mode).slice(0, 15);

    // ── Pareto summary (feature 3) ────────────────────────────────────────────
    if (summaryEl) {
        if (data.length > 0) {
            const totalForVitals = data.reduce((s, d) => s + (mode === 'kg' ? d.kg : d.count), 0);
            let cum = 0;
            const vitals = [];
            for (const item of data) {
                cum += mode === 'kg' ? item.kg : item.count;
                vitals.push(item.motivo);
                if (totalForVitals > 0 && cum / totalForVitals >= 0.8) break;
            }
            const label = vitals.length === 1 ? 'motivo concentra' : 'motivos concentran';
            summaryEl.innerHTML =
                `<span class="pareto-summary-icon">⚡</span>` +
                `<strong>${vitals.length} ${label} el 80% de los rechazos:</strong> ` +
                vitals.map(m => `<span class="pareto-vital-tag">${iqEscapeHtml(m)}</span>`).join('');
        } else {
            summaryEl.innerHTML = '';
        }
    }

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state">Sin rechazos en el período seleccionado.</div>';
        if (subtitle) subtitle.textContent = '';
        return;
    }

    const totalVal = data.reduce((s, d) => s + (mode === 'kg' ? d.kg : d.count), 0);
    const maxVal   = mode === 'kg'
        ? Math.max(...data.map(d => d.kg))
        : Math.max(...data.map(d => d.count));

    if (subtitle) {
        if (mode === 'kg') {
            subtitle.textContent = `Kilogramos rechazados por motivo · ${totalVal.toLocaleString('es-PE', { maximumFractionDigits: 1 })} kg en total`;
        } else {
            subtitle.textContent = `Veces que aparece cada motivo en partidas rechazadas · ${totalVal} rechazos en total`;
        }
    }

    // ── Previous period for trend (feature 1) ────────────────────────────────
    const prevData = iqBuildChartData(iqGetPreviousPeriodEvents(), mode);
    const prevMap  = {};
    prevData.forEach(d => { prevMap[d.motivo] = mode === 'kg' ? d.kg : d.count; });

    container.innerHTML = data.map((item, i) => {
        const val      = mode === 'kg' ? item.kg : item.count;
        const barPct   = maxVal > 0 ? (val / maxVal) * 100 : 0;
        const sharePct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : '0.0';
        const displayVal = mode === 'kg'
            ? `${val.toLocaleString('es-PE', { maximumFractionDigits: 1 })} kg`
            : `${val} rechazos`;
        const fillClass = i < 3 ? 'bar-fill-primary' : i < 7 ? 'bar-fill-secondary' : 'bar-fill-tertiary';

        // Trend badge
        const prevVal = prevMap[item.motivo];
        let trendHtml;
        if (prevVal === undefined) {
            trendHtml = `<span class="bar-trend trend-new">NUEVO</span>`;
        } else if (val === prevVal) {
            trendHtml = `<span class="bar-trend trend-eq">→ igual</span>`;
        } else {
            const pct  = Math.round(Math.abs((val - prevVal) / prevVal) * 100);
            trendHtml  = val > prevVal
                ? `<span class="bar-trend trend-up">↑ +${pct}%</span>`
                : `<span class="bar-trend trend-down">↓ −${pct}%</span>`;
        }

        // Client dominant badge (feature 2)
        let clientHtml = `<span class="bar-client bar-client-empty"></span>`;
        if (item.topClient) {
            const name = item.topClient.name.length > 10
                ? item.topClient.name.slice(0, 9) + '…'
                : item.topClient.name;
            clientHtml = `<span class="bar-client">${iqEscapeHtml(name)} ${item.topClient.pct}%</span>`;
        }

        const clientsAttr = encodeURIComponent(JSON.stringify(item.clients));

        return `
            <div class="bar-chart-item"
                 data-motivo="${iqEscapeHtml(item.motivo)}"
                 data-total="${val}"
                 data-mode="${mode}"
                 data-clients="${clientsAttr}">
                <div class="bar-rank">${i + 1}</div>
                <div class="bar-label" title="${iqEscapeHtml(item.motivo)}">${iqEscapeHtml(item.motivo)}</div>
                <div class="bar-track">
                    <div class="bar-fill ${fillClass}" style="width:${barPct.toFixed(1)}%"></div>
                </div>
                <div class="bar-value-wrap">
                    <span class="bar-val-main">${iqEscapeHtml(displayVal)}</span>
                    <span class="bar-val-pct">${sharePct}%</span>
                </div>
                ${trendHtml}
                ${clientHtml}
            </div>
        `;
    }).join('');
}

// ── Bar tooltip ───────────────────────────────────────────────────────────────

function iqInitBarTooltip() {
    const chart = document.getElementById('top-motivos-chart');
    const tt    = document.getElementById('bar-tooltip');
    if (!chart || !tt) return;

    chart.addEventListener('mousemove', e => {
        const item = e.target.closest('.bar-chart-item[data-clients]');
        if (!item) { tt.classList.add('hidden'); return; }

        const motivo  = item.dataset.motivo || '';
        const total   = parseFloat(item.dataset.total) || 0;
        const mode    = item.dataset.mode  || 'freq';
        const clients = JSON.parse(decodeURIComponent(item.dataset.clients || '%5B%5D'));

        const totalFmt = mode === 'kg'
            ? total.toLocaleString('es-PE', { maximumFractionDigits: 1 }) + ' kg'
            : total + ' rechazos';

        const rows = clients.map(c => {
            const valFmt = mode === 'kg'
                ? c.val.toLocaleString('es-PE', { maximumFractionDigits: 1 }) + ' kg'
                : c.val;
            return `
                <div class="bar-tt-row">
                    <span class="bar-tt-client">${iqEscapeHtml(c.name)}</span>
                    <span class="bar-tt-val">${iqEscapeHtml(String(valFmt))}</span>
                    <span class="bar-tt-pct">${c.pct}%</span>
                </div>`;
        }).join('');

        tt.innerHTML = `
            <div class="bar-tt-title">
                ${iqEscapeHtml(motivo)}
                <span class="bar-tt-total">${totalFmt}</span>
            </div>
            <div class="bar-tt-header">
                <span>Cliente</span><span>Cantidad</span><span>Part.</span>
            </div>
            ${rows}
        `;
        tt.classList.remove('hidden');

        const gap = 14;
        let x = e.clientX + gap;
        let y = e.clientY + gap;
        const tw = tt.offsetWidth  || 240;
        const th = tt.offsetHeight || 120;
        if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - gap;
        if (y + th > window.innerHeight - 8) y = e.clientY - th - gap;
        tt.style.left = x + 'px';
        tt.style.top  = y + 'px';
    });

    chart.addEventListener('mouseleave', () => tt.classList.add('hidden'));
}

// ── Pareto modal ──────────────────────────────────────────────────────────────

function iqOpenParetoModal(records, mode) {
    const modal = document.getElementById('pareto-modal');
    if (!modal) return;
    document.querySelectorAll('[data-pareto-mode]').forEach(b =>
        b.classList.toggle('active', b.dataset.paretoMode === mode)
    );
    iqRenderParetoChart(records, mode);
    modal.classList.remove('hidden');
}

function iqCloseParetoModal() {
    const modal = document.getElementById('pareto-modal');
    if (modal) modal.classList.add('hidden');
}

function iqRenderParetoChart(records, mode) {
    const container = document.getElementById('pareto-chart-container');
    const vitalsEl  = document.getElementById('pareto-vitals');
    if (!container) return;

    const allData = iqBuildChartData(records, mode);
    const data = allData.slice(0, 12); // cap at 12 for readability

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:40px">Sin rechazos en el período.</div>';
        if (vitalsEl) vitalsEl.innerHTML = '';
        return;
    }

    const totalVal = data.reduce((s, d) => s + (mode === 'kg' ? d.kg : d.count), 0);

    // Compute cumulative %
    let cumulative = 0;
    const points = data.map(item => {
        const val = mode === 'kg' ? item.kg : item.count;
        cumulative += val;
        return { ...item, val, cumPct: totalVal > 0 ? (cumulative / totalVal) * 100 : 0 };
    });

    // SVG layout
    const W  = 800;
    const H  = 310;
    const mL = 52;   // left margin (Y axis)
    const mR = 52;   // right margin (% axis)
    const mT = 16;
    const mB = 82;   // bottom margin (rotated labels)
    const cW = W - mL - mR;
    const cH = H - mT - mB;

    const n    = points.length;
    const slotW = cW / n;
    const barW  = Math.max(Math.floor(slotW * 0.65), 10);
    const maxVal = Math.max(...points.map(p => p.val));

    // Y-axis grid and labels
    const yTicks = 5;
    const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
        const ratio = i / yTicks;
        const y = mT + cH - ratio * cH;
        const label = mode === 'kg'
            ? (maxVal * ratio).toLocaleString('es-PE', { maximumFractionDigits: 0 })
            : Math.round(maxVal * ratio);
        return `
            <line x1="${mL}" y1="${y}" x2="${mL + cW}" y2="${y}" stroke="#ececec" stroke-width="1"/>
            <text x="${mL - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#999">${label}</text>
        `;
    }).join('');

    const pctLines = '';

    // 80% threshold line
    const y80 = mT + cH - 0.8 * cH;
    const threshold80 = `
        <line x1="${mL}" y1="${y80}" x2="${mL + cW}" y2="${y80}"
            stroke="#ef5350" stroke-width="1.5" stroke-dasharray="6,3"/>
        <text x="${mL - 6}" y="${y80 - 4}" text-anchor="end" font-size="10" fill="#ef5350" font-weight="600">80%</text>
    `;

    // Bars
    const bars = points.map((p, i) => {
        const x      = mL + i * slotW + (slotW - barW) / 2;
        const barH   = maxVal > 0 ? (p.val / maxVal) * cH : 0;
        const y      = mT + cH - barH;
        const isVital = p.cumPct <= 80.0001;
        const fill   = isVital ? '#1a6eb5' : '#90c8f0';
        const displayVal = mode === 'kg'
            ? p.val.toLocaleString('es-PE', { maximumFractionDigits: 1 })
            : p.val;
        return `
            <rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${fill}" rx="3">
                <title>${iqEscapeHtml(p.motivo)}: ${displayVal}${mode === 'kg' ? ' kg' : ''} · ${p.cumPct.toFixed(1)}% acum.</title>
            </rect>
        `;
    }).join('');

    // X-axis labels (rotated -35°)
    const xLabels = points.map((p, i) => {
        const cx    = mL + i * slotW + slotW / 2;
        const label = p.motivo.length > 14 ? p.motivo.slice(0, 13) + '…' : p.motivo;
        return `
            <text x="${cx}" y="${mT + cH + 14}" text-anchor="end"
                transform="rotate(-35,${cx},${mT + cH + 14})"
                font-size="11" fill="#555">${iqEscapeHtml(label)}</text>
        `;
    }).join('');

    // Cumulative line + dots
    const linePts = points.map((p, i) => {
        const cx = mL + i * slotW + slotW / 2;
        const cy = mT + cH - (p.cumPct / 100) * cH;
        return `${cx},${cy}`;
    }).join(' ');

    const cumLine = `<polyline points="${linePts}" fill="none" stroke="#ef5350" stroke-width="2.5" stroke-linejoin="round"/>`;

    const cumDots = points.map((p, i) => {
        const cx = mL + i * slotW + slotW / 2;
        const cy = mT + cH - (p.cumPct / 100) * cH;
        return `
            <circle cx="${cx}" cy="${cy}" r="4" fill="white" stroke="#ef5350" stroke-width="2.5">
                <title>${p.cumPct.toFixed(1)}% acumulado</title>
            </circle>
        `;
    }).join('');

    const legend = '';

    const svg = `
        <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;min-width:400px">
            ${gridLines}
            ${pctLines}
            ${threshold80}
            ${bars}
            ${xLabels}
            ${cumLine}
            ${cumDots}
            ${legend}
            <line x1="${mL}" y1="${mT}" x2="${mL}" y2="${mT + cH}" stroke="#ccc" stroke-width="1.5"/>
            <line x1="${mL}" y1="${mT + cH}" x2="${mL + cW}" y2="${mT + cH}" stroke="#ccc" stroke-width="1.5"/>
        </svg>
    `;

    container.innerHTML = svg;

    // ── Los Pocos Vitales ────────────────────────────────────────────────────
    const vitals = points.filter(p => p.cumPct <= 80.0001);

    if (vitalsEl) {
        vitalsEl.innerHTML = `
            <h3>⚡ Motivos de Rechazos a reducir</h3>
            <p class="insight-sub">Resuelve estos motivos para eliminar más del 80% de los rechazos.</p>
            <div class="vitals-row">
                ${vitals.map(p => {
                    const displayVal = mode === 'kg'
                        ? `${p.val.toLocaleString('es-PE', { maximumFractionDigits: 1 })} kg`
                        : `${p.val} lotes`;
                    return `<span class="vital-item"><strong>${iqEscapeHtml(p.motivo)}</strong>: ${displayVal} <em>(${p.cumPct.toFixed(1)}% acum.)</em></span>`;
                }).join('')}
            </div>
        `;
    }

}
