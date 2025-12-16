const pool = require('../config/database.js');
const cloudinary = require('../config/cloudinary.js');

const getAllProducts = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p."IdProducto" as "idProducto",
        p."NombreProducto" as "nombreProducto",
        c."NombreCategoria" as "categoriaProducto",
        p."PrecioUnidad" as "precioUnidad",
        p."Stock" as "stock",
        p."Descripcion" as "descripcion",
        p."Imagen" as "imagen",
        p."Estado" as "estado"
      FROM "Productos" AS p
      INNER JOIN "Categorias" AS c ON p."CategoriaProducto" = c."IdCategoria"
      ORDER BY p."IdProducto"
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos', error: error.message });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT p."IdProducto" as "idProducto", 
              p."NombreProducto" as "nombreProducto", 
              c."NombreCategoria" as "categoriaProducto", 
              p."PrecioUnidad" as "precioUnidad", 
              p."Stock" as "stock", 
              p."Descripcion" as "descripcion", 
              p."Imagen" as "imagen", 
              p."Estado" as "estado"
      FROM "Productos" AS p
      INNER JOIN "Categorias" AS c ON p."CategoriaProducto" = c."IdCategoria"
      WHERE p."IdProducto" = $1
      LIMIT 1
    `;
    
    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado u Inexistente' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
  }
};

const getValidProducts = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p."IdProducto" as "idProducto",
        p."NombreProducto" as "nombreProducto",
        c."NombreCategoria" as "categoriaProducto",
        p."PrecioUnidad" as "precioUnidad",
        p."Stock" as "stock",
        p."Descripcion" as "descripcion",
        p."Imagen" as "imagen",
        p."Estado" as "estado"
      FROM "Productos" AS p
      INNER JOIN "Categorias" AS c ON p."CategoriaProducto" = c."IdCategoria"
      WHERE p."Estado" = true
      ORDER BY p."IdProducto"
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos válidos', error });
  }
};

const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT p."IdProducto" as "idProducto", 
              p."NombreProducto" as "nombreProducto", 
              c."NombreCategoria" AS "categoriaProducto", 
              p."PrecioUnidad" as "precioUnidad", 
              p."Stock" as "stock", 
              p."Descripcion" as "descripcion", 
              p."Imagen" as "imagen", 
              p."Estado" as "estado"
      FROM "Productos" AS p
      INNER JOIN "Categorias" AS c ON p."CategoriaProducto" = c."IdCategoria"
      WHERE c."IdCategoria" = $1 AND p."Estado" = true
      ORDER BY p."IdProducto"`,
      [category]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos por categoría', error });
  }
};

const postProduct = async (req, res) => {
  const { NombreProducto, Descripcion, CategoriaProducto, PrecioUnidad, Stock } = req.body;
  let ImagenProducto = { Url: null, PublicID: null };
  try {
    if(req.file){
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'CreamLabImages',
        resource_type: 'auto'
      });
      ImagenProducto = { Url: result.secure_url, PublicID: result.public_id };
    }
    const query = `
      INSERT INTO "Productos" 
      ("NombreProducto", "Descripcion", "CategoriaProducto", "PrecioUnidad", "Stock", "Imagen", "PublicID", "Estado")
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `;
    const values = [ NombreProducto, Descripcion, CategoriaProducto, PrecioUnidad, Stock, ImagenProducto.Url, ImagenProducto.PublicID];
    const queryResult = await pool.query(query, values);
    res.status(201).json({ message: 'Producto creado exitosamente', producto: queryResult.rows[0] });
  } catch (error) {
    if (ImagenProducto.PublicID && req.file) {
      await cloudinary.uploader.destroy(ImagenProducto.PublicID).catch(err => console.log('Error al eliminar la imagen de Cloudinary:', err));
    }
    console.error('Error al insertar el producto en la base de datos:', error);
    res.status(500).json({ message: 'Error al crear el producto', error });
  }
};

const putProduct = async (req, res) => {
  const { id } = req.params;
  const { NombreProducto, Descripcion, CategoriaProducto, PrecioUnidad, Stock, Estado } = req.body;
  let ImagenProducto = { Url: null, PublicID: null };
  try{
    const productQuery = `SELECT "Imagen", "PublicID" FROM "Productos" WHERE "IdProducto" = $1`;
    const productResult = await pool.query(productQuery, [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado u Inexistente' });
    }
    const producto = productResult.rows[0];

    let ImagenProducto = { Url: producto.Imagen, PublicID: producto.PublicID };

    if(req.file){
        if(ImagenProducto.PublicID){
          await cloudinary.uploader.destroy(ImagenProducto.PublicID).catch(err => console.log('Error al eliminar la imagen de Cloudinary:', err));
        }
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'CreamLabImages',
          resource_type: 'auto'
        });
        ImagenProducto = { Url: result.secure_url, PublicID: result.public_id };
    }

    const updateQuery = `
      UPDATE "Productos"
      SET "NombreProducto" = $1, "Descripcion" = $2, "CategoriaProducto" = $3, "PrecioUnidad" = $4, "Stock" = $5, "Imagen" = $6, "PublicID" = $7, "Estado" = $8
      WHERE "IdProducto" = $9
      RETURNING *
    `;
    const updateValues = [ NombreProducto, Descripcion, CategoriaProducto, PrecioUnidad, Stock, ImagenProducto.Url, ImagenProducto.PublicID, Estado, id];
    const updateResult = await pool.query(updateQuery, updateValues);
    res.status(200).json({ message: 'Producto actualizado exitosamente', producto: updateResult.rows[0] });
  }catch (error) {
    if (ImagenProducto.PublicID && req.file) {
      await cloudinary.uploader.destroy(ImagenProducto.PublicID).catch(err => console.log('Error al eliminar la imagen de Cloudinary:', err));
    }
    console.error('Error al actualizar el producto en la base de datos:', error);
    res.status(500).json({ message: 'Error al actualizar el producto', error });
  }
};

const changeProductState = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      UPDATE "Productos"
      SET "Estado" = NOT "Estado"
      WHERE "IdProducto" = $1
      RETURNING *
    `;
    const values = [ id ];
    const queryResult = await pool.query(query, values);
    if (queryResult.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado u Inexistente' });
    }
    res.status(200).json({ message: 'Estado del producto actualizado exitosamente', producto: queryResult.rows[0] });
  } catch (error) {
    console.error('Error al actualizar el estado del producto en la base de datos:', error);
    res.status(500).json({ message: 'Error al actualizar el estado del producto', error });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      DELETE FROM "Productos"
      WHERE "IdProducto" = $1
      RETURNING *
    `;
    const values = [ id ];
    const queryResult = await pool.query(query, values);
    if (queryResult.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado u Inexistente' });
    }
    res.status(200).json({ message: 'Producto eliminado exitosamente', producto: queryResult.rows[0] });
  } catch (error) {
    console.error('Error al eliminar el producto en la base de datos:', error);
    res.status(500).json({ message: 'Error al eliminar el producto', error });
  }
};

module.exports = { getAllProducts, getProductById, getValidProducts, getProductsByCategory, postProduct, putProduct, changeProductState, deleteProduct };
