const pool = require('../config/database.js');

const getAllCategoriasInsumo = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT c."IdCatInsumo" AS "idCatInsumo", c."NombreCatInsumo" AS "nombreCatInsumo" FROM "CategoriasInsumo" AS c ORDER BY c."IdCatInsumo"');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las categorias' });
    }
};

const postCategoriaInsumo = async (req, res) => {
    const { NombreCatInsumo } = req.body;
    try {
        //1 Validar si se proporcionó el nombre del rol
        if(!NombreCatInsumo){
            return res.status(400).json({ error: 'El nombre de la categoria de insumo es requerido' });
        }
        //2 Insertar el rol en la base de datos
        const { rowCount } = await pool.query('INSERT INTO "CategoriasInsumo" ("NombreCatInsumo") VALUES ($1)', [NombreCatInsumo]);
        //3 Verificar si se insertó el rol
        if (rowCount === 0) {
            return res.status(400).json({ error: 'No se pudo crear la categoria de insumo' });
        }
        //4 Devolver una respuesta exitosa
        res.status(201).json({ message: 'Categoria de insumo creada exitosamente' });
    } catch (error) {
        //5 Manejar errores inesperados
        console.error(error);
        res.status(500).json({ error: 'Error al crear la categoria de insumo' });
    }
};

const putCategoriaInsumo = async (req, res) => {
    const { id } = req.params;
    const { NombreCatInsumo } = req.body;
    try {
        const { rowCount } = await pool.query(
            'UPDATE "CategoriasInsumo" SET "NombreCatInsumo" = $1 WHERE "IdCatInsumo" = $2',
            [NombreCatInsumo, id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Categoria de insumo no encontrada' });
        }
        res.status(204).json();
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la categoria de insumo' });
    }
};

const deleteCategoriaInsumo = async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM "CategoriasInsumo" WHERE "IdCatInsumo" = $1',
            [id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Categoria de insumo no encontrada' });
        }
        res.status(204).json();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la categoria de insumo' });
    }
};

module.exports = { getAllCategoriasInsumo, postCategoriaInsumo, putCategoriaInsumo, deleteCategoriaInsumo };