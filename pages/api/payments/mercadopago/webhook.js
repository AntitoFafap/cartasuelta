import { MercadoPagoConfig, Payment } from 'mercadopago';
import db from '../../../../lib/db';
import { sendOrderConfirmationEmail } from '../../../../lib/emailService';
import { invalidateCache } from '../../../../lib/inventoryCache';

// Configurar Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { type, data } = req.body;

    // Solo procesar notificaciones de pago
    if (type === 'payment') {
      const paymentId = data?.id;
      
      if (paymentId) {
        // Obtener detalles del pago
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        console.log('Webhook Mercado Pago - Pago recibido:', {
          id: paymentInfo.id,
          status: paymentInfo.status,
          external_reference: paymentInfo.external_reference,
          transaction_amount: paymentInfo.transaction_amount,
        });

        // Buscar la orden por el código (external_reference) en MySQL
        const orderCode = paymentInfo.external_reference;
        let order = null;
        if (orderCode) {
          const [orders] = await db.query('SELECT * FROM orders WHERE orderCode = ?', [orderCode]);
          order = orders[0] || null;
        }

        // Procesar según el estado del pago
        switch (paymentInfo.status) {
          case 'approved':
            // Pago aprobado
            console.log('✅ Pago aprobado:', orderCode);
            
            if (order && order.status !== 'paid') {
              // 1. Actualizar estado de la orden en MySQL
              await db.query('UPDATE orders SET status = ?, paymentId = ?, updatedAt = ? WHERE id = ?', [
                'paid',
                String(paymentInfo.id),
                new Date().toISOString(),
                order.id
              ]);

              // 2. Reducir stock de productos en MySQL
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

              // 3. Enviar email de confirmación
              try {
                await sendOrderConfirmationEmail({
                  to: order.userEmail,
                  orderCode: order.orderCode,
                  userName: order.userName || order.userEmail.split('@')[0],
                  items,
                  totalPrice: order.totalPrice,
                  paymentMethod: 'mercadopago',
                  status: 'paid',
                });
                console.log(`Email de confirmación enviado a ${order.userEmail}`);
              } catch (emailError) {
                console.error('Error enviando email:', emailError);
              }
            }
            break;

          case 'pending':
            // Pago pendiente (ej: transferencia bancaria)
            console.log('⏳ Pago pendiente:', orderCode);
            if (order) {
              await db.query('UPDATE orders SET paymentId = ?, updatedAt = ? WHERE id = ?', [
                String(paymentInfo.id),
                new Date().toISOString(),
                order.id
              ]);
            }
            break;

          case 'rejected':
            // Pago rechazado
            console.log('❌ Pago rechazado:', orderCode);
            break;

          case 'cancelled':
            // Pago cancelado
            console.log('🚫 Pago cancelado:', orderCode);
            if (order) {
              await updateOrder(order.id, {
                status: 'cancelled',
                updatedAt: new Date().toISOString(),
              });
            }
            break;

          default:
            console.log('Estado de pago:', paymentInfo.status);
        }
      }
    }

    // Siempre responder 200 para que Mercado Pago no reintente
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error procesando webhook Mercado Pago:', error);
    // Aún así respondemos 200 para evitar reintentos
    return res.status(200).json({ error: 'Error interno', received: true });
  }
}
