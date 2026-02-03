const pool = require('../config/database.js');

const getAllCategories = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        c."IdCategoria" AS "idCategoria", 
        c."NombreCategoria" AS "nombreCategoria", 
        c."Descripcion" AS "descripcion"
      FROM "Categorias" AS c
      ORDER BY c."IdCategoria"
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las categorías', error });
  }
};

const postCategory = async (req, res) => {
  const { NombreCategoria, Descripcion } = req.body;
  try {

    // 1 y 2: Validar que los campos requeridos estén presentes
    if (!NombreCategoria || !Descripcion) {
      return res.status(400).json({ message: 'Faltan campos requeridos: NombreCategoria, Descripcion' });
    }
    // 3 y 4: Validar la longitud del nombre de la categoría
    if (NombreCategoria.length < 3) {
      return res.status(400).json({ message: 'El nombre de la categoría debe tener al menos 3 caracteres' });
    }else if (NombreCategoria.length > 15) {
      return res.status(400).json({ message: 'El nombre de la categoría no puede exceder los 15 caracteres' });
    }
    // 5 y 6: Validar la longitud de la descripción de la categoría
    if (Descripcion.length < 10) {
      return res.status(400).json({ message: 'La descripción de la categoría debe tener al menos 10 caracteres' });
    }else if (Descripcion.length > 200) {
      return res.status(400).json({ message: 'La descripción de la categoría no puede exceder los 200 caracteres' });
    }
    // 7: Insertar la categoría en la base de datos
    const { rowCount } = await pool.query(
      'INSERT INTO "Categorias" ("NombreCategoria", "Descripcion") VALUES ($1, $2)',
      [NombreCategoria, Descripcion]
    );
    // 8: Verificar si la inserción fue exitosa
    if (rowCount === 0) {
      return res.status(400).json({ message: 'No se pudo crear la categoría' });
    }
    // 9: Devolver la categoría creada
    res.status(201).json({ message: 'Categoría creada exitosamente' });
  } catch (error) {
    // 10: Manejar errores inesperados
    res.status(500).json({ message: 'Error al crear la categoría', error });
  }
};

const putCategory = async (req, res) => {
  const { id } = req.params;
  const { NombreCategoria, Descripcion } = req.body;
  try {
    const { rowCount } = await pool.query(
      'UPDATE "Categorias" SET "NombreCategoria" = $1, "Descripcion" = $2 WHERE "IdCategoria" = $3',
      [NombreCategoria, Descripcion, id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.status(204).json({ message: 'Categoría actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la categoría', error });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM "Categorias" WHERE "IdCategoria" = $1',
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.status(204).json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la categoría', error });
  }
};

module.exports = { getAllCategories, postCategory, putCategory, deleteCategory };