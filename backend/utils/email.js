// zerobill/backend/utils/email.js
const nodemailer = require("nodemailer");
const logger = require("../config/logger");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendResetEmail = async (to, token) => {
  // [FIX] Use environment variable for frontend URL and URL param for token
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "ZeroBill - Reset Your Password",
    html: `<p>You requested a password reset. Click the link below to set a new password. This link is valid for 15 minutes.</p>
           <p><a href="${resetLink}" style="font-weight: bold;">Reset Password</a></p>
           <p>If you did not request this, please ignore this email.</p>`,
    text: `You requested a password reset. Please use the following link to reset your password: ${resetLink}`
  });

  logger.info({ to, url: nodemailer.getTestMessageUrl(info) }, "Password reset email sent.");

};