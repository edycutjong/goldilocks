import { startGoldilocksProvider } from './provider';
import { makeClient, isMockMode } from '@edycutjong/croo-core';

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

  const client = isMockMode() ? {} : makeClient(sdkKey!);
  let isShuttingDown = false;
  
  // Track the active stream returned by startGoldilocksProvider
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let providerStream: any;

  const gracefulShutdown = async (signal: string, code: number = 0) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Lifecycle] Received ${signal}. Initiating graceful shutdown...`);
    
    try {
      if (providerStream && typeof providerStream.close === 'function') {
        console.log("[Lifecycle] Closing Croo SDK stream...");
        await providerStream.close();
      }
      console.log("[Lifecycle] Shutdown complete. Exiting process cleanly.");
      process.exit(code);
    } catch (err) {
      console.error("[Lifecycle] Error during shutdown:", err);
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
    console.log("✅ Goldilocks provider is online and listening for pricing requests.");
  } catch (error) {
    console.error("[Fatal] Failed to start Goldilocks provider:", error);
    process.exit(1);
  }
}

main();
