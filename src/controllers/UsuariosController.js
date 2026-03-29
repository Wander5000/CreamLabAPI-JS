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
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};

const postUser = async (req, res) => {
  const { NombreUsuario, Correo, Password, TipoDocumento, NumeroDocumento, Direccion, Rol } = req.body;
  try{

    // 1, 2, 3, 4, 5, 6 y 7:Validar que todos los campos estén presentes
    if (!NombreUsuario || !Correo || !Password || !TipoDocumento || !NumeroDocumento || !Direccion || !Rol) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    //8 y 9: Verificar el tamaño del Nombre de Usuario
    if( NombreUsuario.length < 3 || NombreUsuario.length > 50) {
      return res.status(400).json({ message: 'El nombre de usuario debe tener entre 3 y 50 caracteres' });
    }
    //10: Verificar el tamaño de la contraseña
    if( Password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }
    hashedPassword = await bcrypt.hash(Password, 10);
    //11: Enviar datos a la base de datos
    const { rowCount } = await pool.query(
      'INSERT INTO "Usuarios" ("NombreUsuario", "Correo", "Password", "TipoDocumento", "NumeroDocumento", "Direccion", "Rol", "Estado") VALUES ($1, $2, $3, $4, $5, $6, $7, true)',
      [NombreUsuario, Correo, hashedPassword, TipoDocumento, NumeroDocumento, Direccion, Rol]
    );
    //12: Verificar si la inserción fue exitosa
    if (rowCount === 0) {
      return res.status(400).json({ message: 'No se pudo crear el usuario' });
    }
    //13: Devolver el usuario creado
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  }catch (error) {
    //14: Manejar errores inesperados
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { NombreUsuario, Correo, TipoDocumento, NumeroDocumento, Direccion, Rol } = req.body;
  try {
    const { rowCount } = await pool.query(
      'UPDATE "Usuarios" SET "NombreUsuario" = $1, "Correo" = $2, "TipoDocumento" = $3, "NumeroDocumento" = $4, "Direccion" = $5, "Rol" = $6 WHERE "IdUsuario" = $7',
      [NombreUsuario, Correo, TipoDocumento, NumeroDocumento, Direccion, Rol, id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o no actualizado' });
    }
    res.status(200).json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el usuario' });
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
    res.status(500).json({ message: 'Error al actualizar el estado del usuario' });
  }
};

module.exports = { getAllUsers, postUser, updateUser,changeUserStatus };