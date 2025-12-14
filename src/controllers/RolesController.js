const pool = require('../database.js');

const getAllRoles = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM roles');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los roles' });
    }
};

const postRol = async (req, res) => {
    const { NombreRol } = req.body;
    try {
        const { rowCount } = await pool.query('INSERT INTO roles (NombreRol) VALUES ($1)', [NombreRol]);
        if (rowCount === 0) {
            return res.status(400).json({ error: 'No se pudo crear el rol' });
        }
        res.status(201).json({ message: 'Rol creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el rol' });
    }
};

const putRol = async (req, res) => {
    const { id } = req.params;
    const { NombreRol } = req.body;
    try {
        const { rowCount } = await pool.query(
            'UPDATE roles SET NombreRol = $1 WHERE IdRol = $2',
            [NombreRol, id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        res.json({ message: 'Rol actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el rol' });
    }
};

const deleteRol = async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM roles WHERE IdRol = $1',
            [id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        res.json({ message: 'Rol eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el rol' });
    }
};

module.exports = { getAllRoles, postRol, putRol, deleteRol };