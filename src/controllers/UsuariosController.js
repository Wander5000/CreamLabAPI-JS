const pool = require('../config/database.js');
const bcrypt = require('bcrypt');


const getAllUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        u."IdUsuario" AS "idUsuario",
        u."NombreUsuario" AS "nombreUsuario",
        u."Correo" AS "correo",
        u."TipoDocumento" AS "tipoDocumento",
        u."NumeroDocumento" AS "numeroDocumento",
        u."Direccion" AS "direccion",
        r."NombreRol" AS "rol",
        u."Estado" AS "estado"
      FROM "Usuarios" AS u
      INNER JOIN "Roles" AS r ON u."Rol" = r."IdRol"
      WHERE u."Rol" <> 1
      ORDER BY u."IdUsuario"
    `);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};

const postUser = async (req, res) => {
  const { NombreUsuario, Correo, Password, TipoDocumento, NumeroDocumento, Direccion, Rol } = req.body;
  try{
    hashedPassword = await bcrypt.hash(Password, 10);
    const { rowCount } = await pool.query(
      'INSERT INTO "Usuarios" ("NombreUsuario", "Correo", "Password", "TipoDocumento", "NumeroDocumento", "Direccion", "Rol", "Estado") VALUES ($1, $2, $3, $4, $5, $6, $7, true)',
      [NombreUsuario, Correo, hashedPassword, TipoDocumento, NumeroDocumento, Direccion, Rol]
    );
    if (rowCount === 0) {
      return res.status(400).json({ message: 'No se pudo crear el usuario' });
    }
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  }catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
};

const changeUserStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE "Usuarios" SET "Estado" = NOT "Estado" WHERE "IdUsuario" = $1',
      [id]
    );
    const { rowCount } = rows;
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(204).json({ message: 'Estado del usuario actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el estado del usuario' });
  }
};

module.exports = { getAllUsers, postUser, changeUserStatus };