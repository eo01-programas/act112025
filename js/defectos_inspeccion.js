(() => {
    if (!window.AppRouter || window.AppRouter.currentView !== 'defectos_inspeccion') {
        return;
    }

    const {
        BASE_SHEET_HEADER_ROWS = 1,
        SOURCE_APPS_SCRIPT_URL,
        SOURCE_SHEET_ID,
        SOURCE_SHEET_NAME = "base",
    } = window.APP_CONFIG;

const { useState, useEffect, useMemo, useCallback } = React;

        // ============================================
        // CONFIGURACIÓN - URL DE APPS SCRIPT
        // ============================================
        const APPS_SCRIPT_URL = SOURCE_APPS_SCRIPT_URL;
        // ============================================

        // ============================================
        // CONFIGURACIÓN - CARGA RÁPIDA JSONP (Google Sheets público)
        // ============================================
        const SHEET_ID = SOURCE_SHEET_ID;
        const SHEET_NAME = SOURCE_SHEET_NAME;
        // ============================================

        // --- CARGA JSONP centralizada en js/data_api.js ---
        const { gvizToObjects, loadSheetJSONP } = window.DataAPI;

        // Función que intenta JSONP primero y Apps Script como fallback
        const loadSheetDataFast = async () => {
            // Verificar caché local primero (pero ignorar si tiene 0 registros)
            const cacheKey = 'all_data';
            const cached = clientCache.get(cacheKey);
            if (cached && cached.length > 0) {
                console.log(`[Cache] ✓ ${cached.length} registros desde caché`);
                return cached;
            } else if (cached && cached.length === 0) {
                console.log('[Cache] ⚠ Caché vacío detectado, recargando desde servidor...');
                clientCache.clear();
            }

            // Si hay SHEET_ID configurado, intentar JSONP primero
            if (SHEET_ID && SHEET_ID.length > 10) {
                try {
                    updateModalStatus('Cargando datos (JSONP)...');
                    console.log('[JSONP] Intentando carga rápida...');
                    const data = await loadSheetJSONP(SHEET_ID, SHEET_NAME);
                    if (data && data.length > 0) {
                        console.log(`[JSONP] ✓ Cargados ${data.length} registros`);
                        clientCache.set('all_data', data);
                        return data;
                    } else {
                        console.log('[JSONP] ⚠ No se recibieron datos, NO guardando en caché');
                    }
                } catch (err) {
                    console.log('[JSONP] Falló:', err.message);
                }
            }
            // Fallback a Apps Script
            updateModalStatus('Cargando datos (servidor)...');
            return await fetchAllData();
        };

        // ============================================
        // CACHÉ LOCAL CON SESSIONSTORAGE (persistente entre páginas)
        // ============================================
        class LocalCache {
            constructor(duration = 600000) {
                this.duration = duration;
                this.storageKey = 'calidad_textil_cache';
            }
            
            _getStorage() {
                try {
                    const stored = sessionStorage.getItem(this.storageKey);
                    return stored ? JSON.parse(stored) : {};
                } catch (e) {
                    return {};
                }
            }
            
            _setStorage(data) {
                try {
                    sessionStorage.setItem(this.storageKey, JSON.stringify(data));
                } catch (e) {
                    // Si sessionStorage está lleno, limpiar y reintentar
                    sessionStorage.clear();
                    try {
                        sessionStorage.setItem(this.storageKey, JSON.stringify(data));
                    } catch (e2) {
                        console.warn('No se pudo guardar en sessionStorage');
                    }
                }
            }
            
            get(key) {
                const storage = this._getStorage();
                const item = storage[key];
                if (!item) return null;
                
                if (Date.now() - item.timestamp > this.duration) {
                    delete storage[key];
                    this._setStorage(storage);
                    return null;
                }
                
                return item.data;
            }
            
            set(key, data) {
                const storage = this._getStorage();
                storage[key] = {
                    data: data,
                    timestamp: Date.now()
                };
                this._setStorage(storage);
            }
            
            clear() {
                sessionStorage.removeItem(this.storageKey);
            }
            
            clearPattern(pattern) {
                const storage = this._getStorage();
                let changed = false;
                for (const key of Object.keys(storage)) {
                    if (key.includes(pattern)) {
                        delete storage[key];
                        changed = true;
                    }
                }
                if (changed) this._setStorage(storage);
            }
        }
        
        const clientCache = new LocalCache(600000); // 10 minutos

        // --- FUNCIONES DEL MODAL (con retardo de 5s) ---
        let modalShowTimeout = null;
        let modalPendingConfig = null;

        const _actuallyShowModal = () => {
            if (!modalPendingConfig) return;
            const { title, message, status, estimatedSeconds } = modalPendingConfig;
            resetModalTimer();
            document.getElementById('modal-spinner').classList.remove('hidden');
            document.getElementById('modal-close-btn').classList.add('hidden');
            document.getElementById('modal-title').textContent = title || 'Cargando...';
            document.getElementById('modal-message').textContent = message || 'Por favor espere';
            document.getElementById('modal-status').textContent = status || 'Procesando...';
            document.getElementById('loading-modal').classList.remove('hidden');
            if (estimatedSeconds > 0) {
                startModalTimer(estimatedSeconds);
            }
        };

        const showLoadingModal = (title, message, status, estimatedSeconds = 0) => {
            if (modalShowTimeout) { clearTimeout(modalShowTimeout); modalShowTimeout = null; }
            modalPendingConfig = { title, message, status, estimatedSeconds };
            modalShowTimeout = setTimeout(_actuallyShowModal, 5000);
        };

        const updateModalStatus = (status) => {
            if (modalPendingConfig) modalPendingConfig.status = status;
            if (!document.getElementById('loading-modal').classList.contains('hidden')) {
                document.getElementById('modal-status').textContent = status;
            }
        };

        const hideLoadingModal = () => {
            if (modalShowTimeout) { clearTimeout(modalShowTimeout); modalShowTimeout = null; }
            modalPendingConfig = null;
            stopModalTimer();
            document.getElementById('loading-modal').classList.add('hidden');
        };

        const showModalError = (message, details) => {
            if (modalShowTimeout) { clearTimeout(modalShowTimeout); modalShowTimeout = null; }
            modalPendingConfig = null;
            stopModalTimer();
            document.getElementById('modal-spinner').classList.add('hidden');
            document.getElementById('modal-title').textContent = '❌ Error';
            document.getElementById('modal-message').textContent = message;
            document.getElementById('modal-status').textContent = details || 'Intente nuevamente';
            document.getElementById('modal-close-btn').classList.remove('hidden');
            document.getElementById('loading-modal').classList.remove('hidden');
        };

        const showModalSuccess = (message, details) => {
            if (modalShowTimeout) { clearTimeout(modalShowTimeout); modalShowTimeout = null; }
            modalPendingConfig = null;
            stopModalTimer();
            if (!document.getElementById('loading-modal').classList.contains('hidden')) {
                document.getElementById('modal-title').textContent = '✅ ¡Completado!';
                document.getElementById('modal-message').textContent = message;
                document.getElementById('modal-status').textContent = details;
                setTimeout(hideLoadingModal, 3000);
            }
        };

        // --- FUNCIÓN PARA OBTENER TODOS LOS DATOS ---
        const fetchAllData = async () => {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PEGAR_AQUI")) {
                return null;
            }

            const cacheKey = 'all_data';
            const cached = clientCache.get(cacheKey);
            // Solo usar caché si tiene datos válidos (más de 0 registros)
            if (cached && cached.length > 0) {
                updateModalStatus(`✓ ${cached.length} registro(s) cargado(s) desde caché local`);
                return cached;
            } else if (cached && cached.length === 0) {
                console.log('[Cache] ⚠ Caché vacío en fetchAllData, limpiando...');
                clientCache.clear();
            }

            try {
                const url = `${APPS_SCRIPT_URL}?action=getAllData`;
                console.log('fetchAllData url=', url);
                
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 90000);

                updateModalStatus('Descargando todos los datos...');
                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeout);
                
                console.log('fetchAllData response.ok=', response.ok, 'status=', response.status);

                const text = await response.text();
                console.log('fetchAllData - tamaño respuesta:', text.length, 'bytes');
                
                let result = null;
                try {
                    result = JSON.parse(text);
                } catch (err) {
                    console.log('fetchAllData - respuesta no JSON:', text.slice(0, 1000));
                }

                if (result && result.success && result.data && Array.isArray(result.data)) {
                    console.log(`Servidor devolvió ${result.data.length} registros totales`);
                    // Solo guardar en caché si hay datos válidos
                    if (result.data.length > 0) {
                        clientCache.set(cacheKey, result.data);
                    } else {
                        console.log('[Cache] ⚠ No guardando en caché porque hay 0 registros');
                    }
                    return result.data;
                }
                // Mostrar más detalles del error
                if (result && !result.success) {
                    console.log('fetchAllData - error del servidor:', result.error || result.message || 'Error desconocido');
                }
                console.log('fetchAllData - no se recibió data válida', result);
            } catch (error) {
                console.log("Error obteniendo todos los datos (getAllData):", error);
            }
            return null;
        };

        // --- ICONO SVG PARA CARGAR EXCEL ---
        const IconUpload = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);

        // --- FUNCIÓN PARA SINCRONIZAR CON GOOGLE SHEETS ---
        const mesesMapGlobal = {
            'ene': 0, 'enero': 0, 'jan': 0, 'january': 0,
            'feb': 1, 'febrero': 1, 'february': 1,
            'mar': 2, 'marzo': 2, 'march': 2,
            'abr': 3, 'abril': 3, 'apr': 3, 'april': 3,
            'may': 4, 'mayo': 4,
            'jun': 5, 'junio': 5, 'june': 5,
            'jul': 6, 'julio': 6, 'july': 6,
            'ago': 7, 'agosto': 7, 'aug': 7, 'august': 7,
            'sep': 8, 'sept': 8, 'septiembre': 8, 'september': 8,
            'oct': 9, 'octubre': 9, 'october': 9,
            'nov': 10, 'noviembre': 10, 'november': 10,
            'dic': 11, 'diciembre': 11, 'dec': 11, 'december': 11
        };

        const formatDateForInput = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const formatDateLabel = (dateKey) => {
            const [year, month, day] = String(dateKey).split('-');
            if (!year || !month || !day) return dateKey;
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const monthIndex = parseInt(month, 10) - 1;
            const monthLabel = monthNames[monthIndex] || month;
            return `${day}/${monthLabel}`;
        };

        const parseSheetDate = (dateStr, fallbackYear = null) => {
            if (!dateStr) return null;

            const str = String(dateStr).trim().toLowerCase();

            if (/^\d+(?:\.0+)?$/.test(str)) {
                const serial = Number(str);
                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                const jsTime = excelEpoch.getTime() + Math.round(serial * 24 * 60 * 60 * 1000);
                const d = new Date(jsTime);
                return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), asDate: d };
            }

            const shortMatch = str.match(/^(\d{1,2})-([a-z]{3,})$/i);
            if (shortMatch) {
                const day = parseInt(shortMatch[1], 10);
                const monthStr = shortMatch[2].substring(0, 3).toLowerCase();
                const month = mesesMapGlobal[monthStr];
                const year = fallbackYear || new Date().getFullYear();
                if (month !== undefined && !isNaN(day)) {
                    return { year, month, day, asDate: new Date(year, month, day) };
                }
            }

            const textMatch = str.match(/^(\d{1,2})\/([a-z]{3,})\/(\d{4})$/i);
            if (textMatch) {
                const day = parseInt(textMatch[1], 10);
                const monthStr = textMatch[2].substring(0, 3).toLowerCase();
                const month = mesesMapGlobal[monthStr];
                const year = parseInt(textMatch[3], 10);
                if (month !== undefined && !isNaN(day) && !isNaN(year)) {
                    return { year, month, day, asDate: new Date(year, month, day) };
                }
            }

            const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (isoMatch) {
                const year = parseInt(isoMatch[1], 10);
                const month = parseInt(isoMatch[2], 10) - 1;
                const day = parseInt(isoMatch[3], 10);
                return { year, month, day, asDate: new Date(year, month, day) };
            }

            const numericMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (numericMatch) {
                const day = parseInt(numericMatch[1], 10);
                const month = parseInt(numericMatch[2], 10) - 1;
                const year = parseInt(numericMatch[3], 10);
                return { year, month, day, asDate: new Date(year, month, day) };
            }

            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
                return {
                    year: parsed.getFullYear(),
                    month: parsed.getMonth(),
                    day: parsed.getDate(),
                    asDate: parsed
                };
            }

            return null;
        };

        const getSafeRowDate = (row) => {
            const rawYear = String(row['Año'] || row['Anio'] || row['Year'] || '').trim();
            const fallbackYear = /^\d{4}$/.test(rawYear) ? parseInt(rawYear, 10) : null;
            const rawDate = row['Día'] || row['Dia'] || row['Day'] || row['Fecha'] || row['Date'] || '';

            const parsed = parseSheetDate(rawDate, fallbackYear);
            if (parsed) return parsed;

            const rawDay = row['Día'] || row['Dia'] || row['Day'] || '';
            const rawMonth = row['Mes'] || row['Month'] || '';
            const day = parseInt(String(rawDay).replace(/[^0-9]/g, ''), 10);

            let month = null;
            const monthStr = String(rawMonth || '').trim().toLowerCase();
            const monthNum = parseInt(monthStr, 10);
            if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
                month = monthNum - 1;
            } else {
                const monthKey = monthStr.substring(0, 3);
                if (mesesMapGlobal[monthKey] !== undefined) month = mesesMapGlobal[monthKey];
                else if (mesesMapGlobal[monthStr] !== undefined) month = mesesMapGlobal[monthStr];
            }

            if (fallbackYear && !isNaN(day) && month !== null) {
                const d = new Date(fallbackYear, month, day);
                return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), asDate: d };
            }

            return null;
        };

        const compareDates = (dateObj, startStr, endStr) => {
            if (!dateObj || !startStr || !endStr) return false;

            const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
            const [endYear, endMonth, endDay] = endStr.split('-').map(Number);

            const dateNum = dateObj.year * 10000 + (dateObj.month + 1) * 100 + dateObj.day;
            const startNum = startYear * 10000 + startMonth * 100 + startDay;
            const endNum = endYear * 10000 + endMonth * 100 + endDay;

            return dateNum >= startNum && dateNum <= endNum;
        };

        const getComparableRowDate = (row) => {
            const rawYear = String(row['Año'] || row['Año'] || row['Anio'] || row['Year'] || '').trim();
            const fallbackYear = /^\d{4}$/.test(rawYear) ? parseInt(rawYear, 10) : null;
            const rawDate = row['Día'] || row['Día'] || row['Dia'] || row['Day'] || row['Fecha'] || row['Date'] || '';

            const parsed = parseSheetDate(rawDate, fallbackYear);
            if (parsed) return parsed;

            const rawDay = row['Día'] || row['Día'] || row['Dia'] || row['Day'] || '';
            const rawMonth = row['Mes'] || row['Month'] || '';
            const day = parseInt(String(rawDay).replace(/[^0-9]/g, ''), 10);

            let month = null;
            const monthStr = String(rawMonth || '').trim().toLowerCase();
            const monthNum = parseInt(monthStr, 10);
            if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
                month = monthNum - 1;
            } else {
                const monthKey = monthStr.substring(0, 3);
                if (mesesMapGlobal[monthKey] !== undefined) month = mesesMapGlobal[monthKey];
                else if (mesesMapGlobal[monthStr] !== undefined) month = mesesMapGlobal[monthStr];
            }

            if (fallbackYear && !isNaN(day) && month !== null) {
                const d = new Date(fallbackYear, month, day);
                return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), asDate: d };
            }

            return null;
        };

        const syncWithGoogleSheet = async (rows) => {
            if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PEGAR_AQUI")) {
                throw new Error("Configure la URL de Apps Script en el código");
            }
            const firstRow = rows[0] || {};
            console.log('[sync] Enviando', rows.length, 'filas al servidor');
            console.log('[sync] OP:', firstRow['OP'], '| Partida:', firstRow['Partida'], '| Rollo:', firstRow['Rollo']);
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ rows: rows })
            });
            console.log('[sync] Petición enviada');
            return { success: true, message: "Datos enviados al servidor" };
        };

        // ============================================
        // COMPONENTE PRINCIPAL
        // ============================================
        function App() {
            // Estado de filtros principales
            const [selectedYear, setSelectedYear] = useState('');
            const [periodoType, setPeriodoType] = useState('Sem'); // 'Sem', 'Mes' o 'Dia'
            const [periodoInicio, setPeriodoInicio] = useState('');
            const [periodoFin, setPeriodoFin] = useState('');
            
            // Estado de datos
            const [rawData, setRawData] = useState([]);
            const [isLoading, setIsLoading] = useState(false);
            const [dataLoaded, setDataLoaded] = useState(false);

            // Mapa de meses para ordenamiento
            const mesesOrden = {
                'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
                'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12
            };
            
            // Extraer valores únicos de los datos
            const uniqueValues = useMemo(() => {
                const years = new Set();
                const semanas = new Set();
                const meses = new Set();
                
                rawData.forEach(row => {
                    const year = String(row['Año'] || row['Anio'] || row['Year'] || '').trim();
                    const semana = String(row['Semana'] || row['Week'] || '').trim();
                    const mes = String(row['Mes'] || row['Month'] || '').trim();
                    
                    if (year) years.add(year);
                    if (semana && !isNaN(parseInt(semana))) semanas.add(parseInt(semana));
                    if (mes) meses.add(mes);
                });
                
                // Ordenar meses por su orden natural
                const mesesOrdenados = Array.from(meses).sort((a, b) => {
                    const ordenA = mesesOrden[String(a).toLowerCase().substring(0, 3)] || 0;
                    const ordenB = mesesOrden[String(b).toLowerCase().substring(0, 3)] || 0;
                    return ordenA - ordenB;
                });
                
                return {
                    years: Array.from(years).sort((a, b) => b - a), // Más reciente primero
                    semanas: Array.from(semanas).sort((a, b) => a - b),
                    meses: mesesOrdenados
                };
            }, [rawData]);

            // Opciones de periodo según tipo seleccionado
            const availableDates = useMemo(() => {
                const dates = new Set();

                rawData.forEach(row => {
                    const rowDate = getComparableRowDate(row);
                    const rowYear = String(row['Año'] || row['Anio'] || row['Year'] || '').trim() || (rowDate ? String(rowDate.year) : '');
                    const effectiveYear = rowYear || (rowDate ? String(rowDate.year) : '');
                    if (selectedYear && effectiveYear !== selectedYear) return;
                    if (rowDate && rowDate.asDate) {
                        dates.add(formatDateForInput(rowDate.asDate));
                    }
                });

                return Array.from(dates).sort();
            }, [rawData, selectedYear]);

            const periodoOptions = useMemo(() => {
                if (periodoType === 'Sem') return uniqueValues.semanas;
                if (periodoType === 'Mes') return uniqueValues.meses;
                return availableDates;
            }, [periodoType, uniqueValues, availableDates]);

            // Filtrar datos según selección
            const filteredData = useMemo(() => {
                if (!selectedYear || !periodoInicio || !periodoFin) return [];
                
                return rawData.filter(row => {
                    const rowYear = String(row['Año'] || row['Anio'] || row['Year'] || '').trim();
                    
                    const rowDate = getComparableRowDate(row);
                    const effectiveYear = rowYear || (rowDate ? String(rowDate.year) : '');

                    if (periodoType === 'Sem') {
                        const rowSemana = parseInt(row['Semana'] || row['Week'] || 0);
                        const inicio = parseInt(periodoInicio);
                        const fin = parseInt(periodoFin);
                        return effectiveYear === selectedYear && rowSemana >= inicio && rowSemana <= fin;
                    } else if (periodoType === 'Mes') {
                        // Para meses, comparar por orden del mes
                        const rowMes = String(row['Mes'] || row['Month'] || '').trim();
                        const rowMesOrden = mesesOrden[rowMes.toLowerCase().substring(0, 3)] || 0;
                        const inicioOrden = mesesOrden[String(periodoInicio).toLowerCase().substring(0, 3)] || 0;
                        const finOrden = mesesOrden[String(periodoFin).toLowerCase().substring(0, 3)] || 0;
                        return effectiveYear === selectedYear && rowMesOrden >= inicioOrden && rowMesOrden <= finOrden;
                    } else {
                        return effectiveYear === selectedYear && compareDates(rowDate, periodoInicio, periodoFin);
                    }
                });
            }, [rawData, selectedYear, periodoType, periodoInicio, periodoFin]);

            // Agrupar datos por periodo (Semana, Mes o Día)
            const groupedData = useMemo(() => {
                const result = {};
                
                filteredData.forEach(row => {
                    let periodo = null;
                    let periodoKey = null;
                    let sortValue = null;

                    if (periodoType === 'Sem') {
                        periodo = parseInt(row['Semana'] || row['Week'] || 0);
                        periodoKey = String(periodo);
                        sortValue = periodo;
                    } else if (periodoType === 'Mes') {
                        periodo = String(row['Mes'] || row['Month'] || '').trim();
                        periodoKey = periodo;
                        sortValue = mesesOrden[String(periodo).toLowerCase().substring(0, 3)] || 0;
                    } else {
                        const rowDate = getComparableRowDate(row);
                        if (!rowDate || !rowDate.asDate) return;
                        periodoKey = formatDateForInput(rowDate.asDate);
                        periodo = formatDateLabel(periodoKey);
                        sortValue = periodoKey;
                    }
                    
                    if (!periodoKey || !periodo) return;
                    
                    if (!result[periodoKey]) {
                        result[periodoKey] = {
                            periodo: periodo,
                            sortValue: sortValue,
                            peso: 0,
                            rollos: 0,
                            uniqueDays: new Set(),
                            metaRollos: 0
                        };
                    }
                    
                    // Sumar Peso
                    const peso = parseFloat(row['Peso'] || row['Weight'] || 0) || 0;
                    result[periodoKey].peso += peso;
                    
                    // Contar Rollos (cada fila es un rollo)
                    result[periodoKey].rollos += 1;

                    const rowDate = getComparableRowDate(row);
                    if (rowDate && rowDate.asDate) {
                        result[periodoKey].uniqueDays.add(formatDateForInput(rowDate.asDate));
                    }
                });

                Object.values(result).forEach(item => {
                    const uniqueDaysCount = periodoType === 'Dia' ? 1 : item.uniqueDays.size;
                    item.metaRollos = uniqueDaysCount * 235;
                    item.uniqueDaysCount = uniqueDaysCount;
                    delete item.uniqueDays;
                });
                
                return result;
            }, [filteredData, periodoType]);

            // Convertir a array ordenado
            const sortedData = useMemo(() => {
                return Object.values(groupedData).sort((a, b) => {
                    if (periodoType === 'Sem') {
                        return a.sortValue - b.sortValue;
                    } else if (periodoType === 'Mes') {
                        return a.sortValue - b.sortValue;
                    } else {
                        return String(a.sortValue).localeCompare(String(b.sortValue));
                    }
                });
            }, [groupedData, periodoType]);

            // Calcular totales
            const totals = useMemo(() => {
                return sortedData.reduce((acc, item) => ({
                    peso: acc.peso + item.peso,
                    rollos: acc.rollos + item.rollos
                }), { peso: 0, rollos: 0 });
            }, [sortedData]);

            // --- FUNCIÓN PARA CARGAR ARCHIVO EXCEL ---
            const handleFileUpload = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                e.target.value = '';

                showLoadingModal(
                    'Cargando archivo...',
                    'Leyendo datos del Excel',
                    `Archivo: ${file.name}`,
                    5
                );

                const reader = new FileReader();
                reader.onload = async (evt) => {
                    try {
                        updateModalStatus('Procesando archivo Excel...');
                        
                        const bstr = evt.target.result;
                        const wb = XLSX.read(bstr, { type: 'binary' });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        
                        const rawExcelData = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        
                        let headerRowIndex = 1;
                        for (let i = 0; i < Math.min(rawExcelData.length, 10); i++) {
                            const rowStr = JSON.stringify(rawExcelData[i]).toUpperCase();
                            if (rowStr.includes("OP") && (rowStr.includes("PARTIDA") || rowStr.includes("ROLLO"))) {
                                headerRowIndex = i;
                                break;
                            }
                        }

                        const jsonDataRaw = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex, defval: "" });
                        
                        const headers = rawExcelData[headerRowIndex] || [];
                        const opColName = headers.find(h => String(h || '').trim().toUpperCase() === 'OP');

                        const jsonData = jsonDataRaw.filter(row => {
                            if (Object.values(row).some(v => String(v || '').toUpperCase().trim() === 'TOTAL')) return false;
                            const opValue = opColName ? String(row[opColName] || '').trim() : '';
                            return opValue !== '';
                        });

                        if (jsonData.length === 0) {
                            document.getElementById('modal-title').textContent = '❌ Error';
                            document.getElementById('modal-message').textContent = 'No se encontraron datos válidos';
                            document.getElementById('modal-status').textContent = 'El archivo no contiene datos o el formato es incorrecto';
                            setTimeout(hideLoadingModal, 4000);
                            return;
                        }

                        const COLUMN_ALIASES = {
                            'Nro. Rollo': 'Rollo', 'Nro Rollo': 'Rollo',
                            'No. Rollo':  'Rollo', 'No Rollo':  'Rollo',
                            'N° Rollo':   'Rollo', 'Nº Rollo':  'Rollo',
                            '#Rollo':     'Rollo',
                        };
                        const cleanedData = jsonData.map(row => {
                            const clean = {};
                            Object.keys(row).forEach(k => {
                                if (!k || k.startsWith('__EMPTY') || k.trim() === '') return;
                                clean[COLUMN_ALIASES[k] || k] = row[k];
                            });
                            return clean;
                        });

                        updateModalStatus(`${cleanedData.length} filas encontradas. Sincronizando con la base de datos...`);

                        try {
                            await syncWithGoogleSheet(cleanedData);
                            clientCache.clear();

                            document.getElementById('modal-title').textContent = '✅ ¡Completado!';
                            document.getElementById('modal-message').textContent = `Se procesaron ${cleanedData.length} filas correctamente`;
                            document.getElementById('modal-status').textContent = 'Los datos han sido sincronizados con la base de datos. Presione Buscar para ver los cambios.';
                            setTimeout(hideLoadingModal, 3000);
                        } catch (syncError) {
                            console.error('Error de sincronización:', syncError);
                            document.getElementById('modal-title').textContent = '❌ Error';
                            document.getElementById('modal-message').textContent = 'Error al sincronizar con la base de datos';
                            document.getElementById('modal-status').textContent = syncError.message || 'Intente nuevamente';
                            setTimeout(hideLoadingModal, 4000);
                        }
                        
                    } catch (error) {
                        console.error(error);
                        document.getElementById('modal-title').textContent = '❌ Error';
                        document.getElementById('modal-message').textContent = 'Error al leer el archivo';
                        document.getElementById('modal-status').textContent = error.message || 'Formato de archivo no válido';
                        setTimeout(hideLoadingModal, 4000);
                    }
                };
                
                reader.onerror = () => {
                    document.getElementById('modal-title').textContent = '❌ Error';
                    document.getElementById('modal-message').textContent = 'Error al leer el archivo';
                    document.getElementById('modal-status').textContent = 'No se pudo leer el archivo seleccionado';
                    setTimeout(hideLoadingModal, 4000);
                };
                
                reader.readAsBinaryString(file);
            };

            // Cargar datos iniciales
            const loadInitialData = useCallback(async () => {
                if (dataLoaded) return;
                
                setIsLoading(true);
                showLoadingModal('Cargando datos...', 'Obteniendo información del servidor', 'Conectando...', 5);

                try {
                    console.log('loadInitialData - Iniciando carga de datos...');
                    const data = await loadSheetDataFast();
                    console.log('loadInitialData - Datos recibidos:', data ? data.length : 'null');
                    
                    if (data && data.length > 0) {
                        // Debug: mostrar columnas disponibles
                        console.log('loadInitialData - Columnas disponibles:', Object.keys(data[0]));
                        console.log('loadInitialData - Primera fila:', data[0]);
                        
                        setRawData(data);
                        setDataLoaded(true);
                        updateModalStatus(`✓ ${data.length} registros cargados`);
                    } else {
                        console.log('loadInitialData - No se recibieron datos del servidor');
                        updateModalStatus('No se encontraron datos en el servidor');
                    }
                } catch (error) {
                    console.error('Error cargando datos:', error);
                    updateModalStatus('Error al cargar datos: ' + error.message);
                } finally {
                    setTimeout(() => {
                        setIsLoading(false);
                        hideLoadingModal();
                    }, 500);
                }
            }, [dataLoaded]);

            // Cargar datos al montar el componente
            useEffect(() => {
                loadInitialData();
            }, [loadInitialData]);

            // Actualizar valores por defecto cuando se cargan los datos
            useEffect(() => {
                if (uniqueValues.years.length > 0 && !selectedYear) {
                    // Seleccionar el último año (el más reciente)
                    setSelectedYear(uniqueValues.years[0]);
                }
            }, [uniqueValues.years]);

            useEffect(() => {
                if (periodoOptions.length > 0) {
                    if (periodoType === 'Sem') {
                        // Para semanas: última semana y 7 semanas antes
                        const lastWeek = Math.max(...periodoOptions);
                        const startWeek = Math.max(Math.min(...periodoOptions), lastWeek - 7);
                        
                        if (!periodoFin || !periodoOptions.includes(parseInt(periodoFin))) {
                            setPeriodoFin(String(lastWeek));
                        }
                        if (!periodoInicio || !periodoOptions.includes(parseInt(periodoInicio))) {
                            setPeriodoInicio(String(startWeek));
                        }
                    } else if (periodoType === 'Mes') {
                        // Para meses: mantener comportamiento original (primero y último)
                        if (!periodoInicio || !periodoOptions.includes(periodoInicio)) {
                            setPeriodoInicio(String(periodoOptions[0]));
                        }
                        if (!periodoFin || !periodoOptions.includes(periodoFin)) {
                            setPeriodoFin(String(periodoOptions[periodoOptions.length - 1]));
                        }
                    } else {
                        const lastDate = periodoOptions[periodoOptions.length - 1];
                        const lastSevenDates = periodoOptions.slice(-7);
                        const startDate = lastSevenDates[0] || lastDate;

                        if (!periodoInicio || !periodoOptions.includes(periodoInicio)) {
                            setPeriodoInicio(String(startDate));
                        }
                        if (!periodoFin || !periodoOptions.includes(periodoFin)) {
                            setPeriodoFin(String(lastDate));
                        }
                    }
                }
            }, [periodoOptions, periodoType]);

            // Manejar búsqueda/actualización
            const handleSearch = useCallback(async () => {
                setIsLoading(true);
                showLoadingModal('Actualizando datos...', 'Recargando información del servidor', 'Conectando...', 5);

                try {
                    clientCache.clear();
                    const data = await loadSheetDataFast();
                    
                    if (data && data.length > 0) {
                        setRawData(data);
                        updateModalStatus(`✓ ${data.length} registros actualizados`);
                    }
                } catch (error) {
                    console.error('Error actualizando datos:', error);
                    updateModalStatus('Error: ' + error.message);
                } finally {
                    setTimeout(() => {
                        setIsLoading(false);
                        hideLoadingModal();
                    }, 500);
                }
            }, []);

            // Exportar a Excel
            const handleExportExcel = async () => {
                try {
                    if (!window.ExcelJS) {
                        alert('La librería de Excel no se ha cargado. Por favor, recarga la página.');
                        return;
                    }
                    
                    const workbook = new window.ExcelJS.Workbook();
                    const worksheet = workbook.addWorksheet("Defectos Inspección");
                    
                    // Título
                    const titleRow = worksheet.addRow(["CONTROL DE INSPECCIÓN DE CALIDAD T-CRUDO"]);
                    titleRow.font = { bold: true, size: 14, name: 'Calibri' };
                    
                    // Subtítulo
                    const subtitleRow = worksheet.addRow([`Defectos Inspección - Año ${selectedYear} - ${periodoType === 'Sem' ? 'Semanas' : periodoType === 'Mes' ? 'Meses' : 'Días'} ${periodoInicio} a ${periodoFin}`]);
                    subtitleRow.font = { bold: true, size: 11, name: 'Calibri' };
                    
                    worksheet.addRow([]);
                    
                    // Encabezados
                    const periodoLabel = periodoType === 'Sem' ? 'Semana' : periodoType === 'Mes' ? 'Mes' : 'Día';
                    const headers = [periodoLabel, "Peso (Kg)", "Rollos"];
                    const headerRow = worksheet.addRow(headers);
                    headerRow.font = { bold: true, color: { argb: 'FF000000' } };
                    headerRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }
                    };
                    headerRow.alignment = { horizontal: 'center', vertical: 'center' };
                    
                    headerRow.eachCell(cell => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                    
                    // Datos
                    sortedData.forEach((item, index) => {
                        const dataRow = worksheet.addRow([
                            item.periodo,
                            Math.round(item.peso).toLocaleString(),
                            item.rollos.toLocaleString()
                        ]);
                        
                        dataRow.eachCell((cell, colNumber) => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                            cell.alignment = { horizontal: 'center', vertical: 'center' };
                        });
                    });
                    
                    // Totales
                    const footerRow = worksheet.addRow(['Total general', Math.round(totals.peso).toLocaleString(), totals.rollos.toLocaleString()]);
                    footerRow.font = { bold: true };
                    footerRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }
                    };
                    footerRow.eachCell(cell => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        cell.alignment = { horizontal: 'center', vertical: 'center' };
                    });
                    
                    // Anchos de columna
                    worksheet.columns = [
                        { width: 15 },
                        { width: 18 },
                        { width: 15 }
                    ];
                    
                    // Descargar
                    const buffer = await workbook.xlsx.writeBuffer();
                    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Defectos_Inspeccion_${selectedYear}_${periodoType}${periodoInicio}-${periodoFin}.xlsx`;
                    link.click();
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Error al exportar Excel:', error);
                    alert('Error al generar el archivo Excel: ' + error.message);
                }
            };

            return (
                <div className="max-w-7xl mx-auto px-2 py-3">
                    {/* Encabezado con Navegación */}
                    <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="text-left">
                            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                                CONTROL DE INSPECCIÓN DE CALIDAD T-CRUDO
                            </h1>
                            <h2 className="text-sm text-gray-600 mt-1 hidden print:block">Defectos Inspección</h2>
                        </div>
                        
                        {/* Pestañas de Navegación */}
                        <nav className="flex flex-wrap items-center gap-2 print:hidden">
                            <a 
                                href={window.AppRouter.href('principales_defectos')} 
                                className="px-2.5 py-1 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                📊 Principales Defectos
                            </a>
                            <a 
                                href={window.AppRouter.href('defecto_maquina')} 
                                className="px-2.5 py-1 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                🔧 Defectos xMáquina
                            </a>
                            <a 
                                href={window.AppRouter.href('produccion_articulo')} 
                                className="px-2.5 py-1 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                📦 Producción xArtículo
                            </a>
                            <a 
                                href={window.AppRouter.href('defectos_inspeccion')} 
                                className="px-2.5 py-1 text-sm font-medium text-white bg-blue-600 rounded-md transition-colors"
                            >
                                🔍 Defectos Inspecc.
                            </a>
                            <a
                                href={window.AppRouter.href('home')}
                                title="Ir al menu principal"
                                className="w-9 h-9 inline-flex items-center justify-center text-gray-600 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 10.5 12 3l9 7.5"/>
                                    <path d="M5 9.5V21h14V9.5"/>
                                    <path d="M9 21v-6h6v6"/>
                                </svg>
                            </a>
                        </nav>
                    </header>

                    {/* Filtros Principales */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 mb-3 print:hidden">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Filtro de Año */}
                                <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                                    <label className="text-sm font-medium text-gray-700">Año</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {uniqueValues.years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Selector de tipo de periodo */}
                                <div className="flex items-center gap-3 border-r border-gray-200 pr-4">
                                    <span className="text-sm font-medium text-gray-700">Periodo</span>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="periodoType"
                                            value="Dia"
                                            checked={periodoType === 'Dia'}
                                            onChange={(e) => {
                                                setPeriodoType(e.target.value);
                                                setPeriodoInicio('');
                                                setPeriodoFin('');
                                            }}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm text-gray-700">Día</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="periodoType"
                                            value="Sem"
                                            checked={periodoType === 'Sem'}
                                            onChange={(e) => {
                                                setPeriodoType(e.target.value);
                                                setPeriodoInicio('');
                                                setPeriodoFin('');
                                            }}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm text-gray-700">Sem</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="periodoType"
                                            value="Mes"
                                            checked={periodoType === 'Mes'}
                                            onChange={(e) => {
                                                setPeriodoType(e.target.value);
                                                setPeriodoInicio('');
                                                setPeriodoFin('');
                                            }}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm text-gray-700">Mes</span>
                                    </label>
                                </div>

                                {/* Filtros de Inicio y Fin */}
                                <div className="flex items-center gap-4">
                                    {periodoType === 'Dia' ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium text-gray-700">Inicio</label>
                                                <input
                                                    type="date"
                                                    value={periodoInicio}
                                                    min={availableDates[0] || ''}
                                                    max={availableDates[availableDates.length - 1] || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setPeriodoInicio(value);
                                                        if (periodoFin && value > periodoFin) {
                                                            setPeriodoFin(value);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium text-gray-700">Fin</label>
                                                <input
                                                    type="date"
                                                    value={periodoFin}
                                                    min={availableDates[0] || ''}
                                                    max={availableDates[availableDates.length - 1] || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setPeriodoFin(value);
                                                        if (periodoInicio && value < periodoInicio) {
                                                            setPeriodoInicio(value);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium text-gray-700">Inicio</label>
                                                <select
                                                    value={periodoInicio}
                                                    onChange={(e) => setPeriodoInicio(e.target.value)}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[80px]"
                                                >
                                                    <option value="">--</option>
                                                    {periodoOptions.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium text-gray-700">Fin</label>
                                                <select
                                                    value={periodoFin}
                                                    onChange={(e) => setPeriodoFin(e.target.value)}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[80px]"
                                                >
                                                    <option value="">--</option>
                                                    {periodoOptions.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Botón de actualizar */}
                                <button
                                    onClick={handleSearch}
                                    disabled={isLoading}
                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-10 h-10"
                                    title="Actualizar datos"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                        <path d="M3 3v5h5"/>
                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                                        <path d="M16 21h5v-5"/>
                                    </svg>
                                </button>

                                {/* Info de registros */}
                                {filteredData.length > 0 && (
                                    <div className="text-sm text-gray-500">
                                        <span className="font-semibold text-blue-600">{filteredData.length}</span> registros filtrados
                                    </div>
                                )}
                            </div>

                            {/* Botones de exportación */}
                            {sortedData.length > 0 && (
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        let insp = 0, lib = 0;
                                        (Array.isArray(filteredData) ? filteredData : []).forEach(r => {
                                            const t = String(r['Tipo categoría'] || r['Tipo categoria'] || '').trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
                                            if (t.startsWith('INSPEC')) insp++;
                                            else if (t === 'LIBERADO') lib++;
                                        });
                                        if (!insp && !lib) return null;
                                        return (
                                            <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                                                {insp > 0 && <span style={{background:'#dbeafe',color:'#1d4ed8',borderRadius:'9999px',padding:'2px 8px',fontSize:'11px',fontWeight:700,whiteSpace:'nowrap'}}>INSP {insp}</span>}
                                                {lib > 0 && <span style={{background:'#dcfce7',color:'#15803d',borderRadius:'9999px',padding:'2px 8px',fontSize:'11px',fontWeight:700,whiteSpace:'nowrap'}}>LIB {lib}</span>}
                                            </div>
                                        );
                                    })()}
                                    <button
                                        onClick={handleExportExcel}
                                        className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors flex items-center justify-center w-10 h-10"
                                        title="Descargar Excel"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM13 9V3.5L18.5 9H13zM8.5 17v-4h1v4h-1zm2 0v-2.5h1V17h-1zm2 0v-4h1v4h-1z"/>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {setTimeout(() => window.print(), 100);}}
                                        className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center w-10 h-10"
                                        title="Imprimir (Horizontal - Una página)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9"/>
                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                            <rect x="6" y="14" width="12" height="8"/>
                                        </svg>
                                    </button>
                                    <label 
                                        title="Cargar Excel" 
                                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center w-10 h-10 cursor-pointer"
                                    >
                                        <IconUpload />
                                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabla de Resultados */}
                    <div className="w-full">
                        {sortedData.length > 0 ? (
                            <div className="flex gap-4">
                                {/* Columna izquierda - Tabla (25%) */}
                                <div className="w-1/4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="overflow-auto max-h-[calc(100vh-280px)]">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0">
                                                <tr className="bg-gray-100">
                                                    <th className="px-2 py-1.5 text-center font-bold text-gray-700 border-b text-xs">
                                                        {periodoType === 'Sem' ? 'Semana' : periodoType === 'Mes' ? 'Mes' : 'Día'}
                                                    </th>
                                                    <th className="px-2 py-1.5 text-center font-bold text-gray-700 border-b text-xs">
                                                        Peso (Kg)
                                                    </th>
                                                    <th className="px-2 py-1.5 text-center font-bold text-gray-700 border-b text-xs">
                                                        Rollos
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedData.map((item, idx) => {
                                                    const rowBgClass = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                                                    
                                                    return (
                                                        <tr key={item.periodo} className={`${rowBgClass} hover:bg-blue-50`}>
                                                            <td className="px-2 py-1 text-center font-medium text-gray-800 border-b text-xs">
                                                                {item.periodo}
                                                            </td>
                                                            <td className="px-2 py-1 text-center font-semibold text-green-700 border-b text-xs">
                                                                {Math.round(item.peso).toLocaleString('es-ES')}
                                                            </td>
                                                            <td className="px-2 py-1 text-center font-semibold text-blue-700 border-b text-xs">
                                                                {item.rollos.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-gray-200 font-bold sticky bottom-0">
                                                    <td className="px-2 py-1.5 text-center text-gray-800 border-t text-xs">
                                                        Total general
                                                    </td>
                                                    <td className="px-2 py-1.5 text-center text-green-800 border-t text-xs">
                                                        {Math.round(totals.peso).toLocaleString('es-ES')}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-center text-blue-800 border-t text-xs">
                                                        {totals.rollos.toLocaleString()}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                                
                                {/* Columna derecha - Gráfico (75%) */}
                                <div className="w-3/4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Producción por {periodoType === 'Sem' ? 'Semana' : periodoType === 'Mes' ? 'Mes' : 'Día'}
                                        </h3>
                                        <div id="chart-legend" className="flex items-center gap-4 text-sm"></div>
                                    </div>
                                    <div className="w-full" style={{ height: '350px' }}>
                                        <BarChart data={sortedData} periodoType={periodoType} />
                                    </div>
                                </div>
                            </div>
                        ) : !isLoading && dataLoaded ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-4">
                                    <circle cx="11" cy="11" r="8"/>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                                <p className="text-gray-500">Seleccione los filtros para ver los datos de inspección</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            );
        }

        // Componente de Gráfico de Barras
        function BarChart({ data, periodoType }) {
            const chartRef = React.useRef(null);
            const chartInstance = React.useRef(null);

            React.useEffect(() => {
                if (!chartRef.current || !data || data.length === 0) return;

                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }

                const ctx = chartRef.current.getContext('2d');
                
                const labels = data.map(item => (
                    periodoType === 'Sem' ? `SEM${item.periodo}` : item.periodo
                ));
                const pesoData = data.map(item => Math.round(item.peso));
                const rollosData = data.map(item => item.rollos);

                // Plugin para mostrar etiquetas de datos
                const datalabelsPlugin = {
                    id: 'datalabels',
                    afterDatasetsDraw(chart) {
                        const { ctx } = chart;
                        chart.data.datasets.forEach((dataset, datasetIndex) => {
                            const meta = chart.getDatasetMeta(datasetIndex);
                            meta.data.forEach((element, index) => {
                                const value = dataset.data[index];
                                ctx.save();
                                ctx.font = 'bold 12px Arial';
                                ctx.textAlign = 'center';
                                
                                if (dataset.label === 'Rollos') {
                                    // Línea/puntos: etiqueta arriba del punto
                                    ctx.fillStyle = 'rgba(30, 64, 175, 1)';
                                    ctx.fillText(value.toLocaleString('es-ES'), element.x, element.y - 10);
                                } else if (dataset.type === 'line' || datasetIndex > 0) {
                                } else {
                                    // Barras: etiqueta en el medio de la barra
                                    ctx.fillStyle = '#ffffff';
                                    ctx.font = 'bold 11px Arial';
                                    const yPos = element.y + (element.base - element.y) / 2;
                                    ctx.fillText(value.toLocaleString('es-ES'), element.x, yPos + 4);
                                }
                                ctx.restore();
                            });
                        });
                    }
                };
                
                // Plugin para leyenda personalizada externa
                const htmlLegendPlugin = {
                    id: 'htmlLegend',
                    afterUpdate(chart) {
                        const legendContainer = document.getElementById('chart-legend');
                        if (!legendContainer) return;
                        
                        let html = '';
                        chart.data.datasets.forEach((dataset, i) => {
                            const bgColor = dataset.type === 'line' ? dataset.borderColor : dataset.backgroundColor;
                            const icon = dataset.type === 'line' 
                                ? `<span style="display:inline-block;width:20px;height:3px;background:${bgColor};margin-right:4px;vertical-align:middle;"></span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${bgColor};margin-left:-14px;margin-right:6px;vertical-align:middle;"></span>`
                                : `<span style="display:inline-block;width:14px;height:14px;background:${bgColor};margin-right:6px;vertical-align:middle;border-radius:2px;"></span>`;
                            html += `<div class="flex items-center"><span>${icon}</span><span class="text-gray-700 font-medium">${dataset.label}</span></div>`;
                        });
                        legendContainer.innerHTML = html;
                    }
                };

                chartInstance.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Peso (Kg)',
                                data: pesoData,
                                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                                borderColor: 'rgba(34, 197, 94, 1)',
                                borderWidth: 1,
                                yAxisID: 'y',
                                order: 2
                            },
                            {
                                type: 'line',
                                label: 'Rollos',
                                data: rollosData,
                                borderColor: 'rgba(59, 130, 246, 1)',
                                backgroundColor: 'rgba(59, 130, 246, 1)',
                                borderWidth: 2,
                                pointRadius: 5,
                                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 2,
                                tension: 0.1,
                                yAxisID: 'y1',
                                order: 1
                            },
                        ]
                    },
                    plugins: [datalabelsPlugin, htmlLegendPlugin],
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        label += context.parsed.y.toLocaleString('es-ES');
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: periodoType === 'Sem' ? 'SEMANAS' : periodoType === 'Mes' ? 'MESES' : 'DÍAS',
                                    font: { weight: 'bold' }
                                }
                            },
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: 'Peso (Kg)',
                                    font: { weight: 'bold' }
                                },
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString('es-ES');
                                    }
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Rollos',
                                    font: { weight: 'bold' }
                                },
                                grid: {
                                    drawOnChartArea: false
                                },
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString('es-ES');
                                    }
                                }
                            }
                        }
                    }
                });

                return () => {
                    if (chartInstance.current) {
                        chartInstance.current.destroy();
                    }
                };
            }, [data, periodoType]);

            return <canvas ref={chartRef}></canvas>;
        }

        // Renderizar la aplicación
        ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
