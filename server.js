/* Servidor local de desenvolvimento.
   Serve os arquivos estáticos e executa as funções de /api exatamente
   como na Vercel, sem precisar de CLI nem login.

   Uso:  node server.js       (ou npm run dev)  ->  http://localhost:5500
*/
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5500;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

/** Carrega handlers de api/ (com res.status().json() no estilo Vercel). */
function runApi(handler, req, res, body) {
  req.body = body;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(data));
    return res;
  };
  try {
    handler(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Erro interno." });
  }
}

function readRaw(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => resolve(data));
  });
}

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end("404 — arquivo não encontrado");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  // ---- Rotas /api ----
  if (pathname.startsWith("/api/")) {
    const name = pathname.replace(/^\/api\//, "").replace(/\/$/, "");
    const file = path.join(ROOT, "api", `${name}.js`);
    if (!file.startsWith(path.join(ROOT, "api")) || !fs.existsSync(file)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ ok: false, error: "Rota de API não encontrada." }));
    }
    const raw = await readRaw(req);
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
    delete require.cache[require.resolve(file)];
    return runApi(require(file), req, res, body);
  }

  // ---- Estáticos ----
  if (pathname === "/") pathname = "/index.html";

  let filePath = path.join(ROOT, pathname);
  // Trava contra path traversal
  if (!filePath.startsWith(ROOT)) {
    res.statusCode = 403;
    return res.end("403");
  }

  // cleanUrls: /carrinho -> carrinho.html
  if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`\n  Farmácia Mais Que Popular — dev server`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  API: /api/coupon  ·  /api/order\n`);
});
