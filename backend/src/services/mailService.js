import nodemailer from "nodemailer";

// No se imprimen usuario, contraseña ni destinatarios en los logs: Render los
// conserva y cualquiera con acceso al panel podría verlos. Solo se avisa si
// falta la configuración.
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error("❌ Falta configuración SMTP (SMTP_HOST, SMTP_USER o SMTP_PASS).");
}

const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 10000, 
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Error de conexión SMTP al inicio:", error.message);
  } else {
    console.log("✅ Servidor SMTP listo para enviar mensajes");
  }
});

export async function sendVerificationEmail(to, name, token) {
  const link = `${process.env.BASE_URL}/activar/${token}`;
  const html = `
    <h2>¡Hola ${name}!</h2>
    <p>Haz clic en el siguiente enlace para activar tu cuenta (válido por 24 horas):</p>
    <a href="${link}" target="_blank">Activar cuenta</a>
  `;
  try {
    const info = await transporter.sendMail({
      from: `"Módulo Usuarios" <usielhernandez.202318@gmail.com>`,
      to,
      subject: "Activa tu cuenta",
      html
    });
    console.log("✅ Correo de verificación enviado. ID:", info.messageId);
  } catch (error) {
    console.error("❌ Error enviando correo de verificación:", error.message);
  }
}

export async function sendResetEmail(to, name, token) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #0d47a1;">Recuperación de Contraseña</h2>
      <p>Hola ${name || "Usuario"},</p>
      <p>Usa el siguiente código para restablecer tu contraseña:</p>
      <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0; border: 1px dashed #999;">
        ${token}
      </div>
      <p>Copia este código y pégalo en la pantalla de recuperación.</p>
      <p style="font-size: 12px; color: #888;">Este código expira en 1 hora.</p>
    </div>
  `;
  try {
    const info = await transporter.sendMail({
      from: `"Soporte Seguridad" <usielhernandez.202318@gmail.com>`,
      to,
      subject: "Tu código de recuperación",
      html
    });
    console.log("✅ Correo de recuperación enviado. ID:", info.messageId);
  } catch (error) {
    console.error("❌ Error enviando correo de recuperación:", error.message);
    throw error; 
  }
}