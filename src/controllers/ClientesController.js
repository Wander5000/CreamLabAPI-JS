const pool = require('../config/database.js');
const bcrypt = require('bcrypt');

const getAllClients = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT "IdUsuario", "NombreUsuario", "Correo", "TipoDocumento", "NumeroDocumento", "Direccion", "Estado" FROM "Usuarios" WHERE "Rol" = 1 ');
    res.status(200).json(rows);
  }catch(error){
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los clientes' });
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

module.exports = { getAllClients, postClient, changeClientStatus };