const clients = new Set();

export function addSseClient(res, user) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ userId: user.id, role: user.role })}\n\n`);

  const client = { res, userId: user.id };
  clients.add(client);

  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
      clients.delete(client);
    }
  }, 25000);

  res.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(client);
  });
}

export function broadcastEvent(eventName, payload) {
  const line = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(line);
    } catch {
      clients.delete(client);
    }
  }
}
