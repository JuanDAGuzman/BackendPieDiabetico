const db = require('../config/database');

const DoctorPaciente = {
  asignarPaciente: async (id_doctor, id_paciente) => {
    // Verificar si ya existe la relación
    const checkQuery = `
      SELECT * FROM doctor_paciente
      WHERE id_doctor = $1 AND id_paciente = $2
    `;
    
    const checkResult = await db.query(checkQuery, [id_doctor, id_paciente]);
    
    if (checkResult.rows.length > 0) {
      return checkResult.rows[0]; // La relación ya existe
    }
    
    // Si no existe, crearla
    const query = `
      INSERT INTO doctor_paciente(id_doctor, id_paciente)
      VALUES($1, $2)
      RETURNING *
    `;
    
    const result = await db.query(query, [id_doctor, id_paciente]);
    return result.rows[0];
  },
  
  // Desasignar un paciente de un doctor
  desasignarPaciente: async (id_doctor, id_paciente) => {
    const query = `
      DELETE FROM doctor_paciente
      WHERE id_doctor = $1 AND id_paciente = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [id_doctor, id_paciente]);
    return result.rows[0];
  },
  
  // Obtener todos los pacientes de un doctor
  getPacientesByDoctor: async (id_doctor) => {
    const query = `
      SELECT p.*, u.nombre, u.apellido, u.email, u.telefono, u.genero, u.fecha_nacimiento
      FROM pacientes p
      JOIN doctor_paciente dp ON p.id_paciente = dp.id_paciente
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE dp.id_doctor = $1 AND u.estado = 'Activo'
      ORDER BY u.apellido, u.nombre
    `;
    
    const result = await db.query(query, [id_doctor]);
    return result.rows;
  },
  
  // Obtener todos los doctores de un paciente
  getDoctoresByPaciente: async (id_paciente) => {
    const query = `
      SELECT d.*, u.nombre, u.apellido, u.email, u.telefono
      FROM doctores d
      JOIN doctor_paciente dp ON d.id_doctor = dp.id_doctor
      JOIN usuarios u ON d.id_usuario = u.id_usuario
      WHERE dp.id_paciente = $1 AND u.estado = 'Activo' AND d.estado_verificacion = 'Aprobado'
      ORDER BY u.apellido, u.nombre
    `;
    
    const result = await db.query(query, [id_paciente]);
    return result.rows;
  }
};

module.exports = DoctorPaciente;