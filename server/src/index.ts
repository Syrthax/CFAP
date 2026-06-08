import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

const server = Fastify({ logger: true });

await server.register(helmet);
await server.register(rateLimit, { max: 30, timeWindow: '1 minute' });
await server.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
});

server.get('/health', async () => ({ status: 'ok' }));

const port = Number(process.env.PORT ?? 3001);
await server.listen({ port, host: '127.0.0.1' });
