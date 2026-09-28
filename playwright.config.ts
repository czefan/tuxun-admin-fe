import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:9528',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --mode mock --host 127.0.0.1 --port 9528 --strictPort --no-open',
    url: 'http://127.0.0.1:9528',
    reuseExistingServer: false,
    timeout: 120000,
    env: { VITE_AMAP_KEY: '', VITE_AMAP_SECURITY_JSCODE: '', VITE_HTTP_PROXY: 'N', VITE_BASE_URL: '/' }
  }
});
