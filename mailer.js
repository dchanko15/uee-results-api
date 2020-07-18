const nodeMailer = require('nodemailer');

let transporter = null;

module.exports = {
    SmtpServer(host, port, secure, user, pass) {
        transporter = nodeMailer.createTransport({
            host: host,
            port: port,
            secure: secure,
            auth: {
                user: user,
                pass: pass
            }
        });
    },
    async SendMail(to, subject, text, html) {
        try {
            if (!transporter) {
                transporter = nodeMailer.createTransport({
                    host: "mail.naec.ge",
                    port: 465,
                    secure: true,
                    auth: {
                        user: "online@naec.ge",
                        pass: "uW=@{}!gpu8%"
                    }
                });
            }

            let mailOptions = {
                from: "online@naec.ge",
                to: to,
                subject: subject,
                text: text,
                html: html
            };
            let result = await transporter.sendMail(mailOptions);
            if (result.err)
               throw new Error(result.err.message);
            else
                return {};

        } catch (err) {
             return {error: true, msg: err.message}
        }
    }
}
