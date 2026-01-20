const axios = require("axios");
require("dotenv").config();

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const sendResetEmail = async (toEmail, name) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("ERROR: BREVO_API_KEY no está definida");
  }

  if (!process.env.FRONTEND_URL) {
    throw new Error("ERROR: FRONTEND_URL no está definida");
  }

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${toEmail}`;
  console.log("Enviando email a:", toEmail);
  console.log("Link:", resetLink);

  const emailData = {
    sender: {
      name: "Soporte Salud al Día",
      email: "noreply@saludaldia.com",
    },
    to: [
      {
        email: toEmail,
        name: name,
      },
    ],
    subject: "Restablecer Contraseña - Salud al Día",
    htmlContent: `
      <div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Hola, ${name}</h2>
        <p style="font-size: 16px;">Para crear tu nueva contraseña, haz clic en el botón:</p>
        <br>
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
          Cambiar Contraseña
        </a>
        <br><br>
        <p style="font-size: 12px; color: #777;">Si no solicitaste esto, ignora este mensaje.</p>
      </div>
    `,
  };

  try {
    console.log("Iniciando envío de email vía API Brevo...");
    const response = await axios.post(BREVO_API_URL, emailData, {
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      timeout: 10000,
    });

    console.log("Email enviado exitosamente. ID:", response.data.messageId);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error(
      "Error al enviar email:",
      error.response?.data || error.message,
    );
    throw new Error(
      `Fallo al enviar email: ${error.response?.data?.message || error.message}`,
    );
  }
};

module.exports = { sendResetEmail };
