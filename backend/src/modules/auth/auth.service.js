const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../lib/prisma");

async function createRegistrationRequest(data) {

  const {
    institutionalEmail,
    password,
    firstName,
    lastName,
    area,
    description,
  } = data;

  const existingUser = await prisma.user.findUnique({
    where: {
      institutionalEmail,
    },
  });

  if (existingUser) {
    const error = new Error(
      "Ya existe un usuario registrado con este correo"
    );

    error.statusCode = 409;

    throw error;
  }

  const existingPendingRequest =
    await prisma.registrationRequest.findFirst({
      where: {
        institutionalEmail,
        status: "PENDIENTE",
      },
    });

  if (existingPendingRequest) {

    const error = new Error(
      "Ya existe una solicitud pendiente con este correo"
    );

    error.statusCode = 409;

    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.registrationRequest.create({
    data: {
      institutionalEmail,
      passwordHash,
      firstName,
      lastName,
      area,
      description,
      status: "PENDIENTE",
    },
    select: {
      id: true,
      institutionalEmail: true,
      firstName: true,
      lastName: true,
      area: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });
}

async function login(data) {

  const {
    institutionalEmail,
    password,
  } = data;

  const user = await prisma.user.findUnique({
    where: {
      institutionalEmail,
    },
    include: {
      role: true,
    },
  });

  if (!user) {

    const error = new Error("Credenciales incorrectas");
    error.statusCode = 401;

    throw error;
  }

  const passwordIsValid =
    await bcrypt.compare(password, user.passwordHash);

  if (!passwordIsValid) {
    const error = new Error("Credenciales incorrectas");
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== "ACTIVO") {
    const error = new Error(
      "Usuario inactivo, pendiente o bloqueado"
    );

    error.statusCode = 403;

    throw error;
  }

  if (!user.role || !user.role.active) {
    const error = new Error("Rol inválido o inactivo");
    error.statusCode = 403;
    throw error;
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.institutionalEmail,
      role: user.role.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "1d",
    }
  );

  return {
    token,

    user: {
      id: user.id,
      institutionalEmail:
        user.institutionalEmail,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      status: user.status,
    },
  };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      teacherProfile: true,
    },
  });

  if (!user) {
    return null;
  }

  const profile = user.teacherProfile
    ? {
        id: user.teacherProfile.id,
        userId: user.teacherProfile.userId,
        area: user.teacherProfile.area,
        description: user.teacherProfile.description,
        photoUrl: user.teacherProfile.photoUrl,
        createdAt: user.teacherProfile.createdAt,
        updatedAt: user.teacherProfile.updatedAt,
      }
    : null;

  return {
    id: user.id,
    institutionalEmail: user.institutionalEmail,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    role: user.role.name,
    profile,
  };
}
module.exports = {
  createRegistrationRequest,
  login,
  getMe
};