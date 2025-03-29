const express = require('express');
const router = express.Router();
const evaluacionPieController = require('../controllers/evaluacionPieController');
const authMiddleware = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', evaluacionPieController.getAllEvaluaciones);
router.get('/paciente/:id_paciente', evaluacionPieController.getEvaluacionesByPaciente);
router.get('/:id', evaluacionPieController.getEvaluacionById);
router.post('/', evaluacionPieController.createEvaluacion);
router.put('/:id', evaluacionPieController.updateEvaluacion);
router.delete('/:id', evaluacionPieController.deleteEvaluacion);

// Rutas para imágenes
router.get('/:id_evaluacion/imagenes', evaluacionPieController.getImagenesEvaluacion);
router.post('/:id_evaluacion/imagenes', evaluacionPieController.addImagenEvaluacion);
router.delete('/imagenes/:id_imagen', evaluacionPieController.deleteImagenEvaluacion);

module.exports = router;