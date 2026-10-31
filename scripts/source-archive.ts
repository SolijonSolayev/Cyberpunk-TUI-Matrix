import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';

// Explicit allowlist: local .env files, credentials, caches and generated output
// can never be included in the browser's downloadable project.
export const sourceFiles = [
  '.gitignore', '.env.example', '.nvmrc', 'README.md', 'package.json', 'package-lock.json',
  'index.html', 'main.tsx', 'style.css', 'App.tsx', 'types.ts', 'constants.ts',
  'tsconfig.json', 'vite.config.ts', 'tailwind.config.cjs', 'postcss.config.cjs',
  'server.mjs', 'server/oracle.mjs', 'scripts/source-archive.ts',
  'lib/audio.ts', 'lib/tools.ts', 'tests/tools.spec.ts', 'tests/audio.spec.ts', 'lib/grid.ts', 'tests/grid.spec.ts', 'lib/source.ts', 'lib/oracle.ts', 'lib/download.ts',
  'components/BrowserWorkspace.tsx', 'lib/workspace.ts', 'tests/workspace.spec.ts', 'components/DownloadModal.tsx', 'components/GridMiniGame.tsx',
  'components/HackingPuzzle.tsx', 'components/HelpModal.tsx',
  'components/MatrixRainCanvas.tsx', 'components/TerminalHeader.tsx',
  'playwright.config.ts', 'tests/app.spec.ts', 'tests/oracle.test.mjs',
  'vercel.json', '.vercelignore',
  'api/oracle.js', 'api/health.js', 'tests/vercel.test.mjs'
];
// GitHub's template/import flow may omit workflows. They are useful metadata,
// but are not required to install or run the downloaded application.
const optionalSourceFiles = ['.github/workflows/ci.yml', '.github/workflows/eslint.yml'];

export function sourceArchive(): Plugin {
  let root: string;
  const archive = async () => {
    const required = await Promise.all(sourceFiles.map(async file =>
      [file, await fs.readFile(path.join(root, file), 'utf8')]
    ));
    const optional = await Promise.all(optionalSourceFiles.map(async file => {
      try {
        return [[file, await fs.readFile(path.join(root, file), 'utf8')]];
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
        throw error;
      }
    }));
    return Object.fromEntries([...required, ...optional.flat()]);
  };
  return {
    name: 'source-archive',
    configResolved(config) { root = config.root; },
    configureServer(server) {
      server.middlewares.use('/source-code.json', async (_req, res, next) => {
        try {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(await archive()));
        } catch (error) { next(error); }
      });
    },
    async generateBundle() {
      this.emitFile({type: 'asset', fileName: 'source-code.json', source: JSON.stringify(await archive())});
    }
  };
}
