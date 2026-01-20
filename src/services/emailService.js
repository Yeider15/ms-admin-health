const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter = null;

const initTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("ERROR: EMAIL_USER o EMAIL_PASS no están definidas en el entorno");
    }

    console.log("Inicializando transporter con Brevo:", process.env.EMAIL_USER);

    transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER, // Aquí usa el a06de7001...
        pass: process.env.EMAIL_PASS, // Aquí usa la clave xsmtpsib...
      },
      tls: {
        rejectUnauthorized: false, // Ayuda a conectar desde contenedores como Railway
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ Error verificando conexión SMTP con Brevo:", error);
      } else {
        console.log("✅ Transporter de Brevo verificado y listo");
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
  
  console.log("--- Preparando envío de correo ---");
  console.log("Destinatario:", toEmail);
  console.log("Link generado:", resetLink);

  const mailOptions = {
    // Usamos tu correo real como remitente para que se vea profesional
    from: `"Soporte Salud al Día" <xpertpro360@gmail.com>`, 
    to: toEmail,
    subject: "Restablecer Contraseña - Salud al Día",
    html: `
      <div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Hola, ${name}</h2>
        <p style="font-size: 16px;">Para crear tu nueva contraseña, haz clic en el botón:</p>
        <br>
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
          Cambiar Contraseña
        </a>
        <br><br>
        <p style="font-size: 12px; color: #777; margin-top: 20px;">Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.</p>
      </div>
    `,
  };

  try {
    console.log("Iniciando proceso de envío...");
    const mailTransporter = initTransporter();
    const info = await mailTransporter.sendMail(mailOptions);
    console.log("✅ Email enviado exitosamente a Brevo. ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("🔥 Error real al enviar email:", error.message);
    throw new Error(`Fallo en el servicio de correo: ${error.message}`);
  }
};

module.exports = { sendResetEmail };