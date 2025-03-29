const db = require('../config/database');

const CentroMedico = {
  findAll: async () => {
    const query = `
      SELECT * FROM centros_medicos
      WHERE estado = 'Activo'
      ORDER BY nombre
    `;
    const result = await db.query(query);
    return result.rows;
  },
  
  findById: async (id) => {
    const query = `
      SELECT * FROM centros_medicos
      WHERE id_centro = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  create: async (centroMedico) => {
    const query = `
      INSERT INTO centros_medicos(
        nombre, direccion, telefono, email, horario_apertura, horario_cierre,
        dias_servicio, tipo, latitud, longitud)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      centroMedico.nombre,
      centroMedico.direccion,
      centroMedico.telefono,
      centroMedico.email,
      centroMedico.horario_apertura,
      centroMedico.horario_cierre,
      centroMedico.dias_servicio,
      centroMedico.tipo,
      centroMedico.latitud,
      centroMedico.longitud
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  update: async (id, centroMedico) => {
    const query = `
      UPDATE centros_medicos
      SET nombre = $1,
          direccion = $2,
          telefono = $3,
          email = $4,
          horario_apertura = $5,
          horario_cierre = $6,
          dias_servicio = $7,
          tipo = $8,
          latitud = $9,
          longitud = $10,
          estado = $11
      WHERE id_centro = $12
      RETURNING *
    `;
    
    const values = [
      centroMedico.nombre,
      centroMedico.direccion,
      centroMedico.telefono,
      centroMedico.email,
      centroMedico.horario_apertura,
      centroMedico.horario_cierre,
      centroMedico.dias_servicio,
      centroMedico.tipo,
      centroMedico.latitud,
      centroMedico.longitud,
      centroMedico.estado,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  delete: async (id) => {
    // Cambiar estado a inactivo en lugar de eliminar
    const query = `
      UPDATE centros_medicos
      SET estado = 'Inactivo'
      WHERE id_centro = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  getDoctores: async (id_centro) => {
    const query = `
      SELECT d.*, u.nombre, u.apellido, u.email, u.telefono
      FROM doctores d
      JOIN usuarios u ON d.id_usuario = u.id_usuario
      JOIN doctor_centro dc ON d.id_doctor = dc.id_doctor
      WHERE dc.id_centro = $1 AND u.estado = 'Activo'
      ORDER BY u.apellido, u.nombre
    `;
    
    const result = await db.query(query, [id_centro]);
    return result.rows;
  },
  
  asignarDoctor: async (id_centro, id_doctor) => {
    // Verificar si ya existe la relación
    const checkQuery = `
      SELECT * FROM doctor_centro
      WHERE id_centro = $1 AND id_doctor = $2
    `;
    
    const checkResult = await db.query(checkQuery, [id_centro, id_doctor]);
    
    if (checkResult.rows.length > 0) {
      return checkResult.rows[0]; // La relación ya existe
    }
    
    // Si no existe, crearla
    const query = `
      INSERT INTO doctor_centro(id_centro, id_doctor)
      VALUES($1, $2)
      RETURNING *
    `;
    
    const result = await db.query(query, [id_centro, id_doctor]);
    return result.rows[0];
  },
  
  desasignarDoctor: async (id_centro, id_doctor) => {
    const query = `
      DELETE FROM doctor_centro
      WHERE id_centro = $1 AND id_doctor = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [id_centro, id_doctor]);
    return result.rows[0];
  }
};

module.exports = CentroMedico;