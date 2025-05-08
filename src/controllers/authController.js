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

    // Datos adicionales según el rol
    let datosAdicionales = {};

    // Si es doctor, incluir su id_doctor
    if (usuario.id_rol === 2) {
      const resultDoctor = await db.query(
        "SELECT id_doctor, estado_verificacion FROM doctores WHERE id_usuario = $1",
        [usuario.id_usuario]
      );

      if (resultDoctor.rows.length > 0) {
        datosAdicionales = {
          id_doctor: resultDoctor.rows[0].id_doctor,
          doctor_verificado:
            resultDoctor.rows[0].estado_verificacion === "Aprobado",
        };
      }
    }

    // Si es paciente, incluir su id_paciente
    if (usuario.id_rol === 3) {
      const resultPaciente = await db.query(
        "SELECT id_paciente FROM pacientes WHERE id_usuario = $1",
        [usuario.id_usuario]
      );

      if (resultPaciente.rows.length > 0) {
        datosAdicionales = {
          id_paciente: resultPaciente.rows[0].id_paciente,
        };
      }
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        email: usuario.email,
        rol: usuario.id_rol,
        permisos: permisos.map((p) => p.nombre),
        ...datosAdicionales,
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
        ...datosAdicionales,
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
      rol, // Nuevo parámetro opcional para permitir especificar rol (principalmente para admin)
    } = req.body;

    // Validar que el email no exista ya
    const existingUser = await Usuario.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message:
          "El email ya está registrado. Si deseas completar tu perfil como doctor o paciente, usa los endpoints correspondientes.",
      });
    }

    // Determinar el rol - default: paciente (3)
    // Solo permitir rol admin (1) si hay una verificación especial (puedes implementarla después)
    let id_rol = 3; // Default: paciente
    if (rol === 1 && req.headers["admin-secret"] === process.env.ADMIN_SECRET) {
      id_rol = 1; // Permitir crear admin solo con un secreto especial
    } else if (rol === 2) {
      id_rol = 2; // Permitir crear doctor (pero necesitará verificación)
    }

    const nuevoUsuario = await Usuario.create({
      id_rol,
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

    // Mensaje adicional según el rol
    let rolMensaje = "";
    if (id_rol === 1) {
      rolMensaje = "con rol de Administrador";
    } else if (id_rol === 2) {
      rolMensaje =
        "con rol de Doctor. Para completar su perfil profesional, use el endpoint /api/doctores";
    } else {
      rolMensaje =
        "con rol de Paciente. Para completar su perfil médico, use el endpoint /api/pacientes";
    }

    res.status(201).json({
      message: `Usuario registrado exitosamente ${rolMensaje}`,
      user: {
        id: nuevoUsuario.id_usuario,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: id_rol,
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
