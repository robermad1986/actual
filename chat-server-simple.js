// Servidor de chat simple integrado
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  // Health check
  if (req.method === 'GET' && parsedUrl.pathname === '/api/ai/chat/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'actual-ai-chat',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
      }),
    );
    return;
  }

  // Chat endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/api/ai/chat') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { message, context } = JSON.parse(body);

        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required' }));
          return;
        }

        // Respuesta de ejemplo mejorada con el contexto disponible
        const response = {
          message: `He analizado tu consulta: "${message}". ${context && context.accounts ? `Veo que tienes ${context.accounts.length} cuentas configuradas.` : ''} ¿En qué puedo ayudarte específicamente con tus finanzas?`,
          actions: [
            {
              type: 'create_transaction',
              title: 'Crear Transacción',
              description: 'Crear una nueva transacción basada en tu consulta',
            },
            {
              type: 'analyze_spending',
              title: 'Analizar Gastos',
              description: 'Revisar patrones de gastos recientes',
            },
          ],
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 404 para otras rutas
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.CHAT_PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple AI Chat Server running on port ${PORT}`);
  console.log(`📍 Chat endpoint: http://localhost:${PORT}/api/ai/chat`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/ai/chat/health`);
});

module.exports = server;
