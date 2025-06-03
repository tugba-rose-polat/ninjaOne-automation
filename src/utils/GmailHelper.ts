import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { decode } from 'html-entities';
import { Page } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export class GmailHelper {
    private static readonly SCOPES = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
    ];

    private static readonly SENDER = 'noreply@ninjaone.com';
    private static readonly SUBJECT_PATTERN = 'Activate your NinjaOne Account';

    private static instance: GmailHelper;
    private oauth2Client: OAuth2Client;
    private gmail: any;

    private constructor() {
        // Load environment variables
        dotenv.config();
        
        // Debug log environment variables
        console.log('\n=== Gmail API Configuration ===');
        console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '× Not set');
        console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '× Not set');
        console.log('Refresh Token:', process.env.GMAIL_REFRESH_TOKEN ? '✓ Set' : '× Not set');
        
        // Initialize OAuth2 client with credentials from .env
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
        
        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error('Missing required Gmail API credentials in .env file');
        }
        
        this.oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            'http://localhost:3000'
        );

        // Set credentials
        this.oauth2Client.setCredentials({
            refresh_token: refreshToken
        });

        // Initialize Gmail API
        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        console.log('✓ Gmail API initialized successfully\n');
    }

    static getInstance(): GmailHelper {
        if (!GmailHelper.instance) {
            GmailHelper.instance = new GmailHelper();
        }
        return GmailHelper.instance;
    }

    async activateAccount(page: Page, activationLink: string): Promise<boolean> {
        try {
            console.log('Navigating to activation link...');
            await page.goto(activationLink, { waitUntil: 'networkidle' });

            // Wait for activation confirmation
            const confirmationSelector = 'text="Account activated successfully" , text="Your account has been activated"';
            await page.waitForSelector(confirmationSelector, { timeout: 30000 });

            console.log('Account activated successfully');
            return true;
        } catch (error) {
            console.error('Error activating account:', error);
            await page.screenshot({ path: 'activation-error.png' });
            return false;
        }
    }

    async findVerificationEmail(toEmail: string, timeoutMs: number = 60000): Promise<string | null> {
        const startTime = Date.now();
        console.log('\n=== Starting Email Search ===');
        console.log(`Target email: ${toEmail}`);

        try {
            // Simple search for any recent emails
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                maxResults: 10
            });

            if (response.data.messages && response.data.messages.length > 0) {
                console.log(`Found ${response.data.messages.length} recent messages`);
                
                // Get the most recent message
                const message = await this.gmail.users.messages.get({
                    userId: 'me',
                    id: response.data.messages[0].id,
                    format: 'full'
                });

                // Log message details
                const headers = message.data.payload?.headers || [];
                const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
                const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'No Sender';
                console.log('\nChecking email:');
                console.log(`From: ${from}`);
                console.log(`Subject: ${subject}`);

                // Try to get HTML content from either parts or direct payload
                let htmlContent = '';
                
                if (message.data.payload?.parts) {
                    // If message has parts, look for HTML part
                    const htmlPart = message.data.payload.parts.find((p: any) => p.mimeType === 'text/html');
                    if (htmlPart?.body?.data) {
                        htmlContent = Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
                    }
                } else if (message.data.payload?.body?.data) {
                    // If message has direct body content
                    htmlContent = Buffer.from(message.data.payload.body.data, 'base64').toString('utf8');
                }

                if (htmlContent) {
                    console.log('\nSearching for activation link in HTML content...');
                    console.log('Content preview:', htmlContent.substring(0, 200));
                    
                    // Try multiple patterns to find the activation link
                    const patterns = [
                        /href="([^"]*activate[^"]*)"/i,
                        /href="([^"]*verify[^"]*)"/i,
                        /(https:\/\/[^\s<>"]*(?:activate|verify)[^\s<>"]*)/i
                    ];

                    for (const pattern of patterns) {
                        const match = htmlContent.match(pattern);
                        if (match) {
                            const activateUrl = match[1] || match[0];
                            console.log('✓ Found activation link:', activateUrl);
                            return activateUrl;
                        }
                    }
                    
                    console.log('× No activation link found in email content');
                } else {
                    console.log('× No HTML content found in email');
                }
            } else {
                console.log('× No messages found');
            }
        } catch (error) {
            console.error('Error searching for verification email:', error);
        }

        return null;
    }
} 