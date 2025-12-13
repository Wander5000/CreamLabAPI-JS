const express = require('express');
const cors = require('cors');
require('dotenv').config();
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
app.use(cors());

// Rutas
app.get('/', (req, res) => { res.send('¡Bienvenido a la API de CreamLab!'); });
app.use('/api/categorias', CategoriasRouter);
app.use('/api/clientes', ClientesRouter);
app.use('/api/estados', EstadosRouter);
app.use('/api/insumos', InsumosRouter);
app.use('/api/pedidos', PedidosRouter);
app.use('/api/productos', ProductosRouter);
app.use('/api/roles', RolesRouter);
app.use('/api/usuarios', UsuariosRouter);
app.use('/api/ventas', VentasRouter);

app.listen(app.get('port'), () => {
  console.log(`Servidor escuchando en el puerto ${app.get('port')}`);
});