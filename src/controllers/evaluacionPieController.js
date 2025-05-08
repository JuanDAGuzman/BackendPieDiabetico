const EvaluacionPie = require("../models/evaluacionPieModel");

exports.getAllEvaluaciones = async (req, res, next) => {
  try {
    const evaluaciones = await EvaluacionPie.findAll();
    res.status(200).json({ data: evaluaciones });
  } catch (error) {
    next(error);
  }
};

exports.getEvaluacionById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const evaluacion = await EvaluacionPie.findById(id);

    if (!evaluacion) {
      return res.status(404).json({ message: "Evaluación no encontrada" });
    }

    res.status(200).json({ data: evaluacion });
  } catch (error) {
    next(error);
  }
};

exports.createEvaluacion = async (req, res, next) => {
  try {
    const {
      id_consulta,
      pie,
      pulso_pedio,
      pulso_tibial,
      tiempo_llenado_capilar,
      temperatura_piel,
      color_piel,
      sensibilidad_tactil,
      sensibilidad_vibratoria,
      sensibilidad_dolorosa,
      reflejos,
      deformidades,
      descripcion_deformidades,
      callosidades,
      ubicacion_callosidades,
      presencia_ulceras,
      clasificacion_wagner,
      clasificacion_texas,
      localizacion_lesiones,
      evaluacion_calzado,
      recomendacion_calzado,
      grado_riesgo,
      observaciones,
    } = req.body;

    if (!id_consulta) {
      return res.status(400).json({ message: "Se requiere id_consulta" });
    }

    const nuevaEvaluacion = await EvaluacionPie.create({
      id_consulta,
      pie,
      pulso_pedio,
      pulso_tibial,
      tiempo_llenado_capilar,
      temperatura_piel,
      color_piel,
      sensibilidad_tactil,
      sensibilidad_vibratoria,
      sensibilidad_dolorosa,
      reflejos,
      deformidades,
      descripcion_deformidades,
      callosidades,
      ubicacion_callosidades,
      presencia_ulceras,
      clasificacion_wagner,
      clasificacion_texas,
      localizacion_lesiones,
      evaluacion_calzado,
      recomendacion_calzado,
      grado_riesgo,
      observaciones,
    });

    if (!nuevaEvaluacion) {
      return res.status(500).json({ message: "Error al crear la evaluación" });
    }

    // Obtener la evaluación completa
    const evaluacionCompleta = await EvaluacionPie.findById(
      nuevaEvaluacion.id_evaluacion
    );

    res.status(201).json({
      message: "Evaluación creada exitosamente",
      data: evaluacionCompleta,
    });
  } catch (error) {
    next(error);
  }
};
exports.uploadImagenEvaluacion = async (req, res, next) => {
  try {
    const id_evaluacion = req.params.id_evaluacion;

    // Verificar que la evaluación existe
    const evaluacion = await EvaluacionPie.findById(id_evaluacion);

    if (!evaluacion) {
      return res.status(404).json({ message: "Evaluación no encontrada" });
    }

    // Verificar acceso a la evaluación
    // ...codigo de verificación de permisos...

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se ha subido ninguna imagen" });
    }

    // Obtener datos del archivo subido
    const { path: filepath, filename, mimetype } = req.file;

    // Determinar tipo de imagen
    let tipo_imagen = "Otro";
    if (
      req.body.tipo_imagen &&
      ["Clínica", "Radiografía", "Ecografía", "Termografía", "Otro"].includes(
        req.body.tipo_imagen
      )
    ) {
      tipo_imagen = req.body.tipo_imagen;
    }

    // Crear registro en la base de datos
    const nuevaImagen = await EvaluacionPie.addImagenEvaluacion({
      id_evaluacion,
      url_imagen: `/uploads/evaluaciones/${filename}`, // URL relativa para acceder a la imagen
      tipo_imagen,
      descripcion: req.body.descripcion || "",
      fecha_captura: req.body.fecha_captura || new Date(),
    });

    res.status(201).json({
      message: "Imagen subida exitosamente",
      data: nuevaImagen,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEvaluacion = async (req, res, next) => {
  try {
    const id = req.params.id;
    const evaluacion = await EvaluacionPie.findById(id);

    if (!evaluacion) {
      return res.status(404).json({ message: "Evaluación no encontrada" });
    }

    const updatedEvaluacion = await EvaluacionPie.update(id, req.body);

    if (!updatedEvaluacion) {
      return res
        .status(500)
        .json({ message: "Error al actualizar la evaluación" });
    }

    // Obtener la evaluación actualizada completa
    const evaluacionActualizada = await EvaluacionPie.findById(id);

    res.status(200).json({
      message: "Evaluación actualizada exitosamente",
      data: evaluacionActualizada,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteEvaluacion = async (req, res, next) => {
  try {
    const id = req.params.id;
    const evaluacion = await EvaluacionPie.findById(id);

    if (!evaluacion) {
      return res.status(404).json({ message: "Evaluación no encontrada" });
    }

    const deletedEvaluacion = await EvaluacionPie.delete(id);

    if (!deletedEvaluacion) {
      return res
        .status(500)
        .json({ message: "Error al eliminar la evaluación" });
    }

    res.status(200).json({
      message: "Evaluación eliminada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

exports.getEvaluacionesByPaciente = async (req, res, next) => {
  try {
    const id_paciente = req.params.id_paciente;
    const evaluaciones = await EvaluacionPie.getEvaluacionesByPaciente(
      id_paciente
    );

    res.status(200).json({ data: evaluaciones });
  } catch (error) {
    next(error);
  }
};

exports.getImagenesEvaluacion = async (req, res, next) => {
  try {
    const id_evaluacion = req.params.id_evaluacion;
    const imagenes = await EvaluacionPie.getImagenesEvaluacion(id_evaluacion);

    res.status(200).json({ data: imagenes });
  } catch (error) {
    next(error);
  }
};

exports.addImagenEvaluacion = async (req, res, next) => {
  try {
    const id_evaluacion = req.params.id_evaluacion;
    const { url_imagen, tipo_imagen, descripcion, fecha_captura } = req.body;

    if (!url_imagen) {
      return res.status(400).json({ message: "Se requiere url_imagen" });
    }

    const nuevaImagen = await EvaluacionPie.addImagenEvaluacion({
      id_evaluacion,
      url_imagen,
      tipo_imagen,
      descripcion,
      fecha_captura,
    });

    if (!nuevaImagen) {
      return res.status(500).json({ message: "Error al agregar la imagen" });
    }

    res.status(201).json({
      message: "Imagen agregada exitosamente",
      data: nuevaImagen,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteImagenEvaluacion = async (req, res, next) => {
  try {
    const id_imagen = req.params.id_imagen;

    const deletedImagen = await EvaluacionPie.deleteImagenEvaluacion(id_imagen);

    if (!deletedImagen) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }

    res.status(200).json({
      message: "Imagen eliminada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};
