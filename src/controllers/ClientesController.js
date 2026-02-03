const pool = require('../config/database.js');
const bcrypt = require('bcrypt');

const getAllClients = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        u."IdUsuario" AS "idUsuario",
        u."NombreUsuario" AS "nombreUsuario",
        u."Correo" AS "correo",
        u."TipoDocumento" AS "tipoDocumento",
        u."NumeroDocumento" AS "numeroDocumento",
        u."Direccion" AS "direccion",
        u."Estado" AS "estado"
      FROM "Usuarios" AS u
      WHERE u."Rol" = 1
      ORDER BY u."IdUsuario"
    `);
    
    res.status(200).json(rows);
  } catch(error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ 
      message: 'Error al obtener los clientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const postClient = async (req, res) => {
  const { NombreUsuario, Correo, Password, TipoDocumento, NumeroDocumento, Direccion } = req.body;
  try{
    hashedPassword = await bcrypt.hash(Password, 10);
    const { rowCount } = await pool.query(
      'INSERT INTO "Usuarios" ("NombreUsuario", "Correo", "Password", "TipoDocumento", "NumeroDocumento", "Direccion", "Rol", "Estado") VALUES ($1, $2, $3, $4, $5, $6, 1, true)',
      [NombreUsuario, Correo, hashedPassword, TipoDocumento, NumeroDocumento, Direccion]
    );
    if (rowCount === 0) {
      return res.status(400).json({ message: 'No se pudo crear el cliente' });
    }
    res.status(201).json({ message: 'Cliente creado exitosamente' });
  }catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el cliente' });
  }
};

const updateClient = async (req, res) => {
  const { id } = req.params;
  const { NombreCliente, Correo, TipoDocumento, NumeroDocumento, Direccion, Rol } = req.body;

  try {
    const { rowCount } = await pool.query(
      'UPDATE "Usuarios" SET "NombreUsuario" = $1, "Correo" = $2, "TipoDocumento" = $3, "NumeroDocumento" = $4, "Direccion" = $5, "Rol" = $6 WHERE "IdUsuario" = $7',
      [NombreCliente, Correo, TipoDocumento, NumeroDocumento, Direccion, Rol, id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado o no actualizado' });
    }
    res.status(200).json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el cliente' });
  }
};

const changeClientStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE "Usuarios" SET "Estado" = NOT "Estado" WHERE "IdUsuario" = $1',
      [id]
    );
    const { rowCount } = rows;
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.status(204).json({ message: 'Estado del cliente actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el estado del cliente' });
  }
};

module.exports = { getAllClients, postClient, updateClient, changeClientStatus };