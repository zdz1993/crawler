import nodemailer from 'nodemailer'
import config from '../config.json'

const mail = config.mailoption
const smtpTransport = nodemailer.createTransport(mail.from)

function mailer (options) {
  const mailOptions = {
    from: mail.mailfrom,
    to: mail.to,
    subject: options.subject,
    html: options.html
  }
  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log('error:' + error)
    } else {
      console.log(response)
    }
    smtpTransport.close()
  })
}

export default mailer
