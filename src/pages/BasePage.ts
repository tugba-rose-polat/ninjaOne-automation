import { Page } from '@playwright/test';

export class BasePage {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
    }

    async takeScreenshot(name: string) {
        await this.page.screenshot({ 
            path: `screenshots/${name}.png`,
            fullPage: true 
        });
    }

    async waitForSelector(selector: string, timeout = 30000) {
        await this.page.waitForSelector(selector, { 
            state: 'visible', 
            timeout 
        });
    }

    async click(selector: string) {
        await this.waitForSelector(selector);
        await this.page.click(selector);
    }

    async fill(selector: string, value: string) {
        await this.waitForSelector(selector);
        await this.page.fill(selector, value);
    }

    async getText(selector: string): Promise<string | null> {
        await this.waitForSelector(selector);
        const element = await this.page.$(selector);
        return element ? element.textContent() : null;
    }

    async isVisible(selector: string, timeout = 5000): Promise<boolean> {
        try {
            await this.waitForSelector(selector, timeout);
            return true;
        } catch {
            return false;
        }
    }
} 