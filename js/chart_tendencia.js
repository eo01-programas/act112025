/**
 * chart_tendencia.js — Gráfica compartida "Aprobaciones vs Rechazos por período".
 * -------------------------------------------------------------------------------
 * La usan el modal de Trazabilidad OP-Partida (trazabilidad_op.js) y el modal
 * de tendencia del Consolidado de Aprobaciones (consolidado_aprobaciones.js),
 * para que ambas pantallas cuenten y dibujen exactamente igual.
 *
 * Diseño (una sola escala, sin doble eje):
 *   • Barras agrupadas por período: Aprobadas (verde) y Rechazadas (rojo).
 *   • Valor en negrita encima de cada barra.
 *   • Fila superior con el % de rechazo del período (rechazadas ÷ auditadas).
 *   • Tooltip por período con el desglose por cliente.
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

    // Plugin: valor encima de cada barra + fila superior con el % de rechazo
    const tendenciaLabelsPlugin = {
        id: 'tendenciaLabels',
        afterDatasetsDraw(chart, args, opts) {
            const { ctx, chartArea } = chart;
            const aprob = opts.aprobadas  || [];
            const rech  = opts.rechazadas || [];
            const metaA = chart.getDatasetMeta(0);
            const metaR = chart.getDatasetMeta(1);
            const xScale = chart.scales.x;

            ctx.save();
            ctx.textAlign = 'center';

            // Valores en negrita sobre su propia barra (solo si > 0)
            ctx.font = `bold 13px ${FONT}`;
            ctx.textBaseline = 'bottom';
            for (let i = 0; i < aprob.length; i++) {
                if (aprob[i] > 0 && metaA.data[i]) {
                    ctx.fillStyle = COLOR_APROB_TXT;
                    ctx.fillText(String(aprob[i]), metaA.data[i].x, metaA.data[i].y - 3);
                }
                if (rech[i] > 0 && metaR.data[i]) {
                    ctx.fillStyle = COLOR_RECH_TXT;
                    ctx.fillText(String(rech[i]), metaR.data[i].x, metaR.data[i].y - 3);
                }
            }

            // Fila superior: nivel de rechazo del período (gris cuando es 0%)
            ctx.font = `bold 14px ${FONT}`;
            ctx.textBaseline = 'top';
            for (let i = 0; i < aprob.length; i++) {
                const total = (aprob[i] || 0) + (rech[i] || 0);
                if (!total) continue;
                const pct = Math.round((rech[i] || 0) / total * 100);
                ctx.fillStyle = pct > 0 ? COLOR_RECH_TXT : COLOR_TICK;
                ctx.fillText(`${pct}%`, xScale.getPixelForValue(i), chartArea.top - 24);
            }

            ctx.restore();
        },
    };

    function render(canvas, data) {
        const labels     = data.labels     || [];
        const aprobadas  = data.aprobadas  || [];
        const rechazadas = data.rechazadas || [];
        const detalles   = data.detalles   || null;
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

        return new window.Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Aprobadas',
                        data: aprobadas,
                        backgroundColor: COLOR_APROB,
                        borderRadius: 4,
                        barPercentage: 0.85,
                        categoryPercentage: 0.62,
                    },
                    {
                        label: 'Rechazadas',
                        data: rechazadas,
                        backgroundColor: COLOR_RECH,
                        borderRadius: 4,
                        barPercentage: 0.85,
                        categoryPercentage: 0.62,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // Reserva la franja superior para la fila de % de rechazo
                layout: { padding: { top: 34 } },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    // Abajo para no chocar con la fila de % de rechazo del borde superior
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 14,
                            usePointStyle: true,
                            pointStyle: 'rectRounded',
                            boxWidth: 12,
                            boxHeight: 12,
                            color: COLOR_INK,
                            font: { family: FONT, size: 13, weight: 'bold' },
                        },
                    },
                    tendenciaLabels: { aprobadas, rechazadas },
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
                                    if (!t) return 'Aprobadas: 0';
                                    return [`Aprobadas: ${t}`, ...fmtDetalle(det && det.aprobadas, t)];
                                }
                                const t = rechazadas[i] || 0;
                                const lines = t
                                    ? [`Rechazadas: ${t}`, ...fmtDetalle(det && det.rechazadas, t)]
                                    : ['Rechazadas: 0'];
                                const total = (aprobadas[i] || 0) + t;
                                if (total) lines.push(`Nivel de rechazo: ${Math.round(t / total * 100)}%`);
                                return lines;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: COLOR_INK, font: { family: FONT, size: 13, weight: 'bold' } },
                    },
                    y: {
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
