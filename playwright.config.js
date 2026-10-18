import { defineConfig } from '@playwright/test';

// Smoke E2E: sobe o servidor estático e usa um LanguageModel simulado (ver e2e/smoke.spec.js)
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:8080',
    viewport: { width: 1280, height: 900 },
    // RECORD=1 grava vídeo para gerar o GIF do README
    video: process.env.RECORD ? 'on' : 'off'
  },
  webServer: {
    command: 'npx http-server . -p 8080 -c-1 --silent',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 60_000
  }
});
