import { Given, When, Then, After, Before, setDefaultTimeout } from '@cucumber/cucumber';
import { Page } from '@playwright/test';
import { EmailGenerator } from '../../utils/emailGenerator';
import * as fs from 'fs';
import { browser, context, page, setupBrowser, teardownBrowser } from '../support/browser';
import { SignupPage } from '../../pages/SignupPage';
import LoginPage from '../../pages/LoginPage';
import { VerificationPage } from '../../pages/VerificationPage';
import { setTestEmail } from './mfa-steps';

// Set default timeout to 60 seconds for all steps
setDefaultTimeout(60 * 1000);

// Export testEmail so it can be used in other step files
export let testEmail: string;
export let signupPage: SignupPage;
export let loginPage: LoginPage;
export let verificationPage: VerificationPage;

// Ensure screenshots directory exists
if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
}

// Initialize pages and ensure clean browser state before each scenario
Before('@setup', async function() {
    try {
        console.log('Setting up fresh browser instance...');
        // First tear down any existing browser
        await teardownBrowser().catch(e => console.log('Error in teardown:', e));
        
        // Wait a bit to ensure browser is fully closed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set up fresh browser instance
        const { page: newPage } = await setupBrowser();
        
        // Initialize page objects with fresh page instance
        signupPage = new SignupPage(newPage);
        loginPage = new LoginPage(newPage);
        verificationPage = new VerificationPage(newPage);
        
        console.log('Browser and page objects setup complete');
    } catch (error) {
        console.error('Error in Before hook:', error);
        throw error;
    }
});

// Clean up after each scenario
After(async function() {
    try {
        // Take screenshot if test failed
        if (this.result?.status === 'failed') {
            console.log('Test failed, capturing screenshot...');
            await page?.screenshot({ 
                path: `screenshots/failure-${Date.now()}.png`,
                fullPage: true 
            });
        }
        
        // Always perform cleanup
        console.log('Cleaning up browser state...');
        await teardownBrowser().catch(e => console.error('Error in final teardown:', e));
        
        // Add a small delay to ensure browser is fully closed
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error('Error in After hook:', error);
    }
});

Given('user clicks to the do not have an account button', async function() {
    try {
        console.log('Clicking signup link...');
        await signupPage.navigateToSignup();
    } catch (error) {
        console.error('Error clicking signup link:', error);
        throw error;
    }
});

Given('user generates a unique test email using EmailGenerator', function() {
    testEmail = EmailGenerator.generateTestEmail();
    // Share the email with other step files
    setTestEmail(testEmail);
    
    console.log('\n=== Starting Signup Test ===');
    console.log(`Generated Test Email: ${testEmail}`);
    console.log('This email will be used for signup and login');
});

When('user creates a new account with the following details', async function(dataTable) {
    const data = dataTable.rowsHash();
    await signupPage.fillSignupForm({
        organization: data.companyName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: testEmail,
        password: data.password,
        phoneNumber: data.phoneNumber
    });
    await signupPage.submitForm();
});

Then('user should see an email verification message', async function() {
    await signupPage.waitForVerificationMessage();
    console.log('✓ Signup form submitted successfully');
});

//Step 2: Activate account
When('user waits for the verification email', async function() {
    const activationLink = await verificationPage.waitForVerificationEmail(testEmail);
    if (!activationLink) {
        throw new Error('Activation email not found');
    }
    console.log('✓ Activation link received');
});

When('user clicks the activation link in the email', async function() {
    const activationLink = await verificationPage.waitForVerificationEmail(testEmail);
    if (!activationLink) {
        throw new Error('Activation link not found');
    }
    await signupPage.navigateToActivationLink(activationLink);
});

Then('user should see the account activation success message', async function() {
    const isSuccessful = await signupPage.isActivationSuccessful();
    if (!isSuccessful) {
        throw new Error('Account activation failed');
    }
    console.log('✓ Account activated successfully');
});

// End of signup steps

 