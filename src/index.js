const express = require('express');
const cors = require('cors');
require('dotenv').config();
const ProductosRouter = require('./routes/Productos');

const app = express();
app.set('port', process.env.PORT || 3000);

// Middleware
app.use(express.json());
app.use(cors());

// Rutas
app.get('/', (req, res) => { res.send('¡Bienvenido a la API de CreamLab!'); });
app.use('/api/productos', ProductosRouter);

app.listen(app.get('port'), () => {
  console.log(`Servidor escuchando en el puerto ${app.get('port')}`);
});