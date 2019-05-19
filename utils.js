const nodemailer = require("nodemailer");
let uuidAPIKey = require('uuid-apikey');
let secretKeys = require('./config/secrets.config');


let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: secretKeys.auth
});


let createApiKey = () => {
    let result = uuidAPIKey.create();
    if (result && result.apiKey) {
        let formattedKey = 'ARJ-'+ result.apiKey
        return formattedKey;
    } else {
        return false;
    }
}

let sendMail = (to, subject, html) => {
// Generate SMTP service account from ethereal.email

return new Promise((resolve, reject) => {
    nodemailer.createTestAccount((err, account) => {
        if (err) {
            console.error('Failed to create a testing account. ' + err.message);
            return process.exit(1);
        }
        // Create a SMTP transporter object
        let transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
                user: secretKeys.auth.user,
                pass: secretKeys.auth.pass
            }
        });

        // Message object
        let message = {
            from: secretKeys.auth.user,
            to: to,
            subject: subject,
            // text: 'Hello to myself!',
            html: html
        };

        transporter.sendMail(message, (err, info) => {
            if (err) {
                console.log('Error occurred. ' + err.message);
                reject(err)
                // return process.exit(1);
            }
            // console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            resolve({messageIds: info, testUrl: nodemailer.getTestMessageUrl(info)});
        });
    });
})
}

module.exports.createApiKey = createApiKey;
module.exports.sendMail = sendMail;
