import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { sourceArchive } from './scripts/source-archive';
export default defineConfig({
  plugins: [sourceArchive()],
  resolve: {alias: {'@': fileURLToPath(new URL('.', import.meta.url))}},
  server: {headers: {'Cross-Origin-Opener-Policy':'same-origin', 'Cross-Origin-Embedder-Policy':'credentialless'}},
  preview: {headers: {'Cross-Origin-Opener-Policy':'same-origin', 'Cross-Origin-Embedder-Policy':'credentialless'}},
  define: {
    'import.meta.env.VITE_BOTID_ENABLED': JSON.stringify(process.env.VERCEL === '1' ? 'true' : 'false')
  }
});
