import { defineConfig } from 'vite';
import { sourceArchive } from './scripts/source-archive';
export default defineConfig({plugins: [sourceArchive()]});
