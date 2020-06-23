const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendEmail = (email, subject, message) => {
    sgMail.send({
        to: 'rathodbrijesh999@gmail.com',   // email is hardcoded here, otherwise email var can be used
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        subject,
        text: message
    })
}

module.exports = sendEmail