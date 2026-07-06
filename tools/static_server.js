// Servidor estático mínimo para pruebas locales (node tools/static_server.js [puerto]).
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PORT = parseInt(process.argv[2], 10) || 8123;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
};

http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
    if (!file.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end();
    }
    fs.readFile(file, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end("404 " + urlPath);
        }
        res.writeHead(200, {
            "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
            "Cache-Control": "no-cache",
        });
        res.end(data);
    });
}).listen(PORT, () => {
    fs.writeSync(1, `SIRVIENDO ${ROOT} en http://localhost:${PORT}\n`);
});
