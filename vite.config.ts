import { defineConfig } from 'vite';
import { sourceArchive } from './scripts/source-archive';
export default defineConfig({
  plugins: [sourceArchive()],
  server: {headers: {'Cross-Origin-Opener-Policy':'same-origin', 'Cross-Origin-Embedder-Policy':'credentialless'}},
  preview: {headers: {'Cross-Origin-Opener-Policy':'same-origin', 'Cross-Origin-Embedder-Policy':'credentialless'}},
  define: {
    'import.meta.env.VITE_BOTID_ENABLED': JSON.stringify(process.env.VERCEL === '1' ? 'true' : 'false')
  }
});
