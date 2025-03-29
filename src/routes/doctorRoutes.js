const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', doctorController.getAllDoctores);
router.get('/:id', doctorController.getDoctorById);
router.post('/', doctorController.createDoctor);
router.put('/:id', doctorController.updateDoctor);
router.delete('/:id', doctorController.deleteDoctor);

// Rutas adicionales para recuperar información relacionada
router.get('/:id/centros', doctorController.getCentrosDoctor);
router.get('/:id/horarios', doctorController.getHorariosDoctor);
router.get('/:id/pacientes', doctorController.getPacientesDoctor);

module.exports = router;