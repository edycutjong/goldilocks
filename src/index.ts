import { startGoldilocksProvider } from './provider';
import { makeClient, isMockMode } from '@edycutjong/croo-core';

async function main() {
  console.log("Starting Agent Pricing Oracle (Goldilocks)...");
  
  const sdkKey = process.env.CROO_SDK_KEY;
  const serviceId = process.env.GOLDILOCKS_SERVICE_ID;

  if (!sdkKey && !isMockMode()) {
    console.error('Missing CROO_SDK_KEY. Set it or use CROO_MOCK=true for offline mode.');
    process.exit(1);
  }

  if (!serviceId) {
    console.error('Missing GOLDILOCKS_SERVICE_ID.');
    process.exit(1);
  }

  const client = isMockMode() ? {} : makeClient(sdkKey!);

  try {
    await startGoldilocksProvider(client, serviceId);
    console.log("Goldilocks provider is online and listening for pricing requests.");
  } catch (error) {
    console.error("Failed to start Goldilocks provider:", error);
    process.exit(1);
  }
}

main();
