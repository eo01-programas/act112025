/**
 * compile_jsx.js — Precompila una vista JSX a JavaScript plano.
 * -------------------------------------------------------------
 * Usa exactamente la misma configuración de Babel que app_bootstrap.js
 * aplicaba en el navegador, así el resultado es idéntico pero se genera
 * UNA sola vez aquí en lugar de en cada visita del usuario.
 *
 * Uso:
 *   node compile_jsx.js <entrada.js> <salida.js>
 *
 * Sin Node instalado, el runtime embebido de VS Code sirve igual
 * (ver compilar_vistas.cmd, que lo detecta automáticamente).
 */
const fs = require("fs");
const path = require("path");
const Babel = require(path.join(__dirname, "babel.min.js"));

const [, , inFile, outFile] = process.argv;
if (!inFile || !outFile) {
    console.error("Uso: node compile_jsx.js <entrada.js> <salida.js>");
    process.exit(1);
}

const source = fs.readFileSync(inFile, "utf8");

// sourceType "script" + runtime "classic": misma razón que en app_bootstrap.js,
// el resultado se inyecta como <script> normal (no módulo) y no debe contener
// sentencias `import`.
const compiled = Babel.transform(source, {
    sourceType: "script",
    presets: ["env", ["react", { runtime: "classic" }]],
}).code;

const header = [
    "// ARCHIVO GENERADO — NO EDITAR A MANO.",
    `// Fuente: js/${path.basename(inFile)}`,
    `// Generado: ${new Date().toISOString()} con tools/compile_jsx.js`,
    "// Si editas la fuente, regenera este archivo (ver tools/README.md).",
    "",
].join("\n");

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, header + compiled + "\n");
console.log(`OK: ${outFile} (${Math.round(compiled.length / 1024)} KB)`);
