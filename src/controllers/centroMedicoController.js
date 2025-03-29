const CentroMedico = require('../models/centroMedicoModel');

exports.getAllCentrosMedicos = async (req, res, next) => {
  try {
    const centros = await CentroMedico.findAll();
    res.status(200).json({ data: centros });
  } catch (error) {
    next(error);
  }
};

exports.getCentroMedicoById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const centro = await CentroMedico.findById(id);
    
    if (!centro) {
      return res.status(404).json({ message: 'Centro médico no encontrado' });
    }
    
    res.status(200).json({ data: centro });
  } catch (error) {
    next(error);
  }
};

exports.createCentroMedico = async (req, res, next) => {
  try {
    const { 
      nombre, direccion, telefono, email, horario_apertura, horario_cierre,
      dias_servicio, tipo, latitud, longitud
    } = req.body;
    
    const nuevoCentro = await CentroMedico.create({
      nombre,
      direccion,
      telefono,
      email,
      horario_apertura,
      horario_cierre,
      dias_servicio,
      tipo,
      latitud,
      longitud
    });
    
    if (!nuevoCentro) {
      return res.status(500).json({ message: 'Error al crear el centro médico' });
    }
    
    res.status(201).json({
      message: 'Centro médico creado exitosamente',
      data: nuevoCentro
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCentroMedico = async (req, res, next) => {
  try {
    const id = req.params.id;
    const centro = await CentroMedico.findById(id);
    
    if (!centro) {
      return res.status(404).json({ message: 'Centro médico no encontrado' });
    }
    
    const updatedCentro = await CentroMedico.update(id, {
      nombre: req.body.nombre || centro.nombre,
      direccion: req.body.direccion || centro.direccion,
      telefono: req.body.telefono || centro.telefono,
      email: req.body.email || centro.email,
      horario_apertura: req.body.horario_apertura || centro.horario_apertura,
      horario_cierre: req.body.horario_cierre || centro.horario_cierre,
      dias_servicio: req.body.dias_servicio || centro.dias_servicio,
      tipo: req.body.tipo || centro.tipo,
      latitud: req.body.latitud || centro.latitud,
      longitud: req.body.longitud || centro.longitud,
      estado: req.body.estado || centro.estado
    });
    
    if (!updatedCentro) {
      return res.status(500).json({ message: 'Error al actualizar el centro médico' });
    }
    
    res.status(200).json({
      message: 'Centro médico actualizado exitosamente',
      data: updatedCentro
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCentroMedico = async (req, res, next) => {
  try {
    const id = req.params.id;
    const centro = await CentroMedico.findById(id);
    
    if (!centro) {
      return res.status(404).json({ message: 'Centro médico no encontrado' });
    }
    
    const deletedCentro = await CentroMedico.delete(id);
    
    if (!deletedCentro) {
      return res.status(500).json({ message: 'Error al desactivar el centro médico' });
    }
    
    res.status(200).json({
      message: 'Centro médico desactivado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

exports.getDoctoresCentroMedico = async (req, res, next) => {
  try {
    const id = req.params.id;
    const doctores = await CentroMedico.getDoctores(id);
    
    res.status(200).json({ data: doctores });
  } catch (error) {
    next(error);
  }
};

exports.asignarDoctor = async (req, res, next) => {
  try {
    const id_centro = req.params.id;
    const { id_doctor } = req.body;
    
    if (!id_doctor) {
      return res.status(400).json({ message: 'Se requiere el ID del doctor' });
    }
    
    const asignacion = await CentroMedico.asignarDoctor(id_centro, id_doctor);
    
    if (!asignacion) {
      return res.status(500).json({ message: 'Error al asignar el doctor al centro' });
    }
    
    res.status(201).json({
      message: 'Doctor asignado exitosamente al centro médico',
      data: asignacion
    });
  } catch (error) {
    next(error);
  }
};

exports.desasignarDoctor = async (req, res, next) => {
  try {
    const id_centro = req.params.id;
    const id_doctor = req.params.id_doctor;
    
    const desasignacion = await CentroMedico.desasignarDoctor(id_centro, id_doctor);
    
    if (!desasignacion) {
      return res.status(404).json({ message: 'Relación no encontrada' });
    }
    
    res.status(200).json({
      message: 'Doctor desasignado exitosamente del centro médico'
    });
  } catch (error) {
    next(error);
  }
};