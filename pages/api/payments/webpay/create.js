import { WebpayPlus } from 'transbank-sdk';
import { requireUserAuth } from '../../../../lib/middleware';
import db from '../../../../lib/db';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Configurar WebPay según el ambiente
const isProduction = process.env.WEBPAY_ENVIRONMENT === 'production';

// Crear instancia de WebPay
let webpay;
if (isProduction) {
  // Producción - usar credenciales reales
  webpay = new WebpayPlus.Transaction({
    commerceCode: process.env.WEBPAY_COMMERCE_CODE,
    apiKey: process.env.WEBPAY_API_KEY,
    environment: 'production',
  });
} else {
  // Integración/Sandbox - usar credenciales de prueba de Transbank
  webpay = new WebpayPlus.Transaction();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar autenticación del usuario
  const session = await requireUserAuth(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Debes iniciar sesión para realizar un pago' });
  }

  try {
    const { items, total, paymentMethod } = req.body;

    // Validaciones
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ error: 'El total debe ser mayor a 0' });
    }

    // Generar código de orden único
    const orderCode = 'CS-' + new Date().toISOString().slice(0,7).replace('-','') + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Crear orden pendiente en MySQL
    const orderData = {
      orderId: orderCode,
      userId: session.userId,
      items: JSON.stringify(items),
      totalPrice: total,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.query('INSERT INTO orders SET ?', [orderData]);
    const [pendingOrderRows] = await db.query('SELECT * FROM orders WHERE orderId = ?', [orderCode]);
    const pendingOrder = pendingOrderRows[0];

    // Usar el orderCode como buyOrder para poder identificar la orden después
    const buyOrder = orderCode;
    const sessionId = `SESSION-${session.userId || uuidv4()}`;

    // Calcular el monto (WebPay requiere monto en pesos chilenos sin decimales)
    const amount = Math.round(total);

    // URL de retorno después del pago
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/api/payments/webpay/confirm`;

    // Crear transacción en WebPay
    const response = await webpay.create(buyOrder, sessionId, amount, returnUrl);

    return res.status(200).json({
      token: response.token,
      url: response.url,
      buyOrder,
      sessionId,
      orderCode,
      orderId: pendingOrder.id,
    });

  } catch (error) {
    console.error('Error creando transacción WebPay:', error);
    return res.status(500).json({ 
      error: 'Error al crear la transacción de pago',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
