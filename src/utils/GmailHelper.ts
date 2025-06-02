import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as path from 'path';
import * as fs from 'fs';
import { decode } from 'html-entities';
import { Page } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

interface GoogleCredentials {
    client_id: string;
    client_secret: string;
    redirect_uri?: string;
}

export class GmailHelper {
    private static readonly SCOPES = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
    ];
    private static readonly TOKEN_PATH = '/Users/tugba/Desktop/ninja/token.json';
    private static readonly SENDER = 'noreply@ninjaone.com';
    private static readonly SUBJECT_PATTERN = 'Activate your NinjaOne Account';

    private static instance: GmailHelper;
    private oauth2Client: OAuth2Client;
    private gmail: any;

    private constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'http://localhost:3000/oauth2callback'
        );

        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }

    static getInstance(): GmailHelper {
        if (!GmailHelper.instance) {
            GmailHelper.instance = new GmailHelper();
        }
        return GmailHelper.instance;
    }

    private async initializeGmailAPI(credentials: GoogleCredentials) {
        try {
            const { client_id, client_secret, redirect_uri } = credentials;

            // Create OAuth2 client
            this.oauth2Client = new google.auth.OAuth2(
                client_id,
                client_secret,
                redirect_uri || 'http://localhost'
            );

            // Check if we have previously stored a token
            if (fs.existsSync(GmailHelper.TOKEN_PATH)) {
                const token = JSON.parse(fs.readFileSync(GmailHelper.TOKEN_PATH, 'utf-8'));
                this.oauth2Client.setCredentials(token);
            } else {
                await this.getNewToken();
            }

            // Initialize Gmail API
            this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
            
        } catch (error) {
            console.error('Error initializing Gmail API:', error);
            throw error;
        }
    }

    private async getNewToken() {
        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: GmailHelper.SCOPES,
        });

        console.log('Authorize this app by visiting this url:', authUrl);
        console.log('After authorization, copy the code from the browser and create a token.json file with the following structure:');
        console.log('{');
        console.log('  "access_token": "YOUR_ACCESS_TOKEN",');
        console.log('  "refresh_token": "YOUR_REFRESH_TOKEN",');
        console.log('  "scope": "https://www.googleapis.com/auth/gmail.readonly",');
        console.log('  "token_type": "Bearer",');
        console.log('  "expiry_date": EXPIRY_TIMESTAMP');
        console.log('}');
        
        throw new Error('Please complete OAuth2 authorization and create token.json file');
    }

    async waitForActivationEmail(recipientEmail: string, timeoutMs: number = 60000): Promise<string | null> {
        console.log(`Waiting for activation email for ${recipientEmail}...`);
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            try {
                const messages = await this.gmail.users.messages.list({
                    userId: 'me',
                    q: `from:${GmailHelper.SENDER} to:${recipientEmail} subject:"${GmailHelper.SUBJECT_PATTERN}" is:unread`,
                });

                if (messages.data.messages && messages.data.messages.length > 0) {
                    const message = await this.gmail.users.messages.get({
                        userId: 'me',
                        id: messages.data.messages[0].id,
                    });

                    // Extract activation link from email body
                    const activationLink = this.extractActivationLink(message.data);
                    if (activationLink) {
                        console.log('Found activation link:', activationLink);
                        return activationLink;
                    }
                }

                // Wait 5 seconds before checking again
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                console.error('Error checking for activation email:', error);
            }
        }

        throw new Error(`Timeout waiting for activation email for ${recipientEmail}`);
    }

    private extractActivationLink(message: any): string | null {
        try {
            const body = message.payload.parts.find((part: any) => part.mimeType === 'text/html')?.body?.data;
            if (!body) return null;

            const decodedBody = Buffer.from(body, 'base64').toString('utf-8');
            const htmlContent = decode(decodedBody);

            // Look for the activation link
            const matches = htmlContent.match(/href="(https:\/\/app\.ninjarmm\.com\/auth\/#\/activate\/[^"]+)"/);
            return matches ? matches[1] : null;
        } catch (error) {
            console.error('Error extracting activation link:', error);
            return null;
        }
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

    async markEmailAsRead(messageId: string) {
        try {
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    removeLabelIds: ['UNREAD'],
                },
            });
        } catch (error) {
            console.error('Error marking email as read:', error);
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