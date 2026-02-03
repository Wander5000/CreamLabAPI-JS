const pool = require('../config/database.js');

const getPedidosByUser = async (req, res) => {
  const { idUsuario } = req.user;
  
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
      WHERE v."Estado" <> 1 
        AND v."Usuario" = $1
      ORDER BY v."IdVenta" DESC, t."IdDetalle"
    `, [idUsuario]);
    console.log(rows);
    // Agrupar los resultados por venta
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
          descuento: parseFloat(row.Descuento) || 0,
          total: parseFloat(row.Total) || 0,
          observaciones: row.Observaciones,
          estado: row.NombreEstado,
          detalles: []
        });
      }
      
      // Agregar el detalle si existe (LEFT JOIN puede traer nulls)
      if (row.IdDetalle) {
        ventasMap.get(idVenta).detalles.push({
          idDetalle: row.IdDetalle,
          producto: row.Producto,
          cantidad: parseInt(row.Cantidad) || 0,
          precioUnitario: parseFloat(row.PrecioUnitario) || 0,
          subtotal: parseFloat(row.Subtotal) || 0
        });
      }
    });

    // Convertir el Map a array
    const pedidos = Array.from(ventasMap.values());

    res.status(200).json(pedidos);
    
  } catch (error) {
    console.error('Error en getPedidosByUser:', error);
    res.status(500).json({ 
      message: 'Error al obtener los pedidos del cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getPedidoByUserById = async (req, res) => {
  const { idUsuario } = req.user;
  const { id } = req.params;
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
        AND v."Usuario" = $2
      ORDER BY t."IdDetalle"
    `, [id, idUsuario]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Formatear fecha a YYYY-MM-DD
    const formatearFecha = (fecha) => {
      if (!fecha) return null;
      const f = new Date(fecha);
      return f.toISOString().split('T')[0];
    };

    // Construir el objeto pedido con el esquema especificado
    const pedido = {
      idVenta: rows[0].IdVenta,
      usuario: rows[0].NombreUsuario,
      fecha: formatearFecha(rows[0].Fecha),
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
        pedido.detalles.push({
          idDetalle: row.IdDetalle,
          producto: row.Producto,
          cantidad: row.Cantidad,
          precioUnitario: row.PrecioUnitario,
          subtotal: row.Subtotal
        });
      }
    });

    res.status(200).json(pedido);
  } catch (error) {
    console.error('Error al obtener el pedido:', error);
    res.status(500).json({ message: 'Error al obtener el pedido' });
  }
};

const anularPedido = async (req, res) => {
  const { idUsuario } = req.user;
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      UPDATE "Ventas"
      SET "Estado" = 3
      WHERE "IdVenta" = $1
        AND "Usuario" = $2
      RETURNING *
    `, [id, idUsuario]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    await pool.query(`
      UPDATE "Productos" AS p
      SET "Stock" = p."Stock" + d."Cantidad"
      FROM "DetallesVenta" AS d
      WHERE d."Venta" = $1 AND d."Producto" = p."IdProducto"
    `, [id]);
    res.status(200).json({ message: 'Pedido anulado exitosamente' });
  } catch (error) {
    console.error('Error al anular el pedido:', error);
    res.status(500).json({ message: 'Error al anular el pedido' });
  }
};

module.exports = { getPedidosByUser, getPedidoByUserById, anularPedido };