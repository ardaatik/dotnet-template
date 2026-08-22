import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const localDbConnection =
  'Server=localhost,1433;Database=server;User Id=sa;Password=Password1!;TrustServerCertificate=True';

const isCI = Boolean(process.env.CI);
const e2eFresh = Boolean(isCI || process.env.E2E_MODE);

/** Local browser: chrome (default, reliable headed) | firefox | chromium */
const localBrowser = process.env.E2E_BROWSER ?? 'chrome';
const headless = process.env.E2E_HEADLESS ? process.env.E2E_HEADLESS === 'true' : isCI;

function localBrowserUse() {
  switch (localBrowser) {
    case 'chrome':
      return { ...devices['Desktop Chrome'], channel: 'chrome' as const, headless };
    case 'chromium':
      return { ...devices['Desktop Chrome'], headless };
    case 'firefox':
    default:
      return { ...devices['Desktop Firefox'], headless };
  }
}

const testBrowserUse = isCI
  ? { ...devices['Desktop Chrome'], headless: true }
  : localBrowserUse();

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...testBrowserUse,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'e2e',
      dependencies: ['setup'],
      use: {
        storageState: path.join(__dirname, 'e2e/.auth/admin.json'),
      },
    },
  ],
  webServer: [
    {
      command:
        'dotnet run --project server/Server.Api/Server.Api.csproj --no-launch-profile --urls http://localhost:5050',
      url: 'http://localhost:5050/swagger/index.html',
      cwd: repoRoot,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ASPNETCORE_URLS: 'http://localhost:5050',
        ConnectionStrings__Database: localDbConnection,
        Jwt__ExpirationInMinutes: '60',
      },
      reuseExistingServer: !e2eFresh,
      timeout: 180_000,
    },
    {
      command: 'npm run dev -- --port 5174 --strictPort --mode e2e',
      url: 'http://localhost:5174',
      cwd: __dirname,
      env: {
        VITE_API_BASE_URL: 'http://localhost:5050',
      },
      reuseExistingServer: !e2eFresh,
      timeout: 120_000,
    },
  ],
});
