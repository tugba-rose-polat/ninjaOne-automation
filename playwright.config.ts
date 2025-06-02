import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: './tests',
    timeout: 120000,
    expect: {
        timeout: 30000,
    },
    retries: 1,
    workers: 1,
    use: {
        baseURL: 'https://app.ninjarmm.com',
        headless: true,
        viewport: { width: 1280, height: 720 },
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        actionTimeout: 30000,
        navigationTimeout: 30000,
    },
    reporter: [
        ['list'],
        ['html', { open: 'never' }]
    ],
    projects: [
        {
            name: 'Chrome',
            use: {
                browserName: 'chromium',
                channel: 'chrome',
            },
        }
    ],
};

export default config; 