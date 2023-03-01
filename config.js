const { google } = require('googleapis');
const { resolve } = require('path');
// const MailComposer = require('nodemailer/lib/mail-composer');
const credentials = require('./gmail-creds.json');
const path = require('path');
// const tokens = require('./token.json');
const fs = require('fs');
const { authenticate } = require('@google-cloud/local-auth');


const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.compose', 'https://www.googleapis.com/auth/gmail.labels'];


async function saveCredentials(client) {
    // const content = await fs.readFile(CREDENTIALS_PATH);
    // const keys = JSON.parse(content);
    // const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: credentials.installed.client_id,
        client_secret: credentials.installed.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    return new Promise((resolve, reject) => {
        resolve(fs.writeFile(TOKEN_PATH, payload, (err) => {
            if (err)
                console.log(err);
            else {
                console.log("File written successfully\n");
                console.log("The written has the following contents:");
                console.log(fs.readFileSync(TOKEN_PATH, "utf8"));
                return fs.readFileSync(TOKEN_PATH, "utf8");
            }
        }));
    });
}

async function loadSavedCredentialsIfExist() {
    try {
        const content = fs.readFileSync(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return credentials;
        // return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: path.join(__dirname, 'gmail-creds.json'),
    });
    if (client.credentials) {
        saveCredentials(client);
    }
    return client;
}

const getGmailService = async () => {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    // let client = await authorize();
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const client = await loadSavedCredentialsIfExist();
    oAuth2Client.setCredentials(client);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    return gmail;
};
const listLabels = async () => {
    const gmail = await new Promise((resolve, reject) => {
        resolve(getGmailService());
    }).then(data => { return data });

    const res = await gmail.users.labels.list({
        userId: 'me',
    });
    const labels = res.data.labels;
    if (!labels || labels.length === 0) {
        console.log('No labels found.');
        return;
    }
    console.log(labels);
    return labels;
}

const createLabels = async () => {
    const gmail = getGmailService();
    const res = gmail.users.labels.create({
        userId: "me",
        requestBody: {
            "labelListVisibility": "labelShow",
            "messageListVisibility": "show",
            "name": "Assignment"
        }
    }, function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log(result);
            return result;
        }
    });
    return res;
}

const listMessages = async () => {
    const gmail = await getGmailService();
    const time = Date.now() - 2 * 60;
    const res = await new Promise((resolve, reject) => {
        gmail.users.messages.list({
            userId: "me",
            // query: "is:unread"
            query: `is:unread is:unread after:${time}`
        }, function (err, result) {
            if (err) {
                return reject(err);
            } else {
                return resolve(result);
            }
        });
    }).then(res => {
        return res;
    });
    return res;
}
const modifyLabels = async (messageId, addLabelIds, removeLabelIds) => {
    const gmail = await getGmailService();
    const res = await new Promise((resolve, reject) => {
        gmail.users.messages.modify({
            id: messageId,
            userId: 'me',
            resource: {
                addLabelIds,
                removeLabelIds,
            }
        }, function (err, result) {
            if (err) {
                return reject(err);
            } else {
                console.log(result);
                return resolve(result);
            }
        })
    }).then(res => {
        return res;
    }).catch(e => {
        console.log(e);
    });
    return res;
}

const getMessageData = async (messageId) => {
    const gmail = await getGmailService();
    const res = new Promise((resolve, reject) => {
        gmail.users.messages.get({
            id: messageId,
            userId: 'me',
        }, function (err, result) {
            if (err) {
                return reject(err);
            } else {
                return resolve(result);
            }
        })
    }).then(res => {
        return res;
    });
    return res;
}
// getGmailService();
module.exports.listLabels = listLabels;
module.exports.createLabels = createLabels;
module.exports.listMessages = listMessages;
module.exports.modifyLabels = modifyLabels;
module.exports.getMessageData = getMessageData;
module.exports.authorize = authorize;
// authorize().then(listLabels).catch(console.error);