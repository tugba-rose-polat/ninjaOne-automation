import { When, Then, Before } from '@cucumber/cucumber';
import { page } from '../support/browser';
import fs from 'fs';
import LoginPage from '../../pages/LoginPage';

// Declare testEmail variable
let testEmail: string;
let secretKey: string;
let loginPage: LoginPage;

// Initialize LoginPage in constructor
Before('@signup1', async function() {
    loginPage = new LoginPage(page);
});

// Function to set testEmail from other step files
export function setTestEmail(email: string) {
    testEmail = email;
    console.log('MFA Steps - Email set to:', testEmail);
}

// Function to get stored email
function getStoredEmail(): string {
    try {
        const emailData = JSON.parse(fs.readFileSync('test-email.json', 'utf8'));
        console.log('Retrieved stored email:', emailData.testEmail);
        return emailData.testEmail;
    } catch (error) {
        console.error('Error reading stored email:', error);
        return testEmail; // Fallback to memory stored email
    }
}

// MFA Setup Steps
When('user selects {string} as the MFA method', async function(method: string) {
    await page.click('.css-1hwfws3, [class*="select-placeholder"]');
    await page.click(`text=${method}`);
    await page.waitForLoadState('networkidle');
});

Then('user should see the MFA setup page with a secret key', async function() {
    await page.waitForSelector('pre, code, .key, .secret-key', {
        state: 'visible',
        timeout: 30000
    });
});

When('user saves the secret key for future use', async function() {
    const keyElement = await page.$('pre, code, .key, .secret-key');
    if (!keyElement) {
        throw new Error('Secret key element not found');
    }
    const keyText = await keyElement.textContent();
    if (!keyText) {
        throw new Error('Secret key text is empty');
    }
    const match = keyText.match(/[A-Z0-9]{16}/);
    if (!match) {
        throw new Error('Could not find valid secret key format');
    }
    secretKey = match[0];
});

When('user generates a TOTP code using the secret key', async function() {
    const { authenticator } = require('otplib');
    this.totpCode = authenticator.generate(secretKey);
});

When('user enters the TOTP code', async function() {
    await page.fill('[name="totpCode"], [name="code"], input[type="text"]', this.totpCode);
    await page.click('button[type="submit"]');
});

Then('user should be redirected to the {string} page', async function(pageName: string) {
    await page.waitForSelector(`h1:has-text("${pageName}")`, {
        state: 'visible',
        timeout: 30000
    });
});

Then('the secret key should be saved in `mfa_secrets.json` with the generated email', async function() {
    const secretsPath = 'mfa_secrets.json';
    let secrets: Record<string, string> = {};
    
    if (fs.existsSync(secretsPath)) {
        const data = fs.readFileSync(secretsPath, 'utf8');
        secrets = JSON.parse(data);
    }
    
    secrets[testEmail] = secretKey;
    fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));
}); 