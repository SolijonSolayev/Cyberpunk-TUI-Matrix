import express from 'express';
import {createServer as createHttpServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EnvHttpProxyAgent, setGlobalDispatcher} from 'undici';
import {generateOracle} from './server/oracle.mjs';

// Honor the cloud/session proxy and its inherited TLS trust.
setGlobalDispatcher(new EnvHttpProxyAgent());
const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createHttpServer(app);
app.disable('x-powered-by');
app.use(express.json({limit: '16kb'}));
// Bound concurrent upstream requests to protect a local developer's API quota.
let busy = false;
app.post('/api/oracle', async (req, res) => {
  if (busy) return res.status(429).json({error: 'AI band. Birozdan keyin urinib ko‘ring.'});
  busy = true;
  try {
    const result = await generateOracle(req.body?.question, {
      apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    });
    res.status(result.status).json(result.body);
  } finally { busy = false; }
});
app.get('/api/health', (_req, res) => res.json({ok: true, oracle: process.env.GEMINI_API_KEY ? 'configured' : 'offline'}));
if (process.argv.includes('--dev')) {
  const {createServer} = await import('vite');
  const vite = await createServer({root, server: {middlewareMode: true, hmr: {server: httpServer}}});
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(root, 'dist')));
}
app.use((error, _req, res, _next) => res.status(error.status || 500).json({error: 'So‘rovni bajarib bo‘lmadi.'}));
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 5173);
httpServer.on('error', error => { console.error(`Server startup failed: ${error.code || 'unknown error'}`); process.exit(1); });
httpServer.listen(port, host, () => console.log(`Cyberpunk TUI Matrix listening on ${host}:${port}`));
