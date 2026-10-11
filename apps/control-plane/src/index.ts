import { createControlPlaneApp } from './app.js';

const PORT = Number(process.env.CONTROL_PLANE_PORT ?? 4000);
const app = await createControlPlaneApp({ logger: true });
await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`control-plane on :${PORT}`);
