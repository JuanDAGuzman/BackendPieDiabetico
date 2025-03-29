const express = require('express');
const router = express.Router();
const centroMedicoController = require('../controllers/centroMedicoController');
const authMiddleware = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', centroMedicoController.getAllCentrosMedicos);
router.get('/:id', centroMedicoController.getCentroMedicoById);
router.post('/', centroMedicoController.createCentroMedico);
router.put('/:id', centroMedicoController.updateCentroMedico);
router.delete('/:id', centroMedicoController.deleteCentroMedico);

// Rutas para gestionar la relación con doctores
router.get('/:id/doctores', centroMedicoController.getDoctoresCentroMedico);
router.post('/:id/doctores', centroMedicoController.asignarDoctor);
router.delete('/:id/doctores/:id_doctor', centroMedicoController.desasignarDoctor);

module.exports = router;