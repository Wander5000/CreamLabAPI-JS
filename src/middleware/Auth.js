const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try{
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token Faltante' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  }catch(error){
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token Invalido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token Expirado' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error al verificar Token' });
  }
};

module.exports = { authMiddleware };