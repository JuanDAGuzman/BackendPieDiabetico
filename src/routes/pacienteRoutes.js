const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const authMiddleware = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', pacienteController.getAllPacientes);
router.get('/:id', pacienteController.getPacienteById);
router.post('/', pacienteController.createPaciente);
router.put('/:id', pacienteController.updatePaciente);
router.delete('/:id', pacienteController.deletePaciente);

// Rutas adicionales para recuperar información relacionada
router.get('/:id/consultas', pacienteController.getConsultasPaciente);
router.get('/:id/citas', pacienteController.getCitasPaciente);
router.get('/:id/evaluaciones-pie', pacienteController.getEvaluacionesPiePaciente);
router.get('/:id/resultados-laboratorio', pacienteController.getResultadosLaboratorioPaciente);

module.exports = router;