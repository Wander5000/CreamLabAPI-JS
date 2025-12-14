//Bibliotecas
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

//Llamado a las rutas
const AuthRouter = require('./routes/Auth');
const CategoriasRouter = require('./routes/Categorias');
const ClientesRouter = require('./routes/Clientes');
const EstadosRouter = require('./routes/Estados');
const InsumosRouter = require('./routes/Insumos');
const PedidosRouter = require('./routes/Pedidos');
const ProductosRouter = require('./routes/Productos');
const RolesRouter = require('./routes/Roles');
const UsuariosRouter = require('./routes/Usuarios');
const VentasRouter = require('./routes/Ventas');

const app = express();
app.set('port', process.env.PORT || 3000);

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Rutas
app.get('/', (req, res) => { res.send('¡Bienvenido a la API de CreamLab!'); });
app.use('/api/Auth', AuthRouter);
app.use('/api/Categorias', CategoriasRouter);
app.use('/api/Clientes', ClientesRouter);
app.use('/api/Estados', EstadosRouter);
app.use('/api/Insumos', InsumosRouter);
app.use('/api/Pedidos', PedidosRouter);
app.use('/api/Productos', ProductosRouter);
app.use('/api/Roles', RolesRouter);
app.use('/api/Usuarios', UsuariosRouter);
app.use('/api/Ventas', VentasRouter);

app.listen(app.get('port'), () => {
  console.log(`Servidor escuchando en el puerto ${app.get('port')}`);
});