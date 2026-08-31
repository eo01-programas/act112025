/**
 * chart_tendencia.js — Gráfica compartida "Aprobaciones vs Rechazos por período".
 * -------------------------------------------------------------------------------
 * La usan el modal de Trazabilidad OP-Partida (trazabilidad_op.js) y el modal
 * de tendencia del Consolidado de Aprobaciones (consolidado_aprobaciones.js),
 * para que ambas pantallas cuenten y dibujen exactamente igual.
 *
 * Diseño (una sola escala, sin doble eje):
 *   • Línea con puntos por período: Aprobadas (verde) y Rechazadas (rojo).
 *   • Valor en negrita junto a cada punto (la serie más alta arriba, la otra abajo).
 *   • Modo '123' (conteo): fila superior con el % de rechazo del período.
 *   • Modo '%': cada punto es la participación dentro del período
 *     (aprobadas y rechazadas suman 100%); la fila superior se omite por redundante.
 *   • Tooltip por período con el desglose por cliente (siempre en partidas).
 *
 * Los colores pasan la validación de daltonismo (deutan ΔE 20.6) y coinciden
 * con los puntos de estado de la tabla de trazabilidad (STATUS_META).
 *
 * API:
 *   window.ChartTendencia.render(canvas, data) → instancia de Chart
 *   data = {
 *     labels:     ['Sem 24', …],
 *     aprobadas:  [12, …],          // partidas aprobadas por período
 *     rechazadas: [3, …],           // partidas rechazadas por período
 *     detalles:   [{ aprobadas: [{label, value}], rechazadas: [{label, value}] }, …] // opcional
 *     valueMode:  'count' | 'percent',   // opcional; 'count' por defecto
 *     labelAprobadas: 'Aprobadas · TOLERANCIA', // opcional (serie filtrada)
 *   }
 * Requiere window.Chart (Chart.js 4). El llamador decide cuándo destruir la instancia.
 */
