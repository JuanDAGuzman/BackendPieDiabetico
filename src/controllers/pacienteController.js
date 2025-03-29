const Paciente = require('../models/pacienteModel');
const Usuario = require('../models/usuarioModel');

exports.getAllPacientes = async (req, res, next) => {
  try {
    const pacientes = await Paciente.findAll();
    res.status(200).json({ data: pacientes });
  } catch (error) {
    next(error);
  }
};

exports.getPacienteById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const paciente = await Paciente.findById(id);
    
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    
    res.status(200).json({ data: paciente });
  } catch (error) {
    next(error);
  }
};

exports.createPaciente = async (req, res, next) => {
  try {
    // Primero creamos el usuario
    const { 
      nombre, apellido, email, password, telefono, direccion, 
      fecha_nacimiento, genero, numero_identificacion, tipo_identificacion,
      // Datos específicos del paciente
      id_doctor_principal, tipo_sangre, peso, altura, alergias,
      fecha_diagnostico_diabetes, tipo_diabetes, nivel_riesgo, observaciones
    } = req.body;
    
    // Validar que el email no exista ya
    const existingUser = await Usuario.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }
    
    // Crear usuario con rol de paciente (id_rol=3)
    const nuevoUsuario = await Usuario.create({
      id_rol: 3, // Rol de paciente
      nombre,
      apellido,
      email,
      password,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      numero_identificacion,
      tipo_identificacion
    });
    
    if (!nuevoUsuario) {
      return res.status(500).json({ message: 'Error al crear el usuario' });
    }
    
    // Crear el paciente usando el id del usuario
    const nuevoPaciente = await Paciente.create({
      id_usuario: nuevoUsuario.id_usuario,
      id_doctor_principal,
      tipo_sangre,
      peso,
      altura,
      alergias,
      fecha_diagnostico_diabetes,
      tipo_diabetes,
      nivel_riesgo,
      observaciones
    });
    
    if (!nuevoPaciente) {
      // Rollback - eliminar usuario creado
      await db.query('DELETE FROM usuarios WHERE id_usuario = $1', [nuevoUsuario.id_usuario]);
      return res.status(500).json({ message: 'Error al crear el paciente' });
    }
    
    // Combinar la información del usuario y paciente para la respuesta
    const pacienteCompleto = {
      ...nuevoPaciente,
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      email: nuevoUsuario.email,
      telefono: nuevoUsuario.telefono,
      direccion: nuevoUsuario.direccion,
      fecha_nacimiento: nuevoUsuario.fecha_nacimiento,
      genero: nuevoUsuario.genero
    };
    
    res.status(201).json({
      message: 'Paciente creado exitosamente',
      data: pacienteCompleto
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const paciente = await Paciente.findById(id);
    
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    
    // Actualizar datos del paciente
    const updatedPaciente = await Paciente.update(id, {
      id_doctor_principal: req.body.id_doctor_principal,
      tipo_sangre: req.body.tipo_sangre,
      peso: req.body.peso,
      altura: req.body.altura,
      alergias: req.body.alergias,
      fecha_diagnostico_diabetes: req.body.fecha_diagnostico_diabetes,
      tipo_diabetes: req.body.tipo_diabetes,
      nivel_riesgo: req.body.nivel_riesgo,
      observaciones: req.body.observaciones
    });
    
    if (!updatedPaciente) {
      return res.status(500).json({ message: 'Error al actualizar el paciente' });
    }
    
    // Actualizar datos del usuario si se proporcionan
    if (req.body.nombre || req.body.apellido || req.body.telefono || req.body.direccion) {
      await Usuario.update(paciente.id_usuario, {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        telefono: req.body.telefono,
        direccion: req.body.direccion
      });
    }
    
    // Obtener paciente actualizado con datos del usuario
    const pacienteActualizado = await Paciente.findById(id);
    
    res.status(200).json({
      message: 'Paciente actualizado exitosamente',
      data: pacienteActualizado
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const paciente = await Paciente.findById(id);
    
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    
    const deletedPaciente = await Paciente.delete(id);
    
    if (!deletedPaciente) {
      return res.status(500).json({ message: 'Error al desactivar el paciente' });
    }
    
    res.status(200).json({
      message: 'Paciente desactivado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

exports.getConsultasPaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const consultas = await Paciente.getConsultas(id);
    
    res.status(200).json({ data: consultas });
  } catch (error) {
    next(error);
  }
};

exports.getCitasPaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const citas = await Paciente.getCitas(id);
    
    res.status(200).json({ data: citas });
  } catch (error) {
    next(error);
  }
};

exports.getEvaluacionesPiePaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const evaluaciones = await Paciente.getEvaluacionesPie(id);
    
    res.status(200).json({ data: evaluaciones });
  } catch (error) {
    next(error);
  }
};

exports.getResultadosLaboratorioPaciente = async (req, res, next) => {
  try {
    const id = req.params.id;
    const resultados = await Paciente.getResultadosLaboratorio(id);
    
    res.status(200).json({ data: resultados });
  } catch (error) {
    next(error);
  }
};