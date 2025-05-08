const express = require('express');
const router = express.Router();
const resultadoLaboratorioController = require('../controllers/resultadoLaboratorioController');
const { authMiddleware, esAdmin, esDoctorVerificado, accesoPaciente } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas principales
router.get('/', resultadoLaboratorioController.getAllResultados);
router.get('/:id', resultadoLaboratorioController.getResultadoById);
router.post('/', resultadoLaboratorioController.createResultado);
router.put('/:id', resultadoLaboratorioController.updateResultado);
router.delete('/:id', esAdmin, resultadoLaboratorioController.deleteResultado);

// Rutas adicionales
router.get('/paciente/:id_paciente', accesoPaciente, resultadoLaboratorioController.getResultadosByPaciente);
router.get('/tipo/:tipo', resultadoLaboratorioController.getResultadosByTipo);

module.exports = router;