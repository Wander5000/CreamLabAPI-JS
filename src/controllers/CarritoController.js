const pool = require('../config/database.js');

const getCarrito = async (req, res) => {
  const { idUsuario } = req.user;
  try {
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
        d."Venta",
        i."IdInsumo",
        i."NombreInsumo",
        di."Cantidad" AS "CantidadInsumo"
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
      LEFT JOIN "DetallesInsumo" AS di ON d."IdDetalle" = di."Detalle"
      LEFT JOIN "Insumos" AS i ON di."Insumo" = i."IdInsumo"
      ORDER BY d."IdDetalle", i."IdInsumo"`,
      [idUsuario]
    );

    if (rows.length > 0) {
      const detallesMap = new Map();
      
      rows.forEach(row => {
        if (row.IdDetalle) {
          if (!detallesMap.has(row.IdDetalle)) {
            detallesMap.set(row.IdDetalle, {
              idDetalle: row.IdDetalle,
              producto: row.Producto,
              cantidad: row.Cantidad,
              precioUnitario: row.PrecioUnidad,
              subtotal: row.Subtotal,
              insumos: []
            });
          }
          
          if (row.IdInsumo) {
            detallesMap.get(row.IdDetalle).insumos.push({
              idInsumo: row.IdInsumo,
              nombreInsumo: row.NombreInsumo,
              cantidad: row.CantidadInsumo || 1
            });
          }
        }
      });

      const detalles = Array.from(detallesMap.values());

      const carrito = {
        idVenta: rows[0].IdVenta,
        usuario: rows[0].Usuario,
        fecha: rows[0].Fecha,
        metodoPago: rows[0].MetodoPago,
        descuento: rows[0].Descuento,
        total: rows[0].Total,
        observaciones: rows[0].Observaciones,
        detalles: detalles
      };
      
      return res.json(carrito);
    }

    const fecha = new Date();
    const crearCarro = await pool.query(
      'INSERT INTO "Ventas" ("Usuario", "Fecha", "MetodoPago", "Descuento", "Total", "Observaciones", "Estado") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [idUsuario, fecha, 'N/A', 0, 0, null, 1]
    );

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
  const { idProducto, cantidad, insumos } = req.query;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
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

    // ============ PARSEAR Y AGRUPAR INSUMOS ============
    let insumosList = [];
    let insumosAgrupados = {}; // { idInsumo: cantidad }
    
    if (insumos) {
      try {
        insumosList = typeof insumos === 'string' ? JSON.parse(insumos) : insumos;
        
        // Agrupar IDs repetidos y contar cantidades
        insumosAgrupados = insumosList.reduce((acc, insumoId) => {
          acc[insumoId] = (acc[insumoId] || 0) + 1;
          return acc;
        }, {});
        
        // Mantener lista ordenada para comparación
        insumosList.sort((a, b) => a - b);
      } catch (e) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Insumos inválidos' });
      }
    }

    // ============ CALCULAR PRECIO EXTRA DE INSUMOS ============
    let precioExtra = 0;
    
    if (insumosList.length > 0) {
      // Obtener relaciones producto-categoría-insumo con reglas
      const relacionProductoInsumos = await client.query(`
        SELECT DISTINCT
          pi."CategoriaInsumo" as "IdCategoriaInsumo",
          pi."Minimo",
          pi."Maximo"
        FROM "ProductoInsumo" pi
        WHERE pi."Producto" = $1
      `, [idProducto]);

      // Para cada categoría, calcular extras
      for (const relacion of relacionProductoInsumos.rows) {
        const insumosCategoria = await client.query(`
          SELECT 
            i."IdInsumo",
            i."PrecioUnidad"
          FROM "Insumos" i
          WHERE i."CategoriaInsumo" = $1
            AND i."IdInsumo" = ANY($2::int[])
          ORDER BY i."IdInsumo"
        `, [relacion.IdCategoriaInsumo, insumosList]);

        const maximo = parseInt(relacion.Maximo) || 0;
        
        // Contar total seleccionados considerando cantidades
        let totalSeleccionados = 0;
        const insumosConCantidad = [];
        
        for (const ins of insumosCategoria.rows) {
          const cantidadInsumo = insumosAgrupados[ins.IdInsumo] || 0;
          totalSeleccionados += cantidadInsumo;
          
          // Agregar cada insumo tantas veces como su cantidad
          for (let i = 0; i < cantidadInsumo; i++) {
            insumosConCantidad.push(ins);
          }
        }

        // Si excede el máximo, cobrar los extras
        if (totalSeleccionados > maximo) {
          const extras = insumosConCantidad.slice(maximo);
          for (const ins of extras) {
            const precio = parseFloat(ins.PrecioUnidad) || 0;
            precioExtra += precio;
          }
        }
      }
    }
    // ============ FIN CÁLCULO PRECIO EXTRA ============

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

    const detalles = await client.query(
      'SELECT * FROM "DetallesVenta" WHERE "Venta" = $1 AND "Producto" = $2',
      [carrito.rows[0].IdVenta, idProducto]
    );

    let yaExiste = null;
    for (const detalle of detalles.rows) {
      const insumoDetalle = await client.query(
        'SELECT "Insumo" FROM "DetallesInsumo" WHERE "Detalle" = $1 ORDER BY "Insumo"',
        [detalle.IdDetalle]
      );
      const insumosIDs = insumoDetalle.rows.map(row => row.Insumo).sort((a, b) => a - b);
      if (JSON.stringify(insumosIDs) === JSON.stringify(insumosList)) {
        yaExiste = detalle;
        break;
      }
    }

    let diferenciaTotal = 0;
    let resultado = null;

    // USAR EL PRECIO CON EXTRAS
    const precioBase = parseFloat(producto.rows[0].PrecioUnidad) || 0;
    const precioUnitarioTotal = precioBase + precioExtra;

    if (!yaExiste) {
      // Producto nuevo
      if (producto.rows[0].Stock < cantidadNum) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Stock insuficiente' });
      }
      
      const subtotal = precioUnitarioTotal * cantidadNum;
      diferenciaTotal = subtotal;

      const nuevoDetalle = await client.query(
        'INSERT INTO "DetallesVenta" ("Venta", "Producto", "Cantidad", "PrecioUnidad", "Subtotal") VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [carrito.rows[0].IdVenta, idProducto, cantidadNum, precioUnitarioTotal, subtotal]
      );
      resultado = nuevoDetalle.rows[0];

      // ============ INSERTAR INSUMOS CON CANTIDAD CORRECTA ============
      for (const [insumoId, cantidadInsumo] of Object.entries(insumosAgrupados)) {
        await client.query(
          'INSERT INTO "DetallesInsumo" ("Detalle", "Insumo", "Cantidad") VALUES ($1, $2, $3)',
          [nuevoDetalle.rows[0].IdDetalle, parseInt(insumoId), cantidadInsumo]
        );
      }
      // ============ FIN INSERTAR INSUMOS ============
      
    } else {
      // Producto existe - actualizar
      const nuevaCantidad = yaExiste.Cantidad + cantidadNum;
      
      if (producto.rows[0].Stock < nuevaCantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Stock insuficiente' });
      }
      
      const nuevoSubtotal = nuevaCantidad * precioUnitarioTotal;
      diferenciaTotal = nuevoSubtotal - yaExiste.Subtotal;

      const actualizar = await client.query(
        'UPDATE "DetallesVenta" SET "Cantidad" = $1, "Subtotal" = $2, "PrecioUnidad" = $3 WHERE "IdDetalle" = $4 RETURNING *',
        [nuevaCantidad, nuevoSubtotal, precioUnitarioTotal, yaExiste.IdDetalle]
      );
      resultado = actualizar.rows[0];
    }
    
    // Actualizar total con la diferencia
    await client.query(
      'UPDATE "Ventas" SET "Total" = "Total" + $1 WHERE "IdVenta" = $2',
      [diferenciaTotal, carrito.rows[0].IdVenta]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Producto agregado al carrito exitosamente',
      detalle: resultado,
      precioBase: precioBase,
      precioExtra: precioExtra,
      precioTotal: precioUnitarioTotal
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al agregar producto:', error);
    res.status(500).json({ message: 'Error al agregar el producto al carrito', error: error.message });
  } finally {
    client.release();
  }
};

const actualizarCantidad = async (req, res) => {
  const { idUsuario } = req.user;
  const { idDetalle, nuevaCantidad } = req.query; // Cambio aquí
  const client = await pool.connect();
  
  try {
    const nuevaCantidadNum = parseInt(nuevaCantidad);
    if (isNaN(nuevaCantidadNum) || nuevaCantidadNum <= 0) {
      return res.status(400).json({ message: 'Cantidad inválida' });
    }

    await client.query('BEGIN');

    const carrito = await client.query(
      'SELECT * FROM "Ventas" WHERE "Usuario" = $1 AND "Estado" = 1',
      [idUsuario]
    );

    if (!carrito.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }

    // Buscar directamente por IdDetalle
    const detalle = await client.query(
      'SELECT * FROM "DetallesVenta" WHERE "IdDetalle" = $1 AND "Venta" = $2',
      [idDetalle, carrito.rows[0].IdVenta]
    );

    if (!detalle.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
    }

    const producto = await client.query(
      'SELECT * FROM "Productos" WHERE "IdProducto" = $1',
      [detalle.rows[0].Producto] // Usar el producto del detalle
    );

    if (!producto.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (producto.rows[0].Stock < nuevaCantidadNum) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Stock insuficiente' });
    }

    const nuevoSubtotal = nuevaCantidadNum * detalle.rows[0].PrecioUnidad;
    const diferenciaTotal = nuevoSubtotal - detalle.rows[0].Subtotal;

    await client.query(
      'UPDATE "DetallesVenta" SET "Cantidad" = $1, "Subtotal" = $2 WHERE "IdDetalle" = $3',
      [nuevaCantidadNum, nuevoSubtotal, detalle.rows[0].IdDetalle]
    );

    await client.query(
      'UPDATE "Ventas" SET "Total" = "Total" + $1 WHERE "IdVenta" = $2',
      [diferenciaTotal, carrito.rows[0].IdVenta]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Cantidad actualizada exitosamente',
      detalle: {
        cantidad: nuevaCantidadNum,
        subtotal: nuevoSubtotal
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar cantidad:', error);
    res.status(500).json({ 
      message: 'Error al actualizar la cantidad del producto en el carrito', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

const quitarProducto = async (req, res) => {
  const { idUsuario } = req.user;
  const { idDetalle } = req.query; // Cambio aquí
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const carrito = await client.query(
      'SELECT * FROM "Ventas" WHERE "Usuario" = $1 AND "Estado" = 1',
      [idUsuario]
    );

    if (!carrito.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }

    // Buscar directamente por IdDetalle
    const detalle = await client.query(
      'SELECT * FROM "DetallesVenta" WHERE "IdDetalle" = $1 AND "Venta" = $2',
      [idDetalle, carrito.rows[0].IdVenta]
    );

    if (!detalle.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
    }

    const diferenciaTotal = -detalle.rows[0].Subtotal;

    await client.query(
      'DELETE FROM "DetallesInsumo" WHERE "Detalle" = $1',
      [detalle.rows[0].IdDetalle]
    );

    await client.query(
      'DELETE FROM "DetallesVenta" WHERE "IdDetalle" = $1',
      [detalle.rows[0].IdDetalle]
    );

    await client.query(
      'UPDATE "Ventas" SET "Total" = "Total" + $1 WHERE "IdVenta" = $2',
      [diferenciaTotal, carrito.rows[0].IdVenta]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Producto quitado del carrito exitosamente',
      detalle: detalle.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al quitar producto:', error);
    res.status(500).json({ message: 'Error al quitar el producto del carrito', error: error.message });
  } finally {
    client.release();
  }
};

const confirmarPedido = async (req, res) => {
  const { idUsuario } = req.user;
  const { mPago } = req.query;
  
  if (!mPago) {
    return res.status(400).json({ message: 'Método de pago requerido' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    let carrito = await client.query(
      'SELECT * FROM "Ventas" WHERE "Usuario" = $1 AND "Estado" = 1',
      [idUsuario]
    );
    
    if (!carrito.rows[0]) {  // CORREGIDO
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }
    
    const detalles = await client.query(
      'SELECT * FROM "DetallesVenta" WHERE "Venta" = $1',
      [carrito.rows[0].IdVenta]
    );
    
    if (detalles.rows.length === 0) {  // VALIDACIÓN ADICIONAL
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    for (const detalle of detalles.rows) {
      const producto = await client.query(
        'SELECT * FROM "Productos" WHERE "IdProducto" = $1 FOR UPDATE',  // Bloqueo optimista
        [detalle.Producto]
      );
      
      if (!producto.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      
      if (producto.rows[0].Stock < detalle.Cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: `Stock insuficiente para el producto ${producto.rows[0].Nombre}` 
        });
      }
      
      await client.query(
        'UPDATE "Productos" SET "Stock" = "Stock" - $1 WHERE "IdProducto" = $2',
        [detalle.Cantidad, detalle.Producto]
      );
    }
    
    await client.query(
      'UPDATE "Ventas" SET "Estado" = 2, "MetodoPago" = $1 WHERE "IdVenta" = $2',
      [mPago, carrito.rows[0].IdVenta]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Pedido confirmado exitosamente',
      venta: carrito.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al confirmar pedido:', error);
    res.status(500).json({ 
      message: 'Error al confirmar el pedido', 
      error: error.message 
    });
  } finally {
    client.release();
  }
}

module.exports = { getCarrito , agregarProducto, actualizarCantidad, quitarProducto, confirmarPedido };