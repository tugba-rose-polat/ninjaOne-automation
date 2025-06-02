import { When, Then, Given } from '@cucumber/cucumber';
import { page } from '../support/browser';
import { loginPage } from './signup-steps';
import { testEmail as signupEmail } from './signup-steps';

const hardcodedEmail = 'ninja.one.test01+325@gmail.com';

Given('user navigates to the NinjaOne login page', async function () {
    try {
        console.log('Navigating to NinjaOne...');
        await loginPage.navigate();
    } catch (error) {
        console.error('Error during navigation:', error);
        throw error;
    }
});

When('user logs in with the email and password', async function () {
    try {
        console.log('Starting login process...');
        console.log('Using email from signup:', signupEmail);
        await loginPage.navigate();
        await loginPage.login(signupEmail, 'TestPassword123!');
    } catch (error) {
        console.error('Error during login:', error);
        await page?.screenshot({
            path: `screenshots/login-error-${Date.now()}.png`,
            fullPage: true
        });
        throw error;
    }
});

Given('existing user logs in with the email and password', async function (dataTable) {
    try {
        console.log('Starting existing user login process...');
        const data = dataTable.hashes()[0];
        const email = data.email;
        const password = data.password;
        console.log('Using email:', email);
        await loginPage.navigate();
        await loginPage.loginExistingUser(email, password);
    } catch (error) {
        console.error('Error during existing user login:', error);
        await page?.screenshot({
            path: `screenshots/existing-user-login-error-${Date.now()}.png`,
            fullPage: true
        });
        throw error;
    }
});

When('user enters the MFA code for existing user', async function () {
    try {
        console.log('Entering MFA code for existing user...');
        await loginPage.verifyExistingUserMFA(hardcodedEmail);
        console.log('Entered MFA code for existing user');
    } catch (error) {
        console.error('Error entering MFA code for existing user:', error);
        throw error;
    }
});

When('user enters the generated MFA code', async function () {
    try {
        console.log('Entering MFA code for signup user...');
        await loginPage.enterMFACode(signupEmail);
        console.log('Entered MFA code for signup user');
    } catch (error) {
        console.error('Error entering MFA code:', error);
        throw error;
    }
});

Then('user should be successfully logged in', async function () {
    try {
        console.log('Verifying successful login...');
        const isLoggedIn = await loginPage.isLoggedIn();
        if (!isLoggedIn) {
            throw new Error('Login verification failed');
        }
        console.log('Successfully verified login');
    } catch (error) {
        console.error('Error verifying login:', error);
        throw error;
    }
});

Then('user should be redirected to the MFA setup page', async function () {
    try {
        const isMFASetup = await loginPage.isOnMFASetupPage();
        if (!isMFASetup) {
            throw new Error('Not redirected to MFA setup page');
        }
        console.log('Successfully redirected to MFA setup page');
    } catch (error) {
        console.error('Error verifying MFA setup page:', error);
        throw error;
    }
});

When('user selects Authenticator App as the MFA method', async function () {
    try {
        await loginPage.selectMFAMethod('authenticator');
        console.log('Selected Authenticator App as MFA method');
    } catch (error) {
        console.error('Error selecting MFA method:', error);
        throw error;
    }
});

When('user saves the MFA secret for future use', async function () {
    try {
        console.log('Saving MFA secret for email:', signupEmail);
        await loginPage.saveMFASecret(signupEmail);
        console.log('Saved MFA secret for future use');
    } catch (error) {
        console.error('Error saving MFA secret:', error);
        throw error;
    }
});

Then('user should see the first-time MFA setup message', async function () {
    try {
        console.log('Checking for first-time MFA setup message...');

        // Wait for the specific text to appear
        const expectedText = 'Your account requires you to configure at least one form of MFA. Please select a PRIMARY MFA method below.';
        const textExists = await loginPage.verifyText(expectedText);

        if (!textExists) {
            throw new Error('First-time MFA setup message not found');
        }

        console.log('Found first-time MFA setup message');
    } catch (error) {
        console.error('Error verifying first-time MFA setup message:', error);
        throw error;
    }
});

Then('user logs out', async function () {
    try {
        console.log('Starting logout process...');
        await loginPage.logout();
        console.log('Successfully logged out');
    } catch (error) {
        console.error('Error during logout:', error);
        await page?.screenshot({
            path: `screenshots/logout-error-${Date.now()}.png`,
            fullPage: true
        });
        throw error;
    }
});