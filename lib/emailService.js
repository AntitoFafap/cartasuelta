import nodemailer from 'nodemailer';

// Configuración del transporter SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Nombre de la aplicación para los emails
const APP_NAME = process.env.APP_NAME || 'Carta Suelta';

/**
 * Envía un email usando Gmail + Nodemailer
 */
export async function sendEmail({ to, subject, htmlBody, textBody }) {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: htmlBody,
    text: textBody || htmlBody.replace(/<[^>]*>/g, ''),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email enviado a ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando email:', error);
    // En desarrollo, no falla si SMTP no está configurado
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️ SMTP no configurado - Email no enviado (modo desarrollo)');
      console.log('✉️ Configura SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS en .env.local');
      return { success: true, messageId: 'dev-mode', devMode: true };
    }
    throw error;
  }
}

/**
 * Envía email de verificación de cuenta
 */
export async function sendVerificationEmail(email, code, firstName) {
  const subject = `${APP_NAME} - Verifica tu email`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { background: #667eea; color: white; font-size: 32px; letter-spacing: 8px; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎴 ${APP_NAME}</h1>
        </div>
        <div class="content">
          <h2>¡Hola${firstName ? ' ' + firstName : ''}!</h2>
          <p>Gracias por registrarte. Para verificar tu email, usa el siguiente código:</p>
          <div class="code">${code}</div>
          <p>Este código expira en 24 horas.</p>
          <p>Si no te registraste en nuestra tienda, puedes ignorar este email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
    ¡Hola${firstName ? ' ' + firstName : ''}!
    
    Gracias por registrarte en ${APP_NAME}.
    
    Tu código de verificación es: ${code}
    
    Este código expira en 24 horas.
    
    Si no te registraste, puedes ignorar este email.
  `;

  return sendEmail({ to: email, subject, htmlBody, textBody });
}

/**
 * Envía email de recuperación de contraseña
 */
export async function sendPasswordResetEmail(email, code, firstName) {
  const subject = `${APP_NAME} - Recupera tu contraseña`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { background: #f5576c; color: white; font-size: 32px; letter-spacing: 8px; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Recuperar Contraseña</h1>
        </div>
        <div class="content">
          <h2>¡Hola${firstName ? ' ' + firstName : ''}!</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
          <div class="code">${code}</div>
          <p>Este código expira en <strong>1 hora</strong>.</p>
          <div class="warning">
            <strong>⚠️ Importante:</strong> Si no solicitaste restablecer tu contraseña, ignora este email. Tu cuenta está segura.
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
    ¡Hola${firstName ? ' ' + firstName : ''}!
    
    Recibimos una solicitud para restablecer tu contraseña en ${APP_NAME}.
    
    Tu código de recuperación es: ${code}
    
    Este código expira en 1 hora.
    
    Si no solicitaste esto, ignora este email. Tu cuenta está segura.
  `;

  return sendEmail({ to: email, subject, htmlBody, textBody });
}

/**
 * Envía email de confirmación de pedido
 */
export async function sendOrderConfirmationEmail({ to, orderCode, userName, items, totalPrice, paymentMethod, status }) {
  const subject = `${APP_NAME} - Confirmación de Pedido #${orderCode}`;
  
  // Formatear método de pago
  const paymentMethodName = {
    webpay: 'WebPay',
    mercadopago: 'Mercado Pago',
  }[paymentMethod] || 'No especificado';

  // Formatear estado
  const statusName = {
    pending: 'Pendiente de pago',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  }[status] || status;

  // Generar tabla de items
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.image || item.imageUrl || ''}" alt="${item.name}" width="50" height="70" style="border-radius: 4px; object-fit: cover;">
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong>
        ${item.set ? `<br><small style="color: #666;">${item.set}</small>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toLocaleString('es-CL')}</td>
    </tr>
  `).join('');

  const itemsText = items.map(item => 
    `- ${item.name} x${item.quantity} = $${(item.price * item.quantity).toLocaleString('es-CL')}`
  ).join('\n');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-code { background: #11998e; color: white; font-size: 24px; letter-spacing: 2px; padding: 15px 25px; text-align: center; border-radius: 8px; margin: 20px 0; display: inline-block; }
        .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        table { width: 100%; border-collapse: collapse; }
        .total-row { font-size: 18px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎴 ¡Gracias por tu compra!</h1>
          <p>Tu pedido ha sido recibido</p>
        </div>
        <div class="content">
          <p>¡Hola <strong>${userName}</strong>!</p>
          <p>Hemos recibido tu pedido correctamente. Aquí están los detalles:</p>
          
          <div style="text-align: center;">
            <div class="order-code">📦 ${orderCode}</div>
          </div>
          
          <div class="info-box">
            <p><strong>Estado:</strong> <span class="status-badge ${status === 'paid' ? 'status-paid' : 'status-pending'}">${statusName}</span></p>
            <p><strong>Método de pago:</strong> ${paymentMethodName}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0;">📋 Detalle del pedido</h3>
            <table>
              <thead>
                <tr style="background: #f1f1f1;">
                  <th style="padding: 10px; text-align: left;" width="60"></th>
                  <th style="padding: 10px; text-align: left;">Producto</th>
                  <th style="padding: 10px; text-align: center;">Cant.</th>
                  <th style="padding: 10px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3" style="padding: 15px 10px; text-align: right;">Total:</td>
                  <td style="padding: 15px 10px; text-align: right; color: #11998e;">$${totalPrice.toLocaleString('es-CL')}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p style="color: #666; font-size: 14px;">
            Guarda este código de pedido para consultar el estado de tu compra.
            Te enviaremos actualizaciones cuando tu pedido sea enviado.
          </p>
        </div>
        <div class="footer">
          <p>¿Tienes preguntas? Responde a este email.</p>
          <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
¡Hola ${userName}!

¡Gracias por tu compra en ${APP_NAME}!

Tu código de pedido es: ${orderCode}

Estado: ${statusName}
Método de pago: ${paymentMethodName}
Fecha: ${new Date().toLocaleDateString('es-CL')}

DETALLE DEL PEDIDO:
${itemsText}

TOTAL: $${totalPrice.toLocaleString('es-CL')}

Guarda este código para consultar el estado de tu compra.

© ${new Date().getFullYear()} ${APP_NAME}
  `;

  return sendEmail({ to, subject, htmlBody, textBody });
}
