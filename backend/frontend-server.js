const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const rootDir = __dirname;
const port = 8080;

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

function safeResolve(requestPath) {
    const normalized = path.normalize(requestPath).replace(/^([/\\])+/, '');
    const resolved = path.join(rootDir, normalized);
    if (!resolved.startsWith(rootDir)) {
        return null;
    }
    return resolved;
}

function sendFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = decodeURIComponent(parsedUrl.pathname || '/');

    if (pathname === '/') {
        return sendFile(res, path.join(rootDir, 'index.html'));
    }

    if (pathname.startsWith('/api/')) {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: parsedUrl.path, // Use full path including query
            method: req.method,
            headers: req.headers
        };

        const proxyReq = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
        });

        proxyReq.on('error', (e) => {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Backend is not running. Please start the backend on port 3000." }));
        });

        req.pipe(proxyReq, { end: true });
        return;
    }

    const resolvedPath = safeResolve(pathname);
    if (!resolvedPath) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Bad request');
        return;
    }

    fs.stat(resolvedPath, (err, stats) => {
        if (!err && stats.isDirectory()) {
            return sendFile(res, path.join(resolvedPath, 'index.html'));
        }

        if (!err && stats.isFile()) {
            return sendFile(res, resolvedPath);
        }

        if (!path.extname(resolvedPath)) {
            const dirIndex = path.join(resolvedPath, 'index.html');
            if (fs.existsSync(dirIndex)) {
                return sendFile(res, dirIndex);
            }
        }

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
    });
});

server.listen(port, '127.0.0.1', () => {
    console.log(`Frontend server running at http://127.0.0.1:${port}`);
});
