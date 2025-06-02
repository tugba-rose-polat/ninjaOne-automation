import { chromium } from '@playwright/test';
import { GmailHelper } from '../utils/GmailHelper';

async function activateAccount() {
    let browser = null;
    
    try {
        // Initialize Gmail helper
        const gmailHelper = new GmailHelper();
        
        // Search for activation email
        console.log('Looking for activation email...');
        const activationLink = await gmailHelper.findVerificationEmail('ninja.one.test01@gmail.com');
        
        if (!activationLink) {
            throw new Error('No activation link found in recent emails');
        }

        // Launch browser and activate account
        console.log('\nOpening activation link in browser...');
        browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();
        
        await page.goto(activationLink);
        await page.waitForLoadState('networkidle');
        
        // Wait for success message
        const successSelector = 'text=/Account activated|activation successful|verified successfully/i';
        await page.waitForSelector(successSelector, { timeout: 30000 });
        console.log('✓ Account activated successfully');
        
        // Take a screenshot for verification
        await page.screenshot({ path: 'activation-success.png' });
        console.log('Screenshot saved as activation-success.png');

        // Keep browser open for review
        await new Promise(() => {});

    } catch (error: any) {
        console.error('\nError:', error?.message || 'Unknown error occurred');
        if (browser) {
            await browser.close();
        }
    }
}

// Run the activation process
activateAccount().catch(error => {
    console.error('Unhandled error:', error?.message || 'Unknown error occurred');
}); 