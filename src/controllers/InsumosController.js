const pool = require('../database.js');

const getAllInsumos = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM "Insumos"');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los insumos', error });
  }
};

const postInsumo = async (req, res) => {
  const { NombreInsumo, CategoriaInsumo, UnidadMedida, Stock } = req.body;
  try {
    const { rowCount } = await pool.query(
      'INSERT INTO "Insumos" ("NombreInsumo", "CategoriaInsumo", "UnidadMedida", "Stock") VALUES ($1, $2, $3, $4)',
      [NombreInsumo, CategoriaInsumo, UnidadMedida, Stock]
    );
    if (rowCount === 0) {
      return res.status(400).json({ message: 'No se pudo crear el insumo' });
    }
    res.status(201).json({ message: 'Insumo creado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el insumo', error });
  }
};

const putInsumo = async (req, res) => {
  const { id } = req.params;
  const { NombreInsumo, CategoriaInsumo, UnidadMedida, Stock } = req.body;
  try {
    const { rowCount } = await pool.query(
      'UPDATE "Insumos" SET "NombreInsumo" = $1, "CategoriaInsumo" = $2, "UnidadMedida" = $3, "Stock" = $4 WHERE "IdInsumo" = $5',
      [NombreInsumo, CategoriaInsumo, UnidadMedida, Stock, id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }
    res.json({ message: 'Insumo actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el insumo', error });
  }
};

const deleteInsumo = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM "Insumos" WHERE "IdInsumo" = $1',
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }
    res.json({ message: 'Insumo eliminado exitosamente' });
  }
  catch (error) {
    res.status(500).json({ message: 'Error al eliminar el insumo', error });
  }
};

module.exports = { getAllInsumos, postInsumo, putInsumo, deleteInsumo };