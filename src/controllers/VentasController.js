const pool = require('../config/database.js');

const getAllVentas = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        v."IdVenta", 
        u."NombreUsuario", 
        v."Fecha", 
        v."MetodoPago", 
        v."Descuento", 
        v."Total", 
        v."Observaciones", 
        e."NombreEstado", 
        u."IdUsuario", 
        e."IdEstado", 
        t."IdDetalle", 
        t."Producto", 
        t."Cantidad", 
        t."PrecioUnitario", 
        t."Subtotal", 
        t."IdProducto"
      FROM "Ventas" AS v
      INNER JOIN "Usuarios" AS u 
        ON v."Usuario" = u."IdUsuario"
      INNER JOIN "Estados" AS e 
        ON v."Estado" = e."IdEstado"
      LEFT JOIN (
        SELECT 
          d."IdDetalle", 
          p."NombreProducto" AS "Producto", 
          d."Cantidad", 
          d."PrecioUnidad" AS "PrecioUnitario", 
          d."Subtotal", 
          p."IdProducto", 
          d."Venta"
        FROM "DetallesVenta" AS d
        INNER JOIN "Productos" AS p 
          ON d."Producto" = p."IdProducto"
      ) AS t 
        ON v."IdVenta" = t."Venta"
      WHERE v."Estado" NOT IN (1, 2, 3)
      ORDER BY v."IdVenta", t."IdDetalle"
    `);

    // Agrupar los resultados
    const ventasMap = new Map();

    rows.forEach(row => {
      const idVenta = row.IdVenta;
      
      // Si la venta no existe en el Map, la creamos
      if (!ventasMap.has(idVenta)) {
        ventasMap.set(idVenta, {
          idVenta: row.IdVenta,
          usuario: row.NombreUsuario,
          fecha: row.Fecha,
          metodoPago: row.MetodoPago,
          descuento: row.Descuento,
          total: row.Total,
          observaciones: row.Observaciones,
          estado: row.NombreEstado,
          detalles: []
        });
      }
      
      // Agregar el detalle si existe
      if (row.IdDetalle) {
        ventasMap.get(idVenta).detalles.push({
          idDetalle: row.IdDetalle,
          producto: row.Producto,
          cantidad: row.Cantidad,
          precioUnitario: row.PrecioUnitario,
          subtotal: row.Subtotal
        });
      }
    });

    // Convertir el Map a array
    const ventas = Array.from(ventasMap.values());

    res.status(200).json(ventas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las ventas' });
  }
};

const getVentabyId = async (req, res) => {
  const { id_venta } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT 
        v."IdVenta", 
        u."NombreUsuario", 
        v."Fecha", 
        v."MetodoPago", 
        v."Descuento", 
        v."Total", 
        v."Observaciones", 
        e."NombreEstado", 
        u."IdUsuario", 
        e."IdEstado", 
        t."IdDetalle", 
        t."Producto", 
        t."Cantidad", 
        t."PrecioUnitario", 
        t."Subtotal", 
        t."IdProducto"
      FROM "Ventas" AS v
      INNER JOIN "Usuarios" AS u 
        ON v."Usuario" = u."IdUsuario"
      INNER JOIN "Estados" AS e 
        ON v."Estado" = e."IdEstado"
      LEFT JOIN (
        SELECT 
          d."IdDetalle", 
          p."NombreProducto" AS "Producto", 
          d."Cantidad", 
          d."PrecioUnidad" AS "PrecioUnitario", 
          d."Subtotal", 
          p."IdProducto", 
          d."Venta"
        FROM "DetallesVenta" AS d
        INNER JOIN "Productos" AS p 
          ON d."Producto" = p."IdProducto"
      ) AS t 
        ON v."IdVenta" = t."Venta"
      WHERE v."IdVenta" = $1
      ORDER BY t."IdDetalle"
    `, [id_venta]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Agrupar el resultado (solo habrá una venta)
    const venta = {
      idVenta: rows[0].IdVenta,
      usuario: rows[0].NombreUsuario,
      fecha: rows[0].Fecha,
      metodoPago: rows[0].MetodoPago,
      descuento: rows[0].Descuento,
      total: rows[0].Total,
      observaciones: rows[0].Observaciones,
      estado: rows[0].NombreEstado,
      detalles: []
    };

    // Agregar todos los detalles
    rows.forEach(row => {
      if (row.IdDetalle) {
        venta.detalles.push({
          idDetalle: row.IdDetalle,
          producto: row.Producto,
          cantidad: row.Cantidad,
          precioUnitario: row.PrecioUnitario,
          subtotal: row.Subtotal
        });
      }
    });

    res.status(200).json(venta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la venta' });
  }
};

const postVenta = async (req, res) => {
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

    let totalVenta = 0;
    const detallesconSubtotal = Detalles.map(detalle => {
      const producto = productosMap[detalle.Producto];
      const subtotal = producto.PrecioUnidad * detalle.Cantidad;
      totalVenta += subtotal;

      return {
        producto: detalle.Producto,
        cantidad: detalle.Cantidad,
        precio_unidad: producto.PrecioUnidad,
        subtotal: subtotal 
      };
    });

    const descuentoAplicado = Descuento || 0;
    const totalconDescuento = totalVenta - (totalVenta * (descuentoAplicado / 100));

    const queryVenta = `INSERT INTO "Ventas" ("Usuario", "Fecha", "MetodoPago", "Descuento", "Total", "Observaciones", "Estado") VALUES ($1, NOW(), $2, $3, $4, $5, $6) RETURNING "IdVenta"`;
    const resultVenta = await transaction.query(queryVenta, [Usuario, MetodoPago, Descuento, totalconDescuento, Observaciones, Estado]);

    const ventaID = resultVenta.rows[0].IdVenta;

    const queryDetalle = `INSERT INTO "DetallesVenta" ("Venta", "Producto", "Cantidad", "PrecioUnidad", "Subtotal") VALUES($1, $2, $3, $4, $5)`;
    const queryActualizarStock = `UPDATE "Productos" SET "Stock" = "Stock" - $1 WHERE "IdProducto" = $2`;

    for(const detalle of detallesconSubtotal){
      await transaction.query(queryDetalle, [ventaID, detalle.producto, detalle.cantidad, detalle.precio_unidad, detalle.subtotal]);
      await transaction.query(queryActualizarStock, [detalle.cantidad, detalle.producto]);
    }

    await transaction.query('COMMIT');

    res.status(201).json({mensaje: "Venta Creada Exitosamente", idVenta: ventaID});
  } catch (error) {
    await transaction.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error al crear la venta' });
  } finally {
    transaction.release();
  }
};

const putVenta = async (req, res) => {
  const { id } = req.params;
  const {  Observaciones, Estado } = req.body;
  try {
    await pool.query('UPDATE "Ventas" SET "Observaciones" = $1, "Estado" = $2 WHERE "IdVenta" = $3',
      [Observaciones, Estado, id]);
    res.status(200).json({ message: 'Venta actualizada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la venta' });
  }
};

module.exports = { getAllVentas, postVenta, putVenta };