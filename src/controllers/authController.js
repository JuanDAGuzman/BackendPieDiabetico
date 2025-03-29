const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuarioModel");
const Rol = require("../models/rolModel");
const db = require("../config/database");
const { jwtSecret, jwtExpiresIn } = require("../config/config");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email y contraseña son requeridos" });
    }

    const usuario = await Usuario.findByEmail(email);

    if (!usuario) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    if (usuario.estado !== "Activo") {
      return res.status(401).json({ message: "Usuario inactivo" });
    }

    const isPasswordValid = await Usuario.validatePassword(
      password,
      usuario.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Obtener permisos del rol
    const permisos = await Rol.getPermisos(usuario.id_rol);

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        email: usuario.email,
        rol: usuario.id_rol,
        permisos: permisos.map((p) => p.nombre),
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    res.status(200).json({
      message: "Login exitoso",
      token: token,
      user: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.id_rol,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      numero_identificacion,
      tipo_identificacion,
    } = req.body;

    // Validar que el email no exista ya
    const existingUser = await Usuario.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Validar que el número de identificación no exista ya
    if (numero_identificacion) {
      const existingIdUser = await db.query(
        "SELECT * FROM usuarios WHERE numero_identificacion = $1",
        [numero_identificacion]
      );
      if (existingIdUser.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "El número de identificación ya está registrado" });
      }
    }

    // Por defecto, asignar rol de paciente (id_rol=3)
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
      tipo_identificacion,
    });

    if (!nuevoUsuario) {
      return res.status(500).json({ message: "Error al crear el usuario" });
    }

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        id: nuevoUsuario.id_usuario,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.userData.id;
    const usuario = await Usuario.findById(userId);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Ocultar la contraseña
    delete usuario.password;

    res.status(200).json({ user: usuario });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.userData.id;
    const usuario = await Usuario.findById(userId);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar solo los campos permitidos para el usuario
    const updatedUser = await Usuario.update(userId, {
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      telefono: req.body.telefono,
      direccion: req.body.direccion,
      // No permitimos cambiar email, password y otros campos sensibles
    });

    if (!updatedUser) {
      return res.status(500).json({ message: "Error al actualizar el perfil" });
    }

    // Ocultar la contraseña
    delete updatedUser.password;

    res.status(200).json({
      message: "Perfil actualizado exitosamente",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
