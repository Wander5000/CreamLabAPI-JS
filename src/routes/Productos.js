const express = require('express');
const router = express.Router();
const upload = require('../config/multer.js');
const { getAllProducts, getProductById, getValidProducts, getProductsByCategory, postProduct, putProduct, changeProductState, deleteProduct } = require('../controllers/ProductosController.js');

router.get('/', getAllProducts);
router.get('/Validos', getValidProducts);
router.get('/:id', getProductById);
router.get('/Categoria/:category', getProductsByCategory);
router.post('/', upload.single('ImagenProducto'), postProduct);
router.put('/:id', upload.single('ImagenProducto'), putProduct);
router.put('/Cambiar-Estado/:id', changeProductState);
router.delete('/:id', deleteProduct);

module.exports = router;