(() => {
    const COLOR_APROB     = '#16a34a';
    const COLOR_RECH      = '#dc2626';
    // Variantes más oscuras para texto (mejor contraste sobre fondo blanco)
    const COLOR_APROB_TXT = '#15803d';
    const COLOR_RECH_TXT  = '#b91c1c';
    const COLOR_GRID      = '#e8ede4';
    const COLOR_TICK      = '#667466';
    const COLOR_INK       = '#2f3b2f';
    const FONT = "'Calibri', Arial, sans-serif";

    // Plugin: valor junto a cada punto + (solo en modo conteo) fila superior
    // con el % de rechazo del período.
    const tendenciaLabelsPlugin = {
        id: 'tendenciaLabels',
        afterDatasetsDraw(chart, args, opts) {
            const { ctx, chartArea } = chart;
            const aprob   = opts.aprobadas  || [];   // conteos reales
            const rech    = opts.rechazadas || [];
            const serieA  = opts.serieA     || [];   // valores dibujados (conteo o %)
            const serieR  = opts.serieR     || [];
            const pctMode = !!opts.pctMode;
            const metaA = chart.getDatasetMeta(0);
            const metaR = chart.getDatasetMeta(1);
            const xScale = chart.scales.x;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = `bold 13px ${FONT}`;

            const fmt = (v) => pctMode ? `${v}%` : String(v);
            // Dibuja arriba o abajo del punto, sin salirse del área de trazado
            const drawAt = (txt, x, y, above, color) => {
                if (above  && y - 20 < chartArea.top)    above = false;
                if (!above && y + 20 > chartArea.bottom) above = true;
                ctx.fillStyle = color;
                ctx.textBaseline = above ? 'bottom' : 'top';
                ctx.fillText(txt, x, above ? y - 7 : y + 7);
            };

            for (let i = 0; i < serieA.length; i++) {
                const ptA = metaA.data[i];
                const ptR = metaR.data[i];
                const okA = ptA && serieA[i] != null && (pctMode || serieA[i] > 0);
                const okR = ptR && serieR[i] != null && (pctMode || serieR[i] > 0);
                // La serie que queda más alta lleva su etiqueta arriba; la otra, abajo.
                const aArriba = !okR || (okA && ptA.y <= ptR.y);
                if (okA) drawAt(fmt(serieA[i]), ptA.x, ptA.y, aArriba,  COLOR_APROB_TXT);
                if (okR) drawAt(fmt(serieR[i]), ptR.x, ptR.y, !aArriba, COLOR_RECH_TXT);
            }

            // Fila superior: nivel de rechazo del período (gris cuando es 0%).
            // En modo % se omite: sería el mismo número que el punto rojo.
            if (!pctMode) {
                ctx.font = `bold 14px ${FONT}`;
                ctx.textBaseline = 'top';
                for (let i = 0; i < aprob.length; i++) {
                    const total = (aprob[i] || 0) + (rech[i] || 0);
                    if (!total) continue;
                    const pct = Math.round((rech[i] || 0) / total * 100);
                    ctx.fillStyle = pct > 0 ? COLOR_RECH_TXT : COLOR_TICK;
                    ctx.fillText(`${pct}%`, xScale.getPixelForValue(i), chartArea.top - 24);
                }
            }

            ctx.restore();
        },
    };

    function render(canvas, data) {
        const labels     = data.labels     || [];
        const aprobadas  = data.aprobadas  || [];
        const rechazadas = data.rechazadas || [];
        const detalles   = data.detalles   || null;
        const pctMode    = data.valueMode === 'percent';
        const labelA     = data.labelAprobadas || 'Aprobadas';

        // Modo %: participación dentro del período (aprobadas + rechazadas = 100%).
        // Períodos sin partidas quedan en null → hueco en la línea, no un 0% falso.
        const totalDe = (i) => (aprobadas[i] || 0) + (rechazadas[i] || 0);
        const share   = (v, i) => { const t = totalDe(i); return t ? Math.round((v || 0) / t * 100) : null; };
        const serieA = pctMode ? aprobadas.map((v, i) => share(v, i))  : aprobadas;
        const serieR = pctMode ? rechazadas.map((v, i) => share(v, i)) : rechazadas;
        const peak = Math.max(1, ...aprobadas, ...rechazadas);

        // Desglose por cliente para el tooltip: top 6 y el resto agrupado en "Otros"
        const fmtDetalle = (items, total) => {
            const out = [];
            if (!items || !total) return out;
            items.slice(0, 6).forEach(d => {
                out.push(`   ${d.label}: ${d.value}  (${Math.round(d.value / total * 100)}%)`);
            });
            const resto = items.slice(6);
            if (resto.length) {
                const v = resto.reduce((acc, d) => acc + d.value, 0);
                out.push(`   Otros: ${v}  (${Math.round(v / total * 100)}%)`);
            }
            return out;
        };

        const lineStyle = (color) => ({
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            spanGaps: false,
            fill: false,
        });

        return new window.Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: labelA,       data: serieA, ...lineStyle(COLOR_APROB) },
                    { label: 'Rechazadas', data: serieR, ...lineStyle(COLOR_RECH) },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // Reserva la franja superior para la fila de % de rechazo (modo
                // conteo) o para las etiquetas de los puntos más altos (modo %).
                layout: { padding: { top: pctMode ? 26 : 34 } },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    // Abajo para no chocar con la fila de % de rechazo del borde superior
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 14,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 10,
                            boxHeight: 10,
                            color: COLOR_INK,
                            font: { family: FONT, size: 13, weight: 'bold' },
                        },
                    },
                    tendenciaLabels: { aprobadas, rechazadas, serieA, serieR, pctMode },
                    tooltip: {
                        displayColors: false,
                        titleFont: { family: FONT, size: 13, weight: 'bold' },
                        bodyFont:  { family: FONT, size: 12 },
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            title: (items) => items.length ? items[0].label : '',
                            label: (item) => {
                                const i = item.dataIndex;
                                const det = detalles && detalles[i] ? detalles[i] : null;
                                if (item.datasetIndex === 0) {
                                    const t = aprobadas[i] || 0;
                                    if (!t) return `${labelA}: 0`;
                                    const head = pctMode ? `${labelA}: ${t} (${share(t, i)}%)` : `${labelA}: ${t}`;
                                    return [head, ...fmtDetalle(det && det.aprobadas, t)];
                                }
                                const t = rechazadas[i] || 0;
                                const head = (t && pctMode) ? `Rechazadas: ${t} (${share(t, i)}%)` : `Rechazadas: ${t}`;
                                const lines = t
                                    ? [head, ...fmtDetalle(det && det.rechazadas, t)]
                                    : [head];
                                const total = totalDe(i);
                                if (total && !pctMode) lines.push(`Nivel de rechazo: ${Math.round(t / total * 100)}%`);
                                return lines;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        // offset separa los puntos extremos del borde (como las barras)
                        offset: true,
                        grid: { display: false },
                        ticks: { color: COLOR_INK, font: { family: FONT, size: 13, weight: 'bold' } },
                    },
                    y: pctMode
                        ? {
                            min: 0,
                            max: 100,
                            grid: { color: COLOR_GRID },
                            ticks: { color: COLOR_TICK, precision: 0, font: { family: FONT, size: 11 }, callback: (v) => `${v}%` },
                            title: {
                                display: true,
                                text: '% de participación',
                                color: COLOR_TICK,
                                font: { family: FONT, size: 12, weight: 'bold' },
                            },
                        }
                        : {
                            beginAtZero: true,
                            // Margen para que las etiquetas de valor no choquen con la fila de %
                            suggestedMax: Math.ceil(peak * 1.15),
                            grid: { color: COLOR_GRID },
                            ticks: { color: COLOR_TICK, precision: 0, font: { family: FONT, size: 11 } },
                            title: {
                                display: true,
                                text: 'Partidas',
                                color: COLOR_TICK,
                                font: { family: FONT, size: 12, weight: 'bold' },
                            },
                        },
                },
            },
            plugins: [tendenciaLabelsPlugin],
        });
    }

    window.ChartTendencia = { COLOR_APROB, COLOR_RECH, render };
})();
