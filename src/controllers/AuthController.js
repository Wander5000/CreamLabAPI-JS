const pool = require('../config/database.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Register = async (req, res) => {
  const { nombreUsuario, correo, password, confirmPassword, tipoDocumento, numeroDocumento, direccion } = req.body;
  
  try {
    // Verificar si el correo ya existe
    const userExists = await pool.query(
      'SELECT * FROM "Usuarios" WHERE "Correo" = $1',
      [correo]
    );
    
    if (userExists.rowCount > 0) {
      return res.status(401).json({ 
        isSuccess: false,
        message: 'El correo ya está registrado' 
      });
    }
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return res.status(401).json({ 
        isSuccess: false,
        message: 'Las contraseñas no coinciden' 
      });
    }
    
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertar el nuevo usuario
    const result = await pool.query(
      'INSERT INTO "Usuarios" ("NombreUsuario", "Correo", "Password", "TipoDocumento", "NumeroDocumento", "Direccion", "Rol", "Estado") VALUES ($1, $2, $3, $4, $5, $6, 1, true) RETURNING *',
      [nombreUsuario, correo, hashedPassword, tipoDocumento, numeroDocumento, direccion]
    );
    
    const user = result.rows[0];
    
    // Generar el token JWT
    const token = jwt.sign(
      { idUsuario: user.IdUsuario, correo: user.Correo, nombreUsuario: user.NombreUsuario, rol: String(user.Rol) },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Respuesta exitosa
    res.status(201).json({ 
      isSuccess: true,
      message: 'Usuario registrado exitosamente',
      user: user.NombreUsuario,
      token 
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      isSuccess: false,
      message: 'Error al registrar el usuario'
    });
  }
};

const LogIn = async (req, res) => {
  const { correo, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT u."IdUsuario", u."Correo", u."Direccion", u."Estado", u."NombreUsuario", 
              u."NumeroDocumento", u."Password", u."Rol", u."TipoDocumento"
        FROM "Usuarios" AS u
        WHERE u."Correo" = $1
        LIMIT 1`,
      [correo]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.Password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign(
      { idUsuario: user.IdUsuario, correo: user.Correo, nombreUsuario: user.NombreUsuario, rol: String(user.Rol) },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(200).json({
      isSuccess: true,
      message: 'Ingresaste con Exito',
      user: user.NombreUsuario,
      token 
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

module.exports = { Register, LogIn };