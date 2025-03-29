const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');
const authMiddleware = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', citaController.getAllCitas);
router.get('/proximas', citaController.getProximasCitas);
router.get('/doctor/:id_doctor', citaController.getCitasByDoctor);
router.get('/paciente/:id_paciente', citaController.getCitasByPaciente);
router.get('/:id', citaController.getCitaById);
router.post('/', citaController.createCita);
router.put('/:id', citaController.updateCita);
router.delete('/:id', citaController.deleteCita);

module.exports = router;