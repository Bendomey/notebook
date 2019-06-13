const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');
const ejs = require('ejs');

const transport = nodemailer.createTransport({
	host:process.env.MAIL_HOST,
	port:process.env.MAIL_PORT,
	auth:{
		user:process.env.MAIL_USER,
		pass:process.env.MAIL_PASS
	}
});

const generateHTML = (filename, options = {}) => {
    const html = ejs.renderFile(`${__dirname}/../views/${filename}.ejs`,
     options);
    return html
}

exports.send = async (options) => {
	let html = await generateHTML(options.filename,options);
	let text = htmlToText.fromString(html);
	const mailOptions = {
		from: 'Domey Ben <noreply@domey.com>',
		to:options.user.email,
		subject: options.subject,
		html,
		text
	};
	return transport.sendMail(mailOptions);
}