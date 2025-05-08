const ResultadoLaboratorio = require('../models/resultadoLaboratorioModel');
const Notificacion = require('../models/notificacionModel'); // Lo implementaremos después

exports.getAllResultados = async (req, res, next) => {
  try {
    let resultados = [];
    
    // Si es admin o doctor verificado, obtiene todos los resultados según filtros
    if (req.userData.rol === 1 || (req.userData.rol === 2 && req.userData.doctor_verificado)) {
      if (req.query.tipo) {
        resultados = await ResultadoLaboratorio.getResultadosByTipo(req.query.tipo);
      } else {
        resultados = await ResultadoLaboratorio.findAll();
      }
    } 
    // Si es paciente, solo obtiene sus resultados
    else if (req.userData.rol === 3 && req.userData.id_paciente) {
      resultados = await ResultadoLaboratorio.getResultadosByPaciente(req.userData.id_paciente);
    }
    
    res.status(200).json({ data: resultados });
  } catch (error) {
    next(error);
  }
};

exports.getResultadoById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const resultado = await ResultadoLaboratorio.findById(id);
    
    if (!resultado) {
      return res.status(404).json({ message: 'Resultado no encontrado' });
    }
    
    // Verificar acceso
    if (req.userData.rol === 3 && req.userData.id_paciente !== resultado.id_paciente) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
    }
    
    res.status(200).json({ data: resultado });
  } catch (error) {
    next(error);
  }
};

exports.createResultado = async (req, res, next) => {
  try {
    // Solo doctores verificados o admin pueden crear resultados
    if (req.userData.rol !== 1 && !(req.userData.rol === 2 && req.userData.doctor_verificado)) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }
    
    const { 
      id_paciente, fecha_examen, tipo_examen, resultados, valores_referencia,
      interpretacion, id_doctor_ordenante, id_doctor_interpreta
    } = req.body;
    
    if (!id_paciente || !fecha_examen || !tipo_examen || !resultados) {
      return res.status(400).json({ message: 'Campos requeridos incompletos' });
    }
    
    const nuevoResultado = await ResultadoLaboratorio.create({
      id_paciente,
      fecha_examen,
      tipo_examen,
      resultados,
      valores_referencia,
      interpretacion,
      id_doctor_ordenante,
      id_doctor_interpreta
    });
    
    if (!nuevoResultado) {
      return res.status(500).json({ message: 'Error al crear el resultado' });
    }
    
    // Crear notificación para el paciente
    try {
      // Obtener id_usuario del paciente
      const resultPaciente = await db.query(
        'SELECT id_usuario FROM pacientes WHERE id_paciente = $1',
        [id_paciente]
      );
      
      if (resultPaciente.rows.length > 0) {
        const id_usuario_destino = resultPaciente.rows[0].id_usuario;
        
        await Notificacion.create({
          id_usuario_destino,
          tipo_notificacion: 'Resultado',
          titulo: `Nuevo resultado de ${tipo_examen}`,
          mensaje: `Se ha registrado un nuevo resultado de ${tipo_examen} con fecha ${fecha_examen}`,
          entidad_relacionada: 'resultados_laboratorio',
          id_entidad: nuevoResultado.id_resultado
        });
      }
    } catch (notifError) {
      console.error('Error al crear notificación:', notifError);
      // Continuamos aunque falle la notificación
    }
    
    // Obtener el resultado completo
    const resultadoCompleto = await ResultadoLaboratorio.findById(nuevoResultado.id_resultado);
    
    res.status(201).json({
      message: 'Resultado creado exitosamente',
      data: resultadoCompleto
    });
  } catch (error) {
    next(error);
  }
};

exports.updateResultado = async (req, res, next) => {
  try {
    // Solo doctores verificados o admin pueden actualizar resultados
    if (req.userData.rol !== 1 && !(req.userData.rol === 2 && req.userData.doctor_verificado)) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }
    
    const id = req.params.id;
    const resultado = await ResultadoLaboratorio.findById(id);
    
    if (!resultado) {
      return res.status(404).json({ message: 'Resultado no encontrado' });
    }
    
    const updatedResultado = await ResultadoLaboratorio.update(id, {
      fecha_examen: req.body.fecha_examen || resultado.fecha_examen,
      tipo_examen: req.body.tipo_examen || resultado.tipo_examen,
      resultados: req.body.resultados || resultado.resultados,
      valores_referencia: req.body.valores_referencia || resultado.valores_referencia,
      interpretacion: req.body.interpretacion || resultado.interpretacion,
      id_doctor_ordenante: req.body.id_doctor_ordenante || resultado.id_doctor_ordenante,
      id_doctor_interpreta: req.body.id_doctor_interpreta || resultado.id_doctor_interpreta
    });
    
    if (!updatedResultado) {
      return res.status(500).json({ message: 'Error al actualizar el resultado' });
    }
    
    // Obtener el resultado actualizado completo
    const resultadoActualizado = await ResultadoLaboratorio.findById(id);
    
    res.status(200).json({
      message: 'Resultado actualizado exitosamente',
      data: resultadoActualizado
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteResultado = async (req, res, next) => {
  try {
    // Solo admin puede eliminar resultados
    if (req.userData.rol !== 1) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }
    
    const id = req.params.id;
    const resultado = await ResultadoLaboratorio.findById(id);
    
    if (!resultado) {
      return res.status(404).json({ message: 'Resultado no encontrado' });
    }
    
    const deletedResultado = await ResultadoLaboratorio.delete(id);
    
    if (!deletedResultado) {
      return res.status(500).json({ message: 'Error al eliminar el resultado' });
    }
    
    res.status(200).json({
      message: 'Resultado eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

exports.getResultadosByPaciente = async (req, res, next) => {
  try {
    const id_paciente = req.params.id_paciente;
    
    // Verificar acceso al paciente
    if (req.userData.rol === 3 && req.userData.id_paciente !== parseInt(id_paciente)) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
    }
    
    const resultados = await ResultadoLaboratorio.getResultadosByPaciente(id_paciente);
    
    res.status(200).json({ data: resultados });
  } catch (error) {
    next(error);
  }
};

exports.getResultadosByTipo = async (req, res, next) => {
  try {
    // Solo doctores verificados o admin pueden filtrar por tipo
    if (req.userData.rol !== 1 && !(req.userData.rol === 2 && req.userData.doctor_verificado)) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }
    
    const tipo_examen = req.params.tipo;
    const resultados = await ResultadoLaboratorio.getResultadosByTipo(tipo_examen);
    
    res.status(200).json({ data: resultados });
  } catch (error) {
    next(error);
  }
};