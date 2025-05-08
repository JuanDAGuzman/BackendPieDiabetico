// src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { authMiddleware, esAdmin, esDoctorVerificado } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo administradores pueden ver todos los usuarios
router.get('/', esAdmin, usuarioController.getAllUsuarios);

// Solo administradores o el propio usuario pueden ver detalles de un usuario específico
router.get('/:id', authMiddleware, usuarioController.getUsuarioById);

// Solo administradores pueden crear nuevos usuarios
router.post('/', esAdmin, usuarioController.createUsuario);

// Solo administradores o el propio usuario pueden actualizar un usuario
router.put('/:id', authMiddleware, usuarioController.updateUsuario);

// Solo administradores pueden eliminar usuarios
router.delete('/:id', esAdmin, usuarioController.deleteUsuario);

module.exports = router;