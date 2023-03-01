const cron = require("node-cron");
const express = require("express");
const utility = require('./config');
const generateToken = require('./generateToken');
app = express(); // Initializing app

const { google } = require('googleapis');
/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listLabels(gmail) {
    const res = await gmail.users.labels.list({
        userId: 'me',
    });
    const labels = res.data.labels;
    if (!labels || labels.length === 0) {
        console.log('No labels found.');
        return;
    }
    console.log('Labels:');
    labels.forEach((label) => {
        console.log(`- ${label.name}`);
    });
}
// Creating a cron job which runs on every 10 second
utility.authorize().then(() => {
    cron.schedule("*/10 * * * * *", async function () {
        console.log("cron job")
        // generateToken.listLabels();
        let labels = await utility.listLabels();
        let check = labels.filter(label => {
            return label.name == "Assignment"
        });
        if (check.length == 0) {
            console.log("adding label");
            try {
                let res = await utility.createLabels();
                labels = await utility.listLabels();
                console.log("label added");
                check = labels.filter(label => {
                    return label.name == "Assignment"
                });
            } catch (e) {
                console.log(e);
            }
        }
        const emails = await utility.listMessages();
        console.log('email', emails);
        let data = await utility.getMessageData(emails.data.messages[0].id);
        console.log('message data', data);
        // emails.data.messages.map(async email => {
        //     const data = await utility.getMessageData(email.id);
        //     console.log(data);
        // })
        const changeLabel = await utility.modifyLabels(emails.data.messages[0].id, [check[0].id], ["INBOX"]);
        console.log('changed label', changeLabel)
        // messages.forEach(msg => { modifyLabels(oAuth2Client, msg.id, [Label_11], ['INBOX']); })
        // modify the label after sending the mail

    });
});


app.listen(5001);