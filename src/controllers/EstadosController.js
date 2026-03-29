const pool = require('../config/database.js');

const getAllStates = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT e."IdEstado" AS "idEstado", e."NombreEstado" AS "nombreEstado" FROM "Estados" AS e ORDER BY e."IdEstado"');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los estados', error });
  }
};

const postState = async (req, res) => {
  const { NombreEstado } = req.body;
  try {
    //1 Validar si se proporcionó el nombre del estado
    if (!NombreEstado) {
      return res.status(400).json({ message: 'El nombre del estado es requerido' });
    }
    //2 Validar longitud del nombre del estado
    if (NombreEstado.length < 3) {
      return res.status(400).json({ message: 'El nombre del estado debe tener al menos 3 caracteres' });
    }
    //3 Insertar el estado en la base de datos
    const { rowCount } = await pool.query(
      'INSERT INTO "Estados" ("NombreEstado") VALUES ($1)',
      [NombreEstado]
    );
    //4 Verificar si se insertó el estado
    if (rowCount === 0) {
      return res.status(400).json({ message: 'No se pudo crear el estado' });
    }
    //5 Devolver una respuesta exitosa
    res.status(201).json({ message: 'Estado creado exitosamente' });
  } catch (error) {
    //6 Manejar errores inesperados
    res.status(500).json({ message: 'Error al crear el estado', error });
  }
};

const putState = async (req, res) => {
  const { id } = req.params;
  const { NombreEstado } = req.body;
  try {
    const { rowCount } = await pool.query(
      'UPDATE "Estados" SET "NombreEstado" = $1 WHERE "IdEstado" = $2',
      [NombreEstado, id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Estado no encontrado' });
    }
    res.status(204).json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el estado', error });
  }
};

const deleteState = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM "Estados" WHERE "IdEstado" = $1',
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Estado no encontrado' });
    }
    res.status(204).json({ message: 'Estado eliminado exitosamente' });
  }
  catch (error) {
    res.status(500).json({ message: 'Error al eliminar el estado', error });
  }
};

module.exports = { getAllStates, postState, putState, deleteState };