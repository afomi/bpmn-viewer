const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 3001;
const PROCESS_MODELS_DIR = path.join(__dirname, 'process-models');

const server = http.createServer((req, res) => {
  // API endpoint to list BPMN files
  if (req.url === '/api/files') {
    fs.readdir(PROCESS_MODELS_DIR, (err, files) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Could not read directory' }));
        return;
      }

      const bpmnFiles = files.filter(f => f.endsWith('.bpmn'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(bpmnFiles));
    });
    return;
  }

  // Serve BPMN files
  if (req.url.startsWith('/process-models/')) {
    const fileName = decodeURIComponent(path.basename(req.url));
    const filePath = path.join(PROCESS_MODELS_DIR, fileName);

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/xml' });
      res.end(data);
    });
    return;
  }

  // Serve static files
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
