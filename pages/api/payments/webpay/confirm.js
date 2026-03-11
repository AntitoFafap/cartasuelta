import { WebpayPlus } from 'transbank-sdk';
import db from '../../../../lib/db';
import { sendOrderConfirmationEmail } from '../../../../lib/emailService';
import { invalidateCache } from '../../../../lib/inventoryCache';

// Configurar WebPay según el ambiente
const isProduction = process.env.WEBPAY_ENVIRONMENT === 'production';

let webpay;
if (isProduction) {
  webpay = new WebpayPlus.Transaction({
    commerceCode: process.env.WEBPAY_COMMERCE_CODE,
    apiKey: process.env.WEBPAY_API_KEY,
    environment: 'production',
  });
} else {
  webpay = new WebpayPlus.Transaction();
}

export default async function handler(req, res) {
  // WebPay envía el token vía GET o POST dependiendo del resultado
  const token = req.method === 'POST' ? req.body.token_ws : req.query.token_ws;
  const tbkToken = req.method === 'POST' ? req.body.TBK_TOKEN : req.query.TBK_TOKEN;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Si viene TBK_TOKEN, el usuario canceló o hubo timeout
  if (tbkToken || !token) {
    console.log('Pago cancelado o sin token:', { tbkToken, token });
    return res.redirect(302, `${baseUrl}/payment-result?status=cancelled`);
  }

  try {
    // Confirmar la transacción
    const response = await webpay.commit(token);

    console.log('Respuesta WebPay:', response);

    // Verificar el estado de la transacción
    // responseCode 0 = Aprobado
    if (response.responseCode === 0) {
      // Pago exitoso
      // 1. Buscar la orden por el buyOrder (que es el orderCode) en MySQL
      const [orders] = await db.query('SELECT * FROM orders WHERE orderCode = ?', [response.buyOrder]);
      const order = orders[0];
      if (order) {
        // 2. Actualizar estado de la orden a pagado en MySQL
        await db.query('UPDATE orders SET status = ?, paymentId = ?, updatedAt = ? WHERE id = ?', [
          'paid',
          response.authorizationCode,
          new Date().toISOString(),
          order.id
        ]);

        // 3. Reducir stock de productos en MySQL
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        for (const item of items) {
          const [invRows] = await db.query('SELECT * FROM inventory WHERE id = ?', [item.id]);
          const inventoryItem = invRows[0];
          if (inventoryItem) {
            const newStock = Math.max(0, inventoryItem.stock - item.quantity);
            await db.query('UPDATE inventory SET stock = ? WHERE id = ?', [newStock, item.id]);
          }
        }
        invalidateCache();

        // 4. Enviar email de confirmación
        try {
          await sendOrderConfirmationEmail({
            to: order.userEmail,
            orderCode: order.orderCode,
            userName: order.userName || order.userEmail.split('@')[0],
            items,
            totalPrice: order.totalPrice,
            paymentMethod: 'webpay',
            status: 'paid',
          });
          console.log(`Email de confirmación enviado a ${order.userEmail}`);
        } catch (emailError) {
          console.error('Error enviando email:', emailError);
        }
      }

      const orderInfo = {
        orderCode: response.buyOrder,
        buyOrder: response.buyOrder,
        amount: response.amount,
        authorizationCode: response.authorizationCode,
        cardNumber: response.cardDetail?.cardNumber || 'XXXX',
        transactionDate: response.transactionDate,
        paymentType: response.paymentTypeCode,
        installments: response.installmentsNumber,
      };

      // Codificar la info para pasar por URL
      const encodedInfo = encodeURIComponent(JSON.stringify(orderInfo));
      
      return res.redirect(302, `${baseUrl}/payment-result?status=success&data=${encodedInfo}`);
    } else {
      // Pago rechazado
      return res.redirect(302, `${baseUrl}/payment-result?status=rejected&code=${response.responseCode}`);
    }

  } catch (error) {
    console.error('Error confirmando transacción WebPay:', error);
    return res.redirect(302, `${baseUrl}/payment-result?status=error&message=${encodeURIComponent(error.message)}`);
  }
}
