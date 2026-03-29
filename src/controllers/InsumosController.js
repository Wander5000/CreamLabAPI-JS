const pool = require('../config/database.js');

const getAllInsumos = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT i."IdInsumo" AS "idInsumo", 
      i."NombreInsumo" AS "nombreInsumo",
      i."CategoriaInsumo" AS "idCategoriaInsumo", 
      c."NombreCatInsumo" AS "categoriaInsumo",
      i."PrecioUnidad" AS "precioUnitario",
      i."UnidadMedida" AS "unidadMedida", 
      i."Stock" AS "stock",
      i."CantidadUnidad" AS "cantidadUnidad"
      FROM "Insumos" AS i
      INNER JOIN "CategoriasInsumo" AS c
        ON i."CategoriaInsumo" = c."IdCatInsumo"
      ORDER BY i."IdInsumo"`);
    res.json(rows);
  } catch (error) {

    res.status(500).json({ message: 'Error al obtener los insumos', error });
  }
};

const postInsumo = async (req, res) => {
  const { NombreInsumo, CategoriaInsumo, PrecioUnidad, UnidadMedida, Stock, CantidadUnidad } = req.body;
  try {
    //1, 2, 3, 4, 5 y 6: Validar que todos los campos estén presentes
      if (!NombreInsumo || !CategoriaInsumo || !PrecioUnidad || !UnidadMedida || Stock === undefined || CantidadUnidad === undefined) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
      }
      //7 y 8: Verificar el tamaño del Nombre del Insumo y que el precio por unidad sea mayor a 0
      if (NombreInsumo.length < 3 || NombreInsumo.length > 50) {
        return res.status(400).json({ message: 'El nombre del insumo debe tener entre 3 y 50 caracteres' });
      }
      //9: Verificar que el precio por unidad sea mayor a 0
      if (PrecioUnidad <= 0) {
        return res.status(400).json({ message: 'El precio por unidad debe ser mayor a 0' });
      }
    //10: Enviar datos a la base de datos
    const { rowCount } = await pool.query(
      'INSERT INTO "Insumos" ("NombreInsumo", "CategoriaInsumo", "PrecioUnidad", "UnidadMedida", "Stock", "CantidadUnidad") VALUES ($1, $2, $3, $4, $5, $6)',
      [NombreInsumo, CategoriaInsumo, PrecioUnidad, UnidadMedida, Stock, CantidadUnidad]
    );
    //11: Verificar si la inserción fue exitosa
    if (rowCount === 0) {
      return res.status(400).json({ message: 'No se pudo crear el insumo' });
    }
    //12: Devolver el insumo creado
    res.status(201).json({ message: 'Insumo creado exitosamente' });
  } catch (error) {
    //13: Manejar errores inesperados
    res.status(500).json({ message: 'Error al crear el insumo', error });
  }
};

const putInsumo = async (req, res) => {
  const { id } = req.params;
  const { NombreInsumo, CategoriaInsumo, PrecioUnidad, UnidadMedida, Stock, CantidadUnidad } = req.body;
  try {
    const { rowCount } = await pool.query(
      'UPDATE "Insumos" SET "NombreInsumo" = $1, "CategoriaInsumo" = $2, "PrecioUnidad" = $3, "UnidadMedida" = $4, "Stock" = $5, "CantidadUnidad" = $6 WHERE "IdInsumo" = $7',
      [NombreInsumo, CategoriaInsumo, PrecioUnidad, UnidadMedida, Stock, CantidadUnidad, id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }
    res.status(204).json({ message: 'Insumo actualizado exitosamente' });
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
    res.status(204).json({ message: 'Insumo eliminado exitosamente' });
  }
  catch (error) {
    res.status(500).json({ message: 'Error al eliminar el insumo', error });
  }
};

module.exports = { getAllInsumos, postInsumo, putInsumo, deleteInsumo };