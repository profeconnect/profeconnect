const prisma = require("../../lib/prisma");
const { resolveCedulaPath } = require("../../lib/cedula-storage");

const VALID_USER_STATUSES = ["ACTIVO", "INACTIVO", "PENDIENTE", "BLOQUEADO"];

async function getUsers() {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      role: true,
      teacherProfile: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    institutionalEmail: user.institutionalEmail,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    role: user.role?.name,
    profile: user.teacherProfile,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

async function updateUserStatus(userId, status) {
  const id = Number(userId);

  if (Number.isNaN(id)) {
    const error = new Error("ID de usuario no válido");
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_USER_STATUSES.includes(status)) {
    const error = new Error("Estado de usuario no válido");
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
    include: {
      role: true,
      teacherProfile: true,
    },
  });

  return {
    id: updatedUser.id,
    institutionalEmail: updatedUser.institutionalEmail,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    status: updatedUser.status,
    role: updatedUser.role?.name,
    profile: updatedUser.teacherProfile,
  };
}

async function getUserCedulaPhoto(userId) {
  const id = Number(userId);

  if (Number.isNaN(id)) {
    const error = new Error("ID de usuario no válido");
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      cedulaPhotoPath: true,
      cedulaPhotoMime: true,
      cedulaPhotoName: true,
    },
  });

  if (!user?.cedulaPhotoPath) {
    const error = new Error("Foto de cédula no encontrada");
    error.statusCode = 404;
    throw error;
  }

  return {
    fullPath: resolveCedulaPath(user.cedulaPhotoPath),
    mimeType: user.cedulaPhotoMime || "application/octet-stream",
    filename: user.cedulaPhotoName || "cedula",
  };
}

module.exports = {
  getUsers,
  updateUserStatus,
  getUserCedulaPhoto,
};