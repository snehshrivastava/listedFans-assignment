const cron = require("node-cron");
const express = require("express");
const utility = require('./config');
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
cron.schedule("*/10 * * * * *", async function () {
    console.log("cron job")
    const labels = await utility.listLabels();
    const check = labels.filter(label => {
        return label.name == "Assignment"
    });
    if (check.length == 0) {
        console.log("adding label");
        try {
            let res = await utility.createLabels();
            console.log("label added");
        } catch (e) {
            console.log(e);
        }
    }
    const emails = await utility.listMessages();
    console.log(emails);
    let data = await utility.getMessageData(emails.data.messages[0].id);
    console.log(data);
    // emails.map(async email => {
    //     const data = await utility.getMessageData(email.id);
    //     console.log(data);
    // })
    const changeLabel = await utility.modifyLabels(emails.data.messages[0].id, ["Label_9"], ["INBOX"]);
    console.log('changed label', changeLabel)
    // messages.forEach(msg => {      modifyLabels(oAuth2Client, msg.id, [Label_11], ['INBOX']);})
    // modify the label after sending the mail

});

app.listen(5000);