import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { GmailHelper } from '../utils/GmailHelper';
import dotenv from 'dotenv';

dotenv.config();

export interface SignupFormData {
    organization: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
}

export class SignupPage extends BasePage {
    private readonly gmailHelper: GmailHelper;
    
    constructor(page: Page) {
        super(page);
        this.gmailHelper = new GmailHelper();
    }

    async navigateToSignup() {
        console.log('Looking for signup link...');
        
        // Wait for page to load
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForSelector('form');
        
        // Wait for and click the signup link
        await this.page.waitForSelector('a:has-text("Do not have an account")', { state: 'visible' });
        await this.page.click('a:has-text("Do not have an account")');
        
        // Wait for navigation to complete
        await this.page.waitForLoadState('networkidle');
    }

    private async hasAnyElement(selectors: string[]): Promise<boolean> {
        for (const selector of selectors) {
            try {
                const element = await this.page.$(selector);
                if (element) {
                    return true;
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.log(`Error checking selector ${selector}:`, error.message);
                }
                continue;
            }
        }
        return false;
    }
    async fillSignupForm(data: SignupFormData) {
        console.log('Filling signup form...');
        await this.page.fill(this.selectors.organizationInput, data.organization);
        await this.page.fill(this.selectors.firstNameInput, data.firstName);
        await this.page.fill(this.selectors.lastNameInput, data.lastName);
        await this.page.fill(this.selectors.emailInput, data.email);
        await this.page.fill(this.selectors.passwordInput, data.password);
        await this.page.fill(this.selectors.passwordConfirmInput, data.password);
        await this.page.fill(this.selectors.phoneInput, data.phoneNumber);
    }

    async submitForm() {
        console.log('Submitting form...');
        await this.page.click(this.selectors.submitButton);
    }

    async waitForVerificationMessage() {
        console.log('Waiting for verification message...');
        await this.page.waitForSelector(this.selectors.verificationMessage);
    }

    async navigateToActivationLink(activationLink: string) {
        console.log('Going to activation link...');
        await this.page.goto(activationLink);
    }

    async isActivationSuccessful(): Promise<boolean> {
        console.log('Checking activation status...');
        for (const selector of this.selectors.activationSuccessMessage) {
            try {
                const element = await this.page.waitForSelector(selector, { timeout: 5000 });
                if (element) {
                    return true;
                }
            } catch (error) {
                continue;
            }
        }
        return false;
    }

    async waitForPageLoad() {
        console.log('Waiting for page to load...');
        try {
            // Wait for network requests to settle
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
            console.log('Network is idle');

            // Get current URL for debugging
            const currentUrl = await this.page.url();
            console.log('Current URL:', currentUrl);

            // Take a screenshot of the current state
            await this.takeScreenshot('page-load-state');

            // Wait for any common element to be visible
            const hasElements = await this.hasAnyElement(this.selectors.commonElements);
            if (!hasElements) {
                // Get page content for debugging
                const content = await this.page.content();
                console.log('Page content:', content);
                throw new Error('Could not verify page load with any known element');
            }
            console.log('Found page elements');

            // Additional wait for any animations to complete
            await this.page.waitForTimeout(2000);
        } catch (error) {
            console.error('Error waiting for page load:', error);
            await this.takeScreenshot('page-load-error');
            throw error;
        }
    }

    async verifyEmailAddress(email: string): Promise<boolean> {
        console.log('Starting email verification process...');
        
        // Wait for and find verification email
        const verificationLink = await this.gmailHelper.findVerificationEmail(email);
        if (!verificationLink) {
            console.error('Failed to find verification email');
            return false;
        }

        // Visit verification link
        console.log('Visiting verification link...');
        await this.page.goto(verificationLink);
        await this.page.waitForLoadState('networkidle');

        // Check if verification was successful
        try {
            await this.page.waitForSelector('text=Email verified successfully', { timeout: 10000 });
            console.log('Email verified successfully');
            return true;
        } catch (error) {
            console.error('Email verification failed:', error);
            return false;
        }
    }

    async getValidationError(field: string): Promise<string | null> {
        try {
            const errorSelector = `.validation-error[data-field="${field}"], .validation-error:near(:text("${field}"))`;
            const errorElement = await this.page.$(errorSelector);
            if (errorElement) {
                return await errorElement.textContent();
            }
            return null;
        } catch (error) {
            console.error(`Error getting validation error for ${field}:`, error);
            return null;
        }
    }

    async hasValidationError(field: string): Promise<boolean> {
        const error = await this.getValidationError(field);
        return error !== null;
    }

    async isSignupSuccessful(): Promise<boolean> {
        try {
            // Wait for an element that indicates successful signup
            await this.page.waitForSelector('text=Welcome to NinjaOne', { timeout: 30000 });
            return true;
        } catch (error) {
            console.error('Failed to verify successful signup:', error);
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
} 