const prisma = require("../../lib/prisma");
const { resolveCedulaPath } = require("../../lib/cedula-storage");
const {
  isStorageUri,
  downloadStorageFile,
} = require("../../lib/storage");
const {
  createTeacherFromRegistrationRequest,
  serializeUser,
} = require("../auth/auth.service");
const {
  sendRegistrationApprovedEmail,
  sendRegistrationRejectedEmail,
  sendEmailInBackground,
} = require("../../lib/email");

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
    method: request.method,
    emailVerifiedAt: request.emailVerifiedAt,
    verificationSentAt: request.verificationSentAt,
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
    const error = new Error("ID de solicitud no valido");
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
    const error = new Error("Foto de cedula no encontrada");
    error.statusCode = 404;
    throw error;
  }

  const storageFile = isStorageUri(request.cedulaPhotoPath)
    ? await downloadStorageFile(request.cedulaPhotoPath)
    : null;

  return {
    fullPath: storageFile ? null : resolveCedulaPath(request.cedulaPhotoPath),
    buffer: storageFile,
    mimeType: request.cedulaPhotoMime || "application/octet-stream",
    filename: request.cedulaPhotoName || "cedula",
  };
}

async function approveRegistrationRequest(requestId, adminUserId) {
  const id = Number(requestId);

  if (Number.isNaN(id)) {
    const error = new Error("ID de solicitud no valido");
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
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

    if (request.method === "INSTITUTIONAL_EMAIL") {
      const error = new Error("Las solicitudes institucionales se aprueban verificando el correo");
      error.statusCode = 400;
      throw error;
    }

    return createTeacherFromRegistrationRequest(tx, request, {
      reviewedById: adminUserId,
      reviewedAt: new Date(),
    });
  });

  sendEmailInBackground(
    () => sendRegistrationApprovedEmail(result.request),
    "registration_approved"
  );

  return serializeUser(result.user);
}

async function rejectRegistrationRequest(requestId, adminUserId, reviewComment) {
  const id = Number(requestId);

  if (Number.isNaN(id)) {
    const error = new Error("ID de solicitud no valido");
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
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
    },
    select: {
      id: true,
      institutionalEmail: true,
      firstName: true,
      lastName: true,
      status: true,
      reviewComment: true,
      reviewedAt: true,
      method: true,
    },
  });

  sendEmailInBackground(
    () => sendRegistrationRejectedEmail(updatedRequest),
    "registration_rejected"
  );

  return updatedRequest;
}

module.exports = {
  getRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  getRegistrationRequestCedulaPhoto,
};
