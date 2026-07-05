// data.js — Date utilities, record helpers, data loading

const MONTH_NAME_MAP = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
};

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function iqEscapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Parse dates stored as DD/Mes/YYYY HH:mm AM/PM, ISO strings, or Excel serial numbers
function iqParseDateish(value) {
    if (value === null || value === undefined || value === '') return null;

    // Excel serial number
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+(\.\d+)?$/.test(String(value).trim()))) {
        const num = parseFloat(value);
        if (num > 40000 && num < 60000) {
            const excelEpoch = new Date(1899, 11, 30);
            return new Date(excelEpoch.getTime() + num * 86400000);
        }
    }

    const str = String(value).trim();
    if (!str) return null;

    // ISO format: YYYY-MM-DD...
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    }

    // Spanish format: DD/Mes/YYYY HH:mm AM/PM
    const spanishRe = /^(\d{1,2})\/([A-Za-záéíóúü]+)\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?)?/i;
    const m = str.match(spanishRe);
    if (m) {
        const day = parseInt(m[1], 10);
        const monthKey = m[2].toLowerCase().slice(0, 3);
        const year = parseInt(m[3], 10);
        const monthIndex = MONTH_NAME_MAP[monthKey];
        if (monthIndex === undefined) return null;

        let h = m[4] ? parseInt(m[4], 10) : 0;
        const min = m[5] ? parseInt(m[5], 10) : 0;
        const ampm = m[6] ? m[6].toUpperCase() : '';
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;

        const d = new Date(year, monthIndex, day, h, min, 0);
        return isNaN(d.getTime()) ? null : d;
    }

    // Numeric format: DD/MM/YYYY
    const numRe = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const nm = str.match(numRe);
    if (nm) {
        const d = new Date(parseInt(nm[3], 10), parseInt(nm[2], 10) - 1, parseInt(nm[1], 10));
        return isNaN(d.getTime()) ? null : d;
    }

    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? null : fallback;
}

// Records between 00:00–05:59 belong to the previous day (night shift 3T)
function iqAdjustNightShift(date) {
    if (!date) return null;
    if (date.getHours() < 6) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1,
            date.getHours(), date.getMinutes(), date.getSeconds());
    }
    return date;
}

// Reference date for period filtering: calidad_fin for aprobadas, fecha_rechazo_1 for rechazadas, calidad_inicio for en evaluación
function iqGetRecordRefDate(record) {
    if (iqIsAprobada(record)) return iqAdjustNightShift(iqParseDateish(record.calidad_fin));
    if (iqIsRechazada(record)) return iqAdjustNightShift(iqParseDateish(record.fecha_rechazo_1));
    return iqAdjustNightShift(iqParseDateish(record.calidad_inicio));
}

// ISO 8601 week number
function iqGetISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function iqIsEligibleRecord(record) {
    return String(record.calidad_inicio || '').trim() !== '';
}

function iqIsAprobada(record) {
    return String(record.tipo_aprobacion || '').trim() !== '';
}

function iqIsRechazada(record) {
    if (iqIsAprobada(record)) return false;
    for (let i = 1; i <= 7; i++) {
        if (String(record[`motivo_rechazo_${i}`] || '').trim()) return true;
    }
    return false;
}

// Estados válidos para "En Evaluación" — igual que CALIDAD_UNPROGRAMMED_STATES en modulo_principal
const IQ_ESTADOS_EN_EVALUACION = new Set(['', 'X PROG']);

function iqIsEnEvaluacion(record) {
    const estado = String(record.calidad_estado || '').trim().toUpperCase();
    if (!IQ_ESTADOS_EN_EVALUACION.has(estado)) return false;
    return !iqIsAprobada(record) && !iqIsRechazada(record);
}

// Lista para calidad — réplica de isReadyForCalidad en modulo_principal/js/calidad.js.
// El acabado especial debe estar OK o no aplicar para que la partida cuente.
function iqIsReadyForCalidad(record) {
    const acabadoTipo   = String(record.acabado_especial_tipo || '').trim();
    const acabadoEstado = String(record.acabado_especial_estado || record.acab_espec_estado || '').trim();
    return acabadoTipo === 'NO LLEVA' || acabadoTipo === 'OK' || acabadoEstado === 'OK';
}

