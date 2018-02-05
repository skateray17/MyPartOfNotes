const nodeMailer = require('nodemailer');
const mailPassword = require('../secret-info/mail-password');

class Mailer {
    constructor() {
        this.mailer = nodeMailer;
        this.transporter = this.mailer.createTransport({
            service: 'gmail',
            secure: false,
            port: 25,
            auth: {
                user: 'notesapptask@gmail.com',
                pass: mailPassword,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
    }

    sendPasswordResetHash(email, passwordResetHash) {        
            const mailOptions = {
                from: '"Best Notes Ever 👻" <notesapptask@gmail.com>',
                to: email,
                subject: 'Password changing confirmition ✔',
                text: `To change your password enter: ${passwordResetHash}`,
                html: `<h1>To change your password enter:</h1><h4>${passwordResetHash}</h4>`,
            };
        
            this.transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    return console.log(error);
                }
            });
    }
}

module.exports = new Mailer();
