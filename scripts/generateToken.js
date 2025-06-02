const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const credentials = {
    web: {
        client_id: '851907413063-q88bc4mh1lltg58sgllbmaet14810r2a.apps.googleusercontent.com',
        client_secret: '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',
        redirect_uri: 'http://localhost'
    }
};

const oauth2Client = new google.auth.OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uri
);

// Generate the authorization URL
const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent'  // Force to generate refresh_token
});

console.log('1. Visit this URL to authorize the application:');
console.log(authUrl);
console.log('\n2. After authorization, you will be redirected to a URL. Copy the "code" parameter from that URL.');
console.log('\n3. Run this script again with the code as an argument:');
console.log('   node scripts/generateToken.js <CODE>');

// If a code is provided as an argument, generate the token
if (process.argv[2]) {
    const code = process.argv[2];
    
    oauth2Client.getToken(code).then(({ tokens }) => {
        const tokenPath = path.join(process.cwd(), 'token.json');
        fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
        console.log('\nToken has been saved to token.json');
        
        // Display the received tokens for verification
        console.log('\nReceived tokens:');
        console.log(JSON.stringify(tokens, null, 2));
    }).catch(error => {
        console.error('Error getting token:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.data);
        }
    });
} 