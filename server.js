const http = require('http');
const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function resolveSafePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const safePath = path.normalize(decoded).replace(/^([.][.][/\\])+/, '');
  const abs = path.join(ROOT, safePath);
  if (!abs.startsWith(ROOT)) return null;
  return abs;
}

async function serveFile(res, filePath) {
  try {
    const data = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    send(res, 200, data, { 'Content-Type': contentType });
  } catch {
    send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
}

async function handleBeraProxy(res) {
  const apiKey = process.env.METEOFRANCE_API_KEY;
  if (!apiKey) {
    send(
      res,
      500,
      JSON.stringify({ error: 'Server missing METEOFRANCE_API_KEY' }),
      { 'Content-Type': 'application/json; charset=utf-8' }
    );
    return;
  }

  try {
    const upstream = await fetch(
      'https://public-api.meteofrance.fr/public/DPBRA/v1/massif/BRA?id-massif=3&format=xml',
      { headers: { apikey: apiKey, accept: '*/*' } }
    );

    const xml = await upstream.text();
    send(res, upstream.status, xml, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store'
    });
  } catch {
    send(
      res,
      502,
      JSON.stringify({ error: 'Failed to fetch BERA upstream' }),
      { 'Content-Type': 'application/json; charset=utf-8' }
    );
  }
}

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (urlPath === '/api/bera') {
    await handleBeraProxy(res);
    return;
  }

  if (urlPath === '/legacy') {
    await serveFile(res, path.join(ROOT, 'index.legacy.html'));
    return;
  }

  if (urlPath === '/') {
    await serveFile(res, path.join(ROOT, 'index.html'));
    return;
  }

  const absPath = resolveSafePath(urlPath);
  if (!absPath) {
    send(res, 400, 'Bad Request', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  await serveFile(res, absPath);
});

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
