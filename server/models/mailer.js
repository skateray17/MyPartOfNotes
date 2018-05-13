const nodeMailer = require('nodemailer');
const mailPassword = require('../secret-info/mail-password');
const ApiResponce = require('./api-response');


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

  sendNoteReport(email, note, callback) {
    const mailOptions = {
      from: '"Best Notes Ever 👻" <notesapptask@gmail.com>',
      to: email,
      subject: 'Note report ✔',
      //text: `label: ${note.label}\ndescription: ${note.desc}`,
       html: `<h1>${note.label}</h1>
              <h4>${note.desc}</h4>`,
    };

    this.transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return callback(error, new ApiResponce({
          success: false,
        }));
      }
      return callback(null, new ApiResponce({
        success: true,
      }));
    });
  }
}

module.exports = new Mailer();
