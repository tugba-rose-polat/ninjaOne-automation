import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { GmailHelper } from '../utils/GmailHelper';

export class VerificationPage extends BasePage {
    private readonly gmailHelper: GmailHelper;

    constructor(page: Page) {
        super(page);
        this.gmailHelper = GmailHelper.getInstance();
    }

    async waitForVerificationEmail(email: string): Promise<string | null> {
        console.log('\n=== Waiting for Activation Email ===');
        // Wait for email to arrive
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Find verification email
        const activationLink = await this.gmailHelper.findVerificationEmail(email);
        if (!activationLink) {
            throw new Error('Activation email not found');
        }
        console.log('✓ Activation link received');
        return activationLink;
    }

    async activateAccount(activationLink: string): Promise<boolean> {
        console.log('\n=== Processing Account Activation ===');
        await this.page.goto(activationLink);
        await this.waitForPageLoad();
        await this.takeScreenshot('5-activation-page');

        const successSelectors = [
            'text=Account activated',
            'text=activation successful',
            'text=verified successfully',
            'text=Welcome to NinjaOne',
            '[data-testid="activation-success"]',
            'text=Your account has been activated',
            'text=Account verification successful',
            'text=Continue to login'
        ];

        for (const selector of successSelectors) {
            if (await this.isVisible(selector)) {
                await this.takeScreenshot('6-activation-success');
                console.log('✓ Account activated successfully');
                return true;
            }
        }

        console.error('Account activation failed');
        await this.takeScreenshot('activation-error');
        return false;
    }
} 