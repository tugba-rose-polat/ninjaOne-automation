import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { authenticator } from 'otplib';
import * as fs from 'fs';
import * as path from 'path';

interface Secrets {
    [key: string]: string;
}

export default class LoginPage extends BasePage {
    // Selectors
    private readonly emailInput = [
        '[name="email"]',
        'input[type="email"]',
        '#email',
        'input[placeholder*="email" i]',
        'input[id*="email" i]'
    ];
    private readonly passwordInput = [
        '[name="password"]',
        'input[type="password"]',
        '#password',
        'input[placeholder*="password" i]',
        'input[id*="password" i]'
    ];
    private readonly loginButton = [
        'button[type="submit"]',
        'button:has-text("Sign in")',
        'button:has-text("Log in")',
        'button:has-text("Login")',
        '[type="submit"]'
    ];
    private readonly totpInput = '[name="totpCode"], [name="code"], input[type="text"]';
    private readonly verifyButton = 'button[type="submit"], button:has-text("Submit"), button:has-text("Verify")';
    private readonly loginButtonOnMFAPage = 'button[type="submit"]';
    private readonly clickMFAMethod = 'text="Select MFA method..."';
    private readonly secretKey = '//div[@class="m-l-xs"]';
    private readonly clickAuthenticatorApp = 'text="Authenticator App"';
    private readonly loginForm = 'form';    
    private readonly mfaSetupTitle = 'h1:has-text("MFA Setup"), h2:has-text("MFA Setup"), .mfa-setup-title, text="MFA Setup"';
    private readonly mfaDropdownContainer = '.css-2b097c-container, [id*="select"]';
    private readonly mfaDropdownControl = '.css-yk16xz-control, [class*="select-control"]';
    private readonly mfaSetupForm = 'form';
    private readonly mfaOptionAuthApp = '[class*="select-option"]:has-text("Authenticator App"), [class*="select__option"]:has-text("Authenticator App")';
    private readonly mfaPlaceholder = '[class*="select-placeholder"], [class*="select__placeholder"]';
    private readonly successMessage = '.success-message, .alert-success';
    private readonly continueButton = 'button:has-text("Continue"), button:has-text("Finish"), button:has-text("Done"), button:has-text("Next")';
    private readonly confirmButton = 'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Submit")';
    private readonly errorMessage = '.error-message, .alert-error, .error, .alert-danger';
    private readonly setupCompleteMessage = 'text="MFA setup complete", text="Setup successful", text="MFA has been configured", text="Setup complete"';
    private readonly qrCodeImage = 'img[src^="data:image/png;base64,"]';
    private readonly totpKeyElement = 'pre, code, .key, .secret-key';
    private readonly dashboardHeader = '[data-testid="dashboard-header"]';
    private readonly welcomeMessage = 'h1:has-text("Get Started")';
    private readonly mainNavigation = '.sidebar';
    private readonly userMenu = '.user-profile';
    private readonly getStartedPage = '[data-testid="get-started"]';
    private readonly totpInput1 = '[name="totpCode"]';
    private readonly totpInput2 = '[name="totpCodeSecondary"]';
    private readonly signInButton = 'button:has-text("Sign In")';
    private readonly userMenuButton = '//*[@data-testid="data-ninja-tooltip-trigger"]//button[@id="radix-2"]';
    private readonly logoutButton = '//button[@role="menuitem" and .//span[contains(text(), "Logout")]]';
    private readonly logoutButton2 = '//button[@type= "button"]//span[contains(text(), "Logout")]';

    private readonly secretsFile = 'mfa_secrets.json';

    constructor(page: Page) {
        super(page);
    }

    private async saveSecret(email: string, secret: string) {
        try {
            // Create or load existing secrets
            let secrets: Secrets = {};
            if (fs.existsSync(this.secretsFile)) {
                const data = fs.readFileSync(this.secretsFile, 'utf8');
                secrets = JSON.parse(data);
            }

            // Add or update secret
            secrets[email] = secret;

            // Save back to file
            fs.writeFileSync(this.secretsFile, JSON.stringify(secrets, null, 2));
            console.log(`Saved TOTP secret for ${email}`);
        } catch (error) {
            console.error('Error saving TOTP secret:', error);
            throw error;
        }
    }

