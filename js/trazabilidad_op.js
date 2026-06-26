(() => {
    if (!window.AppRouter || window.AppRouter.currentView !== 'trazabilidad_op') {
        return;
    }

    const { useState, useEffect, useMemo, useRef } = React;

    const WEB_APP_URL       = window.APP_CONFIG.IQ.WEB_APP_URL;
    const LOCAL_STORAGE_KEY = window.APP_CONFIG.IQ.LOCAL_STORAGE_KEY;
    const MAX_MOTIVOS = 7;

    // Etiquetas de tipo de tela (igual que iq_data.js)
    const TIPO_TELA_LABELS = {
        '100': 'Produccion', '102': 'Tela para Venta', '103': 'Desarrollo (OF)',
        '104': 'Prueba de lote', '105': 'Prueba validacion de articulo',
        '106': 'Prueba validacion de teñido/disperso', '107': 'Muestra de Venta',
        '108': 'Tela de relleno', '109': 'Prueba de tela/Fundas'
    };

    const tipoTelaLabel = (raw) => {
        const str = String(raw || '').trim();
        if (!str) return '';
        const code = str.includes('→') ? str.split('→')[0].trim() : str;
        return TIPO_TELA_LABELS[code] || str;
    };

    const tipoTelaDisplay = (raw) => {
        const str = String(raw || '').trim();
        if (!str) return '';
        const code = str.includes('→') ? str.split('→')[0].trim() : str;
        const label = TIPO_TELA_LABELS[code];
        return label ? `${code} → ${label}` : str;
    };

    const clean = (v) => String(v == null ? '' : v).trim();

    // Abreviaciones para mostrar en la tabla
    const CLIENT_ABBR = {
        'ALLBIRDS': 'ALLB', 'AM RETAIL': 'AMR', 'AM RETAIL S.A.C.': 'AMR',
        'ATHLETA': 'ATH', 'BANANA': 'BNN', 'COFACO INDUSTRIES': 'COF',
        'DUER': 'DUER', 'LACOSTE': 'LAC', 'LULU': 'LULU',
        'REVTOWN': 'REV', 'SKECHERS': 'SKE', 'THEORY': 'THE',
    };
    // Normalización para el filtro (fusiona variantes de AM RETAIL)
    const CLIENT_NORMALIZE = { 'AM RETAIL S.A.C.': 'AM RETAIL' };

    const clienteAbbr      = (raw) => { const s = clean(raw).toUpperCase(); return CLIENT_ABBR[s] || clean(raw); };
    const normalizeCliente = (raw) => { const s = clean(raw); return CLIENT_NORMALIZE[s] || s; };

    // --- Estado de cada partida (misma lógica que iq_data.js) ---
    const isAprobada = (r) => clean(r.tipo_aprobacion) !== '';
    const getMotivos = (r) => {
        const seen = new Set();
        const out = [];
        for (let i = 1; i <= MAX_MOTIVOS; i++) {
            const m = clean(r[`motivo_rechazo_${i}`]);
            if (m && !seen.has(m)) { seen.add(m); out.push(m); }
        }
        return out;
    };
    const isRechazada = (r) => !isAprobada(r) && getMotivos(r).length > 0;
    const getEstado = (r) => isAprobada(r) ? 'aprobada' : (isRechazada(r) ? 'rechazada' : 'evaluacion');

    const ORDINAL_LABELS = ['1er','2do','3er','4to','5to','6to','7mo'];

    const getRechazosFull = (r) => {
        const out = [];
        for (let i = 1; i <= MAX_MOTIVOS; i++) {
            const motivo = clean(r[`motivo_rechazo_${i}`]);
            if (!motivo) continue;
            out.push({
                label:      ORDINAL_LABELS[i - 1] || `${i}°`,
                motivo,
                fecha:      clean(r[`fecha_rechazo_${i}`]),
                supervisor: clean(r[`supervisor_rechazo_${i}`]),
                turno:      clean(r[`turno_rechazo_${i}`]),
            });
        }
        return out;
    };

    // Resalta los últimos 5 dígitos del cod_art (convención de Trazailidad OP)
    const splitCodArt = (code) => {
        const str = clean(code);
        if (str.length > 5) return [str.slice(0, -5), str.slice(-5)];
        return ['', str];
    };

    // ── Utilidades de fecha y agregación para la gráfica ───────────────────────
    const CHART_MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const CHART_MONTH_MAP = { ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11 };
    // Paleta moderna (Tailwind 500) para clientes — saturada y plana.
    // No incluye rojos: el rojo queda reservado para la línea de rechazos.
    const CHART_CLIENT_COLORS = ['#3b82f6','#f59e0b','#8b5cf6','#10b981','#06b6d4','#ec4899','#6366f1','#84cc16','#14b8a6','#d946ef','#eab308','#64748b'];
    const CHART_RECHAZO_COLOR = '#dc2626';

    // Parsea fechas DD/Mes/YYYY HH:mm AM/PM, ISO o serial Excel (misma lógica que iq_data.js)
    const parseDateish = (value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number' || (typeof value === 'string' && /^\d+(\.\d+)?$/.test(String(value).trim()))) {
            const num = parseFloat(value);
            if (num > 40000 && num < 60000) {
                const excelEpoch = new Date(1899, 11, 30);
                return new Date(excelEpoch.getTime() + num * 86400000);
            }
        }
        const str = String(value).trim();
        if (!str) return null;
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) { const d = new Date(str); return isNaN(d.getTime()) ? null : d; }
        const sp = str.match(/^(\d{1,2})\/([A-Za-záéíóúü]+)\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?)?/i);
        if (sp) {
            const day = parseInt(sp[1],10); const mk = sp[2].toLowerCase().slice(0,3);
            const year = parseInt(sp[3],10); const mi = CHART_MONTH_MAP[mk];
            if (mi === undefined) return null;
            let h = sp[4] ? parseInt(sp[4],10) : 0; const min = sp[5] ? parseInt(sp[5],10) : 0;
            const ap = sp[6] ? sp[6].toUpperCase() : '';
            if (ap === 'PM' && h < 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
            const d = new Date(year, mi, day, h, min, 0); return isNaN(d.getTime()) ? null : d;
        }
        const nm = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (nm) { const d = new Date(parseInt(nm[3],10), parseInt(nm[2],10)-1, parseInt(nm[1],10)); return isNaN(d.getTime()) ? null : d; }
        const fb = new Date(str); return isNaN(fb.getTime()) ? null : fb;
    };

    // Registros de 00:00–05:59 pertenecen al día anterior (turno noche 3T)
    const adjustNightShift = (date) => {
        if (!date) return null;
        if (date.getHours() < 6) return new Date(date.getFullYear(), date.getMonth(), date.getDate()-1, date.getHours(), date.getMinutes(), 0);
        return date;
    };

    // Lunes de la semana de una fecha
    const startOfWeek = (date) => {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff); return d;
    };

    // Número de semana ISO 8601 (misma lógica que iq_data.js)
    const getISOWeek = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const day = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    };

    // Clave (timestamp ordenable) + etiqueta del período de una fecha
    const periodOf = (date, mode) => {
        if (mode === 'semanas') {
            const s = startOfWeek(date);
            return { key: s.getTime(), label: `Sem ${getISOWeek(s)}` };
        }
        const s = new Date(date.getFullYear(), date.getMonth(), 1);
        return { key: s.getTime(), label: `${CHART_MONTH_LABELS[s.getMonth()]} ${String(s.getFullYear()).slice(2)}` };
    };

    // Genera N períodos consecutivos terminando en anchorDate (más antiguo primero)
    const buildPeriods = (anchorDate, mode, n = 7) => {
        const out = [];
        let d = mode === 'semanas' ? startOfWeek(anchorDate) : new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
        for (let i = 0; i < n; i++) {
            out.unshift(periodOf(d, mode));
            d = mode === 'semanas'
                ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7)
                : new Date(d.getFullYear(), d.getMonth() - 1, 1);
        }
        return out;
    };

    // Construye labels, datasets de barras apiladas por cliente y serie de rechazos
    const buildChartData = (records, mode) => {
        const aprob = new Map();   // periodKey → Map<cliente, Set<partidaId>>
        const rech  = new Map();   // periodKey → Map<cliente, conteo de eventos>
        let maxKey = null;
        const track = (key) => { if (maxKey === null || key > maxKey) maxKey = key; };

        records.forEach(r => {
            const cliente = normalizeCliente(clean(r.cliente)) || '(sin cliente)';
            const partidaId = `${clean(r.op_tela)}-${clean(r.partida)}`;
            // Aprobadas → 1 por partida única, ubicada por calidad_fin
            if (clean(r.tipo_aprobacion)) {
                const d = adjustNightShift(parseDateish(r.calidad_fin));
                if (d) {
                    const { key } = periodOf(d, mode); track(key);
                    if (!aprob.has(key)) aprob.set(key, new Map());
                    const byCli = aprob.get(key);
                    if (!byCli.has(cliente)) byCli.set(cliente, new Set());
                    byCli.get(cliente).add(partidaId);
                }
            }
            // Rechazos → 1 por cada fecha_rechazo_N con motivo, ubicado por su fecha
            for (let i = 1; i <= MAX_MOTIVOS; i++) {
                if (!clean(r[`motivo_rechazo_${i}`])) continue;
                const d = adjustNightShift(parseDateish(r[`fecha_rechazo_${i}`]));
                if (!d) continue;
                const { key } = periodOf(d, mode); track(key);
                if (!rech.has(key)) rech.set(key, new Map());
                const byCli = rech.get(key);
                byCli.set(cliente, (byCli.get(cliente) || 0) + 1);
            }
        });

        const anchor = maxKey !== null ? new Date(maxKey) : new Date();
        const periods = buildPeriods(anchor, mode, 7);
        const keys = periods.map(p => p.key);
        const labels = periods.map(p => p.label);

        // Totales de aprobadas por cliente en la ventana → orden mayor a menor
        const totals = new Map();
        keys.forEach(k => {
            const byCli = aprob.get(k); if (!byCli) return;
            byCli.forEach((set, cli) => totals.set(cli, (totals.get(cli) || 0) + set.size));
        });
        const clientesAprob = [...totals.entries()].filter(([,t]) => t > 0).sort((a,b) => b[1]-a[1]).map(([c]) => c);

        // Color por cliente: primero los de las barras (en orden), luego los que solo tienen rechazos
        const colorByCliente = new Map();
        let ci = 0;
        clientesAprob.forEach(cli => { colorByCliente.set(cli, CHART_CLIENT_COLORS[ci % CHART_CLIENT_COLORS.length]); ci++; });
        keys.forEach(k => {
            const m = rech.get(k); if (!m) return;
            m.forEach((_, cli) => { if (!colorByCliente.has(cli)) { colorByCliente.set(cli, CHART_CLIENT_COLORS[ci % CHART_CLIENT_COLORS.length]); ci++; } });
        });

        const clienteDatasets = clientesAprob.map(cli => ({
            label: clienteAbbr(cli),
            data: keys.map(k => { const m = aprob.get(k); return m && m.has(cli) ? m.get(cli).size : 0; }),
            backgroundColor: colorByCliente.get(cli),
            stack: 'aprob',
            yAxisID: 'y',
            order: 2,
        }));

        // Totales por período + detalle de rechazos por cliente (para los tooltips)
        const aprobTotals = keys.map(k => { const m = aprob.get(k); if (!m) return 0; let s = 0; m.forEach(set => s += set.size); return s; });
        const rechazosData = keys.map(k => { const m = rech.get(k); if (!m) return 0; let s = 0; m.forEach(v => s += v); return s; });
        const rechDetail = keys.map(k => {
            const m = rech.get(k); if (!m) return [];
            return [...m.entries()].sort((a,b) => b[1]-a[1]).map(([cli, v]) => ({ label: clienteAbbr(cli), value: v }));
        });

        const hasData = clientesAprob.length > 0 || rechazosData.some(v => v > 0);
        return { labels, clienteDatasets, rechazosData, aprobTotals, rechDetail, hasData };
    };

    // Plugin: dibuja el total de aprobadas encima de cada columna (azul) y el total
    // de rechazos junto a cada punto de la línea (rojo), ambos en negrita, evitando
    // que ambas etiquetas se solapen cuando el punto cae cerca del tope de la barra.
    const totalLabelsPlugin = {
        id: 'totalLabels',
        afterDatasetsDraw(chart, args, opts) {
            const { ctx } = chart;
            const aprobTotals = opts.aprobTotals || [];
            const rechTotals  = opts.rechTotals || [];
            const datasets = chart.data.datasets;
            const barIndex  = datasets.findIndex(d => (d.type || 'bar') === 'bar');
            const lineIndex = datasets.findIndex(d => d.type === 'line' || d.label === 'Rechazos');
            const yScale  = chart.scales.y;
            const barMeta  = barIndex  >= 0 ? chart.getDatasetMeta(barIndex)  : null;
            const lineMeta = lineIndex >= 0 ? chart.getDatasetMeta(lineIndex) : null;
            const n = chart.data.labels.length;

            ctx.save();
            ctx.font = "bold 16px 'Calibri', Arial, sans-serif";
            ctx.textAlign = 'center';

            for (let i = 0; i < n; i++) {
                const x = barMeta ? barMeta.data[i].x : (lineMeta ? lineMeta.data[i].x : null);
                if (x == null) continue;
                const aTot = aprobTotals[i] || 0;
                const rTot = rechTotals[i] || 0;
                const yBar = aTot ? yScale.getPixelForValue(aTot) : null;
                const yPt  = lineMeta ? lineMeta.data[i].y : null;

                // Total de aprobadas (azul) encima de la columna
                if (aTot) {
                    ctx.fillStyle = '#2563eb';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(String(aTot), x, yBar - 4);
                }
                // Total de rechazos (rojo): encima del punto, o debajo si está pegado a la barra
                if (rTot && yPt != null) {
                    ctx.fillStyle = CHART_RECHAZO_COLOR;
                    if (yBar != null && yPt >= yBar - 16) {
                        ctx.textBaseline = 'top';
                        ctx.fillText(String(rTot), x, yPt + 7);
                    } else {
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(String(rTot), x, yPt - 7);
                    }
                }
            }

            ctx.restore();
        },
    };

    // --- Tarjeta de aprobación (estilo Trazailidad OP) ---
    const APROBACION_STYLE = {
        tolerancia:   { bg: 'bg-amber-100',   text: 'text-amber-800',  border: 'border-amber-400' },
        autorizacion: { bg: 'bg-blue-100',    text: 'text-blue-800',   border: 'border-blue-400'  },
        default:      { bg: 'bg-[#d9ead3]',   text: 'text-[#3f7550]', border: 'border-[#3f7550]' },
    };
    const getAprobacionStyle = (tipo) => {
        const t = tipo.toUpperCase();
        if (t.includes('TOLERANCIA'))   return APROBACION_STYLE.tolerancia;
        if (t.includes('AUTORIZACION')) return APROBACION_STYLE.autorizacion;
        return APROBACION_STYLE.default;
    };

    const AprobacionCard = ({ r }) => {
        const tipo = clean(r.tipo_aprobacion);
        if (!tipo) return <span className="text-[#9ca3af] italic text-xs">—</span>;
        const fecha      = clean(r.fecha_aprobacion) || clean(r.calidad_fin);
        const quien      = clean(r.quien_aprobo);
        const supervisor = clean(r.supervisor_aprobacion);
        const turno      = clean(r.turno_aprobacion);
        const st = getAprobacionStyle(tipo);
        return (
            <div className={`bg-white rounded-lg border-2 ${st.border} overflow-hidden shadow-sm`}>
                <div className={`${st.bg} ${st.text} font-bold text-[13px] px-1.5 py-0.5 text-center border-b-2 ${st.border} uppercase tracking-wide`}>
                    {tipo}
                </div>
                <div className="px-1.5 py-1">
                    <div className="flex justify-between items-center gap-1.5 mb-1">
                        <span className="text-[13px] text-black whitespace-nowrap">{fecha || '—'}</span>
                        {quien && (
                            <span className="bg-[#4f8f62] text-white font-bold px-1.5 py-px rounded text-[13px] uppercase whitespace-nowrap">{quien}</span>
                        )}
                    </div>
                    <hr className="border-t border-[#e3ecd9] mb-1" />
                    <div className="flex justify-between items-center gap-1.5">
                        <span className="text-[13px] text-black uppercase truncate" title={supervisor}>{supervisor || '—'}</span>
                        <span className="text-[13px] text-black whitespace-nowrap">{turno || ''}</span>
                    </div>
                </div>
            </div>
        );
    };

    // --- Iconos SVG ---
    const Icon = ({ d, size = 18 }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {d}
        </svg>
    );
    const IconSearch = () => <Icon d={<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>} />;
    const IconRefresh = () => <Icon d={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>} />;
    const IconPrint = () => <Icon d={<><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>} />;
    const IconChart = () => <Icon d={<><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" /></>} />;

    const STATUS_META = {
        aprobada:   { label: 'Aprobada',      dot: '#16a34a', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        rechazada:  { label: 'Rechazada',     dot: '#dc2626', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
        evaluacion: { label: 'En evaluación', dot: '#d39b36', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    };

    // --- Modal con gráfica combinada (barras apiladas por cliente + línea de rechazos) ---
    const ChartModal = ({ records, onClose }) => {
        const [mode, setMode] = useState('meses'); // 'meses' | 'semanas'
        const canvasRef = useRef(null);
        const chartRef  = useRef(null);

        const chartData = useMemo(() => buildChartData(records, mode), [records, mode]);

        // Cerrar con tecla Escape
        useEffect(() => {
            const onKey = (e) => { if (e.key === 'Escape') onClose(); };
            window.addEventListener('keydown', onKey);
            return () => window.removeEventListener('keydown', onKey);
        }, [onClose]);

        // Crear / recrear el gráfico al cambiar datos o modo
        useEffect(() => {
            if (!canvasRef.current || !window.Chart) return;
            const { labels, clienteDatasets, rechazosData, aprobTotals, rechDetail } = chartData;
            // Máximo común para ambos ejes Y → escala uniforme (con margen para las etiquetas)
            const peak = Math.max(0, ...aprobTotals, ...rechazosData);
            const axisMax = peak > 0 ? Math.ceil(peak * 1.12 / 5) * 5 : 10;
            if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
            chartRef.current = new window.Chart(canvasRef.current.getContext('2d'), {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        ...clienteDatasets,
                        {
                            type: 'line',
                            label: 'Rechazos',
                            data: rechazosData,
                            borderColor: CHART_RECHAZO_COLOR,
                            backgroundColor: CHART_RECHAZO_COLOR,
                            yAxisID: 'y1',
                            order: 1,
                            tension: 0.3,
                            borderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            pointHitRadius: 12,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    // 'nearest' + intersect: distingue si el cursor está sobre una barra o sobre el punto de rechazos
                    interaction: { mode: 'nearest', intersect: true },
                    plugins: {
                        legend: { display: false }, // Usamos una leyenda HTML personalizada (ver más abajo)
                        totalLabels: { aprobTotals, rechTotals: rechazosData },
                        tooltip: {
                            displayColors: false,
                            callbacks: {
                                title: (items) => items.length ? items[0].label : '',
                                label: (item) => {
                                    const idx = item.dataIndex;
                                    const esRechazos = item.dataset.type === 'line' || item.dataset.label === 'Rechazos';
                                    if (esRechazos) {
                                        const total = rechazosData[idx] || 0;
                                        if (!total) return 'Sin rechazos';
                                        const out = [`Rechazos: ${total}`];
                                        (rechDetail[idx] || []).forEach(d => {
                                            const pct = Math.round(d.value / total * 100);
                                            out.push(`   ${d.label}: ${d.value}  (${pct}%)`);
                                        });
                                        return out;
                                    }
                                    const total = aprobTotals[idx] || 0;
                                    if (!total) return 'Sin aprobadas';
                                    const out = [`Aprobadas: ${total}`];
                                    clienteDatasets.forEach(ds => {
                                        const v = ds.data[idx] || 0;
                                        if (!v) return;
                                        const pct = Math.round(v / total * 100);
                                        out.push(`   ${ds.label}: ${v}  (${pct}%)`);
                                    });
                                    return out;
                                },
                            },
                        },
                    },
                    scales: {
                        x:  { stacked: true, grid: { display: false },
                              ticks: { font: { size: 14, weight: 'bold' } } },
                        y:  { stacked: true, beginAtZero: true, position: 'left', max: axisMax,
                              title: { display: true, text: 'OP-Partidas aprobadas', font: { size: 14, weight: 'bold' } },
                              ticks: { display: false } },
                        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, max: axisMax,
                              title: { display: true, text: 'Rechazos', font: { size: 14, weight: 'bold' } },
                              ticks: { display: false } },
                    },
                },
                plugins: [totalLabelsPlugin],
            });
            return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
        }, [chartData]);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden" onClick={onClose}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1100px] max-h-[90vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}>
                    {/* Encabezado */}
                    <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#c8d8bd] bg-[#dfeccd]">
                        <h2 className="text-base font-extrabold text-[#3f7550]">OP-Partidas aprobadas por cliente y rechazos</h2>
                        <div className="flex items-center gap-2">
                            <div className="flex rounded-md overflow-hidden border border-[#4f8f62]">
                                <button onClick={() => setMode('meses')}
                                    className={`px-3 py-1 text-xs font-bold transition-colors ${mode==='meses' ? 'bg-[#4f8f62] text-white' : 'bg-white text-[#3f7550] hover:bg-[#eef5e8]'}`}>
                                    Meses
                                </button>
                                <button onClick={() => setMode('semanas')}
                                    className={`px-3 py-1 text-xs font-bold transition-colors ${mode==='semanas' ? 'bg-[#4f8f62] text-white' : 'bg-white text-[#3f7550] hover:bg-[#eef5e8]'}`}>
                                    Semanas
                                </button>
                            </div>
                            <button onClick={onClose} title="Cerrar"
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-white border border-[#c8d8bd] hover:bg-rose-50 text-[#3f7550] text-lg">✕</button>
                        </div>
                    </div>
                    {/* Cuerpo */}
                    <div className="p-5 flex-1 overflow-auto">
                        {/* Leyenda personalizada: pill "Aprobadas" agrupando clientes + Rechazos con círculo */}
                        {chartData.hasData && (
                            <div className="flex justify-end items-start gap-4 mb-3 pr-1">
                                <fieldset className="border border-[#c8d8bd] rounded-lg px-3 pt-0.5 pb-1.5">
                                    <legend className="text-[12px] font-bold text-[#3f7550] px-1.5">Aprobadas</legend>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        {chartData.clienteDatasets.map(ds => (
                                            <span key={ds.label} className="inline-flex items-center gap-1.5 text-[12px] text-black">
                                                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: ds.backgroundColor }}></span>
                                                {ds.label}
                                            </span>
                                        ))}
                                    </div>
                                </fieldset>
                                <div className="flex items-center gap-1.5 text-[12px] text-black self-center">
                                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: CHART_RECHAZO_COLOR }}></span>
                                    Rechazos
                                </div>
                            </div>
                        )}
                        <div className="relative" style={{ height: '60vh', minHeight: '360px' }}>
                            <canvas ref={canvasRef}></canvas>
                            {!chartData.hasData && (
                                <div className="absolute inset-0 flex items-center justify-center text-[#667466]">
                                    No hay datos para graficar.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    function App() {
        const [records, setRecords] = useState([]);
        const [loading, setLoading]  = useState(true);
        const [error, setError]      = useState('');

        const [search, setSearch]           = useState('');
        const [fCliente, setFCliente]       = useState('');
        const [fTipoTela, setFTipoTela]     = useState('');
        const [fEstado, setFEstado]         = useState('evaluacion');
        const [showChart, setShowChart]     = useState(false);

        const loadData = async (force = false) => {
            setLoading(true);
            setError('');
            // Mostrar al instante lo cacheado, luego refrescar desde el servidor.
            if (!force) {
                try {
                    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed) && parsed.length) setRecords(parsed);
                    }
                } catch (e) { /* ignore */ }
            }
            try {
                const url = new URL(WEB_APP_URL);
                url.searchParams.set('action', 'list');
                const res = await fetch(url.toString(), { method: 'GET', headers: { Accept: 'application/json' } });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = JSON.parse(await res.text());
                if (!data.success) throw new Error(data.message || 'Error de API');
                const recs = data.records || [];
                setRecords(recs);
                try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recs)); } catch (e) { /* quota */ }
            } catch (e) {
                console.error('[trazabilidad_op] Error cargando datos:', e);
                if (records.length === 0) setError('No se pudieron cargar los datos. Verifique su conexión y vuelva a intentar.');
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => { loadData(false); }, []);

        const clientes = useMemo(
            () => [...new Set(records.map(r => normalizeCliente(clean(r.cliente))).filter(Boolean))].sort(),
            [records]
        );
        const tiposTela = useMemo(
            () => [...new Set(records.map(r => clean(r.tipo_tela)).filter(Boolean))].sort(),
            [records]
        );

        const filtered = useMemo(() => {
            const q = search.trim().toLowerCase();
            return records.filter(r => {
                if (fCliente && normalizeCliente(clean(r.cliente)) !== fCliente) return false;
                if (fTipoTela && clean(r.tipo_tela) !== fTipoTela) return false;
                if (fEstado && getEstado(r) !== fEstado) return false;
                if (!q) return true;

                // Búsqueda "OP-Partida" estricta cuando hay guion
                if (q.includes('-')) {
                    const [op, ptda] = q.split('-').map(s => s.trim());
                    return clean(r.op_tela).toLowerCase().includes(op) &&
                           clean(r.partida).toLowerCase().includes(ptda);
                }
                const haystack = [
                    r.op_tela, r.partida, r.color, r.cliente, r.cod_art, r.articulo,
                    r.tipo_aprobacion, r.supervisor_aprobacion,
                    ...getMotivos(r)
                ].map(clean).join(' ').toLowerCase();
                return haystack.includes(q);
            });
        }, [records, search, fCliente, fTipoTela, fEstado]);

        // Pintado tipo "zebra" agrupado por OP-Partida: las filas con la misma
        // OP-Partida comparten color y el tono solo cambia al cambiar de OP-Partida.
        const rowShade = useMemo(() => {
            let g = 0;
            let prev = null;
            return filtered.map(r => {
                const key = `${clean(r.op_tela)}-${clean(r.partida)}`;
                if (prev !== null && key !== prev) g++;
                prev = key;
                return g % 2;
            });
        }, [filtered]);

        const homeHref = window.AppRouter.href('home');

        return (
            <div className="traz-op-root min-h-screen bg-[#f4f7ef] text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
                {/* ───────── ENCABEZADO + CONTROLES (no se imprime) ───────── */}
                <div className="print:hidden bg-white border-b border-[#c8d8bd] shadow-sm">
                    <div className="max-w-[1500px] mx-auto px-5 py-3 flex items-center gap-3">

                        {/* Icono + Título — ocupa el espacio sobrante */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="bg-[#4f8f62] text-white w-9 h-9 rounded-lg flex items-center justify-center shadow shrink-0">
                                <Icon size={20} d={<><path d="M3 3v18h18" /><rect x="7" y="13" width="3" height="5" /><rect x="12" y="9" width="3" height="9" /><rect x="17" y="6" width="3" height="12" /></>} />
                            </div>
                            <h1 className="text-base text-[#3f7550] truncate">Trazabilidad OP-Partida T-ACABADA</h1>
                        </div>

                        {/* Filtros + Botones — pegados a la derecha */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Buscar */}
                            <div className="relative w-[180px]">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#4f8f62] pointer-events-none"><IconSearch /></div>
                                <input type="text" value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) setFEstado(''); }}
                                    placeholder="OP / cliente…"
                                    title="Buscar por OP-Partida / cliente / color / artículo / motivo"
                                    className="w-full pl-8 pr-2 py-1.5 text-xs border border-[#c8d8bd] rounded-md bg-white outline-none focus:border-[#4f8f62] focus:ring-2 focus:ring-[#4f8f62]/20" />
                            </div>
                            {/* Cliente */}
                            <select value={fCliente} onChange={e => setFCliente(e.target.value)}
                                title="Filtrar por cliente"
                                className="px-2 py-1.5 text-xs border border-[#c8d8bd] rounded-md bg-white outline-none focus:border-[#4f8f62] w-[110px]">
                                <option value="">Cliente</option>
                                {clientes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {/* Tipo tela */}
                            <select value={fTipoTela} onChange={e => setFTipoTela(e.target.value)}
                                title="Filtrar por tipo de tela"
                                className="px-2 py-1.5 text-xs border border-[#c8d8bd] rounded-md bg-white outline-none focus:border-[#4f8f62] w-[150px]">
                                <option value="">Tipo tela</option>
                                {tiposTela.map(t => <option key={t} value={t}>{tipoTelaDisplay(t)}</option>)}
                            </select>
                            {/* Estado */}
                            <select value={fEstado} onChange={e => setFEstado(e.target.value)}
                                title="Filtrar por estado"
                                className="px-2 py-1.5 text-xs border border-[#c8d8bd] rounded-md bg-white outline-none focus:border-[#4f8f62] w-[110px]">
                                <option value="">Estado</option>
                                <option value="aprobada">Aprobadas</option>
                                <option value="rechazada">Rechazadas</option>
                                <option value="evaluacion">En evaluación</option>
                            </select>
                            {/* Separador */}
                            <div className="w-px h-6 bg-[#c8d8bd]"></div>
                            {/* Botones */}
                            <button onClick={() => loadData(true)} disabled={loading}
                                className="flex items-center justify-center bg-[#4f8f62] hover:bg-[#3f7550] disabled:opacity-50 text-white w-9 h-9 rounded-md transition-colors shadow-sm">
                                <IconRefresh />
                            </button>
                            <button onClick={() => setShowChart(true)} title="Ver gráfica"
                                className="flex items-center justify-center bg-white border border-[#c8d8bd] hover:bg-[#eef5e8] text-[#3f7550] w-9 h-9 rounded-md transition-colors shadow-sm">
                                <IconChart />
                            </button>
                            <button onClick={() => window.print()} disabled={filtered.length === 0}
                                className="flex items-center justify-center bg-white border border-[#c8d8bd] hover:bg-[#eef5e8] disabled:opacity-50 text-[#3f7550] w-9 h-9 rounded-md transition-colors shadow-sm">
                                <IconPrint />
                            </button>
                            <a href={homeHref} title="Volver al menú"
                                className="flex items-center justify-center w-9 h-9 bg-[#3f7550] hover:bg-[#2f5a3c] text-white rounded-md text-lg no-underline transition-colors shadow-sm">←</a>
                        </div>
                    </div>
                </div>

                {/* ───────── GRILLA ───────── */}
                <div className="traz-op-wrap max-w-[1500px] mx-auto px-5 py-3">
                    <div className="traz-op-card bg-white rounded-xl border border-[#c8d8bd] shadow-sm overflow-hidden">
                        <div className="traz-op-scroll overflow-x-hidden overflow-y-auto" style={{ height: 'calc(100vh - 90px)' }}>
                            <table className="w-full table-fixed border-collapse" style={{ fontFamily: "'Calibri', 'Arial Narrow', Arial, sans-serif", fontSize: '13px', fontWeight: 'normal' }}>
                                <colgroup>
                                    <col style={{ width: '3.5%' }} />
                                    <col style={{ width: '5%' }} />
                                    <col style={{ width: '6%' }} />
                                    <col style={{ width: '3%' }} />
                                    <col style={{ width: '7.5%' }} />
                                    <col style={{ width: '24%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '9%' }} />
                                </colgroup>
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-[#dfeccd] text-[#3f7550] text-[13px] uppercase tracking-wide">
                                        <th className="px-3 py-2.5 text-center border border-[#4a4a4a]">Cliente</th>
                                        <th className="px-3 py-2.5 text-center border border-[#4a4a4a]">OP-Ptda</th>
                                        <th className="px-3 py-2.5 text-center border border-[#4a4a4a]">Color</th>
                                        <th className="px-3 py-2.5 text-center border border-[#4a4a4a]">KG</th>
                                        <th className="px-3 py-2.5 text-center border border-[#4a4a4a]">Cód. Art. / Artículo</th>
                                        <th className="px-3 py-2.5 text-center border border-[#4a4a4a]">Motivos de Rechazo</th>
                                        <th className="px-3 py-2.5 text-center border border-[#4a4a4a]">Tipo Aprobación</th>
                                        <th className="px-3 py-2.5 text-center border border-[#4a4a4a]">Observación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && records.length === 0 ? (
                                        <tr><td colSpan="8" className="px-6 py-16 text-center text-[#667466]">Cargando registros…</td></tr>
                                    ) : error ? (
                                        <tr><td colSpan="8" className="px-6 py-16 text-center text-rose-600 font-semibold">{error}</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan="8" className="px-6 py-16 text-center text-[#667466]">Sin coincidencias. Ajuste la búsqueda o los filtros.</td></tr>
                                    ) : filtered.map((r, i) => {
                                        const motivos = getMotivos(r);
                                        const estado = getEstado(r);
                                        const meta = STATUS_META[estado];
                                        const [codPrefix, codTail] = splitCodArt(r.cod_art);
                                        return (
                                            <tr key={`${clean(r.op_tela)}-${clean(r.partida)}-${i}`}
                                                className={`align-top hover:bg-[#eef5e8] transition-colors ${rowShade[i] ? 'bg-[#f9fbf5]' : 'bg-white'}`}>
                                                {/* Cliente */}
                                                <td className="px-3 py-2.5 border border-[#4a4a4a]">
                                                    <span className="block text-[13px] text-black leading-snug" title={clean(r.cliente)}>
                                                        {clienteAbbr(r.cliente) || '—'}
                                                    </span>
                                                </td>
                                                {/* OP-Partida */}
                                                <td className="px-3 py-2.5 border border-[#4a4a4a]">
                                                    <span className="block text-[13px] text-black leading-snug line-clamp-2 break-words font-bold">
                                                        {clean(r.op_tela) || '—'}-{clean(r.partida) || '—'}
                                                    </span>
                                                </td>
                                                {/* Color */}
                                                <td className="px-3 py-2.5 border border-[#4a4a4a]">
                                                    <span className="block text-[13px] text-black leading-snug line-clamp-2 break-words" title={clean(r.color)}>
                                                        {clean(r.color) || '—'}
                                                    </span>
                                                </td>
                                                {/* Peso */}
                                                <td className="px-3 py-2.5 text-right tabular-nums text-[13px] text-black border border-[#4a4a4a]">
                                                    {clean(r.peso_kg_crudo) || '—'}
                                                </td>
                                                {/* Cod Art / Articulo */}
                                                <td className="px-3 py-2.5 border border-[#4a4a4a]">
                                                    <span className="block text-[13px] text-black leading-tight">
                                                        {codPrefix}<span className="text-rose-600 font-bold">{codTail || '—'}</span>
                                                    </span>
                                                    <span className="block text-[13px] text-[#667466] uppercase leading-snug line-clamp-2 break-words" title={clean(r.articulo)}>
                                                        {clean(r.articulo) || 'Artículo sin especificar'}
                                                    </span>
                                                </td>
                                                {/* Rechazo */}
                                                <td className="px-3 py-2.5 align-top border border-[#4a4a4a]">
                                                    {(() => {
                                                        const rechazos = getRechazosFull(r);
                                                        if (rechazos.length === 0) return (
                                                            <span className="text-[#9ca3af] italic text-xs">Sin rechazos</span>
                                                        );
                                                        return (
                                                            <div className="rounded-lg border border-[#c8d8bd] overflow-hidden shadow-sm">
                                                                {rechazos.map((rec, k) => (
                                                                    <div key={k}
                                                                        className={`grid items-center gap-x-2 px-2 py-1.5 ${k > 0 ? 'border-t border-[#e3ecd9]' : ''} ${k % 2 === 0 ? 'bg-white' : 'bg-[#f9fbf5]'}`}
                                                                        style={{ gridTemplateColumns: '30px 142px auto 1fr' }}>
                                                                        <span className="text-[13px] text-[#3f7550] uppercase">{rec.label}</span>
                                                                        <span className="text-[13px] text-black">{rec.fecha || '—'}</span>
                                                                        <span className="bg-yellow-300 text-slate-900 font-bold px-2 py-0.5 rounded border border-yellow-400 text-[13px] uppercase whitespace-nowrap">{rec.motivo}</span>
                                                                        <span className="text-[13px] text-black uppercase truncate text-right" title={`${rec.supervisor}${rec.turno ? ` - ${rec.turno}` : ''}`}>
                                                                            {rec.supervisor || '—'}{rec.turno ? ` - ${rec.turno}` : ''}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                {/* Tipo Aprobación — tarjeta */}
                                                <td className="px-3 py-2.5 align-top border border-[#4a4a4a]">
                                                    <AprobacionCard r={r} />
                                                </td>
                                                {/* Observación Calidad */}
                                                <td className="px-3 py-2.5 align-top border border-[#4a4a4a]">
                                                    <span className="block text-[13px] text-black leading-snug break-words">
                                                        {clean(r.observacion_calidad) || ''}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {showChart && <ChartModal records={records} onClose={() => setShowChart(false)} />}
            </div>
        );
    }

    const root = document.getElementById('root');
    if (root) {
        ReactDOM.createRoot(root).render(<App />);
    }
})();
