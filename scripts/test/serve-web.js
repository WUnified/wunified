#!/usr/bin/env node
// Serves the web export for Playwright. Unknown paths fall back to index.html so a deep
// link like /login reaches the client-side router, as it would on a real host.

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const [directory, port] = process.argv.slice(2);
const root = path.resolve(directory);

const CONTENT_TYPES = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
};

function resolveFile(url) {
  try {
    const { pathname } = new URL(url, 'http://localhost');
    const requested = path.join(root, decodeURIComponent(pathname));
    const isInside = requested.startsWith(root + path.sep);
    if (isInside && fs.existsSync(requested) && fs.statSync(requested).isFile()) return requested;
  } catch {
    // A malformed URL gets the app, like any other unknown path.
  }
  return path.join(root, 'index.html');
}

http
  .createServer((request, response) => {
    const file = resolveFile(request.url);
    const stream = fs.createReadStream(file);
    stream.on('error', () => {
      response.writeHead(404);
      response.end(`Could not read ${file}. Has the app been exported?`);
    });
    stream.on('open', () => {
      const type = CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': type });
      stream.pipe(response);
    });
  })
  .listen(Number(port));
