const PROJECT_CONFIG = {
    // Versión de la app: se usa como ?v= en los scripts de vista para que el
    // navegador los cachee entre visitas. SUBIR este valor en cada despliegue
    // (reemplaza al antiguo ?v=Date.now(), que anulaba la caché en cada carga).
    APP_VERSION: "2026-07-05-1",

    BASE_SHEET_HEADER_ROWS: 1,

    SOURCE: {
        SHEET_ID:            "1NVfMymJadfFuV5ROJB9ZamsCkXjM6hVRAz_Yku1ce_w",
        SHEET_NAME:          "base",
        TERCEROS_SHEET_NAME: "terceros",
        APPS_SCRIPT_URL:     "https://script.google.com/macros/s/AKfycbxp10Ax6faCXDHlOR-XzyU1nwZ_y4mgHfZMllkQH_LTnfbx2hzsz_e243KtStBgf13K/exec",
    },

    DESTINATION: {
        SHEET_ID:           "1U6AuWQgJY7SBMvbslRXVPRMe-VvrsaX23VgnfCmGL5I",
        SHEET_NAME:         "datos",
        ROLLOS_SHEET_NAME:  "rollos",
        APPS_SCRIPT_URL:    "https://script.google.com/macros/s/AKfycbykRbLmMvoXl5Qs5gB-_w501DNIMlucTZfYTqHqMv9uRdHYXAAvtSgNCzWKRRDA4WHLQA/exec",
    },

    // Indicadores de calidad (IQ) — acceso por AppScript API (no gviz).
    // Catálogo de motivos debe sincronizarse con mobile_calidad/js/config.js → MOTIVOS_RECHAZO_OPTIONS
    IQ: {
        WEB_APP_URL:       "https://script.google.com/macros/s/AKfycbyDasMwI_A94gpo6goCHPIYfw2NsjPlgfNkMKf2klpIv_UGYaRMeh7X_OHCcPObmDZA/exec",
        // Lectura rápida vía gviz de la misma hoja que alimenta el Web App
        // (la que usa modulo_principal). El Web App queda como respaldo.
        RECORDS_SHEET_ID:   "1xyHNMesThJLbYFSizH6xNjJcj2F_gy9lnlCDqwejFN0",
        RECORDS_SHEET_NAME: "Hoja 1",
        LOCAL_STORAGE_KEY: "tintoreria-records",
        ALERT_THRESHOLDS:  { red: 10, orange: 5 },
        MOTIVOS_RECHAZO: [
            'TONO', 'QUEBRADURAS', 'OTROS', 'MALA IGUALACIÓN', 'DEGRADÉ',
            'PILLING', 'MANCHAS', 'DENSIDAD BAJA/ELEVADA', 'SOLIDEZ',
            'LINEAS VERTICALES', 'CONTAMINACION', 'ESTABILIDAD DIMENSIONAL',
            'FIBRA MUERTA (NEPS)', 'FUERA DE MEDIDAS', 'RASPADURAS',
            'RESISTENCIA', 'TACTO'
        ],
    },
};

window.APP_CONFIG = {
    ...PROJECT_CONFIG,
    WEB_APP_URL:                  PROJECT_CONFIG.SOURCE.APPS_SCRIPT_URL,
    SOURCE_SHEET_ID:              PROJECT_CONFIG.SOURCE.SHEET_ID,
    SOURCE_SHEET_NAME:            PROJECT_CONFIG.SOURCE.SHEET_NAME,
    SOURCE_TERCEROS_SHEET_NAME:   PROJECT_CONFIG.SOURCE.TERCEROS_SHEET_NAME,
    SOURCE_APPS_SCRIPT_URL:       PROJECT_CONFIG.SOURCE.APPS_SCRIPT_URL,
    DESTINATION_SHEET_ID:         PROJECT_CONFIG.DESTINATION.SHEET_ID,
    DESTINATION_SHEET_NAME:       PROJECT_CONFIG.DESTINATION.SHEET_NAME,
    DESTINATION_APPS_SCRIPT_URL:  PROJECT_CONFIG.DESTINATION.APPS_SCRIPT_URL,
};

// Alias de compatibilidad para iq_data.js, iq_matrix.js, iq_filters.js, iq_auditor.js
// Estos archivos referencian IQ_CONFIG directamente sin prefijo window.
const IQ_CONFIG = window.APP_CONFIG.IQ;
