/**
 * API para obtener estadísticas de ventas
 * GET /api/admin/stats
 * Solo accesible por superadmin
 */

const db = require('../../../lib/db').default || require('../../../lib/db');
const middleware = require('../../../lib/middleware.js');
const auth = require('../../../lib/auth.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticación y rol
    let userRole = null;
    
    // Intentar con adminToken primero
    const session = await middleware.requireAuth(req, res);
    if (session) {
      const adminUser = await auth.getAdminByUsername(session.username);
      if (adminUser) {
        userRole = adminUser.role;
      }
    }
    
    // Si no hay adminToken, intentar con userToken
    if (!userRole) {
      const cookie = req.headers.cookie || '';
      const userTokenMatch = cookie.match(/userToken=([^;]+)/);
      if (userTokenMatch) {
        const userToken = userTokenMatch[1];
        // Aquí deberías buscar la sesión en la tabla UserSession de MySQL si la tienes
        // Y luego buscar el usuario por ID
        // Y luego buscar el admin por email
      }
    }
    
    // Solo superadmin puede ver estadísticas
    if (userRole !== 'superadmin') {
      return res.status(403).json({ error: 'Acceso denegado. Solo superadmin puede ver estadísticas.' });
    }
    // Obtener todas las órdenes
    const [orders] = await db.query('SELECT * FROM orders ORDER BY createdAt DESC LIMIT 1000');
    
    // Fechas para filtros
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Filtrar órdenes por período
    const ordersToday = orders.filter(o => new Date(o.createdAt) >= startOfToday);
    const ordersMonth = orders.filter(o => new Date(o.createdAt) >= startOfMonth);
    const ordersYear = orders.filter(o => new Date(o.createdAt) >= startOfYear);

    // Calcular ingresos
    const calculateRevenue = (orderList) => {
      return orderList.reduce((sum, order) => {
        const total = parseFloat(order.totalPrice) || 0;
        return sum + total;
      }, 0);
    };

    // Calcular cartas vendidas
    const calculateCardsSold = (orderList) => {
      return orderList.reduce((sum, order) => {
        try {
          const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          if (Array.isArray(items)) {
            return sum + items.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0);
          }
        } catch (e) {
          console.error('Error parsing items:', e);
        }
        return sum;
      }, 0);
    };

    // Top cartas vendidas (todas las órdenes)
    const cardSales = {};
    for (const order of orders) {
      try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        if (Array.isArray(items)) {
          for (const item of items) {
            const key = item.name || item.id;
            if (!cardSales[key]) {
              cardSales[key] = {
                id: item.id,
                name: item.name || 'Sin nombre',
                image: item.image || item.imageUrl,
                set: item.set,
                quantity: 0,
                revenue: 0,
              };
            }
            cardSales[key].quantity += item.quantity || 1;
            cardSales[key].revenue += (item.price || 0) * (item.quantity || 1);
          }
        }
      } catch (e) {
        console.error('Error processing order items:', e);
      }
    }

    // Ordenar por cantidad vendida
    const topCards = Object.values(cardSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Ventas por día (últimos 7 días)
    const salesByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate < dayEnd;
      });

      salesByDay.push({
        date: dayStart.toISOString().split('T')[0],
        dayName: dayStart.toLocaleDateString('es-CL', { weekday: 'short' }),
        orders: dayOrders.length,
        revenue: calculateRevenue(dayOrders),
        cardsSold: calculateCardsSold(dayOrders),
      });
    }

    // Estados de órdenes
    const orderStatuses = {
      pending: orders.filter(o => o.status === 'pending').length,
      paid: orders.filter(o => o.status === 'paid').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    const stats = {
      // Resumen general
      totalOrders: orders.length,
      totalRevenue: calculateRevenue(orders),
      totalCardsSold: calculateCardsSold(orders),

      // Hoy
      ordersToday: ordersToday.length,
      revenueToday: calculateRevenue(ordersToday),
      cardsSoldToday: calculateCardsSold(ordersToday),

      // Este mes
      ordersMonth: ordersMonth.length,
      revenueMonth: calculateRevenue(ordersMonth),
      cardsSoldMonth: calculateCardsSold(ordersMonth),

      // Este año
      ordersYear: ordersYear.length,
      revenueYear: calculateRevenue(ordersYear),
      cardsSoldYear: calculateCardsSold(ordersYear),

      // Top cartas
      topCards,

      // Ventas por día
      salesByDay,

      // Estados de órdenes
      orderStatuses,

      // Promedio por orden
      averageOrderValue: orders.length > 0 ? calculateRevenue(orders) / orders.length : 0,
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