    private async getSecret(email: string): Promise<string | null> {
        try {
            if (fs.existsSync(this.secretsFile)) {
                const data = fs.readFileSync(this.secretsFile, 'utf8');
                const secrets: Secrets = JSON.parse(data);
                const secret = secrets[email];
                if (secret) {
                    console.log(`Found saved TOTP secret for ${email}`);
                    return secret;
                }
            }
            return null;
        } catch (error) {
            console.error('Error reading TOTP secret:', error);
            return null;
        }
    }

    private generateTOTPCode(secret: string): string {
        try {
            const code = authenticator.generate(secret);
            console.log('Generated TOTP code:', code);
            return code;
        } catch (error) {
            console.error('Error generating TOTP code:', error);
            throw error;
        }
    }

    async navigate() {
        console.log('Navigating to login page...');
        await this.page.goto('https://app.ninjarmm.com/auth/#/login');
        await this.page.waitForSelector('form');
        
        // Clear storage after page load
        await this.page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            indexedDB.deleteDatabase('ninja');
            
            // Clear any other storage
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            });
        });
    }

    async waitForPageLoad() {
        console.log('Waiting for page to load...');
        
        try {
        // Wait for network requests to settle
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
            await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
            
            // Log current URL and page content for debugging
        const currentUrl = await this.page.url();
        console.log('Current URL:', currentUrl);
            
            const pageContent = await this.page.content();
            console.log('Page content:', pageContent);

        // Take screenshot for debugging
        await this.takeScreenshot('page-loaded');
            
            // Wait for login form with increased timeout
            await this.page.waitForSelector(this.loginForm, { 
                state: 'visible',
                timeout: 30000
            });
            
            console.log('Login form found');
        } catch (error) {
            console.error('Error waiting for page load:', error);
            await this.takeScreenshot('page-load-error');
            throw error;
        }
    }

    async login(email: string, password: string) {
        console.log('Logging in...');
        await this.page.fill('[name="email"]', email);
        await this.page.fill('[name="password"]', password);
        await this.page.click(this.loginButtonOnMFAPage);
    }

    async verifyDashboardAccess(): Promise<boolean> {
        try {
            console.log('Verifying dashboard access...');
            
            // Wait for network requests to settle
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);

            // Log current URL
            const currentUrl = await this.page.url();
            console.log('Current URL:', currentUrl);

            // Take a screenshot for debugging
            await this.takeScreenshot('dashboard-verification');

            // Check if we're on the Get Started page
            if (currentUrl.includes('/getStarted')) {
                console.log('Successfully verified - on Get Started page');
                    return true;
            }

            // Check if we're still on login or MFA pages
            const isLoginPage = await this.page.isVisible(this.loginForm).catch(() => false);
            const isMFAPage = await this.page.isVisible(this.mfaSetupTitle).catch(() => false);

            if (isLoginPage || isMFAPage) {
                throw new Error('Still on login/MFA page after verification');
            }

            // If we're not on login/MFA pages, we're probably logged in
            return true;

        } catch (error) {
            console.error('Dashboard verification failed:', error);
            await this.takeScreenshot('dashboard-verification-error');
            throw error;
        }
    }

    async enterMFACode(email: string) {
        try {
            console.log('Entering MFA codes...');
            const secret = await this.getSecret(email);
            if (!secret) throw new Error('No saved TOTP secret found');
            
            // Generate and enter first code
            const code = this.generateTOTPCode(secret);
            console.log('Entering first MFA code...');
            await this.page.fill(this.totpInput1, code);
            await this.page.click(this.loginButtonOnMFAPage);
            
            // Wait for the second code input
            await this.page.waitForLoadState('networkidle');
            
            // Wait for 30 seconds to get a new TOTP code
            console.log('Waiting 30 seconds for new TOTP code...');
            await this.page.waitForTimeout(30000);
            
            // Generate and enter second code
            console.log('Entering second MFA code...');
            const secondCode = this.generateTOTPCode(secret);
            console.log(`First code was: ${code}, second code is: ${secondCode}`);
            await this.page.fill(this.totpInput2, secondCode);
            await this.page.click(this.loginButtonOnMFAPage);
            
            // Wait for navigation after submitting codes
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            
            // Final wait for navigation
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
        } catch (error) {
            console.error('Error entering MFA codes:', error);
            await this.page.screenshot({ path: 'screenshots/mfa-codes-error.png' });
            throw error;
        }
    }

    async isLoggedIn(): Promise<boolean> {
        try {
            return await this.verifyDashboardAccess();
        } catch (error) {
            console.error('Login verification failed:', error);
            return false;
        }
    }

    async isOnMFASetupPage(): Promise<boolean> {
        try {
            console.log('Checking for MFA setup page...');
            
            // Wait for network requests to settle
            await this.page.waitForLoadState('networkidle');
            
            // Log current URL
            const currentUrl = await this.page.url();
            console.log('Current URL during MFA check:', currentUrl);

            // Take screenshot for debugging
            await this.page.screenshot({ path: 'screenshots/mfa-setup-check.png' });

            // Check for the specific MFA setup text
            const expectedText = 'Your account requires you to configure at least one form of MFA. Please select a PRIMARY MFA method below.';
            const textExists = await this.page.evaluate((text) => {
                const elements = document.querySelectorAll('*');
                for (const element of elements) {
                    if (element.textContent?.includes(text)) {
                        return true;
                    }
                }
                return false;
            }, expectedText);

            if (textExists) {
                console.log('Found expected MFA setup text');
                return true;
            }

            // If specific text not found, check for other MFA setup indicators
            const setupElements = [
                'text=MFA Setup',
                'text=Two-Factor Authentication',
                'text=2FA Setup',
                '[data-testid="mfa-setup"]',
                this.mfaDropdownContainer,
                this.mfaSetupForm
            ];

            for (const selector of setupElements) {
                try {
                    const element = await this.page.waitForSelector(selector, { timeout: 5000 });
                    if (element) {
                        console.log('Found MFA setup element:', selector);
                        return true;
                    }
                } catch (e) {
                    console.log('Selector not found:', selector);
                    continue;
                }
            }

            // Get page content for debugging if no elements found
            const pageContent = await this.page.content();
            console.log('Page content:', pageContent);

            console.log('MFA setup page elements not found');
            return false;
        } catch (error) {
            console.error('Error checking MFA setup page:', error);
            return false;
        }
    }

    protected async waitAndFill(selector: string, value: string) {
        await this.page.waitForSelector(selector, { state: 'visible' });
        await this.page.fill(selector, value);
    }

    protected async waitAndClick(selector: string) {
        await this.page.waitForSelector(selector, { state: 'visible' });
        await this.page.click(selector);
    }

    async selectMFAMethod(method: 'authenticator' | 'sms') {
        console.log('Selecting authenticator app...');
        await this.page.click(this.clickMFAMethod);
        await this.page.click(this.clickAuthenticatorApp);
    }

    async saveMFASecret(email: string) {
        try {
            console.log('Attempting to save MFA secret...');
            
            // Wait for the page to be ready
            await this.page.waitForLoadState('networkidle');
            
            // Use the provided XPath selector
            const element = await this.page.waitForSelector(this.secretKey);
            if (!element) {
                throw new Error('Could not find MFA secret element');
            }

            const secret = await element.textContent();
            if (!secret) {
                throw new Error('Could not extract MFA secret text');
            }

            // Clean up the secret (remove any whitespace/newlines)
            const cleanSecret = secret.trim();
            console.log('Successfully found MFA secret');

            await this.saveSecret(email, cleanSecret);
            console.log('Successfully saved MFA secret');
        } catch (error) {
            console.error('Error in saveMFASecret:', error);
            // Take a screenshot for debugging
            await this.page.screenshot({ path: 'screenshots/mfa-secret-error.png' });
            throw error;
        }
    }

    async verifyText(expectedText: string): Promise<boolean> {
        try {
            // Simple check for MFA setup text
            const mfaTexts = ['MFA Setup', 'Two-Factor Authentication', '2FA Setup'];
            for (const text of mfaTexts) {
                try {
                    const element = await this.page.waitForSelector(`text="${text}"`, { timeout: 5000 });
                    if (element) return true;
                } catch (error) {
                    continue;
                }
            }
            return false;
        } catch (error) {
            console.error('Error verifying text:', error);
            return false;
        }
    }

    async verifyExistingUserMFA(email: string) {
        try {
            console.log('Verifying MFA for existing user...');
            
            // Get the saved TOTP secret
            const secret = await this.getSecret(email);
            if (!secret) {
                throw new Error(`No saved TOTP secret found for ${email}`);
            }
            console.log(`Found saved TOTP secret for ${email}`);
            
            // Generate TOTP code
            const code = this.generateTOTPCode(secret);
            console.log('Generated TOTP code:', code);
            
            // Take screenshot before entering code
            await this.page.screenshot({ path: 'screenshots/before-mfa-code.png' });
            
            // Wait for and fill the authentication code input
            console.log('Waiting for code input field...');
            const inputSelector = '[name="code"], [name="totpCode"], input[type="text"]';
            await this.page.waitForSelector(inputSelector, {
                state: 'visible',
                timeout: 30000
            });
            console.log('Filling code input field...');
            await this.page.fill(inputSelector, code);

            // Wait for 2 seconds before clicking the button
            await this.page.waitForTimeout(2000);

            // Click verify button
            console.log('Clicking verify button...');
            const verifySelector = 'button[type="submit"], button:has-text("Verify"), button:has-text("Submit")';
            await this.page.click(verifySelector);

            // Wait for navigation
            console.log('Waiting for navigation...');
            await this.page.waitForLoadState('networkidle', { timeout: 30000 });
            await this.page.waitForTimeout(5000);

            // Take screenshot for debugging
            await this.page.screenshot({ path: 'screenshots/after-existing-user-mfa.png' });

            // Check for success by looking for multiple possible URLs
            const currentUrl = await this.page.url();
            console.log('Current URL after MFA verification:', currentUrl);

            const validUrls = [
                '/getStarted',
                '/dashboard',
                '/home',
                '/welcome'
            ];

            const isValidUrl = validUrls.some(path => currentUrl.includes(path));
            if (!isValidUrl) {
                console.error('Failed to reach a valid page after MFA verification');
                await this.page.screenshot({ path: 'screenshots/existing-user-mfa-failed.png' });
                throw new Error('Failed to reach a valid page after MFA verification');
            }

            console.log('Successfully verified MFA for existing user');
            return true;

        } catch (error) {
            console.error('Error verifying existing user MFA:', error);
            await this.page.screenshot({ path: 'screenshots/existing-user-mfa-error.png' });
            throw error;
        }
    }

    async loginExistingUser(email: string, password: string) {
        try {
            console.log('Starting existing user login process...');
            console.log(`Attempting to login with email: ${email}`);
            
            // Try multiple selectors for email input
            for (const emailSelector of this.emailInput) {
                try {
                    const emailElement = await this.page.waitForSelector(emailSelector, { 
                        state: 'visible',
                        timeout: 5000 
                    });
                    if (emailElement) {
                        console.log(`Found email input with selector: ${emailSelector}`);
                        await emailElement.fill(email);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            // Try multiple selectors for password input
            for (const passwordSelector of this.passwordInput) {
                try {
                    const passwordElement = await this.page.waitForSelector(passwordSelector, { 
                        state: 'visible',
                        timeout: 5000 
                    });
                    if (passwordElement) {
                        console.log(`Found password input with selector: ${passwordSelector}`);
                        await passwordElement.fill(password);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            // Try multiple selectors for login button
            for (const buttonSelector of this.loginButton) {
                try {
                    const buttonElement = await this.page.waitForSelector(buttonSelector, { 
                        state: 'visible',
                        timeout: 5000 
                    });
                    if (buttonElement) {
                        console.log(`Found login button with selector: ${buttonSelector}`);
                        await buttonElement.click();
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            // Wait for navigation
            console.log('Waiting for navigation...');
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            
            // Log current URL
            const currentUrl = await this.page.url();
            console.log('Current URL after login:', currentUrl);

            // Check if we're on the MFA verification page or any valid post-login page
            const validPaths = ['/mfa', '/auth', '/dashboard', '/home', '/welcome', '/getStarted'];
            if (!validPaths.some(path => currentUrl.includes(path))) {
                throw new Error('Not redirected to a valid post-login page');
            }

            console.log('Successfully logged in');
            return true;
            
        } catch (error) {
            console.error('Existing user login error:', error);
            await this.takeScreenshot('existing-user-login-error');
            throw error;
        }
    }

    async logout() {
        console.log('Logging out...');
        await this.page.click(this.userMenuButton);
        await this.page.click(this.logoutButton);
        await this.page.click(this.logoutButton2);
    }
} 