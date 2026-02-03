const express = require('express');
const router = express.Router();
const { getAllUsers, postUser, updateUser,changeUserStatus } = require('../controllers/UsuariosController.js');

router.get('/', getAllUsers);
router.post('/', postUser);
router.put('/:id', updateUser);
router.put('/Cambiar-Estado/:id', changeUserStatus);

module.exports = router;