(() => {
    if (!window.AppRouter || window.AppRouter.currentView !== 'hoja_evaluacion_textil') {
        return;
    }

    const stylesheetId = 'hoja-evaluacion-textil-styles';
    if (!document.getElementById(stylesheetId)) {
        const link = document.createElement('link');
        link.id = stylesheetId;
        link.rel = 'stylesheet';
        link.href = 'css/hoja_evaluacion_textil.css';
        document.head.appendChild(link);
    }

    const toastStyleId = 'het-toast-keyframes';
    if (!document.getElementById(toastStyleId)) {
        const styleTag = document.createElement('style');
        styleTag.id = toastStyleId;
        styleTag.textContent = '@keyframes hetToastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }';
        document.head.appendChild(styleTag);
    }

// ==========================================
        // CONFIGURACIÓN DE URLS
        // ==========================================
        const {
            SOURCE_APPS_SCRIPT_URL: API_ORIGEN,
            DESTINATION_APPS_SCRIPT_URL: API_DESTINO,
            SOURCE_SHEET_ID: SHEET_ID_ORIGEN,
            DESTINATION_SHEET_ID: SHEET_ID_DESTINO,
        } = window.APP_CONFIG;
        const OBS_KEYS = ['OB1', 'OB2', 'OB3', 'OB4', 'OB5', 'OB6', 'OB7'];
        const EMPTY_OBSERVACIONES = OBS_KEYS.map(() => '');
        const ROLLOS_TOTAL_ROWS = 21;
        const ROLLOS_REGION_ROWS = 7;
        const createEmptyRollosRows = () => Array.from({ length: ROLLOS_TOTAL_ROWS }, () => ({ rollo: '', ancho: '', densidad: '', rolloDeMuestra: false }));

        const App = () => {
            const [busqueda, setBusqueda] = React.useState({ op: '', partida: '' });
            const [vista, setVista] = React.useState('grid'); // 'grid' (listado) | 'hoja' (formulario)
            const [gridRows, setGridRows] = React.useState([]);
            const gridRawRef = React.useRef([]); // Filas crudas del listado (gviz) para reutilizar al abrir (B)
            const [gridLoading, setGridLoading] = React.useState(false);
            const [gridError, setGridError] = React.useState('');
            const [gridFiltro, setGridFiltro] = React.useState({ op: '', partida: '', status: '' });
            const [showNuevoModal, setShowNuevoModal] = React.useState(false);
            const [nuevoForm, setNuevoForm] = React.useState({ op: '', partida: '' });
            const [pendingSearch, setPendingSearch] = React.useState(null);
            const [modoEdicion, setModoEdicion] = React.useState(false); // false = solo lectura (ver) | true = editable
            const [esCopia, setEsCopia] = React.useState(false); // true = el registro actual es una copia sin guardar
            const registroAbiertoRef = React.useRef(null); // {op, partida, status} del registro abierto (para Cancelar)
            const [status, setStatus] = React.useState('');
            const [isLoading, setIsLoading] = React.useState(false);
            const [isUpdateMode, setIsUpdateMode] = React.useState(false);
            const destKeysRef = React.useRef([]); // Orden exacto de columnas del Google Sheet (useRef para acceso síncrono en handleSave)
            const [showStatusModal, setShowStatusModal] = React.useState(false);
            const [statusModalOptions, setStatusModalOptions] = React.useState([]);
            const [statusModalSelected, setStatusModalSelected] = React.useState('');
            const [rolloContextMenu, setRolloContextMenu] = React.useState({ visible: false, x: 0, y: 0, rowIndex: null });
            const [editingObsIndex, setEditingObsIndex] = React.useState(null);
            const [editingFirmaTipo, setEditingFirmaTipo] = React.useState(null);
            const [voiceObsIndex, setVoiceObsIndex] = React.useState(null);
            const [obsMaxChars, setObsMaxChars] = React.useState(120);
            const obsBoxRef = React.useRef(null);
            const obsInputRefs = React.useRef([]);
            const firmaInputRefs = React.useRef({ despacho: null, corte: null });
            const speechRef = React.useRef(null);

            const [formData, setFormData] = React.useState({
                cliente: '', op: '', partida: '', color: '',
                fechaRegistro: '',
                statusAuditoria: 'En proceso', bap: '',
                auditor1: '', auditor2: '',
                tipoOp: '', destino: '', rutaTela: '', rutaOriginal: '',
                componentes: [
                    { nombre: 'CUERPO', codArt: '', desc: '', kg: '', rollos: '', resist: '', solidez: '', rgb: '' },
                    { nombre: 'COMPLEMENTO', codArt: '', desc: '', kg: '', rollos: '', resist: '', solidez: '', rgb: '' }
                ],
                tecnicas: [
                    { condicion: 'CUERPO ACABADO', anchoStd: '', anchoReal: '', anchoLav: '', encA: '', encL: '', denStd: '', denReal: '', denLav: '', revA: '', revB: '', revC: '', incl: '' },
                    { condicion: 'CUERPO LAVADO', anchoStd: '', anchoReal: '', anchoLav: '', encA: '', encL: '', denStd: '', denReal: '', denLav: '', revA: '', revB: '', revC: '', incl: '' },
                    { condicion: 'COMPLEMENTO ACAB', anchoStd: '', anchoReal: '', anchoLav: '', encA: '', encL: '', denStd: '', denReal: '', denLav: '', revA: '', revB: '', revC: '', incl: '' },
                    { condicion: 'COMPLEMENTO LAV', anchoStd: '', anchoReal: '', anchoLav: '', encA: '', encL: '', denStd: '', denReal: '', denLav: '', revA: '', revB: '', revC: '', incl: '' }
                ],
                rollos: createEmptyRollosRows(),
                observaciones: [...EMPTY_OBSERVACIONES],
                firmas: {
                    despacho: { sello: '', fecha: '', firma: '' },
                    corte: { sello: '', fecha: '', firma: '' }
                },
                produccion: {
                    parametros: {
                        TONO: { ar: '', vobo: '' },
                        DEGRADE: { ar: '', vobo: '' },
                        IGUALACION: { ar: '', vobo: '' },
                        PILLING: { ar: '', vobo: '' }
                    },
                    cuerpo: {
                        densidad: { t_acab: '', t_lavada: '' },
                        ancho: { t_acab: '', t_lavada: '' },
                        raport: { t_acab: '', t_lavada: '' },
                        ph: { t_acab: '', t_lavada: '' }
                    },
                    complemento: {
                        densidad: { t_acab: '', t_lavada: '' },
                        ancho: { t_acab: '', t_lavada: '' },
                        raport: { t_acab: '', t_lavada: '' },
                        ph: { t_acab: '', t_lavada: '' }
                    }
                }
            });

            const normalizarClave = (texto) => {
                if (!texto) return '';
                return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '').toLowerCase();
            };

            const normalizarTexto = (texto) => {
                if (!texto) return '';
                return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
            };

            const isTruthyFlag = (value) => {
                if (value === true) return true;
                if (typeof value === 'number') return value === 1;
                const normalized = normalizarTexto(value || '');
                return normalized === 'true' || normalized === 'verdadero' || normalized === 'si' || normalized === 'yes' || normalized === '1' || normalized === 'x';
            };

            const extraerDato = (obj, posiblesClaves) => {
                if (!obj || typeof obj !== 'object') return '';
                const clavesObjeto = Object.keys(obj);
                for (let claveBuscada of posiblesClaves) {
                    const claveNormalizada = normalizarClave(claveBuscada);
                    const claveEncontrada = clavesObjeto.find(k => normalizarClave(k) === claveNormalizada);
                    
                    if (claveEncontrada && obj[claveEncontrada] !== undefined && obj[claveEncontrada] !== null) {
                        const valor = obj[claveEncontrada];
                        if (typeof valor === 'string' && valor.trim() === '') continue; 
                        if (valor !== "") return valor;
                    }
                }
                return '';
            };

            const parsePeso = (valor) => {
                if (!valor) return 0;
                if (typeof valor === 'number') return valor;
                const parsed = parseFloat(String(valor).replace(/,/g, ''));
                return isNaN(parsed) ? 0 : parsed;
            };

            const parseNumericValue = (value) => {
                if (value === null || value === undefined) return null;
                if (typeof value === 'number') return Number.isFinite(value) ? value : null;
                let text = String(value).trim();
                if (!text) return null;

                // Normaliza miles/decimales (ej: 1.234,56 o 1,234.56)
                if (text.includes(',') && text.includes('.')) {
                    if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
                        text = text.replace(/\./g, '').replace(',', '.');
                    } else {
                        text = text.replace(/,/g, '');
                    }
                } else {
                    text = text.replace(/,/g, '.');
                }

                text = text.replace(/[^0-9+\-.]/g, '');
                if (!text || text === '+' || text === '-' || text === '.') return null;

                const parsed = parseFloat(text);
                return Number.isFinite(parsed) ? parsed : null;
            };

            const formatSignedNumber = (num) => {
                const clean = Math.abs(num) < 0.0000001 ? 0 : num;
                const fixed = clean.toFixed(2).replace(/\.?0+$/, '');
                return `${clean > 0 ? '+' : ''}${fixed}`;
            };

            const getDensityDeltaInfo = (productionValue, technicalStdValue) => {
                const prod = parseNumericValue(productionValue);
                const std = parseNumericValue(technicalStdValue);
                if (prod === null || std === null || std === 0) return null;

                const diff = prod - std;
                const pct = (diff / std) * 100;
                return {
                    text: `${formatSignedNumber(diff)} / ${formatSignedNumber(pct)}%`,
                    isAlert: Math.abs(pct) > 5
                };
            };

            const AR_OPTIONS = ['', 'Aprobado', 'Rechazado', 'Aprobado\nc/tolerancia', 'Aprobado\nc/autorizacion'];
            const STATUS_OPTIONS = ['Aprobado', 'Rechazado', 'En proceso', 'x Aprob. de Bulk'];
            const BAP_OPTIONS_BY_STATUS = {
                Aprobado: ['A1', 'A2', 'A3', 'A4'],
                Rechazado: ['R1', 'R2', 'R3', 'R4']
            };

            const normalizeARValue = (value) => {
                const raw = String(value || '');
                const normalized = normalizarTexto(raw).replace(/\s+/g, ' ').trim();
                if (!normalized) return '';
                if (normalized.includes('rechaz')) return 'Rechazado';
                if (normalized.includes('aprobado') && normalized.includes('tolerancia')) return 'Aprobado\nc/tolerancia';
                if (normalized.includes('aprobado') && normalized.includes('autorizacion')) return 'Aprobado\nc/autorizacion';
                if (normalized.includes('aprobado')) return 'Aprobado';
                return raw;
            };

            const normalizeStatusValue = (value) => {
                const normalized = normalizarTexto(value || '');
                if (!normalized) return 'En proceso';
                if (normalized.includes('rechaz') || normalized.includes('rechz')) return 'Rechazado';
                if (normalized.includes('bulk') && normalized.includes('aprob')) return 'x Aprob. de Bulk';
                if (normalized.includes('aprob')) return 'Aprobado';
                if (normalized.includes('proceso') || normalized.includes('audit')) return 'En proceso';
                return 'En proceso';
            };

            const getBapOptionsForStatus = (statusValue) => {
                const normalizedStatus = normalizeStatusValue(statusValue);
                return BAP_OPTIONS_BY_STATUS[normalizedStatus] || [];
            };

            const normalizeBapValue = (value, statusValue) => {
                const normalized = String(value || '').trim().toUpperCase();
                const validOptions = getBapOptionsForStatus(statusValue);
                return validOptions.includes(normalized) ? normalized : '';
            };

            const getRollosArray = (rows) => {
                const base = createEmptyRollosRows();
                if (!Array.isArray(rows)) return base;
                for (let i = 0; i < ROLLOS_TOTAL_ROWS; i++) {
                    const src = rows[i] || {};
                    base[i] = {
                        rollo: src.rollo !== undefined && src.rollo !== null ? String(src.rollo) : '',
                        ancho: src.ancho !== undefined && src.ancho !== null ? String(src.ancho) : '',
                        densidad: src.densidad !== undefined && src.densidad !== null ? String(src.densidad) : '',
                        rolloDeMuestra: isTruthyFlag(src.rolloDeMuestra || src.rollo_muestra || src['ROLLO DE MUESTRA'] || src['ROLLO DE MUESTRAS'])
                    };
                }
                return base;
            };

            const SELLO_OPTIONS = ['', 'APROBADO', 'RECHAZADO', 'APROBADO CON TOLERANCIA', 'APROBADO CON AUTORIZACION'];

            const normalizeSelloValue = (value) => {
                const normalized = normalizarTexto(value || '');
                if (!normalized) return '';
                if (normalized.includes('rech')) return 'RECHAZADO';
                if (normalized.includes('aprob') && normalized.includes('toler')) return 'APROBADO CON TOLERANCIA';
                if (normalized.includes('aprob') && normalized.includes('autoriz')) return 'APROBADO CON AUTORIZACION';
                if (normalized.includes('aprob')) return 'APROBADO';
                return '';
            };

            const getSelloPillClass = (sello) => {
                const normalized = normalizeSelloValue(sello);
                if (normalized === 'RECHAZADO') return 'stamp-rejected';
                if (normalized === 'APROBADO CON TOLERANCIA') return 'stamp-tolerance';
                if (normalized === 'APROBADO CON AUTORIZACION') return 'stamp-authorized';
                return 'stamp-approved';
            };

            const shouldShowSelloHeader = (sello) => {
                const normalized = normalizeSelloValue(sello);
                return normalized === 'APROBADO' || normalized === 'RECHAZADO';
            };

            const getTodayDateStamp = () => {
                const now = new Date();
                const dd = String(now.getDate()).padStart(2, '0');
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const yyyy = String(now.getFullYear());
                return `${dd}/${mm}/${yyyy}`;
            };

            const normalizeFirmaDate = (value) => {
                if (value === null || value === undefined) return '';
                const text = String(value).trim();
                if (!text) return '';

                let m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (m) return `${m[1]}/${m[2]}/${m[3]}`;

                m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (m) return `${m[3]}/${m[2]}/${m[1]}`;

                const parsed = new Date(text);
                if (!isNaN(parsed.getTime())) {
                    // Usar UTC para evitar desfase de día en zona UTC-5 (Perú)
                    const dd = String(parsed.getUTCDate()).padStart(2, '0');
                    const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0');
                    const yyyy = String(parsed.getUTCFullYear());
                    return `${dd}/${mm}/${yyyy}`;
                }
                return text;
            };

            const sanitizeFirmaTexto = (value) => {
                const text = value === null || value === undefined ? '' : String(value).trim();
                if (!text) return '';
                if (/^data:image\//i.test(text)) return '';
                return text.slice(0, 120);
            };

            const getFirmasState = (firmas) => {
                const base = {
                    despacho: { sello: '', fecha: '', firma: '' },
                    corte: { sello: '', fecha: '', firma: '' }
                };

                if (!firmas || typeof firmas !== 'object') return base;

                const selloDespacho = normalizeSelloValue(firmas.despacho && firmas.despacho.sello);
                const selloCorte = normalizeSelloValue(firmas.corte && firmas.corte.sello);

                return {
                    despacho: {
                        sello: selloDespacho,
                        fecha: selloDespacho ? normalizeFirmaDate(firmas.despacho && firmas.despacho.fecha) : '',
                        firma: sanitizeFirmaTexto(firmas.despacho && (firmas.despacho.firma || firmas.despacho.dataUrl))
                    },
                    corte: {
                        sello: selloCorte,
                        fecha: selloCorte ? normalizeFirmaDate(firmas.corte && firmas.corte.fecha) : '',
                        firma: sanitizeFirmaTexto(firmas.corte && (firmas.corte.firma || firmas.corte.dataUrl))
                    }
                };
            };

            const toggleFirmaSello = (tipo) => {
                setFormData(prev => {
                    const firmas = getFirmasState(prev.firmas);
                    const actual = normalizeSelloValue(firmas[tipo] && firmas[tipo].sello);
                    const currentIndex = SELLO_OPTIONS.indexOf(actual);
                    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % SELLO_OPTIONS.length : 1;
                    const siguiente = SELLO_OPTIONS[nextIndex];
                    return {
                        ...prev,
                        firmas: {
                            ...firmas,
                            [tipo]: {
                                ...firmas[tipo],
                                sello: siguiente,
                                fecha: siguiente ? getTodayDateStamp() : ''
                            }
                        }
                    };
                });
            };

            const setFirmaTexto = (tipo, value) => {
                setFormData(prev => {
                    const firmas = getFirmasState(prev.firmas);
                    return {
                        ...prev,
                        firmas: {
                            ...firmas,
                            [tipo]: {
                                ...firmas[tipo],
                                firma: sanitizeFirmaTexto(value)
                            }
                        }
                    };
                });
            };

            const startFirmaEdit = (tipo) => {
                setEditingFirmaTipo(tipo);
                window.setTimeout(() => {
                    const input = firmaInputRefs.current[tipo];
                    if (!input) return;
                    input.focus();
                    const len = input.value ? input.value.length : 0;
                    input.setSelectionRange(len, len);
                }, 0);
            };

            const getObsArray = (obs) => {
                if (Array.isArray(obs) && obs.length === OBS_KEYS.length) return obs;
                return [...EMPTY_OBSERVACIONES];
            };

            const sanitizeObsValue = (value) => {
                const text = value === null || value === undefined ? '' : String(value);
                return text.slice(0, obsMaxChars);
            };

            React.useEffect(() => {
                const updateObsMaxChars = () => {
                    const width = obsBoxRef.current ? obsBoxRef.current.clientWidth : 920;
                    const maxByWidth = Math.floor((Math.max(width, 320) - 96) / 8);
                    setObsMaxChars(Math.max(28, maxByWidth));
                };

                updateObsMaxChars();
                window.addEventListener('resize', updateObsMaxChars);
                return () => window.removeEventListener('resize', updateObsMaxChars);
            }, []);

            React.useEffect(() => {
                setFormData(prev => {
                    const current = getObsArray(prev.observaciones);
                    const trimmed = current.map(sanitizeObsValue);
                    const changed = trimmed.some((v, i) => v !== current[i]);
                    return changed ? { ...prev, observaciones: trimmed } : prev;
                });
            }, [obsMaxChars]);

            React.useEffect(() => {
                return () => {
                    if (speechRef.current) {
                        try { speechRef.current.abort(); } catch (_) {}
                        try { speechRef.current.stop(); } catch (_) {}
                        speechRef.current = null;
                    }
                };
            }, []);

            React.useEffect(() => {
                if (!rolloContextMenu.visible) return undefined;
                const closeMenu = () => closeRolloContextMenu();
                const closeMenuOnEsc = (event) => {
                    if (event.key === 'Escape') closeRolloContextMenu();
                };
                window.addEventListener('click', closeMenu);
                window.addEventListener('scroll', closeMenu, true);
                window.addEventListener('keydown', closeMenuOnEsc);
                return () => {
                    window.removeEventListener('click', closeMenu);
                    window.removeEventListener('scroll', closeMenu, true);
                    window.removeEventListener('keydown', closeMenuOnEsc);
                };
            }, [rolloContextMenu.visible]);

            const setObsValue = (idx, value) => {
                setFormData(prev => {
                    const nextObs = [...getObsArray(prev.observaciones)];
                    nextObs[idx] = sanitizeObsValue(value);
                    return { ...prev, observaciones: nextObs };
                });
            };

            const setRolloValue = (idx, field, value) => {
                setFormData(prev => {
                    const nextRollos = getRollosArray(prev.rollos);
                    nextRollos[idx] = { ...nextRollos[idx], [field]: value };
                    return { ...prev, rollos: nextRollos };
                });
            };

            const closeRolloContextMenu = () => {
                setRolloContextMenu({ visible: false, x: 0, y: 0, rowIndex: null });
            };

            const openRolloContextMenu = (event, rowIndex) => {
                event.preventDefault();
                event.stopPropagation();
                setRolloContextMenu({
                    visible: true,
                    x: event.clientX,
                    y: event.clientY,
                    rowIndex
                });
            };

            const toggleRolloSampleFromContext = () => {
                if (rolloContextMenu.rowIndex === null || rolloContextMenu.rowIndex === undefined) {
                    closeRolloContextMenu();
                    return;
                }
                const targetIndex = rolloContextMenu.rowIndex;
                setFormData(prev => {
                    const nextRollos = getRollosArray(prev.rollos);
                    if (!nextRollos[targetIndex]) return prev;
                    const currentFlag = isTruthyFlag(nextRollos[targetIndex].rolloDeMuestra);
                    nextRollos[targetIndex] = { ...nextRollos[targetIndex], rolloDeMuestra: !currentFlag };
                    return { ...prev, rollos: nextRollos };
                });
                closeRolloContextMenu();
            };

            const startObsEdit = (idx) => {
                setEditingObsIndex(idx);
                window.setTimeout(() => {
                    const input = obsInputRefs.current[idx];
                    if (input) {
                        input.focus();
                        const len = input.value ? input.value.length : 0;
                        input.setSelectionRange(len, len);
                    }
                }, 0);
            };

            const stopVoiceInput = () => {
                if (speechRef.current) {
                    speechRef.current.onresult = null;
                    speechRef.current.onerror = null;
                    speechRef.current.onend = null;
                    try { speechRef.current.stop(); } catch (_) {}
                    speechRef.current = null;
                }
                setVoiceObsIndex(null);
            };

            const startVoiceInput = (idx) => {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognition) {
                    setStatus('Aviso: Este navegador no soporta dictado por voz.');
                    return;
                }

                if (voiceObsIndex === idx && speechRef.current) {
                    stopVoiceInput();
                    return;
                }

                stopVoiceInput();
                const recognition = new SpeechRecognition();
                recognition.lang = 'es-ES';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;
                recognition.continuous = false;

                recognition.onresult = (event) => {
                    const transcript = event?.results?.[0]?.[0]?.transcript || '';
                    if (!transcript) return;

                    setFormData(prev => {
                        const nextObs = [...getObsArray(prev.observaciones)];
                        const current = nextObs[idx] ? String(nextObs[idx]).trim() : '';
                        const merged = sanitizeObsValue(current ? `${current} ${transcript}` : transcript);
                        nextObs[idx] = merged;
                        return { ...prev, observaciones: nextObs };
                    });
                    startObsEdit(idx);
                };

                recognition.onerror = (event) => {
                    setStatus(`Aviso: No se pudo capturar voz (${event?.error || 'desconocido'}).`);
                };

                recognition.onend = () => {
                    speechRef.current = null;
                    setVoiceObsIndex(null);
                };

                speechRef.current = recognition;
                setVoiceObsIndex(idx);
                recognition.start();
            };

            const runSearch = async ({ forceNew = false, selectedStatus = '', prefetchedDestino = null } = {}) => {
                if (!busqueda.op || !busqueda.partida) {
                    setStatus('Error: Ingresa OP y Partida para buscar.');
                    return;
                }

                stopVoiceInput();
                setEditingObsIndex(null);
                setEditingFirmaTipo(null);
                setIsLoading(true);
                setIsUpdateMode(false);
                setEsCopia(false);
                setModoEdicion(forceNew); // registro nuevo desde origen = editable; registro existente = solo lectura
                registroAbiertoRef.current = forceNew ? null : { op: busqueda.op, partida: busqueda.partida, status: selectedStatus || '' };
                const cargaExistente = !forceNew && prefetchedDestino && prefetchedDestino.length > 0;
                setStatus(forceNew ? 'Consultando datos de origen...' : (cargaExistente ? 'Cargando registro...' : 'Consultando datos de origen, destino y rollos...'));
                console.log("-----------------------------------------");
                console.log(`ðŸ”Ž INICIANDO BÚSQUEDA - OP: ${busqueda.op}, PARTIDA: ${busqueda.partida}`);

                // 1. FETCH DE DATOS — (A) lecturas en paralelo, (B) destino reutilizado del listado
                const fetchJson = async (url, label) => {
                    try {
                        console.log(`Consultando API ${label}...`);
                        const res = await fetch(url);
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const json = await res.json();
                        console.log(`Datos ${label} recibidos:`, json);
                        return json;
                    } catch (error) {
                        console.error(`Error en red al consultar ${label}:`, error);
                        return null;
                    }
                };

                // (#2) Si el registro YA existe (lo sabemos porque el listado nos pasó sus filas),
                // nos saltamos la llamada a ORIGEN: el formulario se llena completo desde destino.
                let origenTask = Promise.resolve(null);
                if (!cargaExistente) {
                    const urlOrigen = `${API_ORIGEN}?action=getData&op=${encodeURIComponent(busqueda.op)}&partida=${encodeURIComponent(busqueda.partida)}`;
                    origenTask = fetchJson(urlOrigen, 'Origen');
                } else {
                    console.log('Origen omitido: registro existente, se carga desde destino (sin red).');
                }

                let destinoTask = Promise.resolve(null);
                let rollosTask = Promise.resolve(null);
                if (!forceNew) {
                    if (prefetchedDestino && prefetchedDestino.length > 0) {
                        // (B) Filas de destino ya cargadas por el listado (gviz): sin llamada de red.
                        destinoTask = Promise.resolve({ success: true, data: prefetchedDestino });
                        console.log(`Destino reutilizado del listado (${prefetchedDestino.length} fila/s, sin red).`);
                    } else {
                        const urlDestino = `${API_DESTINO}?action=getReport&op=${encodeURIComponent(busqueda.op)}&partida=${encodeURIComponent(busqueda.partida)}`;
                        destinoTask = fetchJson(urlDestino, 'Destino');
                    }
                    const urlRollos = `${API_DESTINO}?action=getRollos&op=${encodeURIComponent(busqueda.op)}&partida=${encodeURIComponent(busqueda.partida)}`;
                    rollosTask = fetchJson(urlRollos, 'Rollos');
                }

                const [resultOrigen, resultDestino, resultRollos] = await Promise.all([origenTask, destinoTask, rollosTask]);

                // 2. VERIFICAR SI HAY ACTUALIZACIÓN Y CAPTURAR EL ORDEN DE COLUMNAS
                let isDestinoExistente = false;
                let dataD = (!forceNew && resultDestino && resultDestino.success && resultDestino.data) ? resultDestino.data : [];
                if (!forceNew && selectedStatus) {
                    const statusTarget = normalizarTexto(selectedStatus);
                    dataD = dataD.filter(row => normalizarTexto(normalizeStatusValue(extraerDato(row, ['status']) || 'En proceso')) === statusTarget);
                    console.log(`ðŸ“Œ Filtro STATUS aplicado: ${selectedStatus}. Filas encontradas: ${dataD.length}`);
                }
                if (dataD.length > 0) {
                    isDestinoExistente = true;
                    setIsUpdateMode(true);
                    destKeysRef.current = Object.keys(dataD[0]); // Captura los nombres exactos y su orden del Destino
                    console.log('📋 Destino existe - destKeys:', destKeysRef.current);
                } else {
                    destKeysRef.current = []; // Resetear en caso de OP nueva
                }

                // 3. PROCESAR Y ACTUALIZAR ESTADO DE REACT SEGURAMENTE
                // --- PRE-CÁLCULO: extraer valores de producción desde DEST fuera del setFormData
                let pre_prod_cuerpo_den_t_acab = '';
                let pre_prod_cuerpo_den_t_lavada = '';
                let pre_prod_comp_den_t_acab = '';
                let pre_prod_comp_den_t_lavada = '';
                let pre_prod_cuerpo_ancho_t_acab = '';
                let pre_prod_cuerpo_ancho_t_lavada = '';
                let pre_prod_comp_ancho_t_acab = '';
                let pre_prod_comp_ancho_t_lavada = '';
                let pre_prod_cuerpo_raport_t_acab = '';
                let pre_prod_cuerpo_raport_t_lavada = '';
                let pre_prod_comp_raport_t_acab = '';
                let pre_prod_comp_raport_t_lavada = '';
                let pre_prod_cuerpo_ph_t_acab = '';
                let pre_prod_cuerpo_ph_t_lavada = '';
                let pre_prod_comp_ph_t_acab = '';
                let pre_prod_comp_ph_t_lavada = '';
                let pre_observaciones = [...EMPTY_OBSERVACIONES];
                let pre_rollos = createEmptyRollosRows();
                let pre_firmas = getFirmasState(null);

                if (isDestinoExistente && dataD && Array.isArray(dataD)) {
                    const rowMatchesOutside = (row, expectedText) => {
                        if (!row) return false;
                        const expected = normalizarTexto(expectedText || '');
                        if (!expected) return false;
                        const posible = extraerDato(row, ['componente', 'component', 'condicion de tela', 'condicion de tela', 'condicion tela']);
                        if (posible && normalizarTexto(posible) === expected) return true;
                        const anyMatch = Object.values(row).some(v => normalizarTexto(v) === expected);
                        return anyMatch;
                    };

                    const findRowOutside = (componentName, condicionName) => {
                        if (condicionName) {
                            const byCond = dataD.find(r => rowMatchesOutside(r, condicionName));
                            if (byCond) return byCond;
                        }
                        if (componentName && condicionName) {
                            const byCompAndCond = dataD.find(r => rowMatchesOutside(r, componentName) && rowMatchesOutside(r, condicionName));
                            if (byCompAndCond) return byCompAndCond;
                        }
                        if (componentName) {
                            const byComp = dataD.find(r => rowMatchesOutside(r, componentName));
                            if (byComp) return byComp;
                        }
                        return undefined;
                    };

                    const posiblesKeysDens = ['DENSIDAD (g/m2)', 'DENSIDAD g/m2', 'DENSIDAD (g m2)', 'DENSIDAD', 'densidad (g/m2)', 'densidad'];
                    const posiblesKeysAncho = ['ANCHO prod', 'ANCHO_PROD', 'ANCHO', 'ANCHO STD', 'Ancho prod', 'ancho prod'];
                    const posiblesKeysRaport = ['RAPORT', 'Raport', 'raport'];
                    const posiblesKeysPh = ['PH', 'Ph', 'ph'];

                    const rCuerpoAcab = findRowOutside('CUERPO', 'CUERPO ACABADO');
                    const rCuerpoLav = findRowOutside('CUERPO', 'CUERPO LAVADO');
                    const rCompAcab = findRowOutside('COMPLEMENTO', 'COMPLEMENTO ACAB');
                    const rCompLav = findRowOutside('COMPLEMENTO', 'COMPLEMENTO LAV');

                    if (rCuerpoAcab) {
                        pre_prod_cuerpo_den_t_acab = extraerDato(rCuerpoAcab, posiblesKeysDens) || '';
                        pre_prod_cuerpo_ancho_t_acab = extraerDato(rCuerpoAcab, posiblesKeysAncho) || '';
                        pre_prod_cuerpo_raport_t_acab = extraerDato(rCuerpoAcab, posiblesKeysRaport) || '';
                        pre_prod_cuerpo_ph_t_acab = extraerDato(rCuerpoAcab, posiblesKeysPh) || '';
                    }
                    if (rCuerpoLav) {
                        pre_prod_cuerpo_den_t_lavada = extraerDato(rCuerpoLav, posiblesKeysDens) || extraerDato(rCuerpoLav, posiblesKeysAncho) || '';
                        pre_prod_cuerpo_ancho_t_lavada = extraerDato(rCuerpoLav, posiblesKeysAncho) || '';
                        pre_prod_cuerpo_raport_t_lavada = extraerDato(rCuerpoLav, posiblesKeysRaport) || '';
                        pre_prod_cuerpo_ph_t_lavada = extraerDato(rCuerpoLav, posiblesKeysPh) || '';
                    }
                    if (rCompAcab) {
                        pre_prod_comp_den_t_acab = extraerDato(rCompAcab, posiblesKeysDens) || '';
                        pre_prod_comp_ancho_t_acab = extraerDato(rCompAcab, posiblesKeysAncho) || '';
                        pre_prod_comp_raport_t_acab = extraerDato(rCompAcab, posiblesKeysRaport) || '';
                        pre_prod_comp_ph_t_acab = extraerDato(rCompAcab, posiblesKeysPh) || '';
                    }
                    if (rCompLav) {
                        pre_prod_comp_den_t_lavada = extraerDato(rCompLav, posiblesKeysDens) || extraerDato(rCompLav, posiblesKeysAncho) || '';
                        pre_prod_comp_ancho_t_lavada = extraerDato(rCompLav, posiblesKeysAncho) || '';
                        pre_prod_comp_raport_t_lavada = extraerDato(rCompLav, posiblesKeysRaport) || '';
                        pre_prod_comp_ph_t_lavada = extraerDato(rCompLav, posiblesKeysPh) || '';
                    }

                    const findObsOutside = (keys) => {
                        for (let row of dataD) {
                            const value = extraerDato(row, keys);
                            if (value !== '' && value !== null && value !== undefined) {
                                return String(value);
                            }
                        }
                        return '';
                    };

                    pre_observaciones = OBS_KEYS.map((key, idx) => {
                        return findObsOutside([key, `OB ${idx + 1}`, `OBSERVACION ${key}`, `OBSERVACIONES ${key}`, `COLUMNA SHEET ${key}`]);
                    });

                    pre_firmas = {
                        despacho: {
                            sello: normalizeSelloValue(findObsOutside(['SELLO DESPACHO', 'SELLO Y FIRMA APROBADO PARA DESPACHO (AUDITOR)', 'SELLO DESPACHO AUDITOR'])),
                            fecha: formatFechaDMY(findObsOutside(['FECHA DESPACHO', 'FECHA FIRMA DESPACHO', 'FECHA DESPACHO AUDITOR'])),
                            firma: String(findObsOutside(['FIRMA DESPACHO', 'FIRMA DESPACHO AUDITOR', 'FIRMA_AUDITOR_DESPACHO']) || '')
                        },
                        corte: {
                            sello: normalizeSelloValue(findObsOutside(['SELLO CORTE', 'SELLO Y FIRMA APROBADO PARA CORTE (AUDITOR)', 'SELLO CORTE AUDITOR'])),
                            fecha: formatFechaDMY(findObsOutside(['FECHA CORTE', 'FECHA FIRMA CORTE', 'FECHA CORTE AUDITOR'])),
                            firma: String(findObsOutside(['FIRMA CORTE', 'FIRMA CORTE AUDITOR', 'FIRMA_AUDITOR_CORTE']) || '')
                        }
                    };

                    console.log('ðŸ”Ž Producción pre-calculada (outside setFormData):', { pre_prod_cuerpo_den_t_acab, pre_prod_cuerpo_den_t_lavada, pre_prod_comp_den_t_acab, pre_prod_comp_den_t_lavada, pre_prod_cuerpo_ancho_t_acab, pre_prod_cuerpo_ancho_t_lavada, pre_prod_comp_ancho_t_acab, pre_prod_comp_ancho_t_lavada });
                }

                if (resultRollos && resultRollos.success && Array.isArray(resultRollos.data)) {
                    pre_rollos = createEmptyRollosRows();
                    const rowsFromSheet = resultRollos.data.slice(0, ROLLOS_TOTAL_ROWS);
                    rowsFromSheet.forEach((row, idx) => {
                        pre_rollos[idx] = {
                            rollo: String(extraerDato(row, ['#ROLLO', 'ROLLO', 'NO ROLLO', 'N ROLLO']) || ''),
                            ancho: String(extraerDato(row, ['ANCHO']) || ''),
                            densidad: String(extraerDato(row, ['DENSIDAD', 'DENSIDAD (g/m2)', 'DENSIDAD g/m2']) || ''),
                            rolloDeMuestra: isTruthyFlag(extraerDato(row, ['ROLLO DE MUESTRA', 'ROLLO DE MUESTRAS', 'MUESTRA', 'ROLLO MUESTRA']))
                        };
                    });
                }

                setFormData(prev => {
                    try {
                        console.log("âš™ï¸ Procesando datos en memoria...");
                        
                        // Variables preparatorias
                        let nuevosComponentes = [
                            { ...prev.componentes[0], nombre: 'CUERPO', codArt: '', desc: '', kg: '', rollos: '', resist: '', solidez: '', rgb: '' },
                            { ...prev.componentes[1], nombre: '', codArt: '', desc: '', kg: '', rollos: '', resist: '', solidez: '', rgb: '' }
                        ];

                        let nuevasTecnicas = prev.tecnicas.map(t => ({
                            ...t, anchoStd:'', anchoReal:'', anchoLav:'', encA:'', encL:'', denStd:'', denReal:'', denLav:'', revA:'', revB:'', revC:'', incl:''
                        }));
                        nuevasTecnicas[0].condicion = 'CUERPO ACABADO';
                        nuevasTecnicas[1].condicion = 'CUERPO LAVADO';
                        nuevasTecnicas[2].condicion = '';
                        nuevasTecnicas[3].condicion = '';

                        let clienteFinal = prev.cliente;
                        let colorFinal = prev.color;
                        let fechaRegistroFinal = '';
                        let tipoOpFinal = prev.tipoOp;
                        let destinoFinal = prev.destino;
                        let rutaTelaFinal = prev.rutaTela;
                        let rutaOriginalFinal = prev.rutaOriginal;
                        let statusAuditoriaFinal = 'En proceso';
                        let bapFinal = '';
                        let auditor1Final = '';
                        let auditor2Final = '';

                        let o_encA = '', o_encL = '', o_denStd = '', o_denReal = '', o_denLav = '', o_revA = '', o_revB = '', o_revC = '';

                        // --- A. EXTRAER DE ORIGEN ---
                        let dataArrayOrigen = (resultOrigen && resultOrigen.data) ? resultOrigen.data : [];
                        
                        if (dataArrayOrigen.length > 0) {
                            const primerFila = dataArrayOrigen[0];
                            clienteFinal = extraerDato(primerFila, ['cliente']) || clienteFinal;
                            colorFinal = extraerDato(primerFila, ['color']) || colorFinal;
                            tipoOpFinal = extraerDato(primerFila, ['tipo op', 'tipo_op', 'tipo']) || tipoOpFinal;

                            // Escaneo profundo para campos globales / técnicos
                            for (let row of dataArrayOrigen) {
                                if (!o_encA) o_encA = extraerDato(row, ['encogimiento a%', 'encog a', 'enc a%']);
                                if (!o_encL) o_encL = extraerDato(row, ['encogimiento l%', 'encog l', 'enc l%']);
                                if (!o_denStd) o_denStd = extraerDato(row, ['densidad std', 'den std']);
                                if (!o_denReal) o_denReal = extraerDato(row, ['densidad real', 'den real']);
                                if (!o_denLav) o_denLav = extraerDato(row, ['densidad lavado', 'den lav', 'densidad lav']);
                                if (!o_revA) o_revA = extraerDato(row, ['%revirado a', 'revirado a', 'rev a']);
                                if (!o_revB) o_revB = extraerDato(row, ['%revirado b', 'revirado b', 'rev b']);
                                if (!o_revC) o_revC = extraerDato(row, ['%revirado c', 'revirado c', 'rev c']);
                            }

                            // Agrupar artículos y sus características
                            let agrupacionComponentes = {};
                            dataArrayOrigen.forEach(row => {
                                const codArtRaw = extraerDato(row, ['articulo', 'cod. art.', 'cod art', 'codigo']);
                                if (!codArtRaw) return; 
                                
                                const codArt = String(codArtRaw).trim();
                                const desc = extraerDato(row, ['descripcion', 'desc']);
                                const peso = parsePeso(extraerDato(row, ['peso', 'kg', 'total kg', 'peso neto']));

                                const resistVal = extraerDato(row, ['resistencia valor', 'valor resistencia', 'resistencia', 'resist']);
                                const solidezVal = extraerDato(row, ['solidez valor', 'valor solidez', 'solidez', 'solid']);

                                if (!agrupacionComponentes[codArt]) {
                                    agrupacionComponentes[codArt] = { desc: desc, totalKg: peso, totalRollos: 1, resist: resistVal, solidez: solidezVal };
                                } else {
                                    agrupacionComponentes[codArt].totalKg += peso;
                                    agrupacionComponentes[codArt].totalRollos += 1;
                                    if (!agrupacionComponentes[codArt].desc && desc) agrupacionComponentes[codArt].desc = desc;
                                    if (!agrupacionComponentes[codArt].resist && resistVal) agrupacionComponentes[codArt].resist = resistVal;
                                    if (!agrupacionComponentes[codArt].solidez && solidezVal) agrupacionComponentes[codArt].solidez = solidezVal;
                                }
                            });

                            const codigosOrdenados = Object.keys(agrupacionComponentes).sort((a, b) => agrupacionComponentes[b].totalKg - agrupacionComponentes[a].totalKg);

                            if(codigosOrdenados.length > 0) {
                                const codCuerpo = codigosOrdenados[0];
                                nuevosComponentes[0].codArt = codCuerpo;
                                nuevosComponentes[0].desc = agrupacionComponentes[codCuerpo].desc;
                                nuevosComponentes[0].kg = agrupacionComponentes[codCuerpo].totalKg.toFixed(2);
                                nuevosComponentes[0].rollos = agrupacionComponentes[codCuerpo].totalRollos;
                                nuevosComponentes[0].resist = agrupacionComponentes[codCuerpo].resist || '';
                                nuevosComponentes[0].solidez = agrupacionComponentes[codCuerpo].solidez || '';
                            }

                            if(codigosOrdenados.length > 1) {
                                nuevosComponentes[1].nombre = 'COMPLEMENTO';
                                const restoCodigos = codigosOrdenados.slice(1);
                                
                                nuevosComponentes[1].codArt = restoCodigos.join(' / ');
                                nuevosComponentes[1].desc = restoCodigos.map(c => agrupacionComponentes[c].desc).filter(Boolean).join(' / ');
                                
                                const totalKgComp = restoCodigos.reduce((sum, c) => sum + agrupacionComponentes[c].totalKg, 0);
                                nuevosComponentes[1].kg = totalKgComp.toFixed(2);
                                nuevosComponentes[1].rollos = restoCodigos.reduce((sum, c) => sum + agrupacionComponentes[c].totalRollos, 0);

                                nuevosComponentes[1].resist = restoCodigos.map(c => agrupacionComponentes[c].resist).find(Boolean) || '';
                                nuevosComponentes[1].solidez = restoCodigos.map(c => agrupacionComponentes[c].solidez).find(Boolean) || '';

                                nuevasTecnicas[2].condicion = 'COMPLEMENTO ACAB';
                                nuevasTecnicas[3].condicion = 'COMPLEMENTO LAV';
                            }

                            // Aplicar datos técnicos de origen
                            nuevasTecnicas[0].encA = o_encA;
                            nuevasTecnicas[0].encL = o_encL;
                            nuevasTecnicas[0].denStd = o_denStd;
                            nuevasTecnicas[0].denReal = o_denReal;
                            nuevasTecnicas[0].denLav = o_denLav;
                            nuevasTecnicas[0].revA = o_revA;
                            nuevasTecnicas[0].revB = o_revB;
                            nuevasTecnicas[0].revC = o_revC;
                        }

                        // --- B. EXTRAER DE DESTINO (Sobrescribe Origen) ---
                        // declarar variables de params fuera del if para evitar ReferenceError
                        let tono_ar_val = '';
                        let tono_vobo_val = '';
                        let degrade_ar_val = '';
                        let degrade_vobo_val = '';
                        let igualacion_ar_val = '';
                        let igualacion_vobo_val = '';
                        let pilling_ar_val = '';
                        let pilling_vobo_val = '';

                        if (isDestinoExistente) {
                            console.log('ðŸ”Ž FIRST DEST ROW:', dataD[0]);
                            console.log('ðŸ”Ž ALL DEST ROWS COUNT:', dataD.length);
                            const firstD = dataD[0];
                            clienteFinal = extraerDato(firstD, ['cliente']) || clienteFinal;
                            colorFinal = extraerDato(firstD, ['color']) || colorFinal;
                            fechaRegistroFinal = formatFechaDMY(extraerDato(firstD, ['fecha registro'])) || fechaRegistroFinal;
                            tipoOpFinal = extraerDato(firstD, ['tipo op', 'tipo_op', 'tipo']) || tipoOpFinal;
                            destinoFinal = extraerDato(firstD, ['destino']) || destinoFinal;
                            rutaTelaFinal = extraerDato(firstD, ['ruta tela', 'ruta_tela']) || rutaTelaFinal;
                            rutaOriginalFinal = extraerDato(firstD, ['ruta original', 'ruta_original']) || rutaOriginalFinal;
                            statusAuditoriaFinal = normalizeStatusValue(extraerDato(firstD, ['status']) || statusAuditoriaFinal);
                            bapFinal = normalizeBapValue(extraerDato(firstD, ['bap']) || bapFinal, statusAuditoriaFinal);
                            auditor1Final = String(extraerDato(firstD, ['auditor 1', 'auditor1']) || auditor1Final);
                            auditor2Final = String(extraerDato(firstD, ['auditor 2', 'auditor2']) || auditor2Final);

                            // Buscar A/R y VoBo en TODAS las filas del destino y tomar el primer valor no vacío
                            const findInData = (keys) => {
                                for (let r of dataD) {
                                    const v = extraerDato(r, keys);
                                    if (v !== '' && v !== null && v !== undefined) return v;
                                }
                                return '';
                            };

                            tono_ar_val = findInData(['tono a/r', 'tono ar', 'tono a_r', 'tono_ar', 'tono a r', 'tono']) || '';
                            tono_vobo_val = findInData(['tono vobo', 'tono vo bo', 'tono_vobo', 'tono v/o']) || '';

                            degrade_ar_val = findInData(['degrade a/r', 'degrade ar', 'degrade a_r', 'degrade_a_r', 'degrade']) || '';
                            degrade_vobo_val = findInData(['degrade vobo', 'degrade_vobo']) || '';

                            igualacion_ar_val = findInData(['igualacion a/r', 'igualacion ar', 'igualacion a_r', 'igualacion']) || '';
                            igualacion_vobo_val = findInData(['igualacion vobo', 'igualacion_vobo']) || '';

                            pilling_ar_val = findInData(['pilling a/r', 'pilling ar', 'pilling a_r', 'pilling']) || '';
                            pilling_vobo_val = findInData(['pilling vobo', 'pilling_vobo']) || '';

                            console.log('ðŸ”Ž PARAMS from DEST (searched all rows):', { tono_ar_val, tono_vobo_val, degrade_ar_val, degrade_vobo_val, igualacion_ar_val, igualacion_vobo_val, pilling_ar_val, pilling_vobo_val });

                            // Buscar valores del bloque "CARACTERÍSTICAS DE PRODUCCIÓN" en el DESTINO
                            let prod_cuerpo_den_t_acab = '';
                            let prod_cuerpo_den_t_lavada = '';
                            let prod_comp_den_t_acab = '';
                            let prod_comp_den_t_lavada = '';
                            // ANCHO / RAPORT / PH (se declaran aquí para usarse fuera del try)
                            let prod_cuerpo_ancho_t_acab = '';
                            let prod_cuerpo_ancho_t_lavada = '';
                            let prod_comp_ancho_t_acab = '';
                            let prod_comp_ancho_t_lavada = '';

                            let prod_cuerpo_raport_t_acab = '';
                            let prod_cuerpo_raport_t_lavada = '';
                            let prod_comp_raport_t_acab = '';
                            let prod_comp_raport_t_lavada = '';

                            let prod_cuerpo_ph_t_acab = '';
                            let prod_cuerpo_ph_t_lavada = '';
                            let prod_comp_ph_t_acab = '';
                            let prod_comp_ph_t_lavada = '';

                            // función auxiliar: devuelve true si alguna celda de la fila coincide con el texto esperado
                            const rowMatches = (row, expectedText) => {
                                if (!row) return false;
                                const expected = normalizarTexto(expectedText || '');
                                if (!expected) return false;
                                // 1) Revisa claves conocidas usando extraerDato
                                const posible = extraerDato(row, ['componente', 'component', 'condición de tela', 'condicion de tela', 'condicion tela']);
                                if (posible && normalizarTexto(posible) === expected) return true;
                                // 2) Revisa todos los valores de la fila
                                const anyMatch = Object.values(row).some(v => normalizarTexto(v) === expected);
                                return anyMatch;
                            };

                            try {
                                // findRowMatching ahora busca preferentemente por la condicion (p. ej. 'CUERPO ACABADO')
                                // y si no encuentra, intenta otras heurísticas (componente + condicion o solo componente).
                                const findRowMatching = (componentName, condicionName) => {
                                    if (!dataD || !Array.isArray(dataD)) return undefined;
                                    // 1) Intentar encontrar por condicion (mayor probabilidad en tu sheet)
                                    if (condicionName) {
                                        const byCond = dataD.find(r => rowMatches(r, condicionName));
                                        if (byCond) return byCond;
                                    }
                                    // 2) Intentar componente + condicion
                                    if (componentName && condicionName) {
                                        const byCompAndCond = dataD.find(r => rowMatches(r, componentName) && rowMatches(r, condicionName));
                                        if (byCompAndCond) return byCompAndCond;
                                    }
                                    // 3) Intentar solo por componente
                                    if (componentName) {
                                        const byComp = dataD.find(r => rowMatches(r, componentName));
                                        if (byComp) return byComp;
                                    }
                                    return undefined;
                                };

                                const posiblesKeysDens = ['DENSIDAD (g/m2)', 'DENSIDAD g/m2', 'DENSIDAD (g m2)', 'DENSIDAD', 'densidad (g/m2)', 'densidad'];
                                const posiblesKeysAncho = ['ANCHO prod', 'ANCHO_PROD', 'ANCHO', 'ANCHO STD', 'Ancho prod', 'ancho prod'];
                                const posiblesKeysRaport = ['RAPORT', 'Raport', 'raport'];
                                const posiblesKeysPh = ['PH', 'Ph', 'ph'];

                                const rowCuerpoAcab = findRowMatching('CUERPO', 'CUERPO ACABADO');
                                if (rowCuerpoAcab) {
                                    prod_cuerpo_den_t_acab = extraerDato(rowCuerpoAcab, posiblesKeysDens) || '';
                                }

                                const rowCuerpoLav = findRowMatching('CUERPO', 'CUERPO LAVADO');
                                if (rowCuerpoLav) {
                                    // Algunas hojas guardan el valor de "DENSIDAD t_lavada" desplazado a la columna 'ANCHO prod'.
                                    prod_cuerpo_den_t_lavada = extraerDato(rowCuerpoLav, posiblesKeysDens) || extraerDato(rowCuerpoLav, posiblesKeysAncho) || '';
                                }

                                const rowCompAcab = findRowMatching('COMPLEMENTO', 'COMPLEMENTO ACAB');
                                if (rowCompAcab) {
                                    prod_comp_den_t_acab = extraerDato(rowCompAcab, posiblesKeysDens) || '';
                                }

                                const rowCompLav = findRowMatching('COMPLEMENTO', 'COMPLEMENTO LAV');
                                if (rowCompLav) {
                                    prod_comp_den_t_lavada = extraerDato(rowCompLav, posiblesKeysDens) || extraerDato(rowCompLav, posiblesKeysAncho) || '';
                                }

                                // Extraer ANCHO / RAPORT / PH para mostrar en los inputs
                                prod_cuerpo_ancho_t_acab = rowCuerpoAcab ? (extraerDato(rowCuerpoAcab, posiblesKeysAncho) || '') : '';
                                prod_cuerpo_ancho_t_lavada = rowCuerpoLav ? (extraerDato(rowCuerpoLav, posiblesKeysAncho) || '') : '';
                                prod_comp_ancho_t_acab = rowCompAcab ? (extraerDato(rowCompAcab, posiblesKeysAncho) || '') : '';
                                prod_comp_ancho_t_lavada = rowCompLav ? (extraerDato(rowCompLav, posiblesKeysAncho) || '') : '';

                                prod_cuerpo_raport_t_acab = rowCuerpoAcab ? (extraerDato(rowCuerpoAcab, posiblesKeysRaport) || '') : '';
                                prod_cuerpo_raport_t_lavada = rowCuerpoLav ? (extraerDato(rowCuerpoLav, posiblesKeysRaport) || '') : '';
                                prod_comp_raport_t_acab = rowCompAcab ? (extraerDato(rowCompAcab, posiblesKeysRaport) || '') : '';
                                prod_comp_raport_t_lavada = rowCompLav ? (extraerDato(rowCompLav, posiblesKeysRaport) || '') : '';

                                prod_cuerpo_ph_t_acab = rowCuerpoAcab ? (extraerDato(rowCuerpoAcab, posiblesKeysPh) || '') : '';
                                prod_cuerpo_ph_t_lavada = rowCuerpoLav ? (extraerDato(rowCuerpoLav, posiblesKeysPh) || '') : '';
                                prod_comp_ph_t_acab = rowCompAcab ? (extraerDato(rowCompAcab, posiblesKeysPh) || '') : '';
                                prod_comp_ph_t_lavada = rowCompLav ? (extraerDato(rowCompLav, posiblesKeysPh) || '') : '';

                                console.log('ðŸ”Ž Producción extraída:', { prod_cuerpo_den_t_acab, prod_cuerpo_den_t_lavada, prod_comp_den_t_acab, prod_comp_den_t_lavada, prod_cuerpo_ancho_t_acab, prod_cuerpo_ancho_t_lavada, prod_comp_ancho_t_acab, prod_comp_ancho_t_lavada });

                                // Logs adicionales: mostrar keys y valores crudos de las filas encontradas
                                const logRow = (label, row) => {
                                    if (!row) { console.log(`${label}: <no row>`); return; }
                                    try {
                                        console.log(`${label} keys:`, Object.keys(row));
                                        console.log(`${label} raw:`, row);
                                        console.log(`${label} -> DENSIDAD:`, extraerDato(row, posiblesKeysDens));
                                        console.log(`${label} -> ANCHO prod:`, extraerDato(row, posiblesKeysAncho));
                                        console.log(`${label} -> RAPORT:`, extraerDato(row, posiblesKeysRaport));
                                        console.log(`${label} -> PH:`, extraerDato(row, posiblesKeysPh));
                                    } catch(e) { console.warn('Error logRow', e); }
                                };

                                logRow('ROW CUERPO ACAB', rowCuerpoAcab);
                                logRow('ROW CUERPO LAV', rowCuerpoLav);
                                logRow('ROW COMP ACAB', rowCompAcab);
                                logRow('ROW COMP LAV', rowCompLav);
                            } catch(e) { console.warn('Error extrayendo DENSIDAD de DEST:', e); }

                            // Reconstruir nombres de componentes desde destino (necesario cuando se
                            // omite la lectura de origen, optimizacion #2). El formulario tiene 2 slots:
                            // CUERPO (slot 0) y COMPLEMENTO (slot 1).
                            const destTieneComponente = (needle) => dataD.some(r => normalizarTexto(extraerDato(r, ['componente', 'component'])).includes(needle));
                            if (!nuevosComponentes[0].nombre && destTieneComponente('cuerpo')) nuevosComponentes[0].nombre = 'CUERPO';
                            if (!nuevosComponentes[1].nombre && destTieneComponente('complemento')) nuevosComponentes[1].nombre = 'COMPLEMENTO';

                            nuevosComponentes = nuevosComponentes.map(comp => {
                                if (!comp.nombre) return comp;
                                const savedRow = dataD.find(r => rowMatches(r, comp.nombre));
                                if (savedRow) {
                                    return {
                                        ...comp,
                                        // COD.ART/DESCRIPCION/KG/#ROLLOS tambien vienen de destino (antes solo de origen)
                                        codArt: extraerDato(savedRow, ['cod. art.', 'cod art', 'codigo', 'articulo']) || comp.codArt,
                                        desc: extraerDato(savedRow, ['descripcion', 'descripcion', 'desc']) || comp.desc,
                                        kg: extraerDato(savedRow, ['total kg', 'kg']) || comp.kg,
                                        rollos: extraerDato(savedRow, ['#rollos', 'rollos', 'numero de rollos', 'nro rollos', 'n rollos']) || comp.rollos,
                                        resist: extraerDato(savedRow, ['resistencia', 'resistencia valor', 'resist']) || comp.resist,
                                        solidez: extraerDato(savedRow, ['solidez', 'solidez valor', 'solid']) || comp.solidez,
                                        rgb: extraerDato(savedRow, ['color rgb', 'rgb']) || comp.rgb
                                    };
                                }
                                return comp;
                            });

                            // Fijar condiciones del COMPLEMENTO desde destino (slots 2 y 3), necesario
                            // cuando se omite origen (#2). Las de CUERPO ya están fijas (slots 0 y 1).
                            if (!nuevasTecnicas[2].condicion && destTieneComponente('complemento')) nuevasTecnicas[2].condicion = 'COMPLEMENTO ACAB';
                            if (!nuevasTecnicas[3].condicion && destTieneComponente('complemento')) nuevasTecnicas[3].condicion = 'COMPLEMENTO LAV';

                            nuevasTecnicas = nuevasTecnicas.map(tec => {
                                if (!tec.condicion) return tec;
                                const savedRow = dataD.find(r => rowMatches(r, tec.condicion));
                                if (savedRow) {
                                    console.log(`âœ… Found DEST row for condicion='${tec.condicion}':`, savedRow);
                                    return {
                                        ...tec,
                                        anchoStd: extraerDato(savedRow, ['ancho std', 'ancho_std']) || tec.anchoStd,
                                        anchoReal: extraerDato(savedRow, ['ancho real', 'ancho_real']) || tec.anchoReal,
                                        anchoLav: extraerDato(savedRow, ['ancho lavado', 'ancho lav']) || tec.anchoLav,
                                        encA: extraerDato(savedRow, ['enc a%', 'enc a', 'encogimiento a', 'encog a']) || tec.encA,
                                        encL: extraerDato(savedRow, ['enc l%', 'enc l', 'encogimiento l', 'encog l']) || tec.encL,
                                        denStd: extraerDato(savedRow, ['den std', 'densidad std']) || tec.denStd,
                                        denReal: extraerDato(savedRow, ['den real', 'densidad real']) || tec.denReal,
                                        denLav: extraerDato(savedRow, ['den lavado', 'den lav', 'densidad lavado', 'densidad lav']) || tec.denLav,
                                        revA: extraerDato(savedRow, ['rev a', 'rev a%', 'revirado a', '% rev a', '% revirado a']) || tec.revA,
                                        revB: extraerDato(savedRow, ['rev b', 'rev b%', 'revirado b', '% rev b', '% revirado b']) || tec.revB,
                                        revC: extraerDato(savedRow, ['rev c', 'rev c%', 'revirado c', '% rev c', '% revirado c']) || tec.revC,
                                        incl: extraerDato(savedRow, ['inclinac', 'inclinacion']) || tec.incl
                                    };
                                } else {
                                    console.log(`âš ï¸ No DEST row found for condicion='${tec.condicion}'`);
                                }
                                return tec;
                            });
                        }

                        // Generar reporte de Status Visual
                        if (isDestinoExistente) {
                            setStatus(`Datos cargados. Modo Actualizacion (Ya existan registros).`);
                            console.log("âœ… Proceso terminado: Modo Actualizacion.");
                        } else if (dataArrayOrigen.length > 0) {
                            setStatus(`Datos de origen cargados. Modo Nuevo Registro.`);
                            console.log("âœ… Proceso terminado: Modo Nuevo Registro.");
                        } else {
                            setStatus('Aviso: No se encontraron datos en origen ni en destino.');
                            console.log("âš ï¸ Proceso terminado: Sin datos encontrados.");
                        }

                        // Retornar el nuevo estado de forma segura
                        return {
                            ...prev,
                            cliente: clienteFinal,
                            op: busqueda.op,
                            partida: busqueda.partida,
                            color: colorFinal,
                            fechaRegistro: fechaRegistroFinal,
                            statusAuditoria: statusAuditoriaFinal,
                            bap: bapFinal,
                            auditor1: auditor1Final,
                            auditor2: auditor2Final,
                            tipoOp: tipoOpFinal,
                            destino: destinoFinal,
                            rutaTela: rutaTelaFinal,
                            rutaOriginal: rutaOriginalFinal,
                            componentes: nuevosComponentes,
                            tecnicas: nuevasTecnicas,
                            rollos: getRollosArray(pre_rollos),
                            observaciones: pre_observaciones.map(v => sanitizeObsValue(v)),
                            firmas: getFirmasState(pre_firmas),
                            produccion: {
                                ...prev.produccion,
                                parametros: {
                                    TONO: { ar: normalizeARValue(tono_ar_val || (prev.produccion && prev.produccion.parametros && prev.produccion.parametros.TONO ? prev.produccion.parametros.TONO.ar : '')), vobo: tono_vobo_val || (prev.produccion && prev.produccion.parametros && prev.produccion.parametros.TONO ? prev.produccion.parametros.TONO.vobo : '') },
                                    DEGRADE: { ar: normalizeARValue(degrade_ar_val || (prev.produccion && prev.produccion.parametros && prev.produccion.parametros.DEGRADE ? prev.produccion.parametros.DEGRADE.ar : '')), vobo: degrade_vobo_val || (prev.produccion && prev.produccion.parametros && prev.produccion.parametros.DEGRADE ? prev.produccion.parametros.DEGRADE.vobo : '') },
                                    IGUALACION: { ar: normalizeARValue(igualacion_ar_val || (prev.produccion && prev.produccion.parametros && prev.produccion.parametros.IGUALACION ? prev.produccion.parametros.IGUALACION.ar : '')), vobo: igualacion_vobo_val || (prev.produccion && prev.produccion.parametros && prev.produccion.parametros.IGUALACION ? prev.produccion.parametros.IGUALACION.vobo : '') },
                                    PILLING: { ar: normalizeARValue(pilling_ar_val || (prev.produccion && prev.produccion.parametros && prev.produccion.parametros.PILLING ? prev.produccion.parametros.PILLING.ar : '')), vobo: pilling_vobo_val || (prev.produccion && prev.produccion.parametros && prev.produccion.parametros.PILLING ? prev.produccion.parametros.PILLING.vobo : '') }
                                },
                                cuerpo: {
                                    ...((prev.produccion && prev.produccion.cuerpo) ? prev.produccion.cuerpo : {}),
                                    densidad: {
                                        t_acab: typeof pre_prod_cuerpo_den_t_acab !== 'undefined' && pre_prod_cuerpo_den_t_acab !== null && pre_prod_cuerpo_den_t_acab !== '' ? pre_prod_cuerpo_den_t_acab : ((prev.produccion && prev.produccion.cuerpo && prev.produccion.cuerpo.densidad) ? prev.produccion.cuerpo.densidad.t_acab : ''),
                                        t_lavada: typeof pre_prod_cuerpo_den_t_lavada !== 'undefined' && pre_prod_cuerpo_den_t_lavada !== null && pre_prod_cuerpo_den_t_lavada !== '' ? pre_prod_cuerpo_den_t_lavada : ((prev.produccion && prev.produccion.cuerpo && prev.produccion.cuerpo.densidad) ? prev.produccion.cuerpo.densidad.t_lavada : '')
                                    },
                                    ancho: {
                                        t_acab: typeof pre_prod_cuerpo_ancho_t_acab !== 'undefined' && pre_prod_cuerpo_ancho_t_acab !== null && pre_prod_cuerpo_ancho_t_acab !== '' ? pre_prod_cuerpo_ancho_t_acab : ((prev.produccion && prev.produccion.cuerpo && prev.produccion.cuerpo.ancho) ? prev.produccion.cuerpo.ancho.t_acab : ''),
                                        t_lavada: typeof pre_prod_cuerpo_ancho_t_lavada !== 'undefined' && pre_prod_cuerpo_ancho_t_lavada !== null && pre_prod_cuerpo_ancho_t_lavada !== '' ? pre_prod_cuerpo_ancho_t_lavada : ((prev.produccion && prev.produccion.cuerpo && prev.produccion.cuerpo.ancho) ? prev.produccion.cuerpo.ancho.t_lavada : '')
                                    },
                                    raport: {
                                        t_acab: typeof pre_prod_cuerpo_raport_t_acab !== 'undefined' && pre_prod_cuerpo_raport_t_acab !== null && pre_prod_cuerpo_raport_t_acab !== '' ? pre_prod_cuerpo_raport_t_acab : ((prev.produccion && prev.produccion.cuerpo && prev.produccion.cuerpo.raport) ? prev.produccion.cuerpo.raport.t_acab : ''),
                                        t_lavada: typeof pre_prod_cuerpo_raport_t_lavada !== 'undefined' && pre_prod_cuerpo_raport_t_lavada !== null && pre_prod_cuerpo_raport_t_lavada !== '' ? pre_prod_cuerpo_raport_t_lavada : ((prev.produccion && prev.produccion.cuerpo && prev.produccion.cuerpo.raport) ? prev.produccion.cuerpo.raport.t_lavada : '')
                                    },
                                    ph: {
                                        t_acab: typeof pre_prod_cuerpo_ph_t_acab !== 'undefined' && pre_prod_cuerpo_ph_t_acab !== null && pre_prod_cuerpo_ph_t_acab !== '' ? pre_prod_cuerpo_ph_t_acab : ((prev.produccion && prev.produccion.cuerpo && prev.produccion.cuerpo.ph) ? prev.produccion.cuerpo.ph.t_acab : ''),
                                        t_lavada: typeof pre_prod_cuerpo_ph_t_lavada !== 'undefined' && pre_prod_cuerpo_ph_t_lavada !== null && pre_prod_cuerpo_ph_t_lavada !== '' ? pre_prod_cuerpo_ph_t_lavada : ((prev.produccion && prev.produccion.cuerpo && prev.produccion.cuerpo.ph) ? prev.produccion.cuerpo.ph.t_lavada : '')
                                    }
                                },
                                complemento: {
                                    ...((prev.produccion && prev.produccion.complemento) ? prev.produccion.complemento : {}),
                                    densidad: {
                                        t_acab: typeof pre_prod_comp_den_t_acab !== 'undefined' && pre_prod_comp_den_t_acab !== null && pre_prod_comp_den_t_acab !== '' ? pre_prod_comp_den_t_acab : ((prev.produccion && prev.produccion.complemento && prev.produccion.complemento.densidad) ? prev.produccion.complemento.densidad.t_acab : ''),
                                        t_lavada: typeof pre_prod_comp_den_t_lavada !== 'undefined' && pre_prod_comp_den_t_lavada !== null && pre_prod_comp_den_t_lavada !== '' ? pre_prod_comp_den_t_lavada : ((prev.produccion && prev.produccion.complemento && prev.produccion.complemento.densidad) ? prev.produccion.complemento.densidad.t_lavada : '')
                                    },
                                    ancho: {
                                        t_acab: typeof pre_prod_comp_ancho_t_acab !== 'undefined' && pre_prod_comp_ancho_t_acab !== null && pre_prod_comp_ancho_t_acab !== '' ? pre_prod_comp_ancho_t_acab : ((prev.produccion && prev.produccion.complemento && prev.produccion.complemento.ancho) ? prev.produccion.complemento.ancho.t_acab : ''),
                                        t_lavada: typeof pre_prod_comp_ancho_t_lavada !== 'undefined' && pre_prod_comp_ancho_t_lavada !== null && pre_prod_comp_ancho_t_lavada !== '' ? pre_prod_comp_ancho_t_lavada : ((prev.produccion && prev.produccion.complemento && prev.produccion.complemento.ancho) ? prev.produccion.complemento.ancho.t_lavada : '')
                                    },
                                    raport: {
                                        t_acab: typeof pre_prod_comp_raport_t_acab !== 'undefined' && pre_prod_comp_raport_t_acab !== null && pre_prod_comp_raport_t_acab !== '' ? pre_prod_comp_raport_t_acab : ((prev.produccion && prev.produccion.complemento && prev.produccion.complemento.raport) ? prev.produccion.complemento.raport.t_acab : ''),
                                        t_lavada: typeof pre_prod_comp_raport_t_lavada !== 'undefined' && pre_prod_comp_raport_t_lavada !== null && pre_prod_comp_raport_t_lavada !== '' ? pre_prod_comp_raport_t_lavada : ((prev.produccion && prev.produccion.complemento && prev.produccion.complemento.raport) ? prev.produccion.complemento.raport.t_lavada : '')
                                    },
                                    ph: {
                                        t_acab: typeof pre_prod_comp_ph_t_acab !== 'undefined' && pre_prod_comp_ph_t_acab !== null && pre_prod_comp_ph_t_acab !== '' ? pre_prod_comp_ph_t_acab : ((prev.produccion && prev.produccion.complemento && prev.produccion.complemento.ph) ? prev.produccion.complemento.ph.t_acab : ''),
                                        t_lavada: typeof pre_prod_comp_ph_t_lavada !== 'undefined' && pre_prod_comp_ph_t_lavada !== null && pre_prod_comp_ph_t_lavada !== '' ? pre_prod_comp_ph_t_lavada : ((prev.produccion && prev.produccion.complemento && prev.produccion.complemento.ph) ? prev.produccion.complemento.ph.t_lavada : '')
                                    }
                                }
                            }
                        };

                    } catch (innerError) {
                        console.error("âŒ Error CRÍTICO en el mapeo de datos:", innerError);
                        alert("Ocurrió un error leyendo las columnas. Abre la consola (F12) para ver los detalles y contáctame con esa información.");
                        setStatus('Error interno procesando los datos.');
                        return prev; // Regresar a cómo estaba para no colgar la UI
                    }
                });

                setIsLoading(false);
            };

            const handleSearch = async () => {
                if (!busqueda.op || !busqueda.partida) {
                    setStatus('Error: Ingresa OP y Partida para buscar.');
                    return;
                }

                stopVoiceInput();
                setEditingObsIndex(null);
                setEditingFirmaTipo(null);
                setIsLoading(true);
                setShowStatusModal(false);

                try {
                    const urlDestino = `${API_DESTINO}?action=getReport&op=${encodeURIComponent(busqueda.op)}&partida=${encodeURIComponent(busqueda.partida)}`;
                    const resD = await fetch(urlDestino);
                    if (!resD.ok) throw new Error(`HTTP ${resD.status}`);
                    const resultDestino = await resD.json();
                    const dataD = (resultDestino && resultDestino.success && Array.isArray(resultDestino.data)) ? resultDestino.data : [];
                    const uniqueStatus = Array.from(new Set(
                        dataD.map(row => normalizeStatusValue(extraerDato(row, ['status']) || 'En proceso')).filter(Boolean)
                    ));
                    uniqueStatus.sort((a, b) => {
                        const ia = STATUS_OPTIONS.indexOf(a);
                        const ib = STATUS_OPTIONS.indexOf(b);
                        if (ia === -1 && ib === -1) return a.localeCompare(b);
                        if (ia === -1) return 1;
                        if (ib === -1) return -1;
                        return ia - ib;
                    });

                    if (uniqueStatus.length > 0) {
                        setStatusModalOptions(uniqueStatus);
                        setStatusModalSelected(uniqueStatus[0]);
                        setShowStatusModal(true);
                        setStatus('Selecciona STATUS para consultar el registro.');
                        setIsLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error('âŒ Error listando STATUS:', error);
                }

                setIsLoading(false);
                await runSearch({ forceNew: false, selectedStatus: '' });
            };

            const handleSearchNew = async () => {
                setShowStatusModal(false);
                await runSearch({ forceNew: true, selectedStatus: '' });
            };

            const handleStatusModalCancel = () => {
                setShowStatusModal(false);
                setStatus('Consulta cancelada.');
            };

            const handleStatusModalLoad = async () => {
                if (!statusModalSelected) {
                    setStatus('Selecciona un STATUS para continuar.');
                    return;
                }
                setShowStatusModal(false);
                await runSearch({ forceNew: false, selectedStatus: statusModalSelected });
            };

            const handleSave = async () => {
                stopVoiceInput();
                setEditingObsIndex(null);
                setEditingFirmaTipo(null);

                // Una copia debe definir STATUS antes de guardarse (se limpió a propósito).
                if (esCopia && !String(formData.statusAuditoria || '').trim()) {
                    setStatus('Aviso: selecciona el STATUS de la copia antes de guardar.');
                    return;
                }

                setIsLoading(true);
                setStatus('Guardando en base de datos...');

                const opToSave = String(formData.op || '').trim();
                const partidaToSave = String(formData.partida || '').trim();
                if (!opToSave || !partidaToSave) {
                    setStatus('Error: OP y PARTIDA son obligatorios antes de guardar.');
                    setIsLoading(false);
                    return;
                }

                const today = new Date();
                const dia = today.getDate().toString().padStart(2, '0');
                const mes = (today.getMonth() + 1).toString().padStart(2, '0');
                const anio = today.getFullYear();
                const fechaRegistro = String(formData.fechaRegistro || '').trim() || `${dia}/${mes}/${anio}`;
                const firmasBase = getFirmasState(formData.firmas);
                const firmasToSave = {
                    despacho: {
                        ...firmasBase.despacho,
                        fecha: firmasBase.despacho.sello ? (firmasBase.despacho.fecha || getTodayDateStamp()) : ''
                    },
                    corte: {
                        ...firmasBase.corte,
                        fecha: firmasBase.corte.sello ? (firmasBase.corte.fecha || getTodayDateStamp()) : ''
                    }
                };

                const rowsToSave = [];

                const addRow = (compIdx, tecIdx) => {
                    const comp = formData.componentes[compIdx];
                    const tec = formData.tecnicas[tecIdx];
                    
                    if (comp.nombre && tec.condicion) {
                        // Construimos un objeto base con las variables colocadas al final para proteger el orden
                        let rowObj = {
                            "FECHA REGISTRO": fechaRegistro,
                            "STATUS": formData.statusAuditoria || 'En proceso',
                            "BAP": formData.bap || '',
                            "CLIENTE": formData.cliente,
                            "OP": opToSave,
                            "PARTIDA": partidaToSave,
                            "COLOR": formData.color,
                            "Tipo OP": formData.tipoOp,
                            "DESTINO": formData.destino,
                            "RUTA TELA": formData.rutaTela,
                            "RUTA ORIGINAL": formData.rutaOriginal,
                            "COMPONENTE": comp.nombre,
                            "COD. ART.": comp.codArt,
                            "DESCRIPCION": comp.desc,
                            "TOTAL KG": comp.kg,
                            "#ROLLOS": comp.rollos,
                            "COLOR RGB": comp.rgb,
                            "CONDICION DE TELA": tec.condicion,
                            "ANCHO STD": tec.anchoStd,
                            "ANCHO REAL": tec.anchoReal,
                            "ANCHO LAVADO": tec.anchoLav,
                            "ENC A%": tec.encA,
                            "ENC L%": tec.encL,
                            "DEN STD": tec.denStd,
                            "DEN REAL": tec.denReal,
                            "DEN LAVADO": tec.denLav,
                            "REV A": tec.revA,
                            "REV B": tec.revB,
                            "REV C": tec.revC,
                            "INCLINAC": tec.incl,
                            "RESISTENCIA": comp.resist, 
                            "SOLIDEZ": comp.solidez,
                            "TONO A/R": (formData && formData.produccion && formData.produccion.parametros && formData.produccion.parametros.TONO) ? formData.produccion.parametros.TONO.ar : '',
                            "DEGRADE A/R": (formData && formData.produccion && formData.produccion.parametros && formData.produccion.parametros.DEGRADE) ? formData.produccion.parametros.DEGRADE.ar : '',
                            "IGUALACION A/R": (formData && formData.produccion && formData.produccion.parametros && formData.produccion.parametros.IGUALACION) ? formData.produccion.parametros.IGUALACION.ar : '',
                            "PILLING A/R": (formData && formData.produccion && formData.produccion.parametros && formData.produccion.parametros.PILLING) ? formData.produccion.parametros.PILLING.ar : '',
                            "TONO VoBo": (formData && formData.produccion && formData.produccion.parametros && formData.produccion.parametros.TONO) ? formData.produccion.parametros.TONO.vobo : '',
                            "DEGRADE VoBo": (formData && formData.produccion && formData.produccion.parametros && formData.produccion.parametros.DEGRADE) ? formData.produccion.parametros.DEGRADE.vobo : '',
                            "IGUALACION VoBo": (formData && formData.produccion && formData.produccion.parametros && formData.produccion.parametros.IGUALACION) ? formData.produccion.parametros.IGUALACION.vobo : '',
                            "PILLING VoBo": (formData && formData.produccion && formData.produccion.parametros && formData.produccion.parametros.PILLING) ? formData.produccion.parametros.PILLING.vobo : '',
                            "OB1": sanitizeObsValue(getObsArray(formData.observaciones)[0]),
                            "OB2": sanitizeObsValue(getObsArray(formData.observaciones)[1]),
                            "OB3": sanitizeObsValue(getObsArray(formData.observaciones)[2]),
                            "OB4": sanitizeObsValue(getObsArray(formData.observaciones)[3]),
                            "OB5": sanitizeObsValue(getObsArray(formData.observaciones)[4]),
                            "OB6": sanitizeObsValue(getObsArray(formData.observaciones)[5]),
                            "OB7": sanitizeObsValue(getObsArray(formData.observaciones)[6]),
                            "SELLO DESPACHO": firmasToSave.despacho.sello || '',
                            "FECHA DESPACHO": firmasToSave.despacho.fecha || '',
                            "FIRMA DESPACHO": firmasToSave.despacho.firma || '',
                            "SELLO CORTE": firmasToSave.corte.sello || '',
                            "FECHA CORTE": firmasToSave.corte.fecha || '',
                            "FIRMA CORTE": firmasToSave.corte.firma || '',
                            "AUDITOR 1": formData.auditor1 || '',
                            "AUDITOR 2": formData.auditor2 || ''
                        };

                        // Añadir claves alternativas para asegurar coincidencia con distintos encabezados
                        const agregarAlternativas = (r) => {
                            try {
                                if (r['PARTIDA']) r['Partida'] = r['PARTIDA'];
                                if (r['STATUS']) r['Status'] = r['STATUS'];
                                if (r['BAP']) r['Bap'] = r['BAP'];
                                if (r['AUDITOR 1']) { r['Auditor 1'] = r['AUDITOR 1']; r['AUDITOR1'] = r['AUDITOR 1']; }
                                if (r['AUDITOR 2']) { r['Auditor 2'] = r['AUDITOR 2']; r['AUDITOR2'] = r['AUDITOR 2']; }
                                if (r['COMPONENTE']) { r['Componente'] = r['COMPONENTE']; r['COMPONENTE'] = r['COMPONENTE']; }
                                if (r['RUTA ORIGINAL']) r['Ruta original'] = r['RUTA ORIGINAL'];
                                if (r['RESISTENCIA']) r['RESISTENCIA VALOR'] = r['RESISTENCIA'];
                                if (r['SOLIDEZ']) r['SOLIDEZ VALOR'] = r['SOLIDEZ'];
                                if (r['COLOR RGB']) { r['RGB'] = r['COLOR RGB']; r['COLOR RGB'] = r['COLOR RGB']; }
                                if (r['CONDICION DE TELA']) r['CONDICION DE TELA'] = r['CONDICION DE TELA'];
                                if (r['PILLING A/R']) r[' PILLING A/R'] = r['PILLING A/R'];
                                if (r['PILLING VoBo']) r[' PILLING VoBo'] = r['PILLING VoBo'];
                                if (r['OB1']) r['OB 1'] = r['OB1'];
                                if (r['OB2']) r['OB 2'] = r['OB2'];
                                if (r['OB3']) r['OB 3'] = r['OB3'];
                                if (r['OB4']) r['OB 4'] = r['OB4'];
                                if (r['OB5']) r['OB 5'] = r['OB5'];
                                if (r['OB6']) r['OB 6'] = r['OB6'];
                                if (r['OB7']) r['OB 7'] = r['OB7'];
                                if (r['SELLO DESPACHO']) r['SELLO Y FIRMA APROBADO PARA DESPACHO (AUDITOR)'] = r['SELLO DESPACHO'];
                                if (r['FIRMA DESPACHO']) r['FIRMA DESPACHO AUDITOR'] = r['FIRMA DESPACHO'];
                                if (r['FECHA DESPACHO']) r['FECHA FIRMA DESPACHO'] = r['FECHA DESPACHO'];
                                if (r['SELLO CORTE']) r['SELLO Y FIRMA APROBADO PARA CORTE (AUDITOR)'] = r['SELLO CORTE'];
                                if (r['FIRMA CORTE']) r['FIRMA CORTE AUDITOR'] = r['FIRMA CORTE'];
                                if (r['FECHA CORTE']) r['FECHA FIRMA CORTE'] = r['FECHA CORTE'];

                                // Alternativas para campos técnicos ANCHO y ENCOGIMIENTO
                                if (r['ANCHO STD']) r['Ancho std'] = r['ANCHO STD'];
                                if (r['ANCHO REAL']) r['Ancho real'] = r['ANCHO REAL'];
                                if (r['ANCHO LAVADO']) r['Ancho lavado'] = r['ANCHO LAVADO'];
                                if (r['ENC A%']) r['Encogimiento A%'] = r['ENC A%'];
                                if (r['ENC L%']) r['Encogimiento L%'] = r['ENC L%'];
                                if (r['ENC A']) r['Encogimiento A%'] = r['ENC A'];
                                if (r['ENC L']) r['Encogimiento L%'] = r['ENC L'];

                                // Alternativas para DENSIDAD
                                if (r['DEN STD']) r['Densidad std'] = r['DEN STD'];
                                if (r['DEN REAL']) r['Densidad real'] = r['DEN REAL'];
                                if (r['DEN LAV']) r['Densidad lavado'] = r['DEN LAV'];
                                if (r['DEN LAVADO']) r['Densidad lavado'] = r['DEN LAVADO'];
                                if (r['DENSIDAD STD']) r['Densidad std'] = r['DENSIDAD STD'];
                                if (r['DENSIDAD REAL']) r['Densidad real'] = r['DENSIDAD REAL'];
                                if (r['DENSIDAD LAVADO']) r['Densidad lavado'] = r['DENSIDAD LAVADO'];

                                // Alternativas para % REVIRADO
                                if (r['REV A']) r['%Revirado A'] = r['REV A'];
                                if (r['REV B']) r['%Revirado B'] = r['REV B'];
                                if (r['REV C']) r['%Revirado C'] = r['REV C'];
                                if (r['% REV A']) r['%Revirado A'] = r['% REV A'];
                                if (r['% REV B']) r['%Revirado B'] = r['% REV B'];
                                if (r['% REV C']) r['%Revirado C'] = r['% REV C'];

                                // Alternativa para INCLINACION
                                if (r['INCLINAC']) r['Inclinacion'] = r['INCLINAC'];
                                if (r['INCLINACION']) r['Inclinacion'] = r['INCLINACION'];
                            } catch(e) { console.warn('No se pudo agregar claves alternativas', e); }
                        };

                        agregarAlternativas(rowObj);

                        // Si esta fila corresponde a CUERPO/COMPLEMENTO + T.Acab, escribir
                        // los valores del bloque "CARACTERÍSTICAS DE PRODUCCIÓN"
                        try {
                            if (comp && comp.nombre && tec && tec.condicion) {
                                const compNormalized = normalizarTexto(comp.nombre);
                                const tecNormalized = normalizarTexto(tec.condicion);

                                const isCuerpo = compNormalized === 'cuerpo';
                                const isCuerpoAcab = tecNormalized === 'cuerpo acabado';
                                const isComplemento = compNormalized === 'complemento' || compNormalized.includes('complemento');
                                const isComplementoAcab = tecNormalized === 'complemento acabado' || tecNormalized === 'complemento acab' || tecNormalized.includes('complemento acab');

                                if (isCuerpo && isCuerpoAcab) {
                                    const prodDen = (formData && formData.produccion && formData.produccion.cuerpo && formData.produccion.cuerpo.densidad) ? formData.produccion.cuerpo.densidad.t_acab : '';
                                    const prodAncho = (formData && formData.produccion && formData.produccion.cuerpo && formData.produccion.cuerpo.ancho) ? formData.produccion.cuerpo.ancho.t_acab : '';
                                    const prodRaport = (formData && formData.produccion && formData.produccion.cuerpo && formData.produccion.cuerpo.raport) ? formData.produccion.cuerpo.raport.t_acab : '';
                                    const prodPh = (formData && formData.produccion && formData.produccion.cuerpo && formData.produccion.cuerpo.ph) ? formData.produccion.cuerpo.ph.t_acab : '';

                                    rowObj['DENSIDAD (g/m2)'] = prodDen !== undefined && prodDen !== null ? prodDen : '';
                                    rowObj['ANCHO prod'] = prodAncho !== undefined && prodAncho !== null ? prodAncho : '';
                                    rowObj['RAPORT'] = prodRaport !== undefined && prodRaport !== null ? prodRaport : '';
                                    rowObj['PH'] = prodPh !== undefined && prodPh !== null ? prodPh : '';
                                }

                                if (isComplemento && isComplementoAcab) {
                                    const prodDen = (formData && formData.produccion && formData.produccion.complemento && formData.produccion.complemento.densidad) ? formData.produccion.complemento.densidad.t_acab : '';
                                    const prodAncho = (formData && formData.produccion && formData.produccion.complemento && formData.produccion.complemento.ancho) ? formData.produccion.complemento.ancho.t_acab : '';
                                    const prodRaport = (formData && formData.produccion && formData.produccion.complemento && formData.produccion.complemento.raport) ? formData.produccion.complemento.raport.t_acab : '';
                                    const prodPh = (formData && formData.produccion && formData.produccion.complemento && formData.produccion.complemento.ph) ? formData.produccion.complemento.ph.t_acab : '';

                                    rowObj['DENSIDAD (g/m2)'] = prodDen !== undefined && prodDen !== null ? prodDen : '';
                                    rowObj['ANCHO prod'] = prodAncho !== undefined && prodAncho !== null ? prodAncho : '';
                                    rowObj['RAPORT'] = prodRaport !== undefined && prodRaport !== null ? prodRaport : '';
                                    rowObj['PH'] = prodPh !== undefined && prodPh !== null ? prodPh : '';
                                }
                                // Also handle T.Lavada (CUERPO LAVADO / COMPLEMENTO LAV)
                                try {
                                    const isCuerpoLav = isCuerpo && (tecNormalized === 'cuerpo lavado' || tecNormalized === 'cuerpo lav' || tecNormalized.includes('lav'));
                                    const isComplementoLav = isComplemento && (tecNormalized === 'complemento lavado' || tecNormalized === 'complemento lav' || tecNormalized.includes('complemento lav'));

                                    if (isCuerpoLav) {
                                        const prodDen = (formData && formData.produccion && formData.produccion.cuerpo && formData.produccion.cuerpo.densidad) ? formData.produccion.cuerpo.densidad.t_lavada : '';
                                        const prodAncho = (formData && formData.produccion && formData.produccion.cuerpo && formData.produccion.cuerpo.ancho) ? formData.produccion.cuerpo.ancho.t_lavada : '';
                                        const prodRaport = (formData && formData.produccion && formData.produccion.cuerpo && formData.produccion.cuerpo.raport) ? formData.produccion.cuerpo.raport.t_lavada : '';
                                        const prodPh = (formData && formData.produccion && formData.produccion.cuerpo && formData.produccion.cuerpo.ph) ? formData.produccion.cuerpo.ph.t_lavada : '';

                                        rowObj['DENSIDAD (g/m2)'] = prodDen !== undefined && prodDen !== null ? prodDen : '';
                                        rowObj['ANCHO prod'] = prodAncho !== undefined && prodAncho !== null ? prodAncho : '';
                                        rowObj['RAPORT'] = prodRaport !== undefined && prodRaport !== null ? prodRaport : '';
                                        rowObj['PH'] = prodPh !== undefined && prodPh !== null ? prodPh : '';
                                    }

                                    if (isComplementoLav) {
                                        const prodDen = (formData && formData.produccion && formData.produccion.complemento && formData.produccion.complemento.densidad) ? formData.produccion.complemento.densidad.t_lavada : '';
                                        const prodAncho = (formData && formData.produccion && formData.produccion.complemento && formData.produccion.complemento.ancho) ? formData.produccion.complemento.ancho.t_lavada : '';
                                        const prodRaport = (formData && formData.produccion && formData.produccion.complemento && formData.produccion.complemento.raport) ? formData.produccion.complemento.raport.t_lavada : '';
                                        const prodPh = (formData && formData.produccion && formData.produccion.complemento && formData.produccion.complemento.ph) ? formData.produccion.complemento.ph.t_lavada : '';

                                        rowObj['DENSIDAD (g/m2)'] = prodDen !== undefined && prodDen !== null ? prodDen : '';
                                        rowObj['ANCHO prod'] = prodAncho !== undefined && prodAncho !== null ? prodAncho : '';
                                        rowObj['RAPORT'] = prodRaport !== undefined && prodRaport !== null ? prodRaport : '';
                                        rowObj['PH'] = prodPh !== undefined && prodPh !== null ? prodPh : '';
                                    }
                                } catch(e) { console.warn('No se pudo asignar valores de producción (lavada):', e); }
                            }
                        } catch(e) { console.warn('No se pudo asignar valores de producción:', e); }

                        if (destKeysRef.current && destKeysRef.current.length > 0) {
                            let orderedRow = {};

                            // 1. Forzar el orden de las variables para que sea exactamente igual al de tu Google Sheet
                            // Build orderedRow by trying a prioritized mapping list that follows the sheet order
                            const priorityKeys = [
                                'FECHA REGISTRO','STATUS','BAP','AUDITOR 1','AUDITOR 2','CLIENTE','OP','PARTIDA','COLOR','Tipo OP','DESTINO','RUTA TELA','RUTA ORIGINAL',
                                'COMPONENTE','COD. ART.','DESCRIPCION','TOTAL KG','#ROLLOS','RESISTENCIA','RESISTENCIA VALOR','SOLIDEZ','SOLIDEZ VALOR','COLOR RGB','RGB',
                                'CONDICIÓN DE TELA','CONDICION DE TELA','ANCHO STD','ANCHO REAL','ANCHO LAVADO','ENC A%','ENC A','ENC L%','ENC L','DEN STD','DEN REAL','DEN LAVADO','REV A','REV B','REV C','INCLINAC','INCLINACION',
                                'OB1','OB2','OB3','OB4','OB5','OB6','OB7',
                                'SELLO DESPACHO','FECHA DESPACHO','FIRMA DESPACHO','SELLO CORTE','FECHA CORTE','FIRMA CORTE'
                            ];

                            destKeysRef.current.forEach(k => {
                                const normalK = normalizarClave(k);
                                let placed = false;

                                // 1) Try exact matches against rowObj keys
                                const exactMatch = Object.keys(rowObj).find(rk => normalizarClave(rk) === normalK);
                                if (exactMatch) { orderedRow[k] = rowObj[exactMatch]; placed = true; }

                                if (!placed) {
                                    // 2) Try priority list: look for a priority key that matches this dest column
                                    for (let pk of priorityKeys) {
                                        const npk = normalizarClave(pk);
                                        if (npk === normalK || npk.includes(normalK) || normalK.includes(npk) || npk.split(' ').some(t=> normalK.includes(t))) {
                                            const candidate = Object.keys(rowObj).find(rk => normalizarClave(rk) === npk || normalizarClave(rk).includes(npk) || npk.includes(normalizarClave(rk)));
                                            if (candidate) { orderedRow[k] = rowObj[candidate]; placed = true; break; }
                                        }
                                    }
                                }

                                if (!placed) {
                                    // 3) Fallback: partial/token matching
                                    const fallback = Object.keys(rowObj).find(rk => {
                                        const nrk = normalizarClave(rk);
                                        if (nrk.includes(normalK) || normalK.includes(nrk)) return true;
                                        if (normalK.includes('resist') && nrk.includes('resist')) return true;
                                        if (normalK.includes('solide') && nrk.includes('solide')) return true;
                                        if (normalK.includes('rgb') && nrk.includes('rgb')) return true;
                                        if (normalK.includes('partid') && nrk.includes('partid')) return true;
                                        if (normalK.includes('component') && nrk.includes('component')) return true;
                                        return false;
                                    });
                                    orderedRow[k] = fallback ? rowObj[fallback] : '';
                                }
                            });

                            // 2. Si la primera columna del sheet es una columna de fecha con otro nombre
                            // (por ejemplo 'timestamp' u otro encabezado), forzamos la fecha de reporte
                            // en la primera columna para evitar desplazamientos de columnas (shift).
                            try {
                                const firstDestKey = destKeysRef.current[0];
                                const normalFirst = normalizarClave(firstDestKey);
                                const fechaKeyInRow = Object.keys(rowObj).find(rk => normalizarClave(rk) === normalizarClave('FECHA REGISTRO'));
                                if (fechaKeyInRow) {
                                    const normalFecha = normalizarClave('FECHA REGISTRO');
                                    if (normalFirst !== normalFecha) {
                                        // Si la primera columna del destino está vacía, poner la fecha ahí
                                        if (!orderedRow[firstDestKey] || orderedRow[firstDestKey] === '') {
                                            orderedRow[firstDestKey] = rowObj[fechaKeyInRow];
                                        }
                                    }
                                }
                            } catch (e) {
                                console.warn('No se pudo forzar fecha en primera columna:', e);
                            }

                            // 3. Si agregamos columnas en el código pero aún no existen físicamente en tu Excel, las pone al final
                            Object.keys(rowObj).forEach(rk => {
                                const normalRk = normalizarClave(rk);
                                if (!destKeys.some(k => normalizarClave(k) === normalRk)) {
                                    orderedRow[rk] = rowObj[rk];
                                }
                            });

                            // 4. Asegurar mapeo explícito para columnas críticas que a veces no coinciden exactamente
                            const ensureMap = (tokens, rowKey) => {
                                if (!(rowKey in rowObj)) return;
                                const value = rowObj[rowKey];
                                if (value === null || value === undefined) return;
                                if (typeof value === 'string' && value.trim() === '') return;
                                const found = destKeys.find(k => {
                                    const nk = normalizarClave(k);
                                    return tokens.some(t => nk.includes(t));
                                });
                                if (found) orderedRow[found] = value;
                            };

                            ensureMap(['partid'], 'PARTIDA');
                            ensureMap(['status'], 'STATUS');
                            ensureMap(['bap'], 'BAP');
                            ensureMap(['auditor1', 'auditor 1'], 'AUDITOR 1');
                            ensureMap(['auditor2', 'auditor 2'], 'AUDITOR 2');
                            ensureMap(['rutatela'], 'RUTA TELA');
                            ensureMap(['rutaoriginal', 'rutaorigen'], 'RUTA ORIGINAL');
                            ensureMap(['component'], 'COMPONENTE');
                            ensureMap(['resist', 'resistencia'], 'RESISTENCIA');
                            ensureMap(['solide', 'solidez'], 'SOLIDEZ');
                            ensureMap(['rgb', 'colorrgb'], 'COLOR RGB');
                            OBS_KEYS.forEach((key, idx) => ensureMap([`ob${idx + 1}`], key));
                            ensureMap(['sellodespacho', 'despachoauditor'], 'SELLO DESPACHO');
                            ensureMap(['fechadespacho', 'firmafechadespacho'], 'FECHA DESPACHO');
                            ensureMap(['firmadespacho', 'firmaauditordespacho'], 'FIRMA DESPACHO');
                            ensureMap(['sellocorte', 'corteauditor'], 'SELLO CORTE');
                            ensureMap(['fechacorte', 'firmafechacorte'], 'FECHA CORTE');
                            ensureMap(['firmacorte', 'firmaauditorcorte'], 'FIRMA CORTE');

                            // también asegurar alternativas en orderedRow si se usó el orden del destino
                            agregarAlternativas(orderedRow);
                            rowsToSave.push(orderedRow);
                        } else {
                            rowsToSave.push(rowObj);
                        }
                    }
                };

                addRow(0, 0); 
                addRow(0, 1); 
                addRow(1, 2); 
                addRow(1, 3); 

                if (rowsToSave.length === 0) {
                    setStatus('Error: No hay datos válidos para guardar.');
                    setIsLoading(false);
                    return;
                }

                const payload = {
                    action: isUpdateMode ? 'update' : 'append',
                    op: opToSave,
                    partida: partidaToSave,
                    rows: rowsToSave
                };

                const rollosRowsToSave = getRollosArray(formData.rollos).map(r => ({
                    "OP": opToSave,
                    "Partida": partidaToSave,
                    "#ROLLO": r.rollo || '',
                    "ANCHO": r.ancho || '',
                    "DENSIDAD": r.densidad || '',
                    "ROLLO DE MUESTRA": isTruthyFlag(r.rolloDeMuestra) ? 'TRUE' : 'FALSE'
                }));

                const payloadRollos = {
                    action: 'updateRollos',
                    op: opToSave,
                    partida: partidaToSave,
                    rows: rollosRowsToSave
                };

                try {
                    const responseMain = await fetch(API_DESTINO, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
                    if (!responseMain.ok) throw new Error(`Error del servidor: HTTP ${responseMain.status}`);
                    const resultMain = await responseMain.json();

                    if (!resultMain.success) {
                        setStatus('Error al guardar reporte: ' + (resultMain.error || 'Desconocido'));
                        setIsLoading(false);
                        return;
                    }

                    // Guardar rollos tras confirmar que el reporte principal se guardó
                    let rollosOk = false;
                    let rollosError = '';
                    try {
                        const responseRollos = await fetch(API_DESTINO, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payloadRollos) });
                        if (!responseRollos.ok) throw new Error(`HTTP ${responseRollos.status}`);
                        const resultRollos = await responseRollos.json();
                        rollosOk = resultRollos.success;
                        rollosError = resultRollos.error || 'Desconocido';
                    } catch (rollosErr) {
                        rollosError = rollosErr.message;
                    }

                    const fueCopia = esCopia;
                    setIsUpdateMode(true);
                    setEsCopia(false);
                    setModoEdicion(false); // tras guardar, volver a solo lectura
                    setFormData(prev => ({ ...prev, fechaRegistro }));
                    registroAbiertoRef.current = { op: opToSave, partida: partidaToSave, status: formData.statusAuditoria || '' };
                    if (rollosOk) {
                        setStatus('Guardado exitoso! (' + (fueCopia ? 'Copia creada' : (isUpdateMode ? 'Actualizado' : 'Insertado')) + ' en destino y rollos)');
                    } else {
                        setStatus('Reporte guardado, pero fallo guardado de rollos: ' + rollosError);
                    }
                } catch (error) {
                    setStatus('Error de transmision: ' + error.message);
                }
                setIsLoading(false);
            };

            // Crea una COPIA editable del registro actual: limpia STATUS, avanza el BAP a la
            // siguiente letra disponible (A2, A3, A4...) y limpia las firmas del auditor.
            const handleCopiar = () => {
                const oN = normalizarTexto(cleanOpPartida(busqueda.op));
                const pN = normalizarTexto(cleanOpPartida(busqueda.partida));
                const filasOpPartida = (gridRawRef.current || []).filter(row =>
                    normalizarTexto(cleanOpPartida(extraerDato(row, ['OP', 'op']))) === oN &&
                    normalizarTexto(cleanOpPartida(extraerDato(row, ['PARTIDA', 'partida']))) === pN
                );
                let maxN = 0;
                filasOpPartida.forEach(row => {
                    const bap = String(extraerDato(row, ['bap']) || '').trim().toUpperCase();
                    const m = bap.match(/A\s*(\d+)/);
                    if (m) maxN = Math.max(maxN, Number(m[1]));
                });
                const siguienteBap = `A${Math.min((maxN || 1) + 1, 4)}`;

                setFormData(prev => ({
                    ...prev,
                    statusAuditoria: '',           // limpiar STATUS del todo
                    bap: siguienteBap,             // BAP en secuencia (A2, A3, A4...)
                    fechaRegistro: '',             // nueva fecha al guardar
                    firmas: {                      // limpiar bloque SELLO Y FIRMA DEL AUDITOR
                        despacho: { sello: '', fecha: '', firma: '' },
                        corte: { sello: '', fecha: '', firma: '' }
                    }
                }));
                setIsUpdateMode(false); // se guardará como APPEND: nueva versión, sin borrar el original
                setEsCopia(true);
                setModoEdicion(true);
                setStatus(`Copia creada (BAP ${siguienteBap}). Define STATUS y firmas, luego pulsa Guardar.`);
            };

            const handleCancelarEdicion = () => {
                const abierto = registroAbiertoRef.current;
                if (abierto && abierto.op && abierto.partida) {
                    // Recargar el registro original para descartar cambios.
                    abrirRegistro(abierto.op, abierto.partida, abierto.status || '');
                } else {
                    // Sin registro original (p. ej. nuevo en blanco): volver al listado.
                    setModoEdicion(false);
                    setEsCopia(false);
                    setVista('grid');
                    setStatus('');
                }
            };

            const handleGeneralChange = (e, field) => {
                const value = e.target.value;
                if (field === 'statusAuditoria') {
                    const nextStatus = normalizeStatusValue(value);
                    setFormData(prev => ({
                        ...prev,
                        statusAuditoria: nextStatus,
                        bap: normalizeBapValue(prev.bap, nextStatus)
                    }));
                    return;
                }
                if (field === 'bap') {
                    setFormData(prev => ({
                        ...prev,
                        bap: normalizeBapValue(value, prev.statusAuditoria)
                    }));
                    return;
                }
                setFormData({ ...formData, [field]: value });
            };
            const handleCompChange = (idx, field, val) => {
                const newComps = [...formData.componentes];
                newComps[idx][field] = val;
                setFormData({ ...formData, componentes: newComps });
            };
            const handleTecChange = (idx, field, val) => {
                const newTecs = [...formData.tecnicas];
                newTecs[idx][field] = val;
                setFormData({ ...formData, tecnicas: newTecs });
            };
            const handleRolloChange = (idx, field, val) => setRolloValue(idx, field, val);

            const getARButtonStyle = (value) => {
                const normalized = normalizeARValue(value || '');
                const isAprobadoBase = normalized === 'Aprobado';
                const isAprobadoTol = normalized === 'Aprobado\nc/tolerancia';
                const isAprobadoAut = normalized === 'Aprobado\nc/autorizacion';
                const isRechazado = normalized === 'Rechazado';
                const background = isAprobadoTol
                    ? '#d1fae5'
                    : (isAprobadoBase
                        ? 'rgba(59, 130, 246, 0.20)'
                        : (isAprobadoAut
                            ? 'rgba(250, 204, 21, 0.25)'
                            : (isRechazado ? '#ffe4e6' : 'transparent')));
                const color = isAprobadoTol
                    ? '#14532d'
                    : (isAprobadoBase
                        ? '#1e3a8a'
                        : (isAprobadoAut
                            ? '#854d0e'
                            : (isRechazado ? '#991b1b' : 'inherit')));
                return {
                    width: '100%',
                    minHeight: '34px',
                    border: 'none',
                    background,
                    color,
                    cursor: 'pointer',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.1',
                    fontSize: '10px',
                    padding: '2px 4px'
                };
            };

            const renderDensityDeltaPill = (productionValue, technicalStdValue) => {
                const delta = getDensityDeltaInfo(productionValue, technicalStdValue);
                if (!delta) return null;

                return (
                    <span
                        style={{
                            display: 'inline-block',
                            marginTop: '2px',
                            padding: '1px 6px',
                            borderRadius: '999px',
                            fontSize: '9px',
                            lineHeight: '1.2',
                            whiteSpace: 'nowrap',
                            backgroundColor: delta.isAlert ? 'rgba(239, 68, 68, 0.14)' : 'rgba(59, 130, 246, 0.14)',
                            color: delta.isAlert ? '#b91c1c' : '#1d4ed8',
                            fontWeight: delta.isAlert ? 700 : 500
                        }}
                    >
                        {delta.text}
                    </span>
                );
            };

            const toggleAR = (paramKey) => {
                setFormData(prev => {
                    const cur = normalizeARValue((prev.produccion && prev.produccion.parametros && prev.produccion.parametros[paramKey] && prev.produccion.parametros[paramKey].ar) || '');
                    const currentIndex = AR_OPTIONS.indexOf(cur);
                    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % AR_OPTIONS.length : 1;
                    const next = AR_OPTIONS[nextIndex];
                    return {
                        ...prev,
                        produccion: {
                            ...prev.produccion,
                            parametros: {
                                ...prev.produccion.parametros,
                                [paramKey]: {
                                    ...prev.produccion.parametros[paramKey],
                                    ar: next
                                }
                            }
                        }
                    };
                });
            };

            const rollosRows = getRollosArray(formData.rollos);
            const firmas = getFirmasState(formData.firmas);
            const despachoSello = normalizeSelloValue(firmas.despacho.sello);
            const corteSello = normalizeSelloValue(firmas.corte.sello);
            const bapOptionsForSelectedStatus = getBapOptionsForStatus(formData.statusAuditoria);
            // Para una copia con STATUS limpio, mostramos igualmente el BAP (A1-A4) con el valor secuencial.
            const bapVisible = bapOptionsForSelectedStatus.length > 0 || !!formData.bap;
            const bapOptionsToShow = bapOptionsForSelectedStatus.length > 0 ? bapOptionsForSelectedStatus : ['A1', 'A2', 'A3', 'A4'];

            // ==========================================
            // LISTADO / GRID DE REGISTROS
            // ==========================================
            const cleanOpPartida = (value) => String(value || '').replace(/\.0$/, '').trim();

            const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            // Soporta el formato gviz "Date(2026,1,27)" (mes base 0) y el texto "27/01/2026".
            const parseFechaParts = (value) => {
                const s = String(value || '').trim();
                if (!s) return null;
                const mt = s.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
                if (mt) return { y: Number(mt[1]), m: Number(mt[2]), d: Number(mt[3]) };
                const md = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
                if (!md) return null;
                const y = md[3].length === 2 ? 2000 + Number(md[3]) : Number(md[3]);
                return { y, m: Number(md[2]) - 1, d: Number(md[1]) };
            };

            const formatFechaCorta = (value) => {
                const p = parseFechaParts(value);
                if (!p) return String(value || '').trim() || '—';
                const mes = MESES_CORTOS[p.m] || '';
                return `${String(p.d).padStart(2, '0')}/${mes}`;
            };

            const fechaToTime = (value) => {
                const p = parseFechaParts(value);
                return p ? (new Date(p.y, p.m, p.d).getTime() || 0) : 0;
            };

            // Normaliza una fecha (gviz "Date(2026,2,10)" o texto) a "dd/mm/yyyy" para el formulario.
            const formatFechaDMY = (value) => {
                const p = parseFechaParts(value);
                if (!p) return String(value || '').trim();
                return `${String(p.d).padStart(2, '0')}/${String(p.m + 1).padStart(2, '0')}/${p.y}`;
            };

            const CLIENTE_MAP = [
                ['lulu', 'LLL'],
                ['theory', 'THE'],
                ['allbirds', 'ALLB'],
                ['am retail', 'AMR'],
                ['athleta', 'ATH'],
                ['banana', 'BNN'],
                ['lacoste', 'LAC'],
                ['skechers', 'SKE'],
                ['revtown', 'REVT'],
                ['cofaco', 'COF'],
                ['duer', 'DUER']
            ];

            const normalizeClienteCorto = (value) => {
                const s = normalizarTexto(value);
                if (!s) return '';
                for (const [key, abbr] of CLIENTE_MAP) {
                    if (s.includes(key)) return abbr;
                }
                return value;
            };

            const statusCorto = (statusValue) => {
                const s = normalizarTexto(statusValue);
                if (s.includes('rechaz')) return 'Rechaz.';
                if (s.includes('bulk')) return 'Bulk';
                if (s.includes('aprob')) return 'Aprob.';
                if (s.includes('proceso')) return 'Proceso';
                return statusValue;
            };

            const agruparRegistros = (rows) => {
                const grupos = new Map();
                (rows || []).forEach(row => {
                    const op = cleanOpPartida(extraerDato(row, ['OP', 'op']));
                    const partida = cleanOpPartida(extraerDato(row, ['PARTIDA', 'partida']));
                    if (!op && !partida) return;
                    const status = normalizeStatusValue(extraerDato(row, ['status']) || 'En proceso');
                    const key = `${normalizarTexto(op)}|${normalizarTexto(partida)}|${normalizarTexto(status)}`;
                    if (!grupos.has(key)) {
                        grupos.set(key, {
                            op, partida, status,
                            fecha: String(extraerDato(row, ['FECHA REGISTRO', 'fecharegistro', 'fecha']) || '').trim(),
                            cliente: String(extraerDato(row, ['CLIENTE', 'cliente']) || '').trim(),
                            tipoOp: String(extraerDato(row, ['Tipo OP', 'tipoop', 'tipo op']) || '').trim(),
                            color: String(extraerDato(row, ['COLOR', 'color']) || '').trim(),
                            destino: String(extraerDato(row, ['DESTINO', 'destino']) || '').trim(),
                            rutaTela: String(extraerDato(row, ['RUTA TELA', 'rutatela', 'ruta tela']) || '').trim(),
                            rutaOriginal: String(extraerDato(row, ['RUTA ORIGINAL', 'rutaoriginal', 'ruta original']) || '').trim(),
                            componentes: new Set()
                        });
                    }
                    const comp = String(extraerDato(row, ['COMPONENTE', 'componente']) || '').trim();
                    if (comp) grupos.get(key).componentes.add(comp);
                });

                return Array.from(grupos.values())
                    .map(g => ({ ...g, componente: Array.from(g.componentes).join(' · ') }))
                    .sort((a, b) => fechaToTime(b.fecha) - fechaToTime(a.fecha));
            };

            const loadGrid = async () => {
                setGridLoading(true);
                setGridError('');
                try {
                    const rows = await window.DataAPI.loadSheetJSONP(SHEET_ID_DESTINO, window.APP_CONFIG.DESTINATION_SHEET_NAME);
                    gridRawRef.current = Array.isArray(rows) ? rows : [];
                    setGridRows(agruparRegistros(rows));
                } catch (e) {
                    setGridError(`No se pudieron cargar los registros: ${(e && e.message) ? e.message : e}`);
                } finally {
                    setGridLoading(false);
                }
            };

            React.useEffect(() => {
                loadGrid();
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, []);

            React.useEffect(() => {
                if (pendingSearch && busqueda.op && busqueda.partida) {
                    const ps = pendingSearch;
                    setPendingSearch(null);
                    runSearch({ forceNew: ps.forceNew, selectedStatus: ps.status || '', prefetchedDestino: ps.prefetchedDestino || null });
                }
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [pendingSearch, busqueda]);

            // El mensaje de estado se muestra como toast y se auto-oculta a los 4.5s.
            React.useEffect(() => {
                if (!status) return;
                const t = window.setTimeout(() => setStatus(''), 4500);
                return () => window.clearTimeout(t);
            }, [status]);

            const registrosDeOpPartida = (op, partida) => {
                const o = normalizarTexto(cleanOpPartida(op));
                const p = normalizarTexto(cleanOpPartida(partida));
                return gridRows.filter(r => normalizarTexto(r.op) === o && normalizarTexto(r.partida) === p);
            };

            const abrirRegistro = (op, partida, statusRegistro) => {
                setStatus('');
                // (B) Reutiliza las filas de destino ya cargadas por el listado para esta OP/Partida.
                const oN = normalizarTexto(cleanOpPartida(op));
                const pN = normalizarTexto(cleanOpPartida(partida));
                const prefetchedDestino = (gridRawRef.current || []).filter(row =>
                    normalizarTexto(cleanOpPartida(extraerDato(row, ['OP', 'op']))) === oN &&
                    normalizarTexto(cleanOpPartida(extraerDato(row, ['PARTIDA', 'partida']))) === pN
                );
                setBusqueda({ op, partida });
                setVista('hoja');
                setPendingSearch({ forceNew: false, status: statusRegistro || '', prefetchedDestino });
            };

            const handleNuevoConfirm = () => {
                const op = String(nuevoForm.op || '').trim();
                const partida = String(nuevoForm.partida || '').trim();
                if (!op || !partida) return;
                setShowNuevoModal(false);
                setStatus('');
                setBusqueda({ op, partida });
                setVista('hoja');
                setPendingSearch({ forceNew: true, status: '' });
            };

            const statusPillClasses = (statusValue) => {
                const s = normalizarTexto(statusValue);
                if (s.includes('rechaz')) return 'bg-red-100 text-red-700';
                if (s.includes('bulk')) return 'bg-purple-100 text-purple-700';
                if (s.includes('aprob')) return 'bg-green-100 text-green-700';
                return 'bg-amber-100 text-amber-700';
            };

            const gridFiltrado = gridRows.filter(r => {
                const okOp = !gridFiltro.op || normalizarTexto(r.op).includes(normalizarTexto(gridFiltro.op));
                const okPart = !gridFiltro.partida || normalizarTexto(r.partida).includes(normalizarTexto(gridFiltro.partida));
                const okStatus = !gridFiltro.status || normalizarTexto(r.status) === normalizarTexto(gridFiltro.status);
                return okOp && okPart && okStatus;
            });

            if (vista === 'grid') {
                const thClass = 'px-2 py-2 text-left font-bold whitespace-nowrap overflow-hidden text-ellipsis';
                const tdClass = 'px-2 py-1.5 align-middle whitespace-nowrap overflow-hidden text-ellipsis';
                return (
                    <div className="no-print w-full px-4 py-4">
                        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200">
                                <a
                                    href={window.AppRouter.href('home')}
                                    title="Ir al menu principal"
                                    aria-label="Inicio"
                                    className="w-9 h-9 inline-flex items-center justify-center text-gray-600 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-full transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 10.5 12 3l9 7.5"/>
                                        <path d="M5 9.5V21h14V9.5"/>
                                        <path d="M9 21v-6h6v6"/>
                                    </svg>
                                </a>
                                <h1 className="text-lg font-bold text-gray-800">Hoja de Evaluación Textil</h1>
                                <div className="ml-auto flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <label className="text-xs font-bold text-gray-600">OP</label>
                                        <input value={gridFiltro.op} onChange={e => setGridFiltro({ ...gridFiltro, op: e.target.value })} style={{ border: '1px solid #000', borderRadius: '6px' }} className="bg-white px-2 py-1 w-24 text-sm" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <label className="text-xs font-bold text-gray-600">PARTIDA</label>
                                        <input value={gridFiltro.partida} onChange={e => setGridFiltro({ ...gridFiltro, partida: e.target.value })} style={{ border: '1px solid #000', borderRadius: '6px' }} className="bg-white px-2 py-1 w-24 text-sm" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <label className="text-xs font-bold text-gray-600">STATUS</label>
                                        <select value={gridFiltro.status} onChange={e => setGridFiltro({ ...gridFiltro, status: e.target.value })} style={{ border: '1px solid #000', borderRadius: '6px' }} className="bg-white px-2 py-1 text-sm h-[32px]">
                                            <option value="">Todos</option>
                                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    {(gridFiltro.op || gridFiltro.partida || gridFiltro.status) && (
                                        <button onClick={() => setGridFiltro({ op: '', partida: '', status: '' })} className="text-xs text-gray-500 underline">Limpiar</button>
                                    )}
                                    <button
                                        onClick={() => { setNuevoForm({ op: '', partida: '' }); setShowNuevoModal(true); }}
                                        className="btn-excel btn-blue h-[34px] px-4 font-bold"
                                    >
                                        + Crear Nuevo
                                    </button>
                                    <button onClick={loadGrid} disabled={gridLoading} title="Recargar" aria-label="Recargar" className="btn-excel h-[34px] w-[34px] px-0 text-base flex items-center justify-center">↻</button>
                                </div>
                            </div>

                            {gridError && (
                                <div className="px-4 py-2 text-sm font-bold bg-red-100 text-red-800">{gridError}</div>
                            )}

                            <table className="w-full text-xs border-collapse table-fixed">
                                <colgroup>
                                    <col style={{ width: '58px' }} />{/* Fecha */}
                                    <col style={{ width: '78px' }} />{/* Status */}
                                    <col style={{ width: '70px' }} />{/* Cliente */}
                                    <col style={{ width: '66px' }} />{/* Tipo OP */}
                                    <col style={{ width: '54px' }} />{/* OP */}
                                    <col style={{ width: '54px' }} />{/* Partida */}
                                    <col />{/* Color */}
                                    <col style={{ width: '124px' }} />{/* Destino */}
                                    <col style={{ width: '80px' }} />{/* Ruta Tela */}
                                    <col style={{ width: '80px' }} />{/* Ruta Original */}
                                    <col />{/* Componente */}
                                    <col style={{ width: '56px' }} />{/* Ver */}
                                </colgroup>
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600 text-[10px] uppercase border-b border-gray-200">
                                        <th className={thClass}>F.Reg.</th>
                                        <th className={thClass}>Status</th>
                                        <th className={thClass}>Cliente</th>
                                        <th className={thClass}>Tipo OP</th>
                                        <th className={`${thClass} text-center`}>OP</th>
                                        <th className={`${thClass} text-center`}>Part.</th>
                                        <th className={`${thClass} text-center`}>Color</th>
                                        <th className={`${thClass} text-center`}>Destino</th>
                                        <th className={`${thClass} text-center`}>R.Tela</th>
                                        <th className={`${thClass} text-center`}>R.Orig.</th>
                                        <th className={`${thClass} text-center`}>Componente</th>
                                        <th className={`${thClass} text-center`}>Ver</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gridLoading ? (
                                        <tr><td colSpan={12} className="px-3 py-8 text-center text-gray-500">Cargando registros...</td></tr>
                                    ) : gridFiltrado.length === 0 ? (
                                        <tr><td colSpan={12} className="px-3 py-8 text-center text-gray-400">{gridRows.length === 0 ? 'No hay registros guardados.' : 'Ningún registro coincide con los filtros.'}</td></tr>
                                    ) : gridFiltrado.map((r, i) => (
                                        <tr key={`${r.op}|${r.partida}|${r.status}|${i}`} className={`border-b border-gray-100 hover:bg-blue-50 ${i % 2 ? 'bg-gray-50/40' : 'bg-white'}`}>
                                            <td className={tdClass} title={r.fecha}>{formatFechaCorta(r.fecha)}</td>
                                            <td className={tdClass} title={r.status}>
                                                <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusPillClasses(r.status)}`}>{statusCorto(r.status)}</span>
                                            </td>
                                            <td className={tdClass} title={r.cliente}>{normalizeClienteCorto(r.cliente) || '—'}</td>
                                            <td className={tdClass} title={r.tipoOp}>{r.tipoOp || '—'}</td>
                                            <td className={`${tdClass} font-bold text-center`} title={r.op}>{r.op || '—'}</td>
                                            <td className={`${tdClass} font-bold text-center`} title={r.partida}>{r.partida || '—'}</td>
                                            <td className={`${tdClass} text-left`} title={r.color}>{r.color || '—'}</td>
                                            <td className={`${tdClass} text-left`} title={r.destino}>{r.destino || '—'}</td>
                                            <td className={`${tdClass} text-left`} title={r.rutaTela}>{r.rutaTela || '—'}</td>
                                            <td className={`${tdClass} text-left`} title={r.rutaOriginal}>{r.rutaOriginal || '—'}</td>
                                            <td className={`${tdClass} text-left`} title={r.componente}>{r.componente || '—'}</td>
                                            <td className={`${tdClass} text-center`} style={{ overflow: 'visible' }}>
                                                <button
                                                    onClick={() => abrirRegistro(r.op, r.partida, r.status)}
                                                    title="Ver registro"
                                                    aria-label="Ver registro"
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {showNuevoModal && (() => {
                            const existentes = (nuevoForm.op && nuevoForm.partida) ? registrosDeOpPartida(nuevoForm.op, nuevoForm.partida) : [];
                            return (
                                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-lg shadow-xl w-[440px] p-5">
                                        <h3 className="text-base font-bold text-gray-800 mb-1">Crear nueva evaluación</h3>
                                        <p className="text-xs text-gray-500 mb-4">Ingresa OP y Partida. Te avisamos si ya existe en el listado.</p>
                                        <div className="flex gap-3 mb-3">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold mb-1 text-gray-600">OP</label>
                                                <input value={nuevoForm.op} onChange={e => setNuevoForm({ ...nuevoForm, op: e.target.value })} style={{ border: '1px solid #000', borderRadius: '6px' }} className="px-2 py-1 w-full text-sm" autoFocus />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold mb-1 text-gray-600">PARTIDA</label>
                                                <input value={nuevoForm.partida} onChange={e => setNuevoForm({ ...nuevoForm, partida: e.target.value })} style={{ border: '1px solid #000', borderRadius: '6px' }} className="px-2 py-1 w-full text-sm" />
                                            </div>
                                        </div>
                                        {nuevoForm.op && nuevoForm.partida && (
                                            existentes.length === 0 ? (
                                                <div className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-3 py-2 mb-3">✓ No existe. Se creará un registro nuevo.</div>
                                            ) : (
                                                <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded px-3 py-2 mb-3">
                                                    <div className="font-bold mb-1">⚠️ Ya existe ({existentes.length}). Puedes abrir el registro existente:</div>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {existentes.map((e, idx) => (
                                                            <button key={idx} onClick={() => { setShowNuevoModal(false); abrirRegistro(e.op, e.partida, e.status); }} className="btn-excel btn-blue h-[26px] px-2 text-xs">Abrir · {e.status}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                        <div className="flex justify-end gap-2 mt-1">
                                            <button onClick={() => setShowNuevoModal(false)} className="h-[32px] px-3 border border-gray-300 rounded text-sm">Cancelar</button>
                                            <button onClick={handleNuevoConfirm} disabled={!nuevoForm.op || !nuevoForm.partida} className="btn-excel h-[32px] px-4 text-sm font-bold disabled:opacity-50">Crear nuevo</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                );
            }

            return (
                <div>
                    <div className="no-print bg-white border-b border-gray-300 p-4 flex flex-wrap gap-4 items-center mb-4 shadow-sm max-w-[1200px] mx-auto">
                        <button onClick={() => { setVista('grid'); setStatus(''); }} className="btn-excel h-[30px] py-0 px-3" title="Volver al listado">← Listado</button>
                        <div className="flex items-center gap-1 text-sm">
                            <span className="text-xs font-bold text-gray-500">OP:</span>
                            <span className="font-bold text-gray-800">{busqueda.op || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                            <span className="text-xs font-bold text-gray-500">PARTIDA:</span>
                            <span className="font-bold text-gray-800">{busqueda.partida || '—'}</span>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            {esCopia ? (
                                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">COPIA NUEVA</span>
                            ) : modoEdicion ? (
                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">EDITANDO</span>
                            ) : (
                                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">SOLO LECTURA</span>
                            )}

                            {!modoEdicion && (
                                <>
                                    <button onClick={() => setModoEdicion(true)} disabled={isLoading} title="Editar este registro" className="btn-excel btn-blue h-[30px] py-0 px-3 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                        Editar
                                    </button>
                                    <button onClick={handleCopiar} disabled={isLoading} title="Crear una copia editable (nueva versión)" className="btn-excel h-[30px] py-0 px-3 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                        Copiar
                                    </button>
                                </>
                            )}

                            {modoEdicion && (
                                <>
                                    <button onClick={handleCancelarEdicion} disabled={isLoading} className="btn-excel h-[30px] py-0 px-3">
                                        Cancelar
                                    </button>
                                    <button onClick={handleSave} disabled={isLoading} title="Guardar cambios" className="btn-excel btn-blue h-[30px] py-0 px-4 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></svg>
                                        {isLoading ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {status && (
                        <div
                            className={`no-print fixed bottom-4 right-4 z-[100] max-w-sm px-4 py-3 rounded-lg shadow-xl text-sm font-bold flex items-start gap-3 ${status.includes('Error') || status.includes('Aviso') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
                            style={{ animation: 'hetToastIn 0.25s ease-out' }}
                            role="status"
                            aria-live="polite"
                        >
                            <span className="flex-1">{status}</span>
                            <button onClick={() => setStatus('')} title="Cerrar" className="opacity-80 hover:opacity-100 leading-none text-base">✕</button>
                        </div>
                    )}

                    {showStatusModal && (
                        <div className="no-print fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                            <div className="bg-white border border-gray-300 rounded shadow-lg p-4 w-[360px]">
                                <div className="text-sm font-bold mb-1">Seleccionar STATUS</div>
                                <div className="text-xs text-gray-600 mb-3">OP: {busqueda.op} | PARTIDA: {busqueda.partida}</div>
                                <div style={{ border: '1px solid #000', height: '30px', marginBottom: '12px' }}>
                                    <select value={statusModalSelected} onChange={e => setStatusModalSelected(e.target.value)}>
                                        {statusModalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={handleStatusModalCancel} className="h-[30px] px-3 border border-gray-400 rounded text-xs font-bold bg-gray-100 hover:bg-gray-200">
                                        Cancelar
                                    </button>
                                    <button type="button" onClick={handleStatusModalLoad} className="btn-excel btn-blue h-[30px] py-0 px-4 text-xs">
                                        Cargar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {rolloContextMenu.visible && (
                        <div
                            className="no-print"
                            style={{
                                position: 'fixed',
                                top: `${rolloContextMenu.y}px`,
                                left: `${rolloContextMenu.x}px`,
                                zIndex: 70,
                                border: '1px solid #111827',
                                backgroundColor: '#fff',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.18)'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={toggleRolloSampleFromContext}
                                style={{
                                    minWidth: '180px',
                                    padding: '6px 10px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    textAlign: 'left',
                                    backgroundColor: '#fff',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {(rolloContextMenu.rowIndex !== null && rollosRows[rolloContextMenu.rowIndex] && isTruthyFlag(rollosRows[rolloContextMenu.rowIndex].rolloDeMuestra))
                                    ? 'DESHACER SELECCION'
                                    : 'ROLLO DE MUESTRAS'}
                            </button>
                        </div>
                    )}

                    <div className="excel-container print-fit" style={{ pointerEvents: modoEdicion ? 'auto' : 'none' }}>
                        <div className="mb-4">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '2px' }}>
                                <div style={{ width: '180px', textAlign: 'left' }}>
                                    <img
                                        src="https://www.cofaco.com/es/img/logo-marco-verde.png"
                                        alt="Cofaco"
                                        style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
                                    />
                                </div>
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <h1 className="text-lg font-bold tracking-wider">HOJA DE EVALUACION DE ASEGURAMIENTO DE CALIDAD</h1>
                                    <div className="text-xs mt-1 text-gray-600">F-GT-ACT-25 &nbsp;&nbsp;&nbsp; V04 &nbsp;&nbsp;&nbsp; FA: 11/03/2024</div>
                                </div>
                                <div style={{ width: '260px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold' }}>
                                    Fecha de registro: <span style={{ fontWeight: 'normal' }}>{formData.fechaRegistro || ''}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>STATUS:</span>
                                <div style={{ width: '170px', height: '26px', border: '1px solid #000' }}>
                                    <select value={formData.statusAuditoria} onChange={e => handleGeneralChange(e, 'statusAuditoria')}>
                                        <option value=""></option>
                                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                {bapVisible && (
                                    <>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>BAP:</span>
                                        <div style={{ width: '90px', height: '26px', border: '1px solid #000' }}>
                                            <select value={formData.bap} onChange={e => handleGeneralChange(e, 'bap')}>
                                                <option value=""></option>
                                                {bapOptionsToShow.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <table style={{marginBottom: '30px'}}>
                            <colgroup><col width="12%" /><col width="18%" /><col width="10%" /><col width="15%" /><col width="10%" /><col width="10%" /><col width="10%" /><col width="15%" /></colgroup>
                            <tbody>
                                <tr>
                                    <th>CLIENTE</th><td><input value={formData.cliente} onChange={e => handleGeneralChange(e, 'cliente')} /></td>
                                    <th>OP</th><td><input value={formData.op} onChange={e => handleGeneralChange(e, 'op')} /></td>
                                    <th>PARTIDA</th><td><input value={formData.partida} onChange={e => handleGeneralChange(e, 'partida')} /></td>
                                    <th>COLOR</th><td><input value={formData.color} onChange={e => handleGeneralChange(e, 'color')} /></td>
                                </tr>
                            </tbody>
                        </table>

                        <table style={{marginBottom: '15px'}}>
                            <colgroup><col width="15%" /><col width="10%" /><col width="35%" /><col width="8%" /><col width="8%" /><col width="8%" /><col width="8%" /><col width="8%" /></colgroup>
                            <thead>
                                <tr><th>COMPONENTE</th><th>COD. ART.</th><th>DESCRIPCION</th><th>TOTAL KG</th><th>#ROLLOS</th><th>RESISTENCIA</th><th>SOLIDEZ</th><th>COLOR RGB</th></tr>
                            </thead>
                            <tbody>
                                {formData.componentes.map((comp, idx) => (
                                    comp.nombre ? (
                                        <tr key={idx}>
                                            <th style={{textAlign: 'left', paddingLeft: '8px'}}>{comp.nombre}</th>
                                            <td><input value={comp.codArt} onChange={e=>handleCompChange(idx, 'codArt', e.target.value)} /></td>
                                            <td><input value={comp.desc} onChange={e=>handleCompChange(idx, 'desc', e.target.value)} style={{textAlign: 'left', paddingLeft: '8px'}} /></td>
                                            <td><input value={comp.kg} onChange={e=>handleCompChange(idx, 'kg', e.target.value)} /></td>
                                            <td><input value={comp.rollos} onChange={e=>handleCompChange(idx, 'rollos', e.target.value)} /></td>
                                            <td><input value={comp.resist} onChange={e=>handleCompChange(idx, 'resist', e.target.value)} /></td>
                                            <td><input value={comp.solidez} onChange={e=>handleCompChange(idx, 'solidez', e.target.value)} /></td>
                                            <td><input value={comp.rgb} onChange={e=>handleCompChange(idx, 'rgb', e.target.value)} /></td>
                                        </tr>
                                    ) : null
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                            <table style={{ width: '95%', marginBottom: 0 }}>
                                <colgroup><col width="12%" /><col width="13%" /><col width="12%" /><col width="19%" /><col width="12%" /><col width="10%" /><col width="12%" /><col width="10%" /></colgroup>
                                <tbody>
                                    <tr>
                                        <th>Tipo OP</th><td><input value={formData.tipoOp} onChange={e => handleGeneralChange(e, 'tipoOp')} /></td>
                                        <th>Destino</th>
                                        <td>
                                            <select value={formData.destino} onChange={e => handleGeneralChange(e, 'destino')}>
                                                <option value=""></option>
                                                <option value="BULK+TESTING">BULK+TESTING</option>
                                                <option value="MUESTRA DE VENTA">MUESTRA DE VENTA</option>
                                                <option value="PRODUCCION">PRODUCCION</option>
                                                <option value="PRUEBA PILOTO">PRUEBA PILOTO</option>
                                                <option value="PRUEBA DE HILADO">PRUEBA DE HILADO</option>
                                                <option value="RE-EVALUACION">RE-EVALUACION</option>
                                            </select>
                                        </td>
                                        <th>Ruta Original</th>
                                        <td>
                                            <select value={formData.rutaOriginal} onChange={e => handleGeneralChange(e, 'rutaOriginal')}>
                                                <option value=""></option>
                                                <option value="LAVADA">LAVADA</option>
                                                <option value="ACABADA">ACABADA</option>
                                            </select>
                                        </td>
                                        <th>Ruta Tela</th>
                                        <td>
                                            <select value={formData.rutaTela} onChange={e => handleGeneralChange(e, 'rutaTela')}>
                                                <option value=""></option>
                                                <option value="LAVADA">LAVADA</option>
                                                <option value="ACABADA">ACABADA</option>
                                            </select>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="font-bold text-sm mb-1">CARACTERISTICAS TÉCNICAS</div>
                        <table>
                            <colgroup><col width="18%" /><col width="6%" /><col width="6%" /><col width="7%" /><col width="6%" /><col width="6%" /><col width="6%" /><col width="6%" /><col width="7%" /><col width="5%" /><col width="5%" /><col width="5%" /><col width="8%" /></colgroup>
                            <thead>
                                <tr>
                                    <th rowSpan="2">CONDICION DE TELA</th><th colSpan="3">ANCHO</th><th colSpan="2">ENCOGIMIENTO</th><th colSpan="3">DENSIDAD (g/m2)</th><th colSpan="3">% REVIRADO</th><th rowSpan="2">INCLINAC.</th>
                                </tr>
                                <tr>
                                    <th>STD</th><th>REAL</th><th>LAVADO</th><th>A%</th><th>L%</th><th>STD</th><th>REAL</th><th>LAVADO</th><th>A</th><th>B</th><th>C</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.tecnicas.map((tec, idx) => (
                                    tec.condicion ? (
                                        <tr key={idx}>
                                            <th style={{textAlign: 'left', paddingLeft: '8px'}}>{tec.condicion}</th>
                                            <td style={{ backgroundColor: 'rgba(59, 130, 246, 0.18)' }}><input value={tec.anchoStd} onChange={e=>handleTecChange(idx, 'anchoStd', e.target.value)} /></td>
                                            <td><input value={tec.anchoReal} onChange={e=>handleTecChange(idx, 'anchoReal', e.target.value)} /></td>
                                            <td><input value={tec.anchoLav} onChange={e=>handleTecChange(idx, 'anchoLav', e.target.value)} /></td>
                                            <td><input value={tec.encA} onChange={e=>handleTecChange(idx, 'encA', e.target.value)} /></td>
                                            <td><input value={tec.encL} onChange={e=>handleTecChange(idx, 'encL', e.target.value)} /></td>
                                            <td style={{ backgroundColor: 'rgba(59, 130, 246, 0.18)' }}><input value={tec.denStd} onChange={e=>handleTecChange(idx, 'denStd', e.target.value)} /></td>
                                            <td><input value={tec.denReal} onChange={e=>handleTecChange(idx, 'denReal', e.target.value)} /></td>
                                            <td><input value={tec.denLav} onChange={e=>handleTecChange(idx, 'denLav', e.target.value)} /></td>
                                            <td><input value={tec.revA} onChange={e=>handleTecChange(idx, 'revA', e.target.value)} /></td>
                                            <td><input value={tec.revB} onChange={e=>handleTecChange(idx, 'revB', e.target.value)} /></td>
                                            <td><input value={tec.revC} onChange={e=>handleTecChange(idx, 'revC', e.target.value)} /></td>
                                            <td><input value={tec.incl} onChange={e=>handleTecChange(idx, 'incl', e.target.value)} /></td>
                                        </tr>
                                    ) : null
                                ))}
                            </tbody>
                        </table>

                        <div style={{ padding: '8px', marginTop: '12px' }}>
                            <div className="font-bold text-sm mb-1">CARACTERISTICAS DE PRODUCCION</div>
                            <div className="prod-grid">
                                <table style={{ width: '38%', marginBottom: 0 }}>
                                    <colgroup><col width="40%"/><col width="30%"/><col width="30%"/></colgroup>
                                    <tbody>
                                        <tr><th style={{textAlign:'left', paddingLeft:8}}>PARAMETROS</th><th>A/R</th><th>VoBo</th></tr>
                                        <tr>
                                            <td style={{textAlign:'left', paddingLeft:8}}>TONO</td>
                                            <td>
                                                <button type="button" onClick={()=>toggleAR('TONO')} style={getARButtonStyle(formData.produccion.parametros.TONO.ar)}>
                                                    {formData.produccion.parametros.TONO.ar}
                                                </button>
                                            </td>
                                            <td><input value={formData.produccion.parametros.TONO.vobo} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, parametros: { ...prev.produccion.parametros, TONO: { ...prev.produccion.parametros.TONO, vobo: e.target.value } } } }))} /></td>
                                        </tr>
                                        <tr>
                                            <td style={{textAlign:'left', paddingLeft:8}}>DEGRADE</td>
                                            <td>
                                                <button type="button" onClick={()=>toggleAR('DEGRADE')} style={getARButtonStyle(formData.produccion.parametros.DEGRADE.ar)}>
                                                    {formData.produccion.parametros.DEGRADE.ar}
                                                </button>
                                            </td>
                                            <td><input value={formData.produccion.parametros.DEGRADE.vobo} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, parametros: { ...prev.produccion.parametros, DEGRADE: { ...prev.produccion.parametros.DEGRADE, vobo: e.target.value } } } }))} /></td>
                                        </tr>
                                        <tr>
                                            <td style={{textAlign:'left', paddingLeft:8}}>IGUALACION</td>
                                            <td>
                                                <button type="button" onClick={()=>toggleAR('IGUALACION')} style={getARButtonStyle(formData.produccion.parametros.IGUALACION.ar)}>
                                                    {formData.produccion.parametros.IGUALACION.ar}
                                                </button>
                                            </td>
                                            <td><input value={formData.produccion.parametros.IGUALACION.vobo} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, parametros: { ...prev.produccion.parametros, IGUALACION: { ...prev.produccion.parametros.IGUALACION, vobo: e.target.value } } } }))} /></td>
                                        </tr>
                                        <tr>
                                            <td style={{textAlign:'left', paddingLeft:8}}>PILLING</td>
                                            <td>
                                                <button type="button" onClick={()=>toggleAR('PILLING')} style={getARButtonStyle(formData.produccion.parametros.PILLING.ar)}>
                                                    {formData.produccion.parametros.PILLING.ar}
                                                </button>
                                            </td>
                                            <td><input value={formData.produccion.parametros.PILLING.vobo} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, parametros: { ...prev.produccion.parametros, PILLING: { ...prev.produccion.parametros.PILLING, vobo: e.target.value } } } }))} /></td>
                                        </tr>
                                    </tbody>
                                </table>

                                <table style={{ width: '60%', marginBottom: 0 }}>
                                    <colgroup><col width="30%"/><col width="20%"/><col width="20%"/><col width="15%"/><col width="15%"/></colgroup>
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th colSpan="2">CUERPO</th>
                                            {formData.componentes && formData.componentes[1] && formData.componentes[1].nombre ? (
                                                <th colSpan="2">COMPLEMENTO</th>
                                            ) : null}
                                        </tr>
                                        <tr>
                                            <th></th>
                                            <th>T.Acab</th>
                                            <th>T.Lavada</th>
                                            {formData.componentes && formData.componentes[1] && formData.componentes[1].nombre ? (
                                                <>
                                                    <th>T.Acab</th>
                                                    <th>T.Lavada</th>
                                                </>
                                            ) : null}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <th style={{textAlign:'left', paddingLeft:8}}>DENSIDAD (g/m2)</th>
                                            <td>
                                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                                                    <input style={{ height:'22px' }} value={formData.produccion.cuerpo.densidad.t_acab} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, cuerpo: { ...prev.produccion.cuerpo, densidad: { ...prev.produccion.cuerpo.densidad, t_acab: e.target.value } } } }))} />
                                                    {renderDensityDeltaPill(formData.produccion.cuerpo.densidad.t_acab, formData.tecnicas[0] ? formData.tecnicas[0].denStd : '')}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                                                    <input style={{ height:'22px' }} value={formData.produccion.cuerpo.densidad.t_lavada} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, cuerpo: { ...prev.produccion.cuerpo, densidad: { ...prev.produccion.cuerpo.densidad, t_lavada: e.target.value } } } }))} />
                                                    {renderDensityDeltaPill(formData.produccion.cuerpo.densidad.t_lavada, formData.tecnicas[1] ? formData.tecnicas[1].denStd : '')}
                                                </div>
                                            </td>
                                            {formData.componentes && formData.componentes[1] && formData.componentes[1].nombre ? (
                                                <>
                                                    <td>
                                                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                                                            <input style={{ height:'22px' }} value={formData.produccion.complemento.densidad.t_acab} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, complemento: { ...prev.produccion.complemento, densidad: { ...prev.produccion.complemento.densidad, t_acab: e.target.value } } } }))} />
                                                            {renderDensityDeltaPill(formData.produccion.complemento.densidad.t_acab, formData.tecnicas[2] ? formData.tecnicas[2].denStd : '')}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                                                            <input style={{ height:'22px' }} value={formData.produccion.complemento.densidad.t_lavada} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, complemento: { ...prev.produccion.complemento, densidad: { ...prev.produccion.complemento.densidad, t_lavada: e.target.value } } } }))} />
                                                            {renderDensityDeltaPill(formData.produccion.complemento.densidad.t_lavada, formData.tecnicas[3] ? formData.tecnicas[3].denStd : '')}
                                                        </div>
                                                    </td>
                                                </>
                                            ) : null}
                                        </tr>
                                        <tr>
                                            <th style={{textAlign:'left', paddingLeft:8}}>ANCHO</th>
                                            <td>
                                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                                                    <input style={{ height:'22px' }} value={formData.produccion.cuerpo.ancho.t_acab} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, cuerpo: { ...prev.produccion.cuerpo, ancho: { ...prev.produccion.cuerpo.ancho, t_acab: e.target.value } } } }))} />
                                                    {renderDensityDeltaPill(formData.produccion.cuerpo.ancho.t_acab, formData.tecnicas[0] ? formData.tecnicas[0].anchoStd : '')}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                                                    <input style={{ height:'22px' }} value={formData.produccion.cuerpo.ancho.t_lavada} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, cuerpo: { ...prev.produccion.cuerpo, ancho: { ...prev.produccion.cuerpo.ancho, t_lavada: e.target.value } } } }))} />
                                                    {renderDensityDeltaPill(formData.produccion.cuerpo.ancho.t_lavada, formData.tecnicas[1] ? formData.tecnicas[1].anchoStd : '')}
                                                </div>
                                            </td>
                                            {formData.componentes && formData.componentes[1] && formData.componentes[1].nombre ? (
                                                <>
                                                    <td>
                                                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                                                            <input style={{ height:'22px' }} value={formData.produccion.complemento.ancho.t_acab} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, complemento: { ...prev.produccion.complemento, ancho: { ...prev.produccion.complemento.ancho, t_acab: e.target.value } } } }))} />
                                                            {renderDensityDeltaPill(formData.produccion.complemento.ancho.t_acab, formData.tecnicas[2] ? formData.tecnicas[2].anchoStd : '')}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                                                            <input style={{ height:'22px' }} value={formData.produccion.complemento.ancho.t_lavada} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, complemento: { ...prev.produccion.complemento, ancho: { ...prev.produccion.complemento.ancho, t_lavada: e.target.value } } } }))} />
                                                            {renderDensityDeltaPill(formData.produccion.complemento.ancho.t_lavada, formData.tecnicas[3] ? formData.tecnicas[3].anchoStd : '')}
                                                        </div>
                                                    </td>
                                                </>
                                            ) : null}
                                        </tr>
                                        <tr>
                                            <th style={{textAlign:'left', paddingLeft:8}}>RAPORT</th>
                                            <td><input value={formData.produccion.cuerpo.raport.t_acab} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, cuerpo: { ...prev.produccion.cuerpo, raport: { ...prev.produccion.cuerpo.raport, t_acab: e.target.value } } } }))} /></td>
                                            <td><input value={formData.produccion.cuerpo.raport.t_lavada} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, cuerpo: { ...prev.produccion.cuerpo, raport: { ...prev.produccion.cuerpo.raport, t_lavada: e.target.value } } } }))} /></td>
                                            {formData.componentes && formData.componentes[1] && formData.componentes[1].nombre ? (
                                                <>
                                                    <td><input value={formData.produccion.complemento.raport.t_acab} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, complemento: { ...prev.produccion.complemento, raport: { ...prev.produccion.complemento.raport, t_acab: e.target.value } } } }))} /></td>
                                                    <td><input value={formData.produccion.complemento.raport.t_lavada} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, complemento: { ...prev.produccion.complemento, raport: { ...prev.produccion.complemento.raport, t_lavada: e.target.value } } } }))} /></td>
                                                </>
                                            ) : null}
                                        </tr>
                                        <tr>
                                            <th style={{textAlign:'left', paddingLeft:8}}>PH</th>
                                            <td><input value={formData.produccion.cuerpo.ph.t_acab} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, cuerpo: { ...prev.produccion.cuerpo, ph: { ...prev.produccion.cuerpo.ph, t_acab: e.target.value } } } }))} /></td>
                                            <td><input value={formData.produccion.cuerpo.ph.t_lavada} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, cuerpo: { ...prev.produccion.cuerpo, ph: { ...prev.produccion.cuerpo.ph, t_lavada: e.target.value } } } }))} /></td>
                                            {formData.componentes && formData.componentes[1] && formData.componentes[1].nombre ? (
                                                <>
                                                    <td><input value={formData.produccion.complemento.ph.t_acab} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, complemento: { ...prev.produccion.complemento, ph: { ...prev.produccion.complemento.ph, t_acab: e.target.value } } } }))} /></td>
                                                    <td><input value={formData.produccion.complemento.ph.t_lavada} onChange={e=>setFormData(prev=>({ ...prev, produccion: { ...prev.produccion, complemento: { ...prev.produccion.complemento, ph: { ...prev.produccion.complemento.ph, t_lavada: e.target.value } } } }))} /></td>
                                                </>
                                            ) : null}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <table style={{ marginTop: '12px', marginBottom: '2px' }}>
                                <colgroup><col width="12%" /><col width="38%" /><col width="12%" /><col width="38%" /></colgroup>
                                <tbody>
                                    <tr>
                                        <th>AUDITOR 1</th>
                                        <td><input style={{ textAlign: 'left', textTransform: 'none', paddingLeft: '8px' }} value={formData.auditor1} onChange={e => handleGeneralChange(e, 'auditor1')} /></td>
                                        <th>AUDITOR 2</th>
                                        <td><input style={{ textAlign: 'left', textTransform: 'none', paddingLeft: '8px' }} value={formData.auditor2} onChange={e => handleGeneralChange(e, 'auditor2')} /></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="obs-box" ref={obsBoxRef} style={{ marginTop: '2px' }}>
                                <div className="font-bold text-sm mb-2" style={{ textAlign: 'left' }}>OBSERVACIONES DE AUDITORIA</div>
                                {getObsArray(formData.observaciones).map((obsValue, idx) => {
                                    const value = obsValue || '';
                                    const isEditing = editingObsIndex === idx;
                                    const isListening = voiceObsIndex === idx;

                                    return (
                                        <div className="obs-row" key={`obs_${idx}`}>
                                            <div className="obs-edit-zone">
                                                <input
                                                    ref={el => { obsInputRefs.current[idx] = el; }}
                                                    className="obs-input"
                                                    value={value}
                                                    readOnly={!isEditing}
                                                    maxLength={obsMaxChars}
                                                    placeholder={`Doble click para editar OB${idx + 1}`}
                                                    onDoubleClick={() => startObsEdit(idx)}
                                                    onBlur={() => setEditingObsIndex(null)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === 'Escape') {
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                    onChange={e => setObsValue(idx, e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className={`obs-voice-btn ${isListening ? 'active' : ''}`}
                                                    onClick={() => startVoiceInput(idx)}
                                                >
                                                    {isListening ? 'DETENER' : 'VOZ'}
                                                </button>
                                                <span className="obs-char-count">{`${value.length}/${obsMaxChars}`}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="obs-help">Doble click para editar. Boton VOZ para dictado en tablet/movil.</div>
                            </div>

                            <div className="rollos-box">
                                <div className="font-bold text-sm mb-1" style={{ textAlign: 'left' }}>DATOS DE INSPECCION DE ACABADO</div>
                                <table className="rollos-table">
                                    <colgroup>
                                        <col width="11.11%" /><col width="11.11%" /><col width="11.11%" />
                                        <col width="11.11%" /><col width="11.11%" /><col width="11.11%" />
                                        <col width="11.11%" /><col width="11.11%" /><col width="11.11%" />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>#ROLLO</th><th>ANCHO</th><th>DENSIDAD</th>
                                            <th>#ROLLO</th><th>ANCHO</th><th>DENSIDAD</th>
                                            <th>#ROLLO</th><th>ANCHO</th><th>DENSIDAD</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: ROLLOS_REGION_ROWS }).map((_, rowIdx) => {
                                            const idx1 = rowIdx;
                                            const idx2 = rowIdx + ROLLOS_REGION_ROWS;
                                            const idx3 = rowIdx + (ROLLOS_REGION_ROWS * 2);
                                            const sampleStyle1 = rollosRows[idx1].rolloDeMuestra ? { backgroundColor: 'rgba(250, 204, 21, 0.35)' } : undefined;
                                            const sampleStyle2 = rollosRows[idx2].rolloDeMuestra ? { backgroundColor: 'rgba(250, 204, 21, 0.35)' } : undefined;
                                            const sampleStyle3 = rollosRows[idx3].rolloDeMuestra ? { backgroundColor: 'rgba(250, 204, 21, 0.35)' } : undefined;
                                            return (
                                                <tr key={`rollos_row_${rowIdx}`}>
                                                    <td style={sampleStyle1}><input maxLength={24} value={rollosRows[idx1].rollo} onContextMenu={e => openRolloContextMenu(e, idx1)} onChange={e => handleRolloChange(idx1, 'rollo', e.target.value)} /></td>
                                                    <td style={sampleStyle1}><input maxLength={24} value={rollosRows[idx1].ancho} onChange={e => handleRolloChange(idx1, 'ancho', e.target.value)} /></td>
                                                    <td style={sampleStyle1}><input maxLength={24} value={rollosRows[idx1].densidad} onChange={e => handleRolloChange(idx1, 'densidad', e.target.value)} /></td>

                                                    <td style={sampleStyle2}><input maxLength={24} value={rollosRows[idx2].rollo} onContextMenu={e => openRolloContextMenu(e, idx2)} onChange={e => handleRolloChange(idx2, 'rollo', e.target.value)} /></td>
                                                    <td style={sampleStyle2}><input maxLength={24} value={rollosRows[idx2].ancho} onChange={e => handleRolloChange(idx2, 'ancho', e.target.value)} /></td>
                                                    <td style={sampleStyle2}><input maxLength={24} value={rollosRows[idx2].densidad} onChange={e => handleRolloChange(idx2, 'densidad', e.target.value)} /></td>

                                                    <td style={sampleStyle3}><input maxLength={24} value={rollosRows[idx3].rollo} onContextMenu={e => openRolloContextMenu(e, idx3)} onChange={e => handleRolloChange(idx3, 'rollo', e.target.value)} /></td>
                                                    <td style={sampleStyle3}><input maxLength={24} value={rollosRows[idx3].ancho} onChange={e => handleRolloChange(idx3, 'ancho', e.target.value)} /></td>
                                                    <td style={sampleStyle3}><input maxLength={24} value={rollosRows[idx3].densidad} onChange={e => handleRolloChange(idx3, 'densidad', e.target.value)} /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div style={{ marginTop: '4px', textAlign: 'left', fontSize: '11px', fontStyle: 'italic' }}>
                                    En amarillo: Rollo de prueba
                                </div>
                            </div>

                            <div className="signature-section">
                                <div className="font-bold text-sm mb-1" style={{ textAlign: 'left' }}>SELLO Y FIRMA DEL AUDITOR</div>
                                <div className="signature-grid">
                                    <div className="signature-card">
                                        <div className="signature-title">SELLO Y FIRMA APROBADO PARA DESPACHO (AUDITOR)</div>
                                        <div className="signature-meta">
                                            <div>
                                                <div className="signature-label">Firma</div>
                                                <input
                                                    ref={el => { firmaInputRefs.current.despacho = el; }}
                                                    className="signature-firma-input"
                                                    value={firmas.despacho.firma || ''}
                                                    readOnly={editingFirmaTipo !== 'despacho'}
                                                    maxLength={120}
                                                    placeholder="Doble click para editar firma"
                                                    onDoubleClick={() => startFirmaEdit('despacho')}
                                                    onBlur={() => setEditingFirmaTipo(null)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur();
                                                    }}
                                                    onChange={e => setFirmaTexto('despacho', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <div className="signature-label">Fecha</div>
                                                <div className="signature-value">{firmas.despacho.fecha || '--/--/----'}</div>
                                            </div>
                                        </div>
                                        <button type="button" className="stamp-toggle" onClick={() => toggleFirmaSello('despacho')}>
                                            {despachoSello ? (
                                                <span className={`stamp-pill ${getSelloPillClass(despachoSello)}`}>
                                                    {shouldShowSelloHeader(despachoSello) && (
                                                        <span className="stamp-line1">ASEGURAMIENTO DE CALIDAD</span>
                                                    )}
                                                    <span className={`stamp-line2 ${!shouldShowSelloHeader(despachoSello) ? 'stamp-line2-long' : ''}`}>{despachoSello}</span>
                                                </span>
                                            ) : (
                                                <span className="stamp-placeholder">TOCAR PARA SELLAR</span>
                                            )}
                                        </button>
                                    </div>

                                    <div className="signature-card">
                                        <div className="signature-title">SELLO Y FIRMA APROBADO PARA CORTE (AUDITOR)</div>
                                        <div className="signature-meta">
                                            <div>
                                                <div className="signature-label">Firma</div>
                                                <input
                                                    ref={el => { firmaInputRefs.current.corte = el; }}
                                                    className="signature-firma-input"
                                                    value={firmas.corte.firma || ''}
                                                    readOnly={editingFirmaTipo !== 'corte'}
                                                    maxLength={120}
                                                    placeholder="Doble click para editar firma"
                                                    onDoubleClick={() => startFirmaEdit('corte')}
                                                    onBlur={() => setEditingFirmaTipo(null)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur();
                                                    }}
                                                    onChange={e => setFirmaTexto('corte', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <div className="signature-label">Fecha</div>
                                                <div className="signature-value">{firmas.corte.fecha || '--/--/----'}</div>
                                            </div>
                                        </div>
                                        <button type="button" className="stamp-toggle" onClick={() => toggleFirmaSello('corte')}>
                                            {corteSello ? (
                                                <span className={`stamp-pill ${getSelloPillClass(corteSello)}`}>
                                                    {shouldShowSelloHeader(corteSello) && (
                                                        <span className="stamp-line1">ASEGURAMIENTO DE CALIDAD</span>
                                                    )}
                                                    <span className={`stamp-line2 ${!shouldShowSelloHeader(corteSello) ? 'stamp-line2-long' : ''}`}>{corteSello}</span>
                                                </span>
                                            ) : (
                                                <span className="stamp-placeholder">TOCAR PARA SELLAR</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
})();
