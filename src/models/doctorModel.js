const db = require('../config/database');

const Doctor = {
  findAll: async () => {
    const query = `
      SELECT d.*, u.nombre, u.apellido, u.email, u.telefono, u.estado
      FROM doctores d
      JOIN usuarios u ON d.id_usuario = u.id_usuario
      WHERE u.estado = 'Activo'
    `;
    const result = await db.query(query);
    return result.rows;
  },
  
  findById: async (id) => {
    const query = `
      SELECT d.*, u.nombre, u.apellido, u.email, u.telefono, u.estado
      FROM doctores d
      JOIN usuarios u ON d.id_usuario = u.id_usuario
      WHERE d.id_doctor = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  create: async (doctor) => {
    const query = `
      INSERT INTO doctores(id_usuario, especialidad, numero_licencia, consulta_duracion_minutos, biografia)
      VALUES($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      doctor.id_usuario,
      doctor.especialidad,
      doctor.numero_licencia,
      doctor.consulta_duracion_minutos || 30,
      doctor.biografia
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  update: async (id, doctor) => {
    const query = `
      UPDATE doctores
      SET especialidad = $1,
          numero_licencia = $2,
          consulta_duracion_minutos = $3,
          biografia = $4
      WHERE id_doctor = $5
      RETURNING *
    `;
    
    const values = [
      doctor.especialidad,
      doctor.numero_licencia,
      doctor.consulta_duracion_minutos,
      doctor.biografia,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  delete: async (id) => {
    // Esto marcará al usuario asociado como inactivo
    const query = `
      UPDATE usuarios u
      SET estado = 'Inactivo', fecha_modificacion = CURRENT_TIMESTAMP
      FROM doctores d
      WHERE d.id_doctor = $1 AND d.id_usuario = u.id_usuario
      RETURNING d.*
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  getCentros: async (id_doctor) => {
    const query = `
      SELECT cm.*
      FROM centros_medicos cm
      JOIN doctor_centro dc ON cm.id_centro = dc.id_centro
      WHERE dc.id_doctor = $1 AND cm.estado = 'Activo'
    `;
    
    const result = await db.query(query, [id_doctor]);
    return result.rows;
  },
  
  getHorarios: async (id_doctor) => {
    const query = `
      SELECT hd.*
      FROM horarios_doctores hd
      WHERE hd.id_doctor = $1
    `;
    
    const result = await db.query(query, [id_doctor]);
    return result.rows;
  },
  
  getPacientes: async (id_doctor) => {
    const query = `
      SELECT p.*, u.nombre, u.apellido, u.email, u.telefono
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE p.id_doctor_principal = $1 AND u.estado = 'Activo'
    `;
    
    const result = await db.query(query, [id_doctor]);
    return result.rows;
  }
};

module.exports = Doctor;