// Returns all non-empty motivos from motivo_rechazo_1..7 (deduplicated within record)
function iqGetRecordMotivos(record) {
    const seen = new Set();
    const result = [];
    for (let i = 1; i <= 7; i++) {
        const m = String(record[`motivo_rechazo_${i}`] || '').trim();
        if (m && !seen.has(m)) {
            seen.add(m);
            result.push(m);
        }
    }
    return result;
}

function iqGetKg(record) {
    const raw = String(record.peso_kg_crudo || '').replace(',', '.');
    const val = parseFloat(raw);
    return isNaN(val) ? 0 : val;
}

function iqFormatDateTime(date) {
    if (!date) return '--';
    const d = date instanceof Date ? date : new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
}

// ── Tipo tela normalization ───────────────────────────────────────────────────

const TYPE_TELA_LABELS = {
    '100': 'Produccion',
    '102': 'Tela para Venta',
    '103': 'Desarrollo (OF)',
    '104': 'Prueba de lote',
    '105': 'Prueba validacion de articulo',
    '106': 'Prueba validacion de teñido/disperso',
    '107': 'Muestra de Venta',
    '108': 'Tela de relleno',
    '109': 'Prueba de tela/Fundas'
};

function iqGetTipoTelaLabel(rawValue) {
    const raw = String(rawValue || '').trim();
    // El campo puede venir como "100 → Produccion" o solo "100"
    const code = raw.includes('→') ? raw.split('→')[0].trim() : raw;
    return TYPE_TELA_LABELS[code] || raw;
}

// ── Client name normalization ─────────────────────────────────────────────────

const IQ_CLIENT_ALIASES = {
    'AM RETAIL S.A.C.': 'AMRETAIL',
    'AM RETAIL':        'AMRETAIL'
};

function iqNormalizeCliente(value) {
    const raw = String(value || '').trim();
    return IQ_CLIENT_ALIASES[raw] || raw;
}

function iqNormalizeRecords(records) {
    return (records || []).map(r => ({
        ...r,
        cliente: iqNormalizeCliente(r.cliente)
    }));
}

// ── Event expansion ───────────────────────────────────────────────────────────
// Aprobadas  → 1 evento OK en calidad_fin.
// Rechazadas → 1 evento RECHAZADO por cada fecha_rechazo_N.
// En evaluación → 1 evento EN_EVALUACION en calidad_inicio.
function iqExpandToEvents(records) {
    const events = [];

    records.filter(iqIsEligibleRecord).forEach(record => {
        if (iqIsAprobada(record)) {
            const refDate = iqAdjustNightShift(iqParseDateish(record.calidad_fin));
            if (refDate) {
                events.push({
                    ...record,
                    _refDate:    refDate,
                    _estado:     'OK',
                    _motivos:    [],
                    _supervisor: String(record.supervisor_aprobacion || '').trim(),
                    _record:     record,
                });
            }
            // Si la partida fue rechazada antes de ser aprobada, emitir también
            // eventos RECHAZADO para que los motivos aparezcan en la matriz.
            for (let i = 1; i <= 7; i++) {
                const fechaRaw = record[`fecha_rechazo_${i}`];
                if (!fechaRaw && fechaRaw !== 0) continue;
                const rejDate = iqAdjustNightShift(iqParseDateish(fechaRaw));
                if (!rejDate) continue;
                events.push({
                    ...record,
                    _refDate:    rejDate,
                    _estado:     'RECHAZADO',
                    _motivos:    [String(record[`motivo_rechazo_${i}`] || '').trim()].filter(Boolean),
                    _supervisor: String(record[`supervisor_rechazo_${i}`] || '').trim(),
                    _record:     record,
                    _aprobadaPostRechazo: true,
                });
            }
        } else if (iqIsRechazada(record)) {
            for (let i = 1; i <= 7; i++) {
                const fechaRaw = record[`fecha_rechazo_${i}`];
                if (!fechaRaw && fechaRaw !== 0) continue;
                const refDate = iqAdjustNightShift(iqParseDateish(fechaRaw));
                if (!refDate) continue;
                events.push({
                    ...record,
                    _refDate:    refDate,
                    _estado:     'RECHAZADO',
                    _motivos:    [String(record[`motivo_rechazo_${i}`] || '').trim()].filter(Boolean),
                    _supervisor: String(record[`supervisor_rechazo_${i}`] || '').trim(),
                    _record:     record,
                });
            }
        } else if (iqIsEnEvaluacion(record) && iqIsReadyForCalidad(record)) {
            // Misma regla que "En calidad" del módulo principal: estado vacío/'X PROG'
            // y acabado especial listo. Sin esto, Aseg sobre-contaba partidas.
            const refDate = iqAdjustNightShift(iqParseDateish(record.calidad_inicio));
            if (refDate) {
                events.push({
                    ...record,
                    _refDate:    refDate,
                    _estado:     'EN_EVALUACION',
                    _motivos:    [],
                    _supervisor: '',
                    _record:     record,
                });
            }
        }
    });

    return events;
}

