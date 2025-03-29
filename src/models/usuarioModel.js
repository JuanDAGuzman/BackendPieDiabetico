const db = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = {
  findAll: async () => {
    const result = await db.query('SELECT * FROM usuarios');
    return result.rows;
  },
  
  findById: async (id) => {
    const result = await db.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id]);
    return result.rows[0];
  },
  
  findByEmail: async (email) => {
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0];
  },
  
  create: async (usuario) => {
    const hashedPassword = await bcrypt.hash(usuario.password, 10);
    const query = `
      INSERT INTO usuarios(id_rol, nombre, apellido, email, password, telefono, direccion, 
                         fecha_nacimiento, genero, numero_identificacion, tipo_identificacion)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      usuario.id_rol,
      usuario.nombre,
      usuario.apellido,
      usuario.email,
      hashedPassword,
      usuario.telefono,
      usuario.direccion,
      usuario.fecha_nacimiento,
      usuario.genero,
      usuario.numero_identificacion,
      usuario.tipo_identificacion
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  update: async (id, usuario) => {
    // Primero obtenemos el usuario para no sobrescribir la contraseña si no se proporciona
    const currentUser = await Usuario.findById(id);
    if (!currentUser) return null;
    
    // Si se proporciona una nueva contraseña, la hasheamos
    let hashedPassword = currentUser.password;
    if (usuario.password) {
      hashedPassword = await bcrypt.hash(usuario.password, 10);
    }
    
    const query = `
      UPDATE usuarios
      SET id_rol = $1,
          nombre = $2,
          apellido = $3,
          email = $4,
          password = $5,
          telefono = $6,
          direccion = $7,
          fecha_nacimiento = $8,
          genero = $9,
          numero_identificacion = $10,
          tipo_identificacion = $11,
          fecha_modificacion = CURRENT_TIMESTAMP,
          estado = $12
      WHERE id_usuario = $13
      RETURNING *
    `;
    
    const values = [
      usuario.id_rol || currentUser.id_rol,
      usuario.nombre || currentUser.nombre,
      usuario.apellido || currentUser.apellido,
      usuario.email || currentUser.email,
      hashedPassword,
      usuario.telefono || currentUser.telefono,
      usuario.direccion || currentUser.direccion,
      usuario.fecha_nacimiento || currentUser.fecha_nacimiento,
      usuario.genero || currentUser.genero,
      usuario.numero_identificacion || currentUser.numero_identificacion,
      usuario.tipo_identificacion || currentUser.tipo_identificacion,
      usuario.estado || currentUser.estado,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },
  
  delete: async (id) => {
    // Cambiamos estado a inactivo en lugar de eliminar
    const query = `
      UPDATE usuarios
      SET estado = 'Inactivo', fecha_modificacion = CURRENT_TIMESTAMP
      WHERE id_usuario = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
  
  validatePassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
};

module.exports = Usuario;