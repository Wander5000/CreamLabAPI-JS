const pool = require('../database.js');

const getAllProducts = async (req, res) => {
  try {
    const response = await pool.query('SELECT * FROM "Productos"');
    res.json(response.rows);
  }catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos', error });
  }
};

module.exports = { getAllProducts };