const { Resend } = require("resend");
require("dotenv").config();

let resend = null;

const initResend = () => {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("ERROR: RESEND_API_KEY no está definida");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const sendResetEmail = async (toEmail, name) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("ERROR: RESEND_API_KEY no está definida");
  }

  if (!process.env.FRONTEND_URL) {
    throw new Error("ERROR: FRONTEND_URL no está definida");
  }

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${toEmail}`;
  console.log("Enviando email con Resend a:", toEmail);
  console.log("Link:", resetLink);

  try {
    console.log("Enviando email con Resend a:", toEmail);
    const resendClient = initResend();
    const response = await resendClient.emails.send({
      from: "onboarding@resend.dev",
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
          <p style="font-size: 12px; color: #777;">Si no solicitaste esto, ignora este mensaje.</p>
        </div>
      `,
    });

    console.log("Email enviado exitosamente. Response:", response);
    return { success: true, messageId: response.id || "sin_id" };
  } catch (error) {
    console.error("Error al enviar email:", error.message);
    throw new Error(`Fallo al enviar email: ${error.message}`);
  }
};

module.exports = { sendResetEmail };