// ── Data loading ──────────────────────────────────────────────────────────────

function iqLoadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(IQ_CONFIG.LOCAL_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? iqNormalizeRecords(parsed) : null;
    } catch (e) {
        console.error('Error reading localStorage:', e);
        return null;
    }
}

async function iqLoadFromAPI() {
    // gviz primero, Apps Script como respaldo (ver data_api.js).
    const records = await window.DataAPI.loadTintoreriaRecords();
    try {
        localStorage.setItem(IQ_CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(records));
        localStorage.setItem(IQ_CONFIG.LOCAL_STORAGE_KEY + '-updatedAt', String(Date.now()));
    } catch (e) { /* ignore quota errors */ }
    return iqNormalizeRecords(records);
}

// ── KPI rendering ─────────────────────────────────────────────────────────────
// Aprobadas      = tiene tipo_aprobacion (prioridad máxima).
// Rechazadas     = tiene motivo_rechazo_N y NO tiene tipo_aprobacion.
// En evaluación  = tiene calidad_inicio pero ni aprobación ni rechazo.

// Clave única por OP-PTDA, igual que modulo_principal.
function iqGetOpPtdaKey(event) {
    const op   = String(event.op_tela  || '').trim();
    const ptda = String(event.partida  || '').trim();
    return (op && ptda) ? `${op}|${ptda}` : null;
}

function iqRenderKPIs(events) {
    const aprobadas    = new Set();
    const rechazadas   = new Set();
    const enEvaluacion = new Set();
    const kgMap        = new Map(); // key → _record para calcular kg por partida única

    events.forEach(e => {
        const key = iqGetOpPtdaKey(e);
        if (!key) return;
        if (!kgMap.has(key)) kgMap.set(key, e._record);
        if (e._estado === 'OK')             aprobadas.add(key);
        else if (e._estado === 'RECHAZADO') rechazadas.add(key);
        else                                enEvaluacion.add(key);
    });

    // Partidas aprobadas después de rechazo: cuentan solo como aprobadas
    aprobadas.forEach(k => rechazadas.delete(k));

    const nAp = aprobadas.size;
    const nRe = rechazadas.size;
    const nEv = enEvaluacion.size;
    const total = nAp + nRe + nEv;

    const allKeys = new Set([...aprobadas, ...rechazadas, ...enEvaluacion]);
    const kg = [...allKeys].reduce((sum, k) => sum + iqGetKg(kgMap.get(k) || {}), 0);

    const pctAp = total > 0 ? Math.round((nAp / total) * 100) : 0;
    const pctRe = total > 0 ? Math.round((nRe / total) * 100) : 0;
    const pctEv = total > 0 ? Math.round((nEv / total) * 100) : 0;

    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

    set('kpi-auditadas-value',  total);
    set('kpi-aprobadas-value',  nAp);
    set('kpi-aprobadas-pct',    `${pctAp}%`);
    set('kpi-rechazadas-value', nRe);
    set('kpi-rechazadas-pct',   `${pctRe}%`);
    set('kpi-evaluacion-value', nEv);
    set('kpi-evaluacion-pct',   `${pctEv}%`);

    const kgEl = document.getElementById('kpi-kg-value');
    if (kgEl) {
        kgEl.textContent = kg >= 1000
            ? `${(kg / 1000).toFixed(1)} t`
            : `${kg.toLocaleString('es-PE', { maximumFractionDigits: 1 })} kg`;
    }
}
