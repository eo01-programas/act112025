// ARCHIVO GENERADO — NO EDITAR A MANO.
// Fuente: js/trazabilidad_op.js
// Generado: 2026-07-06T23:05:38.479Z con tools/compile_jsx.js
// Si editas la fuente, regenera este archivo (ver tools/README.md).
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
(function () {
  if (!window.AppRouter || window.AppRouter.currentView !== 'trazabilidad_op') {
    return;
  }
  var _React = React,
    useState = _React.useState,
    useEffect = _React.useEffect,
    useMemo = _React.useMemo,
    useRef = _React.useRef;
  var WEB_APP_URL = window.APP_CONFIG.IQ.WEB_APP_URL;
  var LOCAL_STORAGE_KEY = window.APP_CONFIG.IQ.LOCAL_STORAGE_KEY;
  // Catálogo de motivos para el filtro (sincronizado con mobile_calidad
  // vía MOTIVOS_RECHAZO en config.js)
  var MOTIVOS_CATALOGO = window.APP_CONFIG.IQ.MOTIVOS_RECHAZO || [];
  var MAX_MOTIVOS = 7;

  // Etiquetas de tipo de tela (igual que iq_data.js)
  var TIPO_TELA_LABELS = {
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
  var tipoTelaLabel = function tipoTelaLabel(raw) {
    var str = String(raw || '').trim();
    if (!str) return '';
    var code = str.includes('→') ? str.split('→')[0].trim() : str;
    return TIPO_TELA_LABELS[code] || str;
  };
  var tipoTelaDisplay = function tipoTelaDisplay(raw) {
    var str = String(raw || '').trim();
    if (!str) return '';
    var code = str.includes('→') ? str.split('→')[0].trim() : str;
    var label = TIPO_TELA_LABELS[code];
    return label ? "".concat(code, " \u2192 ").concat(label) : str;
  };
  var clean = function clean(v) {
    return String(v == null ? '' : v).trim();
  };

  // Abreviaciones para mostrar en la tabla
  var CLIENT_ABBR = {
    'ALLBIRDS': 'ALLB',
    'AM RETAIL': 'AMR',
    'AM RETAIL S.A.C.': 'AMR',
    'ATHLETA': 'ATH',
    'BANANA': 'BNN',
    'COFACO INDUSTRIES': 'COF',
    'DUER': 'DUER',
    'LACOSTE': 'LAC',
    'LULU': 'LULU',
    'REVTOWN': 'REV',
    'SKECHERS': 'SKE',
    'THEORY': 'THE'
  };
  // Normalización para el filtro (fusiona variantes de AM RETAIL)
  var CLIENT_NORMALIZE = {
    'AM RETAIL S.A.C.': 'AM RETAIL'
  };
  var clienteAbbr = function clienteAbbr(raw) {
    var s = clean(raw).toUpperCase();
    return CLIENT_ABBR[s] || clean(raw);
  };
  var normalizeCliente = function normalizeCliente(raw) {
    var s = clean(raw);
    return CLIENT_NORMALIZE[s] || s;
  };

  // --- Estado de cada partida (misma lógica que iq_data.js) ---
  var isAprobada = function isAprobada(r) {
    return clean(r.tipo_aprobacion) !== '';
  };
  var getMotivos = function getMotivos(r) {
    var seen = new Set();
    var out = [];
    for (var i = 1; i <= MAX_MOTIVOS; i++) {
      var m = clean(r["motivo_rechazo_".concat(i)]);
      if (m && !seen.has(m)) {
        seen.add(m);
        out.push(m);
      }
    }
    return out;
  };
  var isRechazada = function isRechazada(r) {
    return !isAprobada(r) && getMotivos(r).length > 0;
  };
  var getEstado = function getEstado(r) {
    return isAprobada(r) ? 'aprobada' : isRechazada(r) ? 'rechazada' : 'evaluacion';
  };
  var ORDINAL_LABELS = ['1er', '2do', '3er', '4to', '5to', '6to', '7mo'];
  var getRechazosFull = function getRechazosFull(r) {
    var out = [];
    for (var i = 1; i <= MAX_MOTIVOS; i++) {
      var motivo = clean(r["motivo_rechazo_".concat(i)]);
      if (!motivo) continue;
      out.push({
        label: ORDINAL_LABELS[i - 1] || "".concat(i, "\xB0"),
        motivo: motivo,
        fecha: clean(r["fecha_rechazo_".concat(i)]),
        supervisor: clean(r["supervisor_rechazo_".concat(i)]),
        turno: clean(r["turno_rechazo_".concat(i)])
      });
    }
    return out;
  };

  // Resalta los últimos 5 dígitos del cod_art (convención de Trazailidad OP)
  var splitCodArt = function splitCodArt(code) {
    var str = clean(code);
    if (str.length > 5) return [str.slice(0, -5), str.slice(-5)];
    return ['', str];
  };

  // ── Utilidades de fecha y agregación para la gráfica ───────────────────────
  var CHART_MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  var CHART_MONTH_MAP = {
    ene: 0,
    feb: 1,
    mar: 2,
    abr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    ago: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dic: 11
  };

  // Parsea fechas DD/Mes/YYYY HH:mm AM/PM, ISO o serial Excel (misma lógica que iq_data.js)
  var parseDateish = function parseDateish(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' || typeof value === 'string' && /^\d+(\.\d+)?$/.test(String(value).trim())) {
      var num = parseFloat(value);
      if (num > 40000 && num < 60000) {
        var excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + num * 86400000);
      }
    }
    var str = String(value).trim();
    if (!str) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      var d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    }
    var sp = str.match(/^(\d{1,2})\/([A-Za-záéíóúü]+)\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?)?/i);
    if (sp) {
      var day = parseInt(sp[1], 10);
      var mk = sp[2].toLowerCase().slice(0, 3);
      var year = parseInt(sp[3], 10);
      var mi = CHART_MONTH_MAP[mk];
      if (mi === undefined) return null;
      var h = sp[4] ? parseInt(sp[4], 10) : 0;
      var min = sp[5] ? parseInt(sp[5], 10) : 0;
      var ap = sp[6] ? sp[6].toUpperCase() : '';
      if (ap === 'PM' && h < 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      var _d = new Date(year, mi, day, h, min, 0);
      return isNaN(_d.getTime()) ? null : _d;
    }
    var nm = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (nm) {
      var _d2 = new Date(parseInt(nm[3], 10), parseInt(nm[2], 10) - 1, parseInt(nm[1], 10));
      return isNaN(_d2.getTime()) ? null : _d2;
    }
    var fb = new Date(str);
    return isNaN(fb.getTime()) ? null : fb;
  };

  // Registros de 00:00–05:59 pertenecen al día anterior (turno noche 3T)
  var adjustNightShift = function adjustNightShift(date) {
    if (!date) return null;
    if (date.getHours() < 6) return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, date.getHours(), date.getMinutes(), 0);
    return date;
  };

  // Última fecha registrada de la partida (aprobación o cualquier rechazo).
  // Se usa para ordenar la tabla: lo más reciente arriba.
  var getFechaRef = function getFechaRef(r) {
    var max = 0;
    var push = function push(v) {
      var d = parseDateish(clean(v));
      if (d && d.getTime() > max) max = d.getTime();
    };
    if (isAprobada(r)) {
      push(r.fecha_aprobacion);
      push(r.calidad_fin);
    }
    for (var i = 1; i <= MAX_MOTIVOS; i++) push(r["fecha_rechazo_".concat(i)]);
    return max;
  };

  // Lunes de la semana de una fecha
  var startOfWeek = function startOfWeek(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  };

  // Número de semana ISO 8601 (misma lógica que iq_data.js)
  var getISOWeek = function getISOWeek(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  // Clave (timestamp ordenable) + etiqueta del período de una fecha
  var periodOf = function periodOf(date, mode) {
    if (mode === 'semanas') {
      var _s = startOfWeek(date);
      return {
        key: _s.getTime(),
        label: "Sem ".concat(getISOWeek(_s))
      };
    }
    var s = new Date(date.getFullYear(), date.getMonth(), 1);
    return {
      key: s.getTime(),
      label: "".concat(CHART_MONTH_LABELS[s.getMonth()], " ").concat(String(s.getFullYear()).slice(2))
    };
  };

  // Genera N períodos consecutivos terminando en anchorDate (más antiguo primero)
  var buildPeriods = function buildPeriods(anchorDate, mode) {
    var n = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 7;
    var out = [];
    var d = mode === 'semanas' ? startOfWeek(anchorDate) : new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    for (var i = 0; i < n; i++) {
      out.unshift(periodOf(d, mode));
      d = mode === 'semanas' ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7) : new Date(d.getFullYear(), d.getMonth() - 1, 1);
    }
    return out;
  };

  // Consolida las filas en partidas únicas con su ESTADO FINAL, igual que el
  // Consolidado de Aprobaciones: aprobada si CUALQUIER fila trae tipo_aprobacion;
  // rechazada si ninguna lo trae pero hay motivos. Así ambas pantallas cuentan igual.
  var buildPartidasGrafica = function buildPartidasGrafica(records) {
    var map = new Map(); // partidaId → acumulador
    records.forEach(function (r) {
      var id = "".concat(clean(r.op_tela), "-").concat(clean(r.partida));
      var p = map.get(id);
      if (!p) {
        p = {
          cliente: '',
          tipo: '',
          aprobada: false,
          fechaAprob: null,
          fechaRech: null,
          eventos: 0
        };
        map.set(id, p);
      }
      var cli = normalizeCliente(clean(r.cliente));
      if (cli && !p.cliente) p.cliente = cli;
      if (isAprobada(r)) {
        p.aprobada = true;
        var t = clean(r.tipo_aprobacion).toUpperCase();
        if (t && !p.tipo) p.tipo = t;
        var d = adjustNightShift(parseDateish(r.calidad_fin)) || adjustNightShift(parseDateish(r.fecha_aprobacion));
        if (d && (!p.fechaAprob || d > p.fechaAprob)) p.fechaAprob = d;
      }
      for (var i = 1; i <= MAX_MOTIVOS; i++) {
        if (!clean(r["motivo_rechazo_".concat(i)])) continue;
        p.eventos++;
        var _d3 = adjustNightShift(parseDateish(r["fecha_rechazo_".concat(i)]));
        if (_d3 && (!p.fechaRech || _d3 > p.fechaRech)) p.fechaRech = _d3;
      }
    });
    return _toConsumableArray(map.values()).map(function (p) {
      return {
        cliente: p.cliente || '(sin cliente)',
        tipo: p.tipo,
        estado: p.aprobada ? 'aprobada' : p.eventos ? 'rechazada' : null,
        // Aprobadas se ubican por su fecha de aprobación; rechazadas por su último rechazo
        fecha: p.aprobada ? p.fechaAprob || p.fechaRech : p.fechaRech
      };
    }).filter(function (p) {
      return p.estado && p.fecha;
    });
  };

  // Construye la serie por período para ChartTendencia (ver js/chart_tendencia.js).
  // fTipo filtra SOLO la serie de Aprobadas por tipo de aprobación (las
  // rechazadas no tienen tipo y se muestran completas).
  var buildChartData = function buildChartData(partidas, mode, fCliente, fTipo) {
    var items = fCliente ? partidas.filter(function (p) {
      return p.cliente === fCliente;
    }) : partidas;
    var maxKey = null;
    var conPeriodo = items.map(function (p) {
      var period = periodOf(p.fecha, mode);
      if (maxKey === null || period.key > maxKey) maxKey = period.key;
      return _objectSpread(_objectSpread({}, p), {}, {
        key: period.key
      });
    });
    var anchor = maxKey !== null ? new Date(maxKey) : new Date();
    var periods = buildPeriods(anchor, mode, 12);
    var idxByKey = new Map(periods.map(function (p, i) {
      return [p.key, i];
    }));
    var aprobadas = periods.map(function () {
      return 0;
    });
    var rechazadas = periods.map(function () {
      return 0;
    });
    var detalles = periods.map(function () {
      return {
        aprobadas: new Map(),
        rechazadas: new Map()
      };
    });
    conPeriodo.forEach(function (p) {
      var i = idxByKey.get(p.key);
      if (i === undefined) return;
      var abbr = clienteAbbr(p.cliente);
      if (p.estado === 'aprobada') {
        if (fTipo && p.tipo !== fTipo) return;
        aprobadas[i]++;
        detalles[i].aprobadas.set(abbr, (detalles[i].aprobadas.get(abbr) || 0) + 1);
      } else {
        rechazadas[i]++;
        detalles[i].rechazadas.set(abbr, (detalles[i].rechazadas.get(abbr) || 0) + 1);
      }
    });

    // Recorta períodos vacíos al inicio (deja al menos 4 visibles)
    while (periods.length > 4 && !aprobadas[0] && !rechazadas[0]) {
      periods.shift();
      aprobadas.shift();
      rechazadas.shift();
      detalles.shift();
    }
    var toSorted = function toSorted(m) {
      return _toConsumableArray(m.entries()).sort(function (a, b) {
        return b[1] - a[1];
      }).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          label = _ref2[0],
          value = _ref2[1];
        return {
          label: label,
          value: value
        };
      });
    };
    return {
      labels: periods.map(function (p) {
        return p.label;
      }),
      aprobadas: aprobadas,
      rechazadas: rechazadas,
      detalles: detalles.map(function (d) {
        return {
          aprobadas: toSorted(d.aprobadas),
          rechazadas: toSorted(d.rechazadas)
        };
      }),
      hasData: aprobadas.some(function (v) {
        return v;
      }) || rechazadas.some(function (v) {
        return v;
      })
    };
  };

  // --- Tarjeta de aprobación (estilo Trazailidad OP) ---
  var APROBACION_STYLE = {
    tolerancia: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-400'
    },
    autorizacion: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-400'
    },
    "default": {
      bg: 'bg-[#d9ead3]',
      text: 'text-[#3f7550]',
      border: 'border-[#3f7550]'
    }
  };
  var getAprobacionStyle = function getAprobacionStyle(tipo) {
    var t = tipo.toUpperCase();
    if (t.includes('TOLERANCIA')) return APROBACION_STYLE.tolerancia;
    if (t.includes('AUTORIZACION')) return APROBACION_STYLE.autorizacion;
    return APROBACION_STYLE["default"];
  };
  var AprobacionCard = function AprobacionCard(_ref3) {
    var r = _ref3.r;
    var tipo = clean(r.tipo_aprobacion);
    if (!tipo) return /*#__PURE__*/React.createElement("span", {
      className: "text-[#9ca3af] italic text-xs"
    }, "\u2014");
    var fecha = clean(r.fecha_aprobacion) || clean(r.calidad_fin);
    var quien = clean(r.quien_aprobo);
    var supervisor = clean(r.supervisor_aprobacion);
    var turno = clean(r.turno_aprobacion);
    var st = getAprobacionStyle(tipo);
    return /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-lg border-2 ".concat(st.border, " overflow-hidden shadow-sm")
    }, /*#__PURE__*/React.createElement("div", {
      className: "".concat(st.bg, " ").concat(st.text, " font-bold text-[13px] px-1.5 py-0.5 text-center border-b-2 ").concat(st.border, " uppercase tracking-wide")
    }, tipo), /*#__PURE__*/React.createElement("div", {
      className: "px-1.5 py-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-center gap-1.5 mb-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[13px] text-black whitespace-nowrap"
    }, fecha || '—'), quien && /*#__PURE__*/React.createElement("span", {
      className: "bg-[#4f8f62] text-white font-bold px-1.5 py-px rounded text-[13px] uppercase whitespace-nowrap"
    }, quien)), /*#__PURE__*/React.createElement("hr", {
      className: "border-t border-[#e3ecd9] mb-1"
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-center gap-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[13px] text-black uppercase truncate",
      title: supervisor
    }, supervisor || '—'), /*#__PURE__*/React.createElement("span", {
      className: "text-[13px] text-black whitespace-nowrap"
    }, turno || ''))));
  };

  // --- Iconos SVG ---
  var Icon = function Icon(_ref4) {
    var d = _ref4.d,
      _ref4$size = _ref4.size,
      size = _ref4$size === void 0 ? 18 : _ref4$size;
    return /*#__PURE__*/React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, d);
  };
  var IconSearch = function IconSearch() {
    return /*#__PURE__*/React.createElement(Icon, {
      d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
        cx: "11",
        cy: "11",
        r: "8"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "21",
        y1: "21",
        x2: "16.65",
        y2: "16.65"
      }))
    });
  };
  var IconRefresh = function IconRefresh() {
    return /*#__PURE__*/React.createElement(Icon, {
      d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
        d: "M3 12a9 9 0 0 1 15-6.7L21 8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 3v5h-5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 12a9 9 0 0 1-15 6.7L3 16"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M3 21v-5h5"
      }))
    });
  };
  var IconPrint = function IconPrint() {
    return /*#__PURE__*/React.createElement(Icon, {
      d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
        points: "6 9 6 2 18 2 18 9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
      }), /*#__PURE__*/React.createElement("rect", {
        x: "6",
        y: "14",
        width: "12",
        height: "8"
      }))
    });
  };
  var IconChart = function IconChart() {
    return /*#__PURE__*/React.createElement(Icon, {
      d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
        d: "M3 3v18h18"
      }), /*#__PURE__*/React.createElement("rect", {
        x: "7",
        y: "12",
        width: "3",
        height: "6"
      }), /*#__PURE__*/React.createElement("rect", {
        x: "12",
        y: "8",
        width: "3",
        height: "10"
      }), /*#__PURE__*/React.createElement("rect", {
        x: "17",
        y: "5",
        width: "3",
        height: "13"
      }))
    });
  };
  var STATUS_META = {
    aprobada: {
      label: 'Aprobada',
      dot: '#16a34a',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    rechazada: {
      label: 'Rechazada',
      dot: '#dc2626',
      cls: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    evaluacion: {
      label: 'En evaluación',
      dot: '#d39b36',
      cls: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  };

  // --- Modal de tendencia: Aprobadas vs Rechazadas por período (js/chart_tendencia.js) ---
  var ChartModal = function ChartModal(_ref5) {
    var records = _ref5.records,
      onClose = _ref5.onClose;
    var _useState = useState('semanas'),
      _useState2 = _slicedToArray(_useState, 2),
      mode = _useState2[0],
      setMode = _useState2[1]; // 'meses' | 'semanas'
    var _useState3 = useState('count'),
      _useState4 = _slicedToArray(_useState3, 2),
      vMode = _useState4[0],
      setVMode = _useState4[1]; // 'count' (123) | 'percent' (%)
    var _useState5 = useState(''),
      _useState6 = _slicedToArray(_useState5, 2),
      fCli = _useState6[0],
      setFCli = _useState6[1]; // '' = todos los clientes
    var _useState7 = useState(''),
      _useState8 = _slicedToArray(_useState7, 2),
      fTipo = _useState8[0],
      setFTipo = _useState8[1]; // '' = todos los tipos de aprobación
    var canvasRef = useRef(null);
    var chartRef = useRef(null);
    var partidas = useMemo(function () {
      return buildPartidasGrafica(records);
    }, [records]);
    var clientes = useMemo(function () {
      return _toConsumableArray(new Set(partidas.map(function (p) {
        return p.cliente;
      }))).sort();
    }, [partidas]);
    var tiposAprob = useMemo(function () {
      return _toConsumableArray(new Set(partidas.filter(function (p) {
        return p.estado === 'aprobada' && p.tipo;
      }).map(function (p) {
        return p.tipo;
      }))).sort();
    }, [partidas]);
    var chartData = useMemo(function () {
      return _objectSpread(_objectSpread({}, buildChartData(partidas, mode, fCli, fTipo)), {}, {
        valueMode: vMode,
        labelAprobadas: fTipo ? "Aprobadas \xB7 ".concat(fTipo) : 'Aprobadas'
      });
    }, [partidas, mode, fCli, fTipo, vMode]);

    // Cerrar con tecla Escape
    useEffect(function () {
      var onKey = function onKey(e) {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', onKey);
      return function () {
        return window.removeEventListener('keydown', onKey);
      };
    }, [onClose]);

    // Crear / recrear el gráfico al cambiar datos, modo o cliente
    useEffect(function () {
      if (!canvasRef.current || !window.Chart || !window.ChartTendencia) return;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      if (chartData.hasData) {
        chartRef.current = window.ChartTendencia.render(canvasRef.current, chartData);
      }
      return function () {
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
      };
    }, [chartData]);
    return /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden",
      onClick: onClose
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-xl shadow-2xl w-full max-w-[1100px] max-h-[90vh] flex flex-col overflow-hidden",
      onClick: function onClick(e) {
        return e.stopPropagation();
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between gap-3 px-5 py-3 border-b border-[#c8d8bd] bg-[#dfeccd]"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "text-base font-extrabold text-[#3f7550]"
    }, "Aprobaciones y rechazos por per\xEDodo"), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("select", {
      value: fTipo,
      onChange: function onChange(e) {
        return setFTipo(e.target.value);
      },
      title: "Filtrar la serie de Aprobadas por tipo de aprobaci\xF3n (Rechazadas se muestra completa)",
      className: "px-2 py-1 text-xs font-bold border border-[#4f8f62] rounded-md bg-white text-[#3f7550] outline-none focus:ring-2 focus:ring-[#4f8f62]/20 max-w-[200px]"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Todos los tipos"), tiposAprob.map(function (t) {
      return /*#__PURE__*/React.createElement("option", {
        key: t,
        value: t
      }, t);
    })), /*#__PURE__*/React.createElement("select", {
      value: fCli,
      onChange: function onChange(e) {
        return setFCli(e.target.value);
      },
      title: "Ver la tendencia de un solo cliente",
      className: "px-2 py-1 text-xs font-bold border border-[#4f8f62] rounded-md bg-white text-[#3f7550] outline-none focus:ring-2 focus:ring-[#4f8f62]/20 max-w-[180px]"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Todos los clientes"), clientes.map(function (c) {
      return /*#__PURE__*/React.createElement("option", {
        key: c,
        value: c
      }, c);
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex rounded-md overflow-hidden border border-[#4f8f62]"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setVMode('count');
      },
      title: "Ver n\xFAmero de partidas",
      className: "px-3 py-1 text-xs font-bold transition-colors ".concat(vMode === 'count' ? 'bg-[#4f8f62] text-white' : 'bg-white text-[#3f7550] hover:bg-[#eef5e8]')
    }, "123"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setVMode('percent');
      },
      title: "Ver % de participaci\xF3n dentro de cada per\xEDodo",
      className: "px-3 py-1 text-xs font-bold transition-colors ".concat(vMode === 'percent' ? 'bg-[#4f8f62] text-white' : 'bg-white text-[#3f7550] hover:bg-[#eef5e8]')
    }, "%")), /*#__PURE__*/React.createElement("div", {
      className: "flex rounded-md overflow-hidden border border-[#4f8f62]"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setMode('meses');
      },
      className: "px-3 py-1 text-xs font-bold transition-colors ".concat(mode === 'meses' ? 'bg-[#4f8f62] text-white' : 'bg-white text-[#3f7550] hover:bg-[#eef5e8]')
    }, "Meses"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setMode('semanas');
      },
      className: "px-3 py-1 text-xs font-bold transition-colors ".concat(mode === 'semanas' ? 'bg-[#4f8f62] text-white' : 'bg-white text-[#3f7550] hover:bg-[#eef5e8]')
    }, "Semanas")), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      title: "Cerrar",
      className: "flex items-center justify-center w-8 h-8 rounded-md bg-white border border-[#c8d8bd] hover:bg-rose-50 text-[#3f7550] text-lg"
    }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
      className: "p-5 flex-1 overflow-auto"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[12px] text-[#667466] mb-1"
    }, vMode === 'percent' ? /*#__PURE__*/React.createElement(React.Fragment, null, "Cada punto muestra el ", /*#__PURE__*/React.createElement("b", null, "% de participaci\xF3n"), " dentro del per\xEDodo (Aprobadas y Rechazadas suman 100%).") : /*#__PURE__*/React.createElement(React.Fragment, null, "El porcentaje sobre cada per\xEDodo es el ", /*#__PURE__*/React.createElement("b", null, "nivel de rechazo"), " (partidas rechazadas \xF7 partidas auditadas)."), fTipo && /*#__PURE__*/React.createElement(React.Fragment, null, " El filtro de tipo aplica solo a las Aprobadas; Rechazadas muestra el total."), ' ', "Pase el cursor sobre los puntos para ver el detalle por cliente."), /*#__PURE__*/React.createElement("div", {
      className: "relative",
      style: {
        height: '58vh',
        minHeight: '360px'
      }
    }, /*#__PURE__*/React.createElement("canvas", {
      ref: canvasRef
    }), !chartData.hasData && /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 flex items-center justify-center text-[#667466]"
    }, "No hay datos para graficar.")))));
  };
  function App() {
    var _useState9 = useState([]),
      _useState0 = _slicedToArray(_useState9, 2),
      records = _useState0[0],
      setRecords = _useState0[1];
    var _useState1 = useState(true),
      _useState10 = _slicedToArray(_useState1, 2),
      loading = _useState10[0],
      setLoading = _useState10[1];
    var _useState11 = useState(''),
      _useState12 = _slicedToArray(_useState11, 2),
      error = _useState12[0],
      setError = _useState12[1];
    var _useState13 = useState(''),
      _useState14 = _slicedToArray(_useState13, 2),
      search = _useState14[0],
      setSearch = _useState14[1];
    var _useState15 = useState(''),
      _useState16 = _slicedToArray(_useState15, 2),
      fCliente = _useState16[0],
      setFCliente = _useState16[1];
    var _useState17 = useState(''),
      _useState18 = _slicedToArray(_useState17, 2),
      fTipoTela = _useState18[0],
      setFTipoTela = _useState18[1];
    // '' = todas (aprobadas y rechazadas); las "en evaluación" ya no se listan
    var _useState19 = useState(''),
      _useState20 = _slicedToArray(_useState19, 2),
      fEstado = _useState20[0],
      setFEstado = _useState20[1];
    var _useState21 = useState(''),
      _useState22 = _slicedToArray(_useState21, 2),
      fMotivo = _useState22[0],
      setFMotivo = _useState22[1];
    var _useState23 = useState(false),
      _useState24 = _slicedToArray(_useState23, 2),
      showChart = _useState24[0],
      setShowChart = _useState24[1];
    var loadData = /*#__PURE__*/function () {
      var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var force,
          raw,
          parsed,
          recs,
          _args = arguments,
          _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              force = _args.length > 0 && _args[0] !== undefined ? _args[0] : false;
              setLoading(true);
              setError('');
              // Mostrar al instante lo cacheado, luego refrescar desde el servidor.
              if (!force) {
                try {
                  raw = localStorage.getItem(LOCAL_STORAGE_KEY);
                  if (raw) {
                    parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length) setRecords(parsed);
                  }
                } catch (e) {/* ignore */}
              }
              _context.p = 1;
              _context.n = 2;
              return window.DataAPI.loadTintoreriaRecords();
            case 2:
              recs = _context.v;
              setRecords(recs);
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recs));
              } catch (e) {/* quota */}
              _context.n = 4;
              break;
            case 3:
              _context.p = 3;
              _t = _context.v;
              console.error('[trazabilidad_op] Error cargando datos:', _t);
              if (records.length === 0) setError('No se pudieron cargar los datos. Verifique su conexión y vuelva a intentar.');
            case 4:
              _context.p = 4;
              setLoading(false);
              return _context.f(4);
            case 5:
              return _context.a(2);
          }
        }, _callee, null, [[1, 3, 4, 5]]);
      }));
      return function loadData() {
        return _ref6.apply(this, arguments);
      };
    }();
    useEffect(function () {
      loadData(false);
    }, []);

    // ── Filtros en cascada ──────────────────────────────────────────────
    // Cada desplegable ofrece solo valores con datos bajo los DEMÁS filtros
    // activos (p. ej. con Motivo=QUEBRADURAS, Cliente solo lista clientes
    // con partidas de ese motivo). Si un valor seleccionado se queda sin
    // datos (p. ej. tras refrescar), se conserva en la lista para poder
    // verlo y quitarlo.
    var passesBase = function passesBase(r) {
      return isAprobada(r) || getMotivos(r).length > 0;
    };
    var passCliente = function passCliente(r) {
      return !fCliente || normalizeCliente(clean(r.cliente)) === fCliente;
    };
    var passTipoTela = function passTipoTela(r) {
      return !fTipoTela || clean(r.tipo_tela) === fTipoTela;
    };
    var passEstado = function passEstado(r) {
      return !fEstado || getEstado(r) === fEstado;
    };
    var passMotivo = function passMotivo(r) {
      return !fMotivo || getMotivos(r).some(function (m) {
        return m.toUpperCase() === fMotivo.toUpperCase();
      });
    };
    var clientes = useMemo(function () {
      var set = new Set(records.filter(function (r) {
        return passesBase(r) && passTipoTela(r) && passEstado(r) && passMotivo(r);
      }).map(function (r) {
        return normalizeCliente(clean(r.cliente));
      }).filter(Boolean));
      if (fCliente) set.add(fCliente);
      return _toConsumableArray(set).sort();
    }, [records, fCliente, fTipoTela, fEstado, fMotivo]);
    var tiposTela = useMemo(function () {
      var set = new Set(records.filter(function (r) {
        return passesBase(r) && passCliente(r) && passEstado(r) && passMotivo(r);
      }).map(function (r) {
        return clean(r.tipo_tela);
      }).filter(Boolean));
      if (fTipoTela) set.add(fTipoTela);
      return _toConsumableArray(set).sort();
    }, [records, fCliente, fTipoTela, fEstado, fMotivo]);
    var estadosDisponibles = useMemo(function () {
      var set = new Set(records.filter(function (r) {
        return passesBase(r) && passCliente(r) && passTipoTela(r) && passMotivo(r);
      }).map(getEstado));
      if (fEstado) set.add(fEstado);
      return set;
    }, [records, fCliente, fTipoTela, fEstado, fMotivo]);
    var motivosDisponibles = useMemo(function () {
      var presentes = new Set();
      records.filter(function (r) {
        return passesBase(r) && passCliente(r) && passTipoTela(r) && passEstado(r);
      }).forEach(function (r) {
        return getMotivos(r).forEach(function (m) {
          return presentes.add(m.toUpperCase());
        });
      });
      var lista = MOTIVOS_CATALOGO.filter(function (m) {
        return presentes.has(m.toUpperCase());
      });
      if (fMotivo && !lista.some(function (m) {
        return m.toUpperCase() === fMotivo.toUpperCase();
      })) lista.push(fMotivo);
      return lista;
    }, [records, fCliente, fTipoTela, fEstado, fMotivo]);
    var filtered = useMemo(function () {
      var q = search.trim().toLowerCase();
      return records.filter(function (r) {
        // Solo partidas con datos en Motivos de Rechazo o Tipo Aprobación;
        // las "en evaluación" (sin ninguno de los dos) no se muestran.
        if (!passesBase(r)) return false;
        if (!passCliente(r) || !passTipoTela(r) || !passEstado(r) || !passMotivo(r)) return false;
        if (!q) return true;

        // Búsqueda "OP-Partida" estricta cuando hay guion
        if (q.includes('-')) {
          var _q$split$map = q.split('-').map(function (s) {
              return s.trim();
            }),
            _q$split$map2 = _slicedToArray(_q$split$map, 2),
            op = _q$split$map2[0],
            ptda = _q$split$map2[1];
          return clean(r.op_tela).toLowerCase().includes(op) && clean(r.partida).toLowerCase().includes(ptda);
        }
        var haystack = [r.op_tela, r.partida, r.color, r.cliente, r.cod_art, r.articulo, r.tipo_aprobacion, r.supervisor_aprobacion].concat(_toConsumableArray(getMotivos(r))).map(clean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }, [records, search, fCliente, fTipoTela, fEstado, fMotivo]);

    // Orden de la tabla: lo más reciente arriba, según la última fecha de
    // aprobación o rechazo registrada. Empates conservan el orden de la hoja.
    var sorted = useMemo(function () {
      return filtered.map(function (r, i) {
        return {
          r: r,
          i: i,
          t: getFechaRef(r)
        };
      }).sort(function (a, b) {
        return b.t - a.t || a.i - b.i;
      }).map(function (x) {
        return x.r;
      });
    }, [filtered]);

    // Pintado tipo "zebra" agrupado por OP-Partida: las filas con la misma
    // OP-Partida comparten color y el tono solo cambia al cambiar de OP-Partida.
    var rowShade = useMemo(function () {
      var g = 0;
      var prev = null;
      return sorted.map(function (r) {
        var key = "".concat(clean(r.op_tela), "-").concat(clean(r.partida));
        if (prev !== null && key !== prev) g++;
        prev = key;
        return g % 2;
      });
    }, [sorted]);
    var homeHref = window.AppRouter.href('home');
    return /*#__PURE__*/React.createElement("div", {
      className: "traz-op-root min-h-screen bg-[#f4f7ef] text-black",
      style: {
        fontFamily: 'Arial, sans-serif'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "print:hidden bg-white border-b border-[#c8d8bd] shadow-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "max-w-[1500px] mx-auto px-5 py-3 flex items-center gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-[#4f8f62] text-white w-9 h-9 rounded-lg flex items-center justify-center shadow shrink-0"
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 20,
      d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
        d: "M3 3v18h18"
      }), /*#__PURE__*/React.createElement("rect", {
        x: "7",
        y: "13",
        width: "3",
        height: "5"
      }), /*#__PURE__*/React.createElement("rect", {
        x: "12",
        y: "9",
        width: "3",
        height: "9"
      }), /*#__PURE__*/React.createElement("rect", {
        x: "17",
        y: "6",
        width: "3",
        height: "12"
      }))
    })), /*#__PURE__*/React.createElement("h1", {
      className: "text-base text-[#3f7550] truncate"
    }, "Trazabilidad OP-Partida T-ACABADA")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 shrink-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative w-[180px]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#4f8f62] pointer-events-none"
    }, /*#__PURE__*/React.createElement(IconSearch, null)), /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: search,
      onChange: function onChange(e) {
        setSearch(e.target.value);
        if (e.target.value) setFEstado('');
      },
      placeholder: "OP / cliente\u2026",
      title: "Buscar por OP-Partida / cliente / color / art\xEDculo / motivo",
      className: "w-full pl-8 pr-2 py-1.5 text-xs border border-[#c8d8bd] rounded-md bg-white outline-none focus:border-[#4f8f62] focus:ring-2 focus:ring-[#4f8f62]/20"
    })), /*#__PURE__*/React.createElement("select", {
      value: fCliente,
      onChange: function onChange(e) {
        return setFCliente(e.target.value);
      },
      title: "Filtrar por cliente",
      className: "px-2 py-1.5 text-xs border border-[#c8d8bd] rounded-md bg-white outline-none focus:border-[#4f8f62] w-[110px]"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Cliente"), clientes.map(function (c) {
      return /*#__PURE__*/React.createElement("option", {
        key: c,
        value: c
      }, c);
    })), /*#__PURE__*/React.createElement("select", {
      value: fTipoTela,
      onChange: function onChange(e) {
        return setFTipoTela(e.target.value);
      },
      title: "Filtrar por tipo de tela",
      className: "px-2 py-1.5 text-xs border border-[#c8d8bd] rounded-md bg-white outline-none focus:border-[#4f8f62] w-[150px]"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Tipo tela"), tiposTela.map(function (t) {
      return /*#__PURE__*/React.createElement("option", {
        key: t,
        value: t
      }, tipoTelaDisplay(t));
    })), /*#__PURE__*/React.createElement("select", {
      value: fEstado,
      onChange: function onChange(e) {
        return setFEstado(e.target.value);
      },
      title: "Filtrar por estado",
      className: "px-2 py-1.5 text-xs border border-[#c8d8bd] rounded-md bg-white outline-none focus:border-[#4f8f62] w-[110px]"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Estado"), estadosDisponibles.has('aprobada') && /*#__PURE__*/React.createElement("option", {
      value: "aprobada"
    }, "Aprobadas"), estadosDisponibles.has('rechazada') && /*#__PURE__*/React.createElement("option", {
      value: "rechazada"
    }, "Rechazadas")), /*#__PURE__*/React.createElement("select", {
      value: fMotivo,
      onChange: function onChange(e) {
        return setFMotivo(e.target.value);
      },
      title: "Filtrar por motivo de rechazo (busca en todos los motivos de la partida)",
      className: "px-2 py-1.5 text-xs border border-[#c8d8bd] rounded-md bg-white outline-none focus:border-[#4f8f62] w-[150px]"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Motivo rechazo"), motivosDisponibles.map(function (m) {
      return /*#__PURE__*/React.createElement("option", {
        key: m,
        value: m
      }, m);
    })), /*#__PURE__*/React.createElement("div", {
      className: "w-px h-6 bg-[#c8d8bd]"
    }), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return loadData(true);
      },
      disabled: loading,
      className: "flex items-center justify-center bg-[#4f8f62] hover:bg-[#3f7550] disabled:opacity-50 text-white w-9 h-9 rounded-md transition-colors shadow-sm"
    }, /*#__PURE__*/React.createElement(IconRefresh, null)), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setShowChart(true);
      },
      title: "Ver gr\xE1fica",
      className: "flex items-center justify-center bg-white border border-[#c8d8bd] hover:bg-[#eef5e8] text-[#3f7550] w-9 h-9 rounded-md transition-colors shadow-sm"
    }, /*#__PURE__*/React.createElement(IconChart, null)), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return window.print();
      },
      disabled: filtered.length === 0,
      className: "flex items-center justify-center bg-white border border-[#c8d8bd] hover:bg-[#eef5e8] disabled:opacity-50 text-[#3f7550] w-9 h-9 rounded-md transition-colors shadow-sm"
    }, /*#__PURE__*/React.createElement(IconPrint, null)), /*#__PURE__*/React.createElement("a", {
      href: homeHref,
      title: "Volver al men\xFA",
      className: "flex items-center justify-center w-9 h-9 bg-[#3f7550] hover:bg-[#2f5a3c] text-white rounded-md text-lg no-underline transition-colors shadow-sm"
    }, "\u2190")))), /*#__PURE__*/React.createElement("div", {
      className: "traz-op-wrap max-w-[1500px] mx-auto px-5 py-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "traz-op-card bg-white rounded-xl border border-[#c8d8bd] shadow-sm overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "traz-op-scroll overflow-x-hidden overflow-y-auto",
      style: {
        height: 'calc(100vh - 90px)'
      }
    }, /*#__PURE__*/React.createElement("table", {
      className: "w-full table-fixed border-collapse",
      style: {
        fontFamily: "'Calibri', 'Arial Narrow', Arial, sans-serif",
        fontSize: '13px',
        fontWeight: 'normal'
      }
    }, /*#__PURE__*/React.createElement("colgroup", null, /*#__PURE__*/React.createElement("col", {
      style: {
        width: '3.5%'
      }
    }), /*#__PURE__*/React.createElement("col", {
      style: {
        width: '5%'
      }
    }), /*#__PURE__*/React.createElement("col", {
      style: {
        width: '6%'
      }
    }), /*#__PURE__*/React.createElement("col", {
      style: {
        width: '3%'
      }
    }), /*#__PURE__*/React.createElement("col", {
      style: {
        width: '7.5%'
      }
    }), /*#__PURE__*/React.createElement("col", {
      style: {
        width: '24%'
      }
    }), /*#__PURE__*/React.createElement("col", {
      style: {
        width: '14%'
      }
    }), /*#__PURE__*/React.createElement("col", {
      style: {
        width: '9%'
      }
    })), /*#__PURE__*/React.createElement("thead", {
      className: "sticky top-0 z-10"
    }, /*#__PURE__*/React.createElement("tr", {
      className: "bg-[#dfeccd] text-[#3f7550] text-[13px] uppercase tracking-wide"
    }, /*#__PURE__*/React.createElement("th", {
      className: "px-3 py-2.5 text-center border border-[#4a4a4a]"
    }, "Cliente"), /*#__PURE__*/React.createElement("th", {
      className: "px-3 py-2.5 text-center border border-[#4a4a4a]"
    }, "OP-Ptda"), /*#__PURE__*/React.createElement("th", {
      className: "px-3 py-2.5 text-center border border-[#4a4a4a]"
    }, "Color"), /*#__PURE__*/React.createElement("th", {
      className: "px-3 py-2.5 text-center border border-[#4a4a4a]"
    }, "KG"), /*#__PURE__*/React.createElement("th", {
      className: "px-3 py-2.5 text-center border border-[#4a4a4a]"
    }, "C\xF3d. Art. / Art\xEDculo"), /*#__PURE__*/React.createElement("th", {
      className: "px-3 py-2.5 text-center border border-[#4a4a4a]"
    }, "Motivos de Rechazo"), /*#__PURE__*/React.createElement("th", {
      className: "px-3 py-2.5 text-center border border-[#4a4a4a]"
    }, "Tipo Aprobaci\xF3n"), /*#__PURE__*/React.createElement("th", {
      className: "px-3 py-2.5 text-center border border-[#4a4a4a]"
    }, "Observaci\xF3n"))), /*#__PURE__*/React.createElement("tbody", null, loading && records.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      colSpan: "8",
      className: "px-6 py-16 text-center text-[#667466]"
    }, "Cargando registros\u2026")) : error ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      colSpan: "8",
      className: "px-6 py-16 text-center text-rose-600 font-semibold"
    }, error)) : sorted.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      colSpan: "8",
      className: "px-6 py-16 text-center text-[#667466]"
    }, "Sin coincidencias. Ajuste la b\xFAsqueda o los filtros.")) : sorted.map(function (r, i) {
      var motivos = getMotivos(r);
      var estado = getEstado(r);
      var meta = STATUS_META[estado];
      var _splitCodArt = splitCodArt(r.cod_art),
        _splitCodArt2 = _slicedToArray(_splitCodArt, 2),
        codPrefix = _splitCodArt2[0],
        codTail = _splitCodArt2[1];
      return /*#__PURE__*/React.createElement("tr", {
        key: "".concat(clean(r.op_tela), "-").concat(clean(r.partida), "-").concat(i),
        className: "align-top hover:bg-[#eef5e8] transition-colors ".concat(rowShade[i] ? 'bg-[#f9fbf5]' : 'bg-white')
      }, /*#__PURE__*/React.createElement("td", {
        className: "px-3 py-2.5 border border-[#4a4a4a]"
      }, /*#__PURE__*/React.createElement("span", {
        className: "block text-[13px] text-black leading-snug",
        title: clean(r.cliente)
      }, clienteAbbr(r.cliente) || '—')), /*#__PURE__*/React.createElement("td", {
        className: "px-3 py-2.5 border border-[#4a4a4a]"
      }, /*#__PURE__*/React.createElement("span", {
        className: "block text-[13px] text-black leading-snug line-clamp-2 break-words font-bold"
      }, clean(r.op_tela) || '—', "-", clean(r.partida) || '—')), /*#__PURE__*/React.createElement("td", {
        className: "px-3 py-2.5 border border-[#4a4a4a]"
      }, /*#__PURE__*/React.createElement("span", {
        className: "block text-[13px] text-black leading-snug line-clamp-2 break-words",
        title: clean(r.color)
      }, clean(r.color) || '—')), /*#__PURE__*/React.createElement("td", {
        className: "px-3 py-2.5 text-right tabular-nums text-[13px] text-black border border-[#4a4a4a]"
      }, clean(r.peso_kg_crudo) || '—'), /*#__PURE__*/React.createElement("td", {
        className: "px-3 py-2.5 border border-[#4a4a4a]"
      }, /*#__PURE__*/React.createElement("span", {
        className: "block text-[13px] text-black leading-tight"
      }, codPrefix, /*#__PURE__*/React.createElement("span", {
        className: "text-rose-600 font-bold"
      }, codTail || '—')), /*#__PURE__*/React.createElement("span", {
        className: "block text-[13px] text-[#667466] uppercase leading-snug line-clamp-2 break-words",
        title: clean(r.articulo)
      }, clean(r.articulo) || 'Artículo sin especificar')), /*#__PURE__*/React.createElement("td", {
        className: "px-3 py-2.5 align-top border border-[#4a4a4a]"
      }, function () {
        var rechazos = getRechazosFull(r);
        if (rechazos.length === 0) return /*#__PURE__*/React.createElement("span", {
          className: "text-[#9ca3af] italic text-xs"
        }, "Sin rechazos");
        return /*#__PURE__*/React.createElement("div", {
          className: "rounded-lg border border-[#c8d8bd] overflow-hidden shadow-sm"
        }, rechazos.map(function (rec, k) {
          return /*#__PURE__*/React.createElement("div", {
            key: k,
            className: "grid items-center gap-x-2 px-2 py-1.5 ".concat(k > 0 ? 'border-t border-[#e3ecd9]' : '', " ").concat(k % 2 === 0 ? 'bg-white' : 'bg-[#f9fbf5]'),
            style: {
              gridTemplateColumns: '30px 142px auto 1fr'
            }
          }, /*#__PURE__*/React.createElement("span", {
            className: "text-[13px] text-[#3f7550] uppercase"
          }, rec.label), /*#__PURE__*/React.createElement("span", {
            className: "text-[13px] text-black"
          }, rec.fecha || '—'), /*#__PURE__*/React.createElement("span", {
            className: "bg-yellow-300 text-slate-900 font-bold px-2 py-0.5 rounded border border-yellow-400 text-[13px] uppercase whitespace-nowrap"
          }, rec.motivo), /*#__PURE__*/React.createElement("span", {
            className: "text-[13px] text-black uppercase truncate text-right",
            title: "".concat(rec.supervisor).concat(rec.turno ? " - ".concat(rec.turno) : '')
          }, rec.supervisor || '—', rec.turno ? " - ".concat(rec.turno) : ''));
        }));
      }()), /*#__PURE__*/React.createElement("td", {
        className: "px-3 py-2.5 align-top border border-[#4a4a4a]"
      }, /*#__PURE__*/React.createElement(AprobacionCard, {
        r: r
      })), /*#__PURE__*/React.createElement("td", {
        className: "px-3 py-2.5 align-top border border-[#4a4a4a]"
      }, /*#__PURE__*/React.createElement("span", {
        className: "block text-[13px] text-black leading-snug break-words"
      }, clean(r.observacion_calidad) || '')));
    })))))), showChart && /*#__PURE__*/React.createElement(ChartModal, {
      records: records,
      onClose: function onClose() {
        return setShowChart(false);
      }
    }));
  }
  var root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(/*#__PURE__*/React.createElement(App, null));
  }
})();
