import { google } from 'googleapis';
import * as http from 'http';
import { AddressInfo } from 'net';
import open from 'open';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000';

if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing required environment variables: GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET');
}

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Generate the url that will be used for authorization
const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
    ],
    prompt: 'consent'
});

// Create a local server to receive the OAuth2 callback
const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        if (url.pathname === '/oauth2callback') {
            const code = url.searchParams.get('code');
            if (code) {
                // Now that we have the code, use it to get the tokens
                const { tokens } = await oauth2Client.getToken(code);
                console.log('\nRefresh Token:', tokens.refresh_token);
                console.log('\nSave this refresh token in your .env file\n');
                
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('Authentication successful! You can close this window.');
                
                // Close the server
                server.close();
            }
        }
    } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('Authentication failed!');
    }
});

server.listen(3000, () => {
    const address = server.address() as AddressInfo;
    console.log(`\nListening on port ${address.port}`);
    console.log('\nOpening browser for authentication...');
    open(authorizeUrl);
}); 