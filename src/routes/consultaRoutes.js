const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const authMiddleware = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', consultaController.getAllConsultas);
router.get('/paciente/:id_paciente', consultaController.getConsultasByPaciente);
router.get('/doctor/:id_doctor', consultaController.getConsultasByDoctor);
router.get('/:id', consultaController.getConsultaById);
router.post('/', consultaController.createConsulta);
router.put('/:id', consultaController.updateConsulta);
router.delete('/:id', consultaController.deleteConsulta);

module.exports = router;