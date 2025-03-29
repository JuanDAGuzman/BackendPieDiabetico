const Tratamiento = require('../models/tratamientoModel');

exports.getAllTratamientos = async (req, res, next) => {
  try {
    const tratamientos = await Tratamiento.findAll();
    res.status(200).json({ data: tratamientos });
  } catch (error) {
    next(error);
  }
};

exports.getTratamientoById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const tratamiento = await Tratamiento.findById(id);
    
    if (!tratamiento) {
      return res.status(404).json({ message: 'Tratamiento no encontrado' });
    }
    
    res.status(200).json({ data: tratamiento });
  } catch (error) {
    next(error);
  }
};

exports.createTratamiento = async (req, res, next) => {
  try {
    const { 
      id_consulta, tipo_tratamiento, nombre, descripcion, dosis, frecuencia, duracion,
      instrucciones_especiales, fecha_inicio, fecha_fin, estado
    } = req.body;
    
    if (!id_consulta || !tipo_tratamiento || !nombre) {
      return res.status(400).json({ message: 'Se requiere id_consulta, tipo_tratamiento y nombre' });
    }
    
    const nuevoTratamiento = await Tratamiento.create({
      id_consulta,
      tipo_tratamiento,
      nombre,
      descripcion,
      dosis,
      frecuencia,
      duracion,
      instrucciones_especiales,
      fecha_inicio,
      fecha_fin,
      estado
    });
    
    if (!nuevoTratamiento) {
      return res.status(500).json({ message: 'Error al crear el tratamiento' });
    }
    
    // Obtener el tratamiento completo
    const tratamientoCompleto = await Tratamiento.findById(nuevoTratamiento.id_tratamiento);
    
    res.status(201).json({
      message: 'Tratamiento creado exitosamente',
      data: tratamientoCompleto
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTratamiento = async (req, res, next) => {
  try {
    const id = req.params.id;
    const tratamiento = await Tratamiento.findById(id);
    
    if (!tratamiento) {
      return res.status(404).json({ message: 'Tratamiento no encontrado' });
    }
    
    const updatedTratamiento = await Tratamiento.update(id, {
      tipo_tratamiento: req.body.tipo_tratamiento || tratamiento.tipo_tratamiento,
      nombre: req.body.nombre || tratamiento.nombre,
      descripcion: req.body.descripcion || tratamiento.descripcion,
      dosis: req.body.dosis || tratamiento.dosis,
      frecuencia: req.body.frecuencia || tratamiento.frecuencia,
      duracion: req.body.duracion || tratamiento.duracion,
      instrucciones_especiales: req.body.instrucciones_especiales || tratamiento.instrucciones_especiales,
      fecha_inicio: req.body.fecha_inicio || tratamiento.fecha_inicio,
      fecha_fin: req.body.fecha_fin || tratamiento.fecha_fin,
      estado: req.body.estado || tratamiento.estado
    });
    
    if (!updatedTratamiento) {
      return res.status(500).json({ message: 'Error al actualizar el tratamiento' });
    }
    
    // Obtener el tratamiento actualizado completo
    const tratamientoActualizado = await Tratamiento.findById(id);
    
    res.status(200).json({
      message: 'Tratamiento actualizado exitosamente',
      data: tratamientoActualizado
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTratamiento = async (req, res, next) => {
  try {
    const id = req.params.id;
    const tratamiento = await Tratamiento.findById(id);
    
    if (!tratamiento) {
      return res.status(404).json({ message: 'Tratamiento no encontrado' });
    }
    
    const deletedTratamiento = await Tratamiento.delete(id);
    
    if (!deletedTratamiento) {
      return res.status(500).json({ message: 'Error al cancelar el tratamiento' });
    }
    
    res.status(200).json({
      message: 'Tratamiento cancelado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

exports.getTratamientosByPaciente = async (req, res, next) => {
  try {
    const id_paciente = req.params.id_paciente;
    const tratamientos = await Tratamiento.getTratamientosByPaciente(id_paciente);
    
    res.status(200).json({ data: tratamientos });
  } catch (error) {
    next(error);
  }
};

exports.getTratamientosByConsulta = async (req, res, next) => {
  try {
    const id_consulta = req.params.id_consulta;
    const tratamientos = await Tratamiento.getTratamientosByConsulta(id_consulta);
    
    res.status(200).json({ data: tratamientos });
  } catch (error) {
    next(error);
  }
};

exports.getSeguimientos = async (req, res, next) => {
  try {
    const id_tratamiento = req.params.id_tratamiento;
    const seguimientos = await Tratamiento.getSeguimientos(id_tratamiento);
    
    res.status(200).json({ data: seguimientos });
  } catch (error) {
    next(error);
  }
};

exports.addSeguimiento = async (req, res, next) => {
  try {
    const id_tratamiento = req.params.id_tratamiento;
    const { 
      fecha_seguimiento, cumplimiento, efectos_secundarios, 
      efectividad, observaciones, id_doctor 
    } = req.body;
    
    if (!cumplimiento || !efectividad) {
      return res.status(400).json({ message: 'Se requiere cumplimiento y efectividad' });
    }
    
    const nuevoSeguimiento = await Tratamiento.addSeguimiento({
      id_tratamiento,
      fecha_seguimiento,
      cumplimiento,
      efectos_secundarios,
      efectividad,
      observaciones,
      id_doctor
    });
    
    if (!nuevoSeguimiento) {
      return res.status(500).json({ message: 'Error al agregar el seguimiento' });
    }
    
    res.status(201).json({
      message: 'Seguimiento agregado exitosamente',
      data: nuevoSeguimiento
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSeguimiento = async (req, res, next) => {
  try {
    const id = req.params.id_seguimiento;
    
    // Verificar que existe
    const seguimientoExistente = await db.query(
      'SELECT * FROM seguimiento_tratamientos WHERE id_seguimiento = $1',
      [id]
    );
    
    if (seguimientoExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Seguimiento no encontrado' });
    }
    
    const updatedSeguimiento = await Tratamiento.updateSeguimiento(id, req.body);
    
    if (!updatedSeguimiento) {
      return res.status(500).json({ message: 'Error al actualizar el seguimiento' });
    }
    
    res.status(200).json({
      message: 'Seguimiento actualizado exitosamente',
      data: updatedSeguimiento
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSeguimiento = async (req, res, next) => {
  try {
    const id = req.params.id_seguimiento;
    
    const deletedSeguimiento = await Tratamiento.deleteSeguimiento(id);
    
    if (!deletedSeguimiento) {
      return res.status(404).json({ message: 'Seguimiento no encontrado' });
    }
    
    res.status(200).json({
      message: 'Seguimiento eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};