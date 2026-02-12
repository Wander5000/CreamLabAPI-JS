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
        t."IdProducto",
        i."IdInsumo",
        i."NombreInsumo"
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
      LEFT JOIN "DetallesInsumo" AS di 
        ON t."IdDetalle" = di."Detalle"
      LEFT JOIN "Insumos" AS i 
        ON di."Insumo" = i."IdInsumo"
      WHERE v."IdVenta" = $1
      ORDER BY t."IdDetalle", i."IdInsumo"
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Agrupar insumos por detalle usando Map
    const detallesMap = new Map();
    
    rows.forEach(row => {
      if (row.IdDetalle) {
        // Si el detalle no existe en el Map, lo creamos
        if (!detallesMap.has(row.IdDetalle)) {
          detallesMap.set(row.IdDetalle, {
            idDetalle: row.IdDetalle,
            producto: row.Producto,
            cantidad: row.Cantidad,
            precioUnitario: row.PrecioUnitario,
            subtotal: row.Subtotal,
            insumos: []
          });
        }
        
        // Si hay insumo asociado, lo agregamos al detalle
        if (row.IdInsumo) {
          detallesMap.get(row.IdDetalle).insumos.push({
            idInsumo: row.IdInsumo,
            nombreInsumo: row.NombreInsumo,
          });
        }
      }
    });

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
      detalles: Array.from(detallesMap.values())
    };
 
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
      productosMap[row.IdProducto] = { 
        PrecioUnidad: parseFloat(row.PrecioUnidad), 
        Stock: parseInt(row.Stock) 
      };
    });

    // Validar stock
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

    if (erroresStock.length > 0) {
      await transaction.query('ROLLBACK');
      return res.status(400).json({ error: 'Problemas de Stock', detalles: erroresStock });
    }

    // ============ CALCULAR PRECIOS CON INSUMOS EXTRAS ============
    let totalVenta = 0;
    const detallesconSubtotal = [];

    for (const detalle of Detalles) {
      const producto = productosMap[detalle.Producto];
      const precioBase = producto.PrecioUnidad;
      let precioExtra = 0;

      // Calcular precio extra por insumos
      const insumosList = Array.isArray(detalle.Insumos) ? detalle.Insumos : [];
      
      if (insumosList.length > 0) {
        // Obtener las relaciones producto-categoría con reglas
        const relacionProductoInsumos = await transaction.query(`
          SELECT DISTINCT
            pi."CategoriaInsumo" as "IdCategoriaInsumo",
            pi."Minimo",
            pi."Maximo"
          FROM "ProductoInsumo" pi
          WHERE pi."Producto" = $1
        `, [detalle.Producto]);

        // Para cada categoría, calcular el precio extra
        for (const relacion of relacionProductoInsumos.rows) {
          const insumosCategoria = await transaction.query(`
            SELECT 
              i."IdInsumo",
              i."PrecioUnidad"
            FROM "Insumos" i
            WHERE i."CategoriaInsumo" = $1
              AND i."IdInsumo" = ANY($2::int[])
            ORDER BY i."IdInsumo"
          `, [relacion.IdCategoriaInsumo, insumosList]);

          const maximo = parseInt(relacion.Maximo) || 0;
          const seleccionados = insumosCategoria.rows.length;

          // Si excede el máximo, cobrar los extras
          if (seleccionados > maximo) {
            const extras = insumosCategoria.rows.slice(maximo);
            for (const ins of extras) {
              const precio = parseFloat(ins.PrecioUnidad) || 0;
              precioExtra += precio;
            }
          }
        }
      }

      // Precio unitario total = precio base + precio extra
      const precioUnitarioTotal = precioBase + precioExtra;
      const subtotal = precioUnitarioTotal * detalle.Cantidad;
      totalVenta += subtotal;

      detallesconSubtotal.push({
        producto: detalle.Producto,
        cantidad: detalle.Cantidad,
        precio_unidad: precioUnitarioTotal, // Precio con extras incluidos
        subtotal: subtotal,
        insumos: insumosList
      });
    }
    // ============ FIN CÁLCULO PRECIOS CON INSUMOS EXTRAS ============

    const descuentoAplicado = Descuento || 0;
    const totalconDescuento = totalVenta - (totalVenta * (descuentoAplicado / 100));

    const queryVenta = `INSERT INTO "Ventas" ("Usuario", "Fecha", "MetodoPago", "Descuento", "Total", "Observaciones", "Estado") VALUES ($1, NOW(), $2, $3, $4, $5, $6) RETURNING "IdVenta"`;
    const resultVenta = await transaction.query(queryVenta, [
      Usuario, 
      MetodoPago, 
      Descuento, 
      totalconDescuento, 
      Observaciones, 
      Estado
    ]);

    const ventaID = resultVenta.rows[0].IdVenta;

    const queryDetalle = `INSERT INTO "DetallesVenta" ("Venta", "Producto", "Cantidad", "PrecioUnidad", "Subtotal") VALUES($1, $2, $3, $4, $5) RETURNING "IdDetalle"`;
    const queryActualizarStock = `UPDATE "Productos" SET "Stock" = "Stock" - $1 WHERE "IdProducto" = $2`;
    const queryDetalleInsumo = `INSERT INTO "DetallesInsumo" ("Detalle", "Insumo", "Cantidad") VALUES($1, $2, $3)`;

    for (const detalle of detallesconSubtotal) {
      // Insertar el detalle de venta con el precio que incluye extras
      const resultDetalle = await transaction.query(queryDetalle, [
        ventaID, 
        detalle.producto, 
        detalle.cantidad, 
        detalle.precio_unidad, // Ya incluye el precio extra
        detalle.subtotal
      ]);
      const detalleID = resultDetalle.rows[0].IdDetalle;
      
      // Actualizar stock del producto
      await transaction.query(queryActualizarStock, [detalle.cantidad, detalle.producto]);

      // Insertar los insumos asociados al detalle
      if (Array.isArray(detalle.insumos) && detalle.insumos.length > 0) {
        for (const insumo of detalle.insumos) {
          const insumoId = typeof insumo === 'object' ? insumo.idInsumo : insumo;
          const cantidadInsumo = typeof insumo === 'object' ? (insumo.cantidad || 1) : 1;
          
          await transaction.query(queryDetalleInsumo, [detalleID, insumoId, cantidadInsumo]);
        }
      }
    }

    await transaction.query('COMMIT');

    res.status(201).json({ 
      mensaje: "Venta Creada Exitosamente", 
      idVenta: ventaID,
      totalCalculado: totalconDescuento
    });
    
  } catch (error) {
    await transaction.query('ROLLBACK');
    console.error('Error al crear venta:', error);
    res.status(500).json({ 
      message: 'Error al crear la venta', 
      error: error.message 
    });
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

module.exports = { getAllVentas, getVentabyId, postVenta, putVenta };