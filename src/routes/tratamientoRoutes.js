// src/routes/tratamientoRoutes.js
const express = require("express");
const router = express.Router();
const tratamientoController = require("../controllers/tratamientoController");
const {
  authMiddleware,
  esDoctorVerificado,
  accesoPaciente,
} = require("../middlewares/auth");

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas generales (filtran resultados según rol en el controlador)
router.get("/", tratamientoController.getAllTratamientos);
router.get("/:id", tratamientoController.getTratamientoById);

// Rutas específicas con control de acceso
router.get(
  "/paciente/:id_paciente",
  accesoPaciente,
  tratamientoController.getTratamientosByPaciente
);
router.get(
  "/consulta/:id_consulta",
  tratamientoController.getTratamientosByConsulta
);

// Rutas para crear y modificar tratamientos (solo doctores verificados)
router.post("/", esDoctorVerificado, tratamientoController.createTratamiento);
router.put("/:id", tratamientoController.updateTratamiento);
router.delete("/:id", tratamientoController.deleteTratamiento);

// Rutas para seguimientos
router.get(
  "/:id_tratamiento/seguimientos",
  tratamientoController.getSeguimientos
);
router.post(
  "/:id_tratamiento/seguimientos",
  esDoctorVerificado,
  tratamientoController.addSeguimiento
);
router.put(
  "/seguimientos/:id_seguimiento",
  tratamientoController.updateSeguimiento
);
router.delete(
  "/seguimientos/:id_seguimiento",
  tratamientoController.deleteSeguimiento
);

module.exports = router;
