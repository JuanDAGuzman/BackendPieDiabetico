const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const { authMiddleware, esAdmin } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas para el usuario autenticado
router.get('/', notificacionController.getNotificacionesUsuario);
router.get('/contador', notificacionController.getContadorNoLeidas);
router.put('/:id/leer', notificacionController.marcarLeida);
router.put('/leer-todas', notificacionController.marcarTodasLeidas);
router.delete('/:id', notificacionController.deleteNotificacion);

// Ruta para administradores
router.post('/', esAdmin, notificacionController.createNotificacion);

module.exports = router;