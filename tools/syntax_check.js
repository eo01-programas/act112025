// Verificación rápida de sintaxis: compila el archivo sin ejecutarlo.
const fs = require("fs");
const vm = require("vm");
const file = process.argv[2];
try {
    new vm.Script(fs.readFileSync(file, "utf8"), { filename: file });
    fs.writeSync(1, "SINTAXIS OK: " + file + "\n");
} catch (e) {
    fs.writeSync(2, "ERROR: " + e.message + "\n");
    process.exit(1);
}
