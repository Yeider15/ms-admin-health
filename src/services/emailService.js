const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendResetEmail = async (toEmail, name) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${toEmail}`;

  const mailOptions = {
    from: `"Soporte Salud al Día" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Restablecer Contraseña - Salud al Día',
    html: `
      <div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Hola, ${name}</h2>
        <p style="font-size: 16px;">Para crear tu nueva contraseña, haz clic en el botón:</p>
        <br>
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Cambiar Contraseña
        </a>
        <br><br>
        <p style="font-size: 12px; color: #777;">Si no solicitaste esto, ignora este mensaje.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sendResetEmail:", error);
    throw error;
  }
};

module.exports = { sendResetEmail };