import { createTenantApp } from './app.js';

const PORT = Number(process.env.TENANT_PORT ?? 4001);
const app = await createTenantApp({ logger: true });
await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`tenant on :${PORT}`);
