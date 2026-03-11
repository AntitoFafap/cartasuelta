import { MercadoPagoConfig, Preference } from 'mercadopago';
import { requireUserAuth } from '../../../../lib/middleware';
import db from '../../../../lib/db';
import crypto from 'crypto';

// Configurar Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN',
});

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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Crear los items para Mercado Pago
    const mpItems = items.map(item => ({
      id: item.id,
      title: item.name,
      description: `Carta Pokémon TCG - ${item.name}`,
      picture_url: item.image || undefined,
      quantity: item.quantity,
      unit_price: Number(item.price),
      currency_id: 'CLP', // Peso chileno
    }));

    // Usar el orderCode como referencia externa
    const externalReference = orderCode;

    // Crear preferencia de pago
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: mpItems,
        payer: {
          email: session.email || 'comprador@email.com',
        },
        back_urls: {
          success: `${baseUrl}/payment-result?status=success&method=mercadopago&orderCode=${orderCode}`,
          failure: `${baseUrl}/payment-result?status=rejected&method=mercadopago&orderCode=${orderCode}`,
          pending: `${baseUrl}/payment-result?status=pending&method=mercadopago&orderCode=${orderCode}`,
        },
        auto_return: 'approved',
        external_reference: externalReference,
        notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
        statement_descriptor: 'CARTA SUELTA',
      },
    });

    return res.status(200).json({
      id: result.id,
      init_point: result.init_point, // URL de pago normal
      sandbox_init_point: result.sandbox_init_point, // URL de pago en sandbox
      external_reference: externalReference,
      orderCode,
      orderId: pendingOrder.id,
    });

  } catch (error) {
    console.error('Error creando preferencia Mercado Pago:', error);
    return res.status(500).json({ 
      error: 'Error al crear la preferencia de pago',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
