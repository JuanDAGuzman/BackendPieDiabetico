const db = require('../config/database');

const Paciente = {
  findAll: async () => {
    const query = `
      SELECT p.*, u.nombre, u.apellido, u.email, u.telefono, u.genero, u.fecha_nacimiento
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE u.estado = 'Activo'
    `;
    const result = await db.query(query);
    return result.rows;
  },
  
  findById: async (id) => {
    const query = `
      SELECT p.*, u.nombre, u.apellido, u.email, u.telefono, u.genero, u.fecha_nacimiento
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE p.id_paciente = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  create: async (paciente) => {
    const query = `
      INSERT INTO pacientes(
        id_usuario, id_doctor_principal, tipo_sangre, peso, altura, 
        alergias, fecha_diagnostico_diabetes, tipo_diabetes, nivel_riesgo, observaciones)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      paciente.id_usuario,
      paciente.id_doctor_principal,
      paciente.tipo_sangre,
      paciente.peso,
      paciente.altura,
      paciente.alergias,
      paciente.fecha_diagnostico_diabetes,
      paciente.tipo_diabetes,
      paciente.nivel_riesgo || 'Medio',
      paciente.observaciones
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  update: async (id, paciente) => {
    const query = `
      UPDATE pacientes
      SET id_doctor_principal = $1,
          tipo_sangre = $2,
          peso = $3,
          altura = $4,
          alergias = $5,
          fecha_diagnostico_diabetes = $6,
          tipo_diabetes = $7,
          nivel_riesgo = $8,
          observaciones = $9
      WHERE id_paciente = $10
      RETURNING *
    `;
    
    const values = [
      paciente.id_doctor_principal,
      paciente.tipo_sangre,
      paciente.peso,
      paciente.altura,
      paciente.alergias,
      paciente.fecha_diagnostico_diabetes,
      paciente.tipo_diabetes,
      paciente.nivel_riesgo,
      paciente.observaciones,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  delete: async (id) => {
    // Marcar al usuario asociado como inactivo
    const query = `
      UPDATE usuarios u
      SET estado = 'Inactivo', fecha_modificacion = CURRENT_TIMESTAMP
      FROM pacientes p
      WHERE p.id_paciente = $1 AND p.id_usuario = u.id_usuario
      RETURNING p.*
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  getConsultas: async (id_paciente) => {
    const query = `
      SELECT c.*
      FROM consultas c
      WHERE c.id_paciente = $1
      ORDER BY c.fecha_consulta DESC
    `;
    
    const result = await db.query(query, [id_paciente]);
    return result.rows;
  },
  
  getCitas: async (id_paciente) => {
    const query = `
      SELECT c.*, cm.nombre as centro_nombre
      FROM citas c
      JOIN centros_medicos cm ON c.id_centro = cm.id_centro
      WHERE c.id_paciente = $1
      ORDER BY c.fecha DESC, c.hora_inicio ASC
    `;
    
    const result = await db.query(query, [id_paciente]);
    return result.rows;
  },
  
  getEvaluacionesPie: async (id_paciente) => {
    const query = `
      SELECT ep.*
      FROM evaluaciones_pie ep
      JOIN consultas c ON ep.id_consulta = c.id_consulta
      WHERE c.id_paciente = $1
      ORDER BY c.fecha_consulta DESC
    `;
    
    const result = await db.query(query, [id_paciente]);
    return result.rows;
  },
  
  getResultadosLaboratorio: async (id_paciente) => {
    const query = `
      SELECT rl.*
      FROM resultados_laboratorio rl
      WHERE rl.id_paciente = $1
      ORDER BY rl.fecha_examen DESC
    `;
    
    const result = await db.query(query, [id_paciente]);
    return result.rows;
  }
};

module.exports = Paciente;