const { WebSocketServer } = require('ws');
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Estado inicial 27 módulos
const states = {};
for (let i = 1; i <= 27; i++) {
  states['M' + String(i).padStart(2,'0')] = 'green';
}

// Servidor HTTP — sirve panel.html
const server = http.createServer((req, res) => {
  fs.readFile(path.join(__dirname, 'panel.html'), (err, data) => {
    if (err) { res.writeHead(404); res.end('No encontrado'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

// WebSocket — sincroniza en tiempo real
const wss = new WebSocketServer({ server });

function broadcast(msg) {
  const json = JSON.stringify(msg);
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(json); });
}

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'init', states }));
  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'change' && states[msg.id] !== undefined) {
        states[msg.id] = msg.state;
        broadcast({ type: 'change', id: msg.id, state: msg.state });
      }
    } catch(e) {}
  });
});

server.listen(PORT, () => console.log('Servidor activo en puerto ' + PORT));
