$ErrorActionPreference = 'Stop'

$viewFiles = @(
    'js/trazabilidad.js',
    'js/principales_defectos.js',
    'js/defecto_maquina.js',
    'js/produccion_articulo.js',
    'js/defectos_inspeccion.js',
    'js/registro_terceros.js',
    'js/hoja_evaluacion_textil.js'
)

$outputDir = Join-Path $PSScriptRoot 'js\view_sources'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
Add-Type -AssemblyName System.Web.Extensions
$serializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

foreach ($file in $viewFiles) {
    $absolute = Join-Path $PSScriptRoot $file
    $source = [System.IO.File]::ReadAllText($absolute, [System.Text.Encoding]::UTF8)
    $targetName = [System.IO.Path]::GetFileNameWithoutExtension($file) + '.source.js'
    $target = Join-Path $outputDir $targetName
    $content = 'window.__VIEW_SOURCE__ = ' + $serializer.Serialize($source) + ';'
    [System.IO.File]::WriteAllText($target, $content, $utf8NoBom)
}

Write-Host 'view_sources regenerado correctamente.'
