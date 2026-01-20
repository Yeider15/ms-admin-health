const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter = null;

const initTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("ERROR: EMAIL_USER o EMAIL_PASS no están definidas");
    }

    console.log("Inicializando transporter con:", process.env.EMAIL_USER);

    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
      connectionTimeout: 30000,
      socketTimeout: 30000,
      greetingTimeout: 30000,
      logger: true,
      debug: true,
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error("Transporter verification failed:", error);
      } else {
        console.log("Transporter verificado correctamente");
      }
    });
  }
  return transporter;
};

const sendResetEmail = async (toEmail, name) => {
  if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL no está definida en variables de entorno");
  }

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${toEmail}`;
  console.log("Reset link:", resetLink);
  console.log("Destinatario:", toEmail);
  console.log("Nombre:", name);

  const mailOptions = {
    from: `"Soporte Salud al Día" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Restablecer Contraseña - Salud al Día",
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
    `,
  };

  try {
    console.log("Iniciando envío de email...");
    const mailTransporter = initTransporter();
    const info = await mailTransporter.sendMail(mailOptions);
    console.log("Email enviado exitosamente. ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error al enviar email:", error.message);
    throw new Error(`Fallo al enviar email: ${error.message}`);
  }
};

module.exports = { sendResetEmail };
