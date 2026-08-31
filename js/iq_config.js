const IQ_CONFIG = {
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbyDasMwI_A94gpo6goCHPIYfw2NsjPlgfNkMKf2klpIv_UGYaRMeh7X_OHCcPObmDZA/exec',
    LOCAL_STORAGE_KEY: 'tintoreria-records',
    // Thresholds for alert dots in the matrix (total defects per motivo column)
    ALERT_THRESHOLDS: { red: 10, orange: 5 },
    // Catálogo canónico de motivos — debe mantenerse sincronizado con
    // mobile_calidad/js/config.js → MOTIVOS_RECHAZO_OPTIONS
    MOTIVOS_RECHAZO: [
        'TONO', 'QUEBRADURAS', 'OTROS', 'MALA IGUALACIÓN', 'DEGRADÉ',
        'PILLING', 'MANCHAS', 'DENSIDAD BAJA/ELEVADA', 'SOLIDEZ',
        'LINEAS VERTICALES', 'CONTAMINACION', 'ESTABILIDAD DIMENSIONAL',
        'FIBRA MUERTA (NEPS)', 'FUERA DE MEDIDAS', 'RASPADURAS',
        'RESISTENCIA', 'TACTO'
    ]
};
