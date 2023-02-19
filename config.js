const { google } = require('googleapis');
const { resolve } = require('path');
// const MailComposer = require('nodemailer/lib/mail-composer');
const credentials = require('./gmail-creds.json');
const tokens = require('./token.json');

const getGmailService = () => {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    return gmail;
};
const listLabels = async () => {
    const gmail = getGmailService();
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
    const gmail = getGmailService();
    const time = Date.now() - 2 * 60 * 1000;
    const res = await new Promise((resolve, reject) => {
        gmail.users.messages.list({
            userId: "me",
            // query: "is:unread"
            query: `is:unread after:${time}`
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
    const gmail = getGmailService();
    const res = new Promise((resolve, reject) => {
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
    });
    return res;
}

const getMessageData = async (messageId) => {
    const gmail = getGmailService();
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

module.exports.listLabels = listLabels;
module.exports.createLabels = createLabels;
module.exports.listMessages = listMessages;
module.exports.modifyLabels = modifyLabels;
module.exports.getMessageData = getMessageData;
// authorize().then(listLabels).catch(console.error);