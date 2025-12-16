const pool = require('../config/database.js');

const getCarrito = async (req, res) => {
  const { idUsuario } = req.user;
  try {
    // Consulta con JOIN para obtener venta y detalles
    const { rows } = await pool.query(
      `SELECT 
        t."IdVenta", 
        t."Descuento", 
        t."Estado", 
        t."Fecha", 
        t."MetodoPago", 
        t."Observaciones", 
        t."Total", 
        t."Usuario", 
        d."IdDetalle", 
        d."Cantidad", 
        d."PrecioUnidad", 
        d."Producto", 
        d."Subtotal", 
        d."Venta"
      FROM (
        SELECT 
          v."IdVenta", 
          v."Descuento", 
          v."Estado", 
          v."Fecha", 
          v."MetodoPago", 
          v."Observaciones", 
          v."Total", 
          v."Usuario"
        FROM "Ventas" AS v
        WHERE v."Usuario" = $1 AND v."Estado" = 1
        LIMIT 1
      ) AS t
      LEFT JOIN "DetallesVenta" AS d ON t."IdVenta" = d."Venta"
      ORDER BY t."IdVenta"`,
      [idUsuario]
    );

    // Si existe una venta (carrito)
    if (rows.length > 0) {
      // Transformar los datos al formato requerido
      const carrito = {
        idVenta: rows[0].IdVenta,
        usuario: rows[0].Usuario,
        fecha: rows[0].Fecha,
        metodoPago: rows[0].MetodoPago,
        descuento: rows[0].Descuento,
        total: rows[0].Total,
        detalles: rows[0].IdDetalle 
          ? rows.map(row => ({
              idDetalle: row.IdDetalle,
              producto: row.Producto,
              cantidad: row.Cantidad,
              precioUnitario: row.PrecioUnidad,
              subtotal: row.Subtotal
            }))
          : []
      };
      
      return res.json(carrito);
    }

    // Si no existe, crear un nuevo carrito
    const fecha = new Date();
    const crearCarro = await pool.query(
      'INSERT INTO "Ventas" ("Usuario", "Fecha", "MetodoPago", "Descuento", "Total", "Observaciones", "Estado") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [idUsuario, fecha, 'N/A', 0, 0, null, 1]
    );

    // Retornar el carrito nuevo con detalles vacíos
    const nuevoCarrito = {
      idVenta: crearCarro.rows[0].IdVenta,
      usuario: crearCarro.rows[0].Usuario,
      fecha: crearCarro.rows[0].Fecha,
      metodoPago: crearCarro.rows[0].MetodoPago,
      descuento: crearCarro.rows[0].Descuento,
      total: crearCarro.rows[0].Total,
      detalles: []
    };

    res.json(nuevoCarrito);
  } catch (error) {
    console.error('Error al obtener el carrito:', error);
    res.status(500).json({ message: 'Error al obtener el carrito', error: error.message });
  }
};

const agregarProducto = async (req, res) => {
  const { idUsuario } = req.user;
  const { idProducto, cantidad } = req.query;
  
  const client = await pool.connect(); // Obtener cliente para transacción
  
  try {
    await client.query('BEGIN'); // Iniciar transacción
    
    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return res.status(400).json({ message: 'Cantidad inválida' });
    }

    // Verificar que el producto existe y obtener info
    const producto = await client.query(
      'SELECT "PrecioUnidad", "Stock" FROM "Productos" WHERE "IdProducto" = $1',
      [idProducto]
    );
    
    if (!producto.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Obtener o crear carrito
    let carrito = await client.query(
      'SELECT * FROM "Ventas" WHERE "Usuario" = $1 AND "Estado" = 1',
      [idUsuario]
    );
    
    if (!carrito.rows[0]) {
      const crearCarro = await client.query(
        'INSERT INTO "Ventas" ("Usuario", "Fecha", "MetodoPago", "Descuento", "Total", "Observaciones", "Estado") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', 
        [idUsuario, new Date(), 'N/A', 0, 0, null, 1]
      );
      carrito = crearCarro;
    }

    const yaExiste = await client.query(
      'SELECT * FROM "DetallesVenta" WHERE "Venta" = $1 AND "Producto" = $2',
      [carrito.rows[0].IdVenta, idProducto]
    );

    let diferenciaTotal = 0;
    let resultado = null;

    if (!yaExiste.rows[0]) {
      // Producto nuevo
      if (producto.rows[0].Stock < cantidadNum) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Stock insuficiente' });
      }
      
      const subtotal = producto.rows[0].PrecioUnidad * cantidadNum;
      diferenciaTotal = subtotal;

      const agregarProducto = await client.query(
        'INSERT INTO "DetallesVenta" ("Venta", "Producto", "Cantidad", "PrecioUnidad", "Subtotal") VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [carrito.rows[0].IdVenta, idProducto, cantidadNum, producto.rows[0].PrecioUnidad, subtotal]
      );
      resultado = agregarProducto.rows[0];
    } else {
      // Producto existe - actualizar
      const nuevaCantidad = yaExiste.rows[0].Cantidad + cantidadNum;
      
      if (producto.rows[0].Stock < nuevaCantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Stock insuficiente' });
      }
      
      const subtotalAnterior = yaExiste.rows[0].Subtotal;
      const nuevoSubtotal = nuevaCantidad * yaExiste.rows[0].PrecioUnidad;
      diferenciaTotal = nuevoSubtotal - subtotalAnterior; // CORRECCIÓN CLAVE

      const actualizarDetalle = await client.query(
        'UPDATE "DetallesVenta" SET "Cantidad" = $1, "Subtotal" = $2 WHERE "IdDetalle" = $3 RETURNING *',
        [nuevaCantidad, nuevoSubtotal, yaExiste.rows[0].IdDetalle]
      );
      resultado = actualizarDetalle.rows[0];
    }
    
    // Actualizar total con la diferencia
    await client.query(
      'UPDATE "Ventas" SET "Total" = "Total" + $1 WHERE "IdVenta" = $2',
      [diferenciaTotal, carrito.rows[0].IdVenta]
    );
    
    await client.query('COMMIT'); // Confirmar transacción
    
    res.status(200).json({
      message: 'Producto agregado al carrito exitosamente',
      detalle: resultado
    });
    
  } catch (error) {
    await client.query('ROLLBACK'); // Revertir en caso de error
    console.error('Error al agregar producto:', error);
    res.status(500).json({ message: 'Error al agregar el producto al carrito', error: error.message });
  } finally {
    client.release(); // Liberar conexión
  }
}

module.exports = { getCarrito , agregarProducto };