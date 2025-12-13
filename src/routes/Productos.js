const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById } = require('../controllers/ProductosController.js');

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/Validos', (req, res) => { res.send('Obtener productos Activos'); });
router.get('/Categoria/:category', (req, res) => { res.send(`Obtener productos de la categoría ${req.params.category}`); });
router.post('/', (req, res) => { res.send('Crear un nuevo producto'); });
router.put('/:id', (req, res) => { res.send(`Actualizar el producto con ID ${req.params.id}`); });
router.delete('/:id', (req, res) => { res.send(`Eliminar el producto con ID ${req.params.id}`); });

module.exports = router;