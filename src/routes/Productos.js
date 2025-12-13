const express = require('express');
const router = express.Router();
const { getAllProducts } = require('../controllers/ProductosController.js');

router.get('/', getAllProducts);
router.post('/', (req, res) => { res.send('Crear un nuevo producto'); });

module.exports = router;