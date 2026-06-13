import { startGoldilocksProvider } from './provider';
import { makeClient, isMockMode } from '@edycutjong/croo-core';
import * as http from 'http';

async function main() {
  console.log("Starting Agent Pricing Oracle (Goldilocks)...");

  const sdkKey = process.env.CROO_SDK_KEY;
  const serviceId = process.env.GOLDILOCKS_SERVICE_ID;

  if (!sdkKey && !isMockMode()) {
    console.error('CRITICAL: Missing CROO_SDK_KEY. Set it or use CROO_MOCK=true for offline mode.');
    process.exit(1);
  }

  if (!serviceId) {
    console.error('CRITICAL: Missing GOLDILOCKS_SERVICE_ID.');
    process.exit(1);
  }

  // 1. Initialize PaaS Health-Check Server (Satisfies Railway/Render/Fly.io/Heroku)
  const port = process.env.PORT || 8080;
  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'goldilocks', timestamp: new Date().toISOString() }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  healthServer.listen(port, () => {
    console.log(`[Lifecycle] 🩺 Health check server bound to port ${port}`);
  });

  const client = isMockMode() ? {} : makeClient(sdkKey!);
  let isShuttingDown = false;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let providerStream: any;

  // 2. Hardened Teardown Sequence
  const gracefulShutdown = async (signal: string, code: number = 0) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Lifecycle] 🛑 Received ${signal}. Initiating graceful shutdown...`);
    
    try {
      healthServer.close(() => {
        console.log("[Lifecycle] 🩺 Health check server stopped.");
      });

      if (providerStream && typeof providerStream.close === 'function') {
        console.log("[Lifecycle] 🔌 Closing Croo SDK WebSocket stream...");
        await providerStream.close();
      }
      
      console.log("[Lifecycle] ✅ Shutdown complete. Exiting process cleanly.");
      process.exit(code);
    } catch (err) {
      console.error("[Lifecycle] ❌ Error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION', 1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] Unhandled Rejection:', reason);
    gracefulShutdown('UNHANDLED_REJECTION', 1);
  });

  try {
    providerStream = await startGoldilocksProvider(client, serviceId);
    console.log("✅ Goldilocks provider is online, connected to Base Mainnet, and listening for pricing requests.");
  } catch (error) {
    console.error("[Fatal] Failed to start Goldilocks provider:", error);
    gracefulShutdown('STARTUP_FAILURE', 1);
  }
}

main();
