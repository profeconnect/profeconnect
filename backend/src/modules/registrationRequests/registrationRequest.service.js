const prisma = require("../../lib/prisma");
const { resolveCedulaPath } = require("../../lib/cedula-storage");

/***
 * Obtener todas las solicitudes de registro pendientes por aprobar -- SOLO MODERADOR
 */
async function getRegistrationRequests(status) {
  const where = {};

  if (status) {
    where.status = status;
  }

  const requests = await prisma.registrationRequest.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      reviewedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          institutionalEmail: true,
        },
      },
    },
  });

  return requests.map((request) => ({
    id: request.id,
    institutionalEmail: request.institutionalEmail,
    firstName: request.firstName,
    lastName: request.lastName,
    hasCedulaPhoto: Boolean(request.cedulaPhotoPath),
    cedulaPhotoName: request.cedulaPhotoName,
    area: request.area,
    description: request.description,
    status: request.status,
    reviewComment: request.reviewComment,
    reviewedAt: request.reviewedAt,
    reviewedBy: request.reviewedBy,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  }));
}

async function getRegistrationRequestCedulaPhoto(requestId) {
  const id = Number(requestId);

  if (Number.isNaN(id)) {
    const error = new Error("ID de solicitud no válido");
    error.statusCode = 400;
    throw error;
  }

  const request = await prisma.registrationRequest.findUnique({
    where: { id },
    select: {
      cedulaPhotoPath: true,
      cedulaPhotoMime: true,
      cedulaPhotoName: true,
    },
  });

  if (!request?.cedulaPhotoPath) {
    const error = new Error("Foto de cédula no encontrada");
    error.statusCode = 404;
    throw error;
  }

  return {
    fullPath: resolveCedulaPath(request.cedulaPhotoPath),
    mimeType: request.cedulaPhotoMime || "application/octet-stream",
    filename: request.cedulaPhotoName || "cedula",
  };
}

/***
 * Aprobar solicitud de registro -- SOLO MODERADOR
 */
async function approveRegistrationRequest(requestId, adminUserId) {
  const id = Number(requestId);

  if (Number.isNaN(id)) {
    const error = new Error("ID de solicitud no válido");
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.registrationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      const error = new Error("Solicitud no encontrada");
      error.statusCode = 404;
      throw error;
    }

    if (request.status !== "PENDIENTE") {
      const error = new Error("La solicitud ya fue revisada");
      error.statusCode = 409;
      throw error;
    }

    const existingUser = await tx.user.findUnique({
      where: {
        institutionalEmail: request.institutionalEmail,
      },
    });

    if (existingUser) {
      const error = new Error("Ya existe un usuario con este correo");
      error.statusCode = 409;
      throw error;
    }

    const teacherRole = await tx.role.findUnique({
      where: {
        name: "docente",
      },
    });

    if (!teacherRole || !teacherRole.active) {
      const error = new Error("Rol docente no encontrado o inactivo");
      error.statusCode = 500;
      throw error;
    }

    if (!request.passwordHash) {
      const error = new Error("La solicitud no tiene contraseña válida");
      error.statusCode = 400;
      throw error;
    }

    const user = await tx.user.create({
      data: {
        institutionalEmail: request.institutionalEmail,
        passwordHash: request.passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        cedulaPhotoPath: request.cedulaPhotoPath,
        cedulaPhotoMime: request.cedulaPhotoMime,
        cedulaPhotoName: request.cedulaPhotoName,
        status: "ACTIVO",
        roleId: teacherRole.id,
        teacherProfile: {
          create: {
            area: request.area,
            description: request.description,
          },
        },
      },
      include: {
        role: true,
        teacherProfile: true,
      },
    });

    await tx.registrationRequest.update({
      where: { id },
      data: {
        status: "APROBADA",
        reviewedById: adminUserId,
        reviewedAt: new Date(),
        reviewComment: "Solicitud aprobada",
      },
    });

    return {
      id: user.id,
      institutionalEmail: user.institutionalEmail,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      role: user.role.name,
      profile: user.teacherProfile,
    };
  });
}

/***
 * Eliminar solicitud de registro -- SOLO MODERADOR
 */
async function rejectRegistrationRequest(requestId, adminUserId, reviewComment) {
  const id = Number(requestId);

  if (Number.isNaN(id)) {
    const error = new Error("ID de solicitud no válido");
    error.statusCode = 400;
    throw error;
  }

  const request = await prisma.registrationRequest.findUnique({
    where: { id },
  });

  if (!request) {
    const error = new Error("Solicitud no encontrada");
    error.statusCode = 404;
    throw error;
  }

  if (request.status !== "PENDIENTE") {
    const error = new Error("La solicitud ya fue revisada");
    error.statusCode = 409;
    throw error;
  }

  const updatedRequest = await prisma.registrationRequest.update({
    where: { id },
    data: {
      status: "RECHAZADA",
      reviewedById: adminUserId,
      reviewedAt: new Date(),
      reviewComment: reviewComment || "Solicitud rechazada",
      passwordHash: null,
    },
    select: {
      id: true,
      institutionalEmail: true,
      firstName: true,
      lastName: true,
      status: true,
      reviewComment: true,
      reviewedAt: true,
    },
  });

  return updatedRequest;
}

module.exports = {
  getRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  getRegistrationRequestCedulaPhoto,
};