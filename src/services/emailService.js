const emailjs = require('@emailjs/nodejs');
require('dotenv').config();

const sendResetEmail = async (toEmail, name) => {
  // Validamos que existan las variables de EmailJS
  if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PRIVATE_KEY) {
    throw new Error("ERROR: Faltan las credenciales de EmailJS en el archivo .env");
  }

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${toEmail}`;
  
  // Estos nombres deben ser IGUALES a los que pusiste entre {{ }} en la web de EmailJS
  const templateParams = {
    to_email: toEmail,    // El destinatario
    to_name: name,        // El nombre para el saludo
    reset_link: resetLink // El enlace del botón
  };

  try {
    console.log(`[EmailJS] Enviando correo a: ${toEmail}`);

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY, // Esto es lo que permite enviar desde el backend
      }
    );

    console.log("✅ Email enviado exitosamente:", response.status, response.text);
    return { success: true };

  } catch (error) {
    console.error("🔥 Error al enviar con EmailJS:", error);
    throw new Error(`Fallo al enviar email: ${error.text || error.message}`);
  }
};

module.exports = { sendResetEmail };