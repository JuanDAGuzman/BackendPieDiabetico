const express = require('express');
const router = express.Router();
const tratamientoController = require('../controllers/tratamientoController');
const { authMiddleware } = require('../middlewares/auth'); 


// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', tratamientoController.getAllTratamientos);
router.get('/paciente/:id_paciente', tratamientoController.getTratamientosByPaciente);
router.get('/consulta/:id_consulta', tratamientoController.getTratamientosByConsulta);
router.get('/:id', tratamientoController.getTratamientoById);
router.post('/', tratamientoController.createTratamiento);
router.put('/:id', tratamientoController.updateTratamiento);
router.delete('/:id', tratamientoController.deleteTratamiento);

// Rutas para seguimientos
router.get('/:id_tratamiento/seguimientos', tratamientoController.getSeguimientos);
router.post('/:id_tratamiento/seguimientos', tratamientoController.addSeguimiento);
router.put('/seguimientos/:id_seguimiento', tratamientoController.updateSeguimiento);
router.delete('/seguimientos/:id_seguimiento', tratamientoController.deleteSeguimiento);

module.exports = router;