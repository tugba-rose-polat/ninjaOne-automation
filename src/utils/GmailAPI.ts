import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as path from 'path';
import * as fs from 'fs';

export class GmailAPI {
    private oauth2Client: OAuth2Client;
    private gmail: any;

    constructor() {
        // Initialize OAuth2 client
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            'http://localhost'
        );

        // Set credentials
        this.oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });

        // Initialize Gmail API
        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }

    private decodeBase64(data: string): string {
        return Buffer.from(data, 'base64').toString();
    }

    async findActivationEmail(): Promise<string> {
        try {
            // Search for activation email
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: 'from:noreply@ninjarmm.com subject:Activate',
                maxResults: 1
            });

            if (!response.data.messages || response.data.messages.length === 0) {
                throw new Error('Activation email not found');
            }

            // Get the email content
            const email = await this.gmail.users.messages.get({
                userId: 'me',
                id: response.data.messages[0].id,
                format: 'full'
            });

            // Extract the activation link from email body
            const emailBody = email.data.payload.parts.find((part: any) => 
                part.mimeType === 'text/html' || part.mimeType === 'text/plain'
            );

            if (!emailBody) {
                throw new Error('Email body not found');
            }

            const decodedBody = this.decodeBase64(emailBody.body.data);
            
            // Extract activation link using regex
            const linkMatch = decodedBody.match(/https:\/\/[^\s<>"]+?(?=["<])/);
            if (!linkMatch) {
                throw new Error('Activation link not found in email body');
            }

            return linkMatch[0];
        } catch (error) {
            console.error('Error accessing Gmail:', error);
            throw error;
        }
    }

    async deleteEmail(query: string): Promise<void> {
        try {
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: query
            });

            if (response.data.messages) {
                for (const message of response.data.messages) {
                    await this.gmail.users.messages.trash({
                        userId: 'me',
                        id: message.id
                    });
                }
            }
        } catch (error) {
            console.error('Error deleting emails:', error);
            throw error;
        }
    }
} 