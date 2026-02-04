const pool = require('../config/database.js');

const getAllProIns = async (req, res) => {
    const { idProducto } = req.params;
    try {
        const query = `
        SELECT
            i."IdInsumo" AS "idInsumo",
            i."NombreInsumo" AS "nombreInsumo",
            ci."IdCatInsumo" AS "idCategoriaInsumo",
            ci."NombreCatInsumo" AS "categoriaInsumo",
            pi."Minimo",
            pi."Maximo",
            pi."Obligatorio"
        FROM "Insumos" AS i
        INNER JOIN "CategoriasInsumo" AS ci ON i."CategoriaInsumo" = ci."IdCatInsumo"
        INNER JOIN "ProductoInsumo" AS pi ON ci."IdCatInsumo" = pi."CategoriaInsumo"
        WHERE pi."Producto" = $1 AND i."Stock" > 0
        `;
        const { rows } = await pool.query(query, [idProducto]);
        const categoriasMap = new Map();
        rows.forEach(insumo => {
            const nombreCategoria = insumo.categoriaInsumo;
            if (!categoriasMap.has(nombreCategoria)) {
                categoriasMap.set(nombreCategoria, {
                    idCategoriaInsumo: insumo.idCategoriaInsumo,
                    categoriaInsumo: nombreCategoria,
                    minimo: insumo.Minimo,
                    maximo: insumo.Maximo,
                    obligatorio: insumo.Obligatorio,
                    insumos: []
                });
            }
            categoriasMap.get(nombreCategoria).insumos.push({
                idInsumo: insumo.idInsumo,
                nombreInsumo: insumo.nombreInsumo,
            });
        });
        const resultado = Array.from(categoriasMap.values());
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos del producto', error: error.message });
    }
}

module.exports = { getAllProIns };