(() => {
    if (!window.AppRouter || window.AppRouter.currentView !== 'trazabilidad_op') {
        return;
    }

    const { useState, useEffect, useMemo } = React;

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
                label:      `${ORDINAL_LABELS[i - 1] || `${i}°`} RECHAZO`,
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

    // --- Tarjeta de aprobación (estilo Trazailidad OP) ---
    const AprobacionCard = ({ r }) => {
        const tipo = clean(r.tipo_aprobacion);
        if (!tipo) return <span className="text-[#9ca3af] italic text-xs">—</span>;
        const fecha      = clean(r.fecha_aprobacion) || clean(r.calidad_fin);
        const quien      = clean(r.quien_aprobo);
        const supervisor = clean(r.supervisor_aprobacion);
        const turno      = clean(r.turno_aprobacion);
        return (
            <div className="bg-white rounded-lg border-2 border-[#3f7550] overflow-hidden shadow-sm">
                <div className="bg-[#d9ead3] text-[#3f7550] font-extrabold text-[11px] px-2 py-1.5 text-center border-b-2 border-[#3f7550] uppercase tracking-wide">
                    {tipo}
                </div>
                <div className="p-2">
                    <div className="flex justify-between items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-[#2f3b2f] whitespace-nowrap">{fecha || '—'}</span>
                        {quien && (
                            <span className="bg-[#4f8f62] text-white font-black px-2 py-0.5 rounded text-[11px] uppercase whitespace-nowrap">{quien}</span>
                        )}
                    </div>
                    <hr className="border-t border-[#e3ecd9] mb-1.5" />
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-[11px] font-black text-[#2f3b2f] uppercase truncate" title={supervisor}>{supervisor || '—'}</span>
                        <span className="text-[11px] font-black text-[#2f3b2f] whitespace-nowrap">{turno || ''}</span>
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

    const STATUS_META = {
        aprobada:   { label: 'Aprobada',      dot: '#16a34a', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        rechazada:  { label: 'Rechazada',     dot: '#dc2626', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
        evaluacion: { label: 'En evaluación', dot: '#d39b36', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    };

    function App() {
        const [records, setRecords] = useState([]);
        const [loading, setLoading]  = useState(true);
        const [error, setError]      = useState('');

        const [search, setSearch]           = useState('');
        const [fCliente, setFCliente]       = useState('');
        const [fTipoTela, setFTipoTela]     = useState('');
        const [fEstado, setFEstado]         = useState('evaluacion');

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
            <div className="traz-op-root min-h-screen bg-[#f4f7ef] text-[#2f3b2f]" style={{ fontFamily: 'Arial, sans-serif' }}>
                {/* ───────── ENCABEZADO + CONTROLES (no se imprime) ───────── */}
                <div className="print:hidden bg-white border-b border-[#c8d8bd] shadow-sm">
                    <div className="max-w-[1500px] mx-auto px-5 py-3 flex items-center gap-3">

                        {/* Icono + Título — ocupa el espacio sobrante */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="bg-[#4f8f62] text-white w-9 h-9 rounded-lg flex items-center justify-center shadow shrink-0">
                                <Icon size={20} d={<><path d="M3 3v18h18" /><rect x="7" y="13" width="3" height="5" /><rect x="12" y="9" width="3" height="9" /><rect x="17" y="6" width="3" height="12" /></>} />
                            </div>
                            <h1 className="text-base font-extrabold text-[#3f7550] truncate">Trazabilidad OP-Partida T-ACABADA</h1>
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
                            <button onClick={() => window.print()} disabled={filtered.length === 0}
                                className="flex items-center justify-center bg-white border border-[#c8d8bd] hover:bg-[#eef5e8] disabled:opacity-50 text-[#3f7550] w-9 h-9 rounded-md transition-colors shadow-sm">
                                <IconPrint />
                            </button>
                            <a href={homeHref} title="Volver al menú"
                                className="flex items-center justify-center w-9 h-9 bg-[#3f7550] hover:bg-[#2f5a3c] text-white rounded-md text-lg font-bold no-underline transition-colors shadow-sm">←</a>
                        </div>
                    </div>
                </div>

                {/* ───────── GRILLA ───────── */}
                <div className="traz-op-wrap max-w-[1500px] mx-auto px-5 py-3">
                    <div className="traz-op-card bg-white rounded-xl border border-[#c8d8bd] shadow-sm overflow-hidden">
                        <div className="traz-op-scroll overflow-x-hidden overflow-y-auto" style={{ height: 'calc(100vh - 90px)' }}>
                            <table className="w-full table-fixed text-sm">
                                <colgroup>
                                    <col style={{ width: '3%' }} />
                                    <col style={{ width: '2%' }} />
                                    <col style={{ width: '5%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '3%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '17%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '6%' }} />
                                </colgroup>
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-[#dfeccd] text-[#3f7550] text-[11px] uppercase tracking-wide">
                                        <th className="px-3 py-2.5 text-left font-extrabold border-b border-[#a9bf9a]">Cliente</th>
                                        <th className="px-3 py-2.5 text-center font-extrabold border-b border-[#a9bf9a]">Tipo</th>
                                        <th className="px-3 py-2.5 text-left font-extrabold border-b border-[#a9bf9a]">OP-Partida</th>
                                        <th className="px-3 py-2.5 text-left font-extrabold border-b border-[#a9bf9a]">Color</th>
                                        <th className="px-3 py-2.5 text-right font-extrabold border-b border-[#a9bf9a]">Peso kg</th>
                                        <th className="px-3 py-2.5 text-left font-extrabold border-b border-[#a9bf9a]">Cód. Art. / Artículo</th>
                                        <th className="px-3 py-2.5 text-left font-extrabold border-b border-[#a9bf9a]">Rechazo</th>
                                        <th className="px-3 py-2.5 text-left font-extrabold border-b border-[#a9bf9a]">Tipo Aprobación</th>
                                        <th className="px-3 py-2.5 text-center font-extrabold border-b border-[#a9bf9a]">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && records.length === 0 ? (
                                        <tr><td colSpan="9" className="px-6 py-16 text-center text-[#667466]">Cargando registros…</td></tr>
                                    ) : error ? (
                                        <tr><td colSpan="9" className="px-6 py-16 text-center text-rose-600 font-semibold">{error}</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan="9" className="px-6 py-16 text-center text-[#667466]">Sin coincidencias. Ajuste la búsqueda o los filtros.</td></tr>
                                    ) : filtered.map((r, i) => {
                                        const motivos = getMotivos(r);
                                        const estado = getEstado(r);
                                        const meta = STATUS_META[estado];
                                        const [codPrefix, codTail] = splitCodArt(r.cod_art);
                                        return (
                                            <tr key={`${clean(r.op_tela)}-${clean(r.partida)}-${i}`}
                                                className={`align-top border-b border-[#e3ecd9] hover:bg-[#eef5e8] transition-colors ${rowShade[i] ? 'bg-[#f9fbf5]' : 'bg-white'}`}>
                                                {/* Cliente */}
                                                <td className="px-3 py-2.5">
                                                    <span className="block text-xs text-[#2f3b2f] leading-snug font-bold" title={clean(r.cliente)}>
                                                        {clienteAbbr(r.cliente) || '—'}
                                                    </span>
                                                </td>
                                                {/* Tipo (código numérico) */}
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="block text-xs text-[#2f3b2f] leading-snug" title={tipoTelaDisplay(r.tipo_tela)}>
                                                        {(() => { const s = clean(r.tipo_tela); return s.includes('→') ? s.split('→')[0].trim() : s || '—'; })()}
                                                    </span>
                                                </td>
                                                {/* OP-Partida */}
                                                <td className="px-3 py-2.5">
                                                    <span className="block text-xs text-[#2f3b2f] leading-snug line-clamp-2 break-words">
                                                        {clean(r.op_tela) || '—'}-{clean(r.partida) || '—'}
                                                    </span>
                                                </td>
                                                {/* Color */}
                                                <td className="px-3 py-2.5">
                                                    <span className="block text-xs text-[#2f3b2f] leading-snug line-clamp-2 break-words" title={clean(r.color)}>
                                                        {clean(r.color) || '—'}
                                                    </span>
                                                </td>
                                                {/* Peso */}
                                                <td className="px-3 py-2.5 text-right font-bold tabular-nums text-xs text-[#2f3b2f]">
                                                    {clean(r.peso_kg_crudo) || '—'}
                                                </td>
                                                {/* Cod Art / Articulo */}
                                                <td className="px-3 py-2.5">
                                                    <span className="block text-xs font-bold text-[#2f3b2f] leading-tight">
                                                        {codPrefix}<span className="text-rose-600 font-extrabold">{codTail || '—'}</span>
                                                    </span>
                                                    <span className="block text-[10px] text-[#667466] uppercase leading-snug line-clamp-2 break-words" title={clean(r.articulo)}>
                                                        {clean(r.articulo) || 'Artículo sin especificar'}
                                                    </span>
                                                </td>
                                                {/* Motivos */}
                                                <td className="px-3 py-2.5 align-top">
                                                    {(() => {
                                                        const rechazos = getRechazosFull(r);
                                                        if (rechazos.length === 0) return (
                                                            <span className="text-[#9ca3af] italic text-xs">Sin rechazos</span>
                                                        );
                                                        return (
                                                            <div className="flex flex-col gap-1.5">
                                                                {rechazos.map((rec, k) => (
                                                                    <div key={k}>
                                                                        <div className="text-[10px] font-extrabold text-[#3f7550] uppercase tracking-wide mb-0.5">{rec.label}</div>
                                                                        <div className="bg-white rounded-lg border border-[#c8d8bd] shadow-sm p-2">
                                                                            <div className="flex justify-between items-center gap-2 mb-1.5">
                                                                                <span className="text-[11px] font-bold text-[#2f3b2f] whitespace-nowrap">
                                                                                    {rec.fecha || '—'}
                                                                                </span>
                                                                                <span className="bg-yellow-300 text-slate-900 font-black px-2 py-0.5 rounded border border-yellow-400 text-[11px] uppercase whitespace-nowrap">
                                                                                    {rec.motivo}
                                                                                </span>
                                                                            </div>
                                                                            <hr className="border-t border-[#e3ecd9] mb-1.5" />
                                                                            <div className="flex justify-between items-center gap-2">
                                                                                <span className="text-[11px] font-black text-[#2f3b2f] uppercase truncate" title={rec.supervisor}>
                                                                                    {rec.supervisor || '—'}
                                                                                </span>
                                                                                <span className="text-[11px] font-black text-[#2f3b2f] whitespace-nowrap">
                                                                                    {rec.turno || ''}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                {/* Tipo Aprobación — tarjeta */}
                                                <td className="px-3 py-2.5 align-top">
                                                    <AprobacionCard r={r} />
                                                </td>
                                                {/* Estado — pill delgado */}
                                                <td className="px-2 py-2.5 align-top text-center">
                                                    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${meta.cls}`}>
                                                        <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.dot }}></span>
                                                        {meta.label}
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
            </div>
        );
    }

    const root = document.getElementById('root');
    if (root) {
        ReactDOM.createRoot(root).render(<App />);
    }
})();
