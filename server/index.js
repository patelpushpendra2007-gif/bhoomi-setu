import 'dotenv/config';
import app from './app.js';

const BASE_PORT = Number(process.env.PORT || 3050);

function listenWithFallback(port) {
  const srv = app.listen(port, () => {
    console.log('\n======================================================================');
    console.log('  BHOOMI-SETU (भूमि-सेतु) v3.0 — FULL-STACK GOVTECH ECOSYSTEM');
    console.log(`  Portal Login : http://localhost:${port}/login`);
    console.log(`  API Health   : http://localhost:${port}/api/health`);
    console.log('======================================================================\n');
  });

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < BASE_PORT + 10) {
      listenWithFallback(port + 1);
    } else {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
  });
}

listenWithFallback(BASE_PORT);
