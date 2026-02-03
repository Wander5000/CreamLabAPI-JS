//Bibliotecas
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

//Llamado a las rutas
const AuthRouter = require('./routes/Auth');
const CarritoRouter = require('./routes/Carrito');
const CategoriasRouter = require('./routes/Categorias');
const CategoriasInsumoRouter = require('./routes/CategoriasInsumo');
const ClientesRouter = require('./routes/Clientes');
const EstadosRouter = require('./routes/Estados');
const InsumosRouter = require('./routes/Insumos');
const MisPedidosRouter = require('./routes/MisPedidos');
const PedidosRouter = require('./routes/Pedidos');
const ProductosRouter = require('./routes/Productos');
const RolesRouter = require('./routes/Roles');
const UsuariosRouter = require('./routes/Usuarios');
const VentasRouter = require('./routes/Ventas');

const app = express();
app.set('port', process.env.PORT || 3000);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());

// Rutas
app.get('/', (req, res) => { res.send('¡Bienvenido a la API de CreamLab!'); });
app.use('/api/Auth', AuthRouter);
app.use('/api/Carrito', CarritoRouter);
app.use('/api/Categorias', CategoriasRouter);
app.use('/api/Categorias-Insumo', CategoriasInsumoRouter);
app.use('/api/Clientes', ClientesRouter);
app.use('/api/Estados', EstadosRouter);
app.use('/api/Insumos', InsumosRouter);
app.use('/api/Mis-Pedidos', MisPedidosRouter);
app.use('/api/Pedidos', PedidosRouter);
app.use('/api/Productos', ProductosRouter);
app.use('/api/Roles', RolesRouter);
app.use('/api/Usuarios', UsuariosRouter);
app.use('/api/Ventas', VentasRouter);

app.listen(app.get('port'), () => {
  console.log(`Servidor escuchando en el puerto ${app.get('port')}`);
});