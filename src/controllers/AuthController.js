const pool = require('../config/database.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Register = async (req, res) => {
  const { NombreUsuario, Correo, Password, ConfirmPassword, TipoDocumento, NumeroDocumento, Direccion } = req.body;
  try{
    const userExists = await pool.query(
      'SELECT * FROM "Usuarios" WHERE "Correo" = $1',
      [Correo]
    );
    if(userExists.rowCount > 0){
      return res.status(401).json({ message: 'El correo ya está registrado' });
    }
    if(Password !== ConfirmPassword){
      return res.status(401).json({ message: 'Las contraseñas no coinciden' });
    }
    const hashedPassword = await bcrypt.hash(Password, 10);
    const result = await pool.query(
      'INSERT INTO "Usuarios" ("NombreUsuario", "Correo", "Password", "TipoDocumento", "NumeroDocumento", "Direccion", "Rol", "Estado") VALUES ($1, $2, $3, $4, $5, $6, 1, true) RETURNING *',
      [NombreUsuario, Correo, hashedPassword, TipoDocumento, NumeroDocumento, Direccion]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.IdUsuario, correo: user.Correo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.status(201).json({ message: 'Usuario registrado exitosamente', 
      id: user.IdUsuario, nombre: user.NombreUsuario,
      token 
    });
  }catch(error){
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el usuario'});
  }
};

const LogIn = async (req, res) => {
  const { Correo , Password } = req.body
  try{
    const result = await pool.query(
      'SELECT * FROM "Usuarios" WHERE "Correo" = $1',
      [Correo]
    );
    if(result.rows.length === 0){
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(Password, user.Password);
    if(!validPassword){
      return res.status(401).json({ error: 'Credenciales Invalidas' });
    }
    const token = jwt.sign(
      { id: user.IdUsuario, correo: user.Correo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
        res.status(200).json({ message: 'Login Exitoso', 
      user: { id: user.IdUsuario, nombre: user.NombreUsuario},
      token 
    });
  }catch(error){
    console.error(error);
    res.status(500).json({ message: 'Error al iniciar sesión', error });
  }
};

module.exports = { Register, LogIn };