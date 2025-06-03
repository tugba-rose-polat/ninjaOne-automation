import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { GaxiosError } from 'gaxios';
import open from 'open';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

// Create OAuth2 client with correct credentials
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000'
);

async function generateToken() {
    try {
        // Clear any existing tokens
        if (fs.existsSync(TOKEN_PATH)) {
            fs.unlinkSync(TOKEN_PATH);
            console.log('Cleared existing token file.');
        }

        // Generate the authorization URL with force prompt
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent',  // Force consent screen
            include_granted_scopes: true  // Include previously granted scopes
        });

        console.log('\nPlease visit this URL to authorize the application:');
        console.log(authUrl);
        console.log('\nAfter authorization, you will be redirected to a URL starting with http://localhost/?code=');
        console.log('Copy that entire URL and run this script again with the URL as a command line argument.');

    } catch (error) {
        console.error('Error generating auth URL:', error);
        process.exit(1);
    }
}

async function processAuthUrl(redirectUrl: string) {
    try {
        // Extract the authorization code from the URL
        const url = new URL(redirectUrl);
        const code = url.searchParams.get('code');
        if (!code) {
            throw new Error('No authorization code found in the URL');
        }

        console.log('Getting token with code:', code);
        
        // Exchange the authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        // Verify we got both scopes
        if (!tokens.scope?.includes('https://www.googleapis.com/auth/gmail.readonly') || 
            !tokens.scope?.includes('https://www.googleapis.com/auth/gmail.modify')) {
            throw new Error('Did not receive all required scopes. Please try again and approve all permissions.');
        }

        console.log('\nOAuth2 token received successfully!');
        console.log('Access Token:', tokens.access_token);
        console.log('Refresh Token:', tokens.refresh_token);
        console.log('Token Type:', tokens.token_type);
        console.log('Scopes:', tokens.scope);
        
        // Save the tokens to token.json
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log('\nToken saved to', TOKEN_PATH);

    } catch (error) {
        if (error instanceof GaxiosError) {
            console.error('Error getting token:', error.message);
            if (error.response?.data) {
                console.error('Response data:', error.response.data);
            }
            if (error.message.includes('invalid_client')) {
                console.error('\nPossible solutions:');
                console.error('1. Verify the client ID and secret are correct');
                console.error('2. Make sure the OAuth consent screen is properly configured');
                console.error('3. Check that the redirect URI matches exactly in Google Cloud Console');
            }
        } else {
            console.error('Error:', error);
        }
        process.exit(1);
    }
}

// Main execution
if (process.argv.length > 2) {
    processAuthUrl(process.argv[2]).catch(console.error);
} else {
    generateToken().catch(console.error);
} 