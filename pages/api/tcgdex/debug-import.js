
import db from '../../../lib/db';

export default async function handler(req, res) {
  try {
    // Test MySQL connection
    const [inventory] = await db.query('SELECT * FROM inventory');
    res.status(200).json({
      status: 'ok',
      database: 'MySQL',
      inventoryCount: inventory ? inventory.length : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack,
    });
  }
}
