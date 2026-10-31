import { defineConfig } from 'vite';
import { sourceArchive } from './scripts/source-archive';
export default defineConfig({
  plugins: [sourceArchive()],
  define: {
    'import.meta.env.VITE_BOTID_ENABLED': JSON.stringify(process.env.VERCEL === '1' ? 'true' : 'false')
  }
});
