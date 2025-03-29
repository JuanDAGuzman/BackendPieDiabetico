const Consulta = require('../models/consultaModel');

exports.getAllConsultas = async (req, res, next) => {
  try {
    const consultas = await Consulta.findAll();
    res.status(200).json({ data: consultas });
  } catch (error) {
    next(error);
  }
};

exports.getConsultaById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const consulta = await Consulta.findById(id);
    
    if (!consulta) {
      return res.status(404).json({ message: 'Consulta no encontrada' });
    }
    
    res.status(200).json({ data: consulta });
  } catch (error) {
    next(error);
  }
};

exports.createConsulta = async (req, res, next) => {
  try {
    const { 
      id_cita, id_videocita, id_paciente, id_doctor, fecha_consulta, tipo_consulta,
      sintomas, diagnostico, tratamiento, observaciones, recomendaciones, fecha_proxima_revision
    } = req.body;
    
    // Validar que al menos un origen (cita o videocita) está presente
    if (!id_cita && !id_videocita) {
      return res.status(400).json({ message: 'Se requiere un id_cita o id_videocita' });
    }
    
    // Validar que el paciente y doctor existan
    if (!id_paciente || !id_doctor) {
      return res.status(400).json({ message: 'Se requiere id_paciente y id_doctor' });
    }
    
    const nuevaConsulta = await Consulta.create({
      id_cita,
      id_videocita,
      id_paciente,
      id_doctor,
      fecha_consulta,
      tipo_consulta,
      sintomas,
      diagnostico,
      tratamiento,
      observaciones,
      recomendaciones,
      fecha_proxima_revision
    });
    
    if (!nuevaConsulta) {
      return res.status(500).json({ message: 'Error al crear la consulta' });
    }
    
    // Obtener la consulta con información completa
    const consultaCompleta = await Consulta.findById(nuevaConsulta.id_consulta);
    
    res.status(201).json({
      message: 'Consulta creada exitosamente',
      data: consultaCompleta
    });
  } catch (error) {
    next(error);
  }
};

exports.updateConsulta = async (req, res, next) => {
  try {
    const id = req.params.id;
    const consulta = await Consulta.findById(id);
    
    if (!consulta) {
      return res.status(404).json({ message: 'Consulta no encontrada' });
    }
    
    const updatedConsulta = await Consulta.update(id, {
      sintomas: req.body.sintomas,
      diagnostico: req.body.diagnostico,
      tratamiento: req.body.tratamiento,
      observaciones: req.body.observaciones,
      recomendaciones: req.body.recomendaciones,
      fecha_proxima_revision: req.body.fecha_proxima_revision
    });
    
    if (!updatedConsulta) {
      return res.status(500).json({ message: 'Error al actualizar la consulta' });
    }
    
    // Obtener la consulta actualizada con información completa
    const consultaActualizada = await Consulta.findById(id);
    
    res.status(200).json({
      message: 'Consulta actualizada exitosamente',
      data: consultaActualizada
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteConsulta = async (req, res, next) => {
  try {
    const id = req.params.id;
    const consulta = await Consulta.findById(id);
    
    if (!consulta) {
      return res.status(404).json({ message: 'Consulta no encontrada' });
    }
    
    const deletedConsulta = await Consulta.delete(id);
    
    if (!deletedConsulta) {
      return res.status(500).json({ message: 'Error al eliminar la consulta' });
    }
    
    res.status(200).json({
      message: 'Consulta eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

exports.getConsultasByPaciente = async (req, res, next) => {
  try {
    const id_paciente = req.params.id_paciente;
    const consultas = await Consulta.getConsultasByPaciente(id_paciente);
    
    res.status(200).json({ data: consultas });
  } catch (error) {
    next(error);
  }
};

exports.getConsultasByDoctor = async (req, res, next) => {
  try {
    const id_doctor = req.params.id_doctor;
    const consultas = await Consulta.getConsultasByDoctor(id_doctor);
    
    res.status(200).json({ data: consultas });
  } catch (error) {
    next(error);
  }
};