const pool = require('../config/database.js');

const getAllProducts = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM "Productos"');
    res.json(rows);
  }catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos', error });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM "Productos" WHERE "IdProducto" = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado u Inexistente' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto', error });
  }
};

module.exports = { getAllProducts, getProductById };