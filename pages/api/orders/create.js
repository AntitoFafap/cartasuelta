/**
 * API para crear órdenes de compra
 * POST /api/orders/create
 */

const db = require('../../../lib/db').default || require('../../../lib/db');
import { invalidateCache } from '../../../lib/inventoryCache';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
// ...existing code...

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      userEmail,
      userName,
      items,
      totalPrice,
      paymentMethod,
      paymentId,
      shippingAddress,
      notes,
    } = req.body;

    // Validaciones
    if (!userId || !userEmail || !items || !totalPrice) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: userId, userEmail, items, totalPrice',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'El carrito está vacío',
      });
    }

    // Verificar stock disponible y actualizar inventario
    for (const item of items) {
      const [inventoryRows] = await db.query('SELECT * FROM card_inventory WHERE id = ?', [item.id]);
      const inventoryItem = inventoryRows[0];
      if (!inventoryItem) {
        return res.status(400).json({ error: `Producto no encontrado: ${item.name || item.id}` });
      }
      if (inventoryItem.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuficiente para "${inventoryItem.name}". Disponible: ${inventoryItem.stock}, solicitado: ${item.quantity}` });
      }
    }

    // Generar código de orden único
    const orderCode = 'CS-' + new Date().toISOString().slice(0,7).replace('-','') + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Crear la orden en MySQL
    const orderData = {
      orderId: orderCode,
      userId,
      items: JSON.stringify(items),
      totalPrice,
      status: paymentId ? 'paid' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.query('INSERT INTO orders SET ?', [orderData]);
    // Obtener la orden recién creada
    const [orderRows] = await db.query('SELECT * FROM orders WHERE orderId = ?', [orderCode]);
    const order = orderRows[0];

    // Actualizar stock de cada producto
    for (const item of items) {
      const [inventoryRows] = await db.query('SELECT * FROM card_inventory WHERE id = ?', [item.id]);
      const inventoryItem = inventoryRows[0];
      if (inventoryItem) {
        const newStock = Math.max(0, inventoryItem.stock - item.quantity);
        await db.query('UPDATE card_inventory SET stock = ? WHERE id = ?', [newStock, item.id]);
      }
    }

    invalidateCache();

    // Enviar email de confirmación con Nodemailer
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: userEmail,
        subject: `Confirmación de orden ${orderCode}`,
        html: `<p>Hola ${userName || userEmail.split('@')[0]},<br>Tu orden <b>${orderCode}</b> ha sido creada.<br>Total: $${totalPrice}<br>Estado: ${order.status}</p>`,
      });
    } catch (emailError) {
      console.error('Error enviando email de confirmación:', emailError);
    }

    return res.status(201).json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error creando orden:', error);
    return res.status(500).json({
      error: 'Error interno al crear la orden',
      details: error.message,
    });
  }
}
