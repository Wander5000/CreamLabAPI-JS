const pool = require('../config/database.js');

const getAllPedidos = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM "Ventas" WHERE ("Estado" <> 1 AND "Estado" <> 4 AND "Estado" <> 5) ');
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los pedidos' });
  }
};

const getPedidoById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM "Ventas" WHERE "IdVenta" = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el pedido' });
  }
};

const getPedidosByClientId = async (req, res) => {
  const { clientId } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM "Ventas" WHERE "IdCliente" = $1', [clientId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron pedidos para este cliente' });
    }
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los pedidos del cliente' });
  }
};

const postPedido = async (req, res) => {
  const transaction = await pool.connect();
  try {
    await transaction.query('BEGIN');
    const { Usuario, MetodoPago, Descuento, Observaciones, Estado, Detalles } = req.body;

    const productosIDs = Detalles.map(detalle => detalle.Producto);
    const queryProductos = 'SELECT "IdProducto", "PrecioUnidad", "Stock" FROM "Productos" WHERE "IdProducto" = ANY($1)';
    const resultProductos = await transaction.query(queryProductos, [productosIDs]);
    const productosMap = {};
    resultProductos.rows.forEach(row => {
        productosMap[row.IdProducto] = { PrecioUnidad: parseFloat(row.PrecioUnidad), Stock: parseInt(row.Stock) };
    });

    const erroresStock = [];
    for (const detalle of Detalles) {
      const producto = productosMap[detalle.Producto];
      if (!producto) {
        erroresStock.push(`Producto ID ${detalle.Producto} no encontrado.`);
        continue;
      }
      if (producto.Stock < detalle.Cantidad) {
        erroresStock.push(`Stock Insuficiente ${detalle.Producto}. ` +
          `Disponible: ${producto.Stock}, Solicitado: ${detalle.Cantidad}`
        );
      }
    }

    if(erroresStock.length > 0){
      await transaction.query('ROLLBACK');
      return res.status(400).json({error: 'Problemas de Stock', detalles: erroresStock});
    }

    let totalPedido = 0;
    const detallesconSubtotal = Detalles.map(detalle => {
      const producto = productosMap[detalle.Producto];
      const subtotal = producto.PrecioUnidad * detalle.Cantidad;
      totalPedido += subtotal;

      return {
        producto: detalle.Producto,
        cantidad: detalle.Cantidad,
        precio_unidad: producto.PrecioUnidad,
        subtotal: subtotal 
      };
    });

    const descuentoAplicado = Descuento || 0;
    const totalconDescuento = totalPedido - (totalPedido * (descuentoAplicado / 100));

    const queryPedido = `INSERT INTO "Ventas" ("Usuario", "Fecha", "MetodoPago", "Descuento", "Total", "Observaciones", "Estado") VALUES ($1, NOW(), $2, $3, $4, $5, $6) RETURNING "IdVenta"`;
    const resultPedido = await transaction.query(queryPedido, [Usuario, MetodoPago, Descuento, totalconDescuento, Observaciones, Estado]);

    const ventaID = resultPedido.rows[0].IdVenta;

    const queryDetalle = `INSERT INTO "DetallesVenta" ("Venta", "Producto", "Cantidad", "PrecioUnidad", "Subtotal") VALUES($1, $2, $3, $4, $5)`;
    const queryActualizarStock = `UPDATE "Productos" SET "Stock" = "Stock" - $1 WHERE "IdProducto" = $2`;

    for(const detalle of detallesconSubtotal){
      await transaction.query(queryDetalle, [ventaID, detalle.producto, detalle.cantidad, detalle.precio_unidad, detalle.subtotal]);
      await transaction.query(queryActualizarStock, [detalle.cantidad, detalle.producto]);
    }

    await transaction.query('COMMIT');

    res.status(201).json({mensaje: "Pedido Creado Exitosamente", idVenta: ventaID});
  } catch (error) {
    await transaction.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error al crear el pedido' });
  } finally {
    transaction.release();
  }
};

const putPedido = async (req, res) => {
  const { id } = req.params;
  const {  Observaciones, Estado } = req.body;
  try {
    await pool.query('UPDATE "Ventas" SET "Observaciones" = $1, "Estado" = $2 WHERE "IdVenta" = $3',
      [Observaciones, Estado, id]);
    res.status(200).json({ message: 'Pedido actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el pedido' });
  }
};

const anularPedido = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE "Ventas" SET "Estado" = $1 WHERE "IdVenta" = $2',
      [3, id]);
    res.status(200).json({ message: 'Pedido anulado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al anular el pedido' });
  }
};

module.exports = { getAllPedidos, getPedidoById, getPedidosByClientId, postPedido, putPedido, anularPedido };
