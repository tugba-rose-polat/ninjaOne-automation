import { chromium, Browser, BrowserContext, Page } from '@playwright/test';

export let browser: Browser;
export let context: BrowserContext;
export let page: Page;

export async function setupBrowser() {
    try {
        // Only close existing browser if it exists
        if (browser) {
            await teardownBrowser();
        }

        const isHeadless = process.env.PLAYWRIGHT_HEADLESS !== 'false';
        console.log(`Launching browser in ${isHeadless ? 'headless' : 'headed'} mode`);

        // Launch new browser
        browser = await chromium.launch({ 
            headless: isHeadless,
            slowMo: 100
        });

        // Create new context with cleared state
        context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            // Clear all browser data
            storageState: undefined,
            // Additional context options for clean state
            acceptDownloads: true,
            ignoreHTTPSErrors: true,
            bypassCSP: true,
            // Clear permissions
            permissions: []
        });

        // Create new page
        page = await context.newPage();

        // Clear cookies and cache
        await context.clearCookies();
        if (page) {
            const session = await context.newCDPSession(page);
            await session.send('Network.clearBrowserCache');
            await session.send('Network.clearBrowserCookies');
        }

        return { browser, context, page };
    } catch (error) {
        console.error('Error setting up browser:', error);
        // If setup fails, ensure cleanup
        if (browser) {
            await teardownBrowser().catch(e => console.error('Cleanup after setup error:', e));
        }
        throw error;
    }
}

export async function teardownBrowser() {
    try {
        if (page) {
            try {
                // Clear cookies and cache
                const session = await context.newCDPSession(page);
                await session.send('Network.clearBrowserCache');
                await session.send('Network.clearBrowserCookies');
                await context.clearCookies();
            } catch (e) {
                console.log('Error clearing cache/cookies:', e);
            }

            // Close page
            await page.close().catch(e => console.log('Error closing page:', e));
        }

        if (context) {
            // Clear context-level data
            await context.clearPermissions().catch(e => console.log('Error clearing permissions:', e));
            await context.close().catch(e => console.log('Error closing context:', e));
        }

        if (browser) {
            await browser.close().catch(e => console.log('Error closing browser:', e));
        }

        // Reset variables
        page = null as unknown as Page;
        context = null as unknown as BrowserContext;
        browser = null as unknown as Browser;
    } catch (error) {
        console.error('Error tearing down browser:', error);
    }
} 