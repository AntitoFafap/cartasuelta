/**
 * API de prueba para enviar email de confirmación de pedido
 * POST /api/test/send-order-email
 * 
 * Solo funciona en desarrollo
 */

import { sendOrderConfirmationEmail } from '../../../lib/emailService';

function generateOrderCode() {
  // Simple order code generator: AAAA-1234
  const letters = Array(4).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  const numbers = Math.floor(1000 + Math.random() * 9000);
  return `${letters}-${numbers}`;
}

export default async function handler(req, res) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Solo disponible en desarrollo' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Datos de prueba
    const testOrderCode = generateOrderCode();
    const testItems = [
      {
        id: '1',
        name: 'Pikachu VMAX (Secret Rare)',
        set: 'Vivid Voltage',
        quantity: 2,
        price: 15000,
        image: 'https://images.pokemontcg.io/swsh4/188_hires.png',
      },
      {
        id: '2',
        name: 'Charizard V',
        set: 'Champions Path',
        quantity: 1,
        price: 25000,
        image: 'https://images.pokemontcg.io/swshp/SWSH050_hires.png',
      },
      {
        id: '3',
        name: 'Umbreon VMAX (Alt Art)',
        set: 'Evolving Skies',
        quantity: 1,
        price: 180000,
        image: 'https://images.pokemontcg.io/swsh7/215_hires.png',
      },
    ];

    const testTotal = testItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    console.log(`\n📧 Enviando email de prueba a: ${email}`);
    console.log(`📦 Código de orden: ${testOrderCode}`);
    console.log(`💰 Total: $${testTotal.toLocaleString('es-CL')} CLP\n`);

    const result = await sendOrderConfirmationEmail({
      to: email,
      orderCode: testOrderCode,
      userName: email.split('@')[0],
      items: testItems,
      totalPrice: testTotal,
      paymentMethod: 'webpay',
      status: 'paid',
    });

    return res.status(200).json({
      success: true,
      message: `Email enviado a ${email}`,
      orderCode: testOrderCode,
      devMode: result.devMode || false,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('Error enviando email de prueba:', error);
    return res.status(500).json({
      error: 'Error al enviar email',
      details: error.message,
    });
  }
}
