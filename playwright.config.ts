import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', workers: 1,
  use: {baseURL: 'http://127.0.0.1:5180', headless: true,
    launchOptions: process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}},
  webServer: {command: 'npm start', url: 'http://127.0.0.1:5180/api/health', reuseExistingServer: false,
    env: {PORT: '5180', HOST: '127.0.0.1', GEMINI_API_KEY: ''}}
});
