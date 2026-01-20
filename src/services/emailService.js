const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter = null;

const initTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("ERROR: EMAIL_USER o EMAIL_PASS no están definidas en el entorno");
    }

    console.log("Inicializando transporter con Brevo (Puerto 2525):", process.env.EMAIL_USER);

    transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525, // <--- CAMBIO CRÍTICO: El puerto 2525 rara vez se bloquea en Railway
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ Error verificando conexión SMTP con Brevo:", error);
      } else {
        console.log("✅ Transporter de Brevo verificado en puerto 2525");
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
  
  const mailOptions = {
    // Es vital que este correo coincida con el de tu cuenta de Brevo
    from: `"Soporte Salud al Día" <xpertpro360@gmail.com>`, 
    to: toEmail,
    subject: "Restablecer Contraseña - Salud al Día",
    html: `
      <div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Hola, ${name}</h2>
        <p style="font-size: 16px;">Haz clic abajo para crear tu nueva contraseña:</p>
        <br>
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
          Cambiar Contraseña
        </a>
      </div>
    `,
  };

  try {
    const mailTransporter = initTransporter();
    const info = await mailTransporter.sendMail(mailOptions);
    console.log("✅ Email enviado exitosamente vía Puerto 2525. ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("🔥 Error al enviar email:", error.message);
    throw new Error(`Fallo en el servicio de correo: ${error.message}`);
  }
};

module.exports = { sendResetEmail };