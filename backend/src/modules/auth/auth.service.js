const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../../lib/prisma");
const {
  sendRegistrationReceivedEmail,
  sendInstitutionalVerificationEmail,
  sendInstitutionalAccountActivatedEmail,
  sendEmailInBackground,
} = require("../../lib/email");

function getAllowedInstitutionalDomains() {
  return (process.env.ALLOWED_INSTITUTIONAL_DOMAINS || "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

function getEmailDomain(email) {
  return String(email || "").split("@").pop()?.toLowerCase() || "";
}

function assertAllowedInstitutionalDomain(email) {
  const allowedDomains = getAllowedInstitutionalDomains();

  if (allowedDomains.length === 0) {
    const error = new Error("No hay dominios institucionales configurados");
    error.statusCode = 500;
    throw error;
  }

  const domain = getEmailDomain(email);

  if (!allowedDomains.includes(domain)) {
    const error = new Error("El dominio del correo institucional no esta permitido");
    error.statusCode = 400;
    throw error;
  }
}

function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  return { token, hash };
}

function hashVerificationToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getVerificationExpirationDate() {
  const configuredHours = Number(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS);
  const hours = Number.isFinite(configuredHours) && configuredHours > 0
    ? configuredHours
    : 24;

  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function getAppPublicUrl() {
  return (process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

function buildVerificationUrl(token) {
  return `${getAppPublicUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

async function assertCanRequestRegistration(institutionalEmail) {
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
}

async function createTeacherFromRegistrationRequest(tx, request, extraRequestData = {}) {
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
    const error = new Error("La solicitud no tiene contrasena valida");
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

  const updatedRequest = await tx.registrationRequest.update({
    where: { id: request.id },
    data: {
      status: "APROBADA",
      reviewedAt: new Date(),
      reviewComment: "Solicitud aprobada",
      ...extraRequestData,
    },
  });

  return { user, request: updatedRequest };
}

function serializeUser(user) {
  return {
    id: user.id,
    institutionalEmail: user.institutionalEmail,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    role: user.role.name,
    profile: user.teacherProfile,
  };
}

async function createRegistrationRequest(data) {

  const {
    institutionalEmail,
    password,
    firstName,
    lastName,
    cedulaPhotoPath,
    cedulaPhotoMime,
    cedulaPhotoName,
    area,
    description,
  } = data;

  if (!cedulaPhotoPath) {
    const error = new Error("La foto de cédula es obligatoria");
    error.statusCode = 400;
    throw error;
  }

  await assertCanRequestRegistration(institutionalEmail);

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.registrationRequest.create({
    data: {
      institutionalEmail,
      passwordHash,
      firstName,
      lastName,
      cedulaPhotoPath,
      cedulaPhotoMime,
      cedulaPhotoName,
      area,
      description,
      method: "CEDULA",
      status: "PENDIENTE",
    },
    select: {
      id: true,
      institutionalEmail: true,
      firstName: true,
      lastName: true,
      cedulaPhotoPath: true,
      cedulaPhotoName: true,
      area: true,
      description: true,
      status: true,
      method: true,
      createdAt: true,
    },
  });

  sendEmailInBackground(
    () => sendRegistrationReceivedEmail(created),
    "registration_received"
  );

  return {
    ...created,
    hasCedulaPhoto: Boolean(created.cedulaPhotoPath),
    cedulaPhotoPath: undefined,
  };
}

async function createInstitutionalRegistrationRequest(data) {
  const {
    institutionalEmail,
    password,
    firstName,
    lastName,
    area,
    description,
  } = data;

  assertAllowedInstitutionalDomain(institutionalEmail);
  await assertCanRequestRegistration(institutionalEmail);

  const passwordHash = await bcrypt.hash(password, 10);
  const { token, hash } = generateVerificationToken();
  const expiresAt = getVerificationExpirationDate();

  const created = await prisma.registrationRequest.create({
    data: {
      institutionalEmail,
      passwordHash,
      firstName,
      lastName,
      area,
      description,
      method: "INSTITUTIONAL_EMAIL",
      status: "PENDIENTE",
      verificationTokenHash: hash,
      verificationTokenExpiresAt: expiresAt,
      verificationSentAt: new Date(),
    },
    select: {
      id: true,
      institutionalEmail: true,
      firstName: true,
      lastName: true,
      area: true,
      description: true,
      status: true,
      method: true,
      verificationSentAt: true,
      createdAt: true,
    },
  });

  try {
    await sendInstitutionalVerificationEmail(created, buildVerificationUrl(token));
  } catch (emailError) {
    try {
      await prisma.registrationRequest.deleteMany({
        where: {
          id: created.id,
          method: "INSTITUTIONAL_EMAIL",
          status: "PENDIENTE",
        },
      });
    } catch (cleanupError) {
      console.error("No se pudo limpiar la solicitud tras el fallo SMTP", {
        requestId: created.id,
        message: cleanupError.message,
      });
    }

    throw emailError;
  }

  return {
    ...created,
    hasCedulaPhoto: false,
  };
}

async function verifyInstitutionalEmail(token) {
  if (!token || typeof token !== "string") {
    const error = new Error("Token de verificacion requerido");
    error.statusCode = 400;
    throw error;
  }

  const tokenHash = hashVerificationToken(token);

  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.registrationRequest.findFirst({
      where: {
        verificationTokenHash: tokenHash,
      },
    });

    if (!request) {
      const error = new Error("Token de verificacion invalido");
      error.statusCode = 400;
      throw error;
    }

    if (request.method !== "INSTITUTIONAL_EMAIL") {
      const error = new Error("La solicitud no corresponde a verificacion institucional");
      error.statusCode = 400;
      throw error;
    }

    if (request.status !== "PENDIENTE") {
      const error = new Error("La solicitud ya fue revisada");
      error.statusCode = 409;
      throw error;
    }

    if (!request.verificationTokenExpiresAt || request.verificationTokenExpiresAt < new Date()) {
      const error = new Error("El enlace de verificacion expiro");
      error.statusCode = 400;
      throw error;
    }

    const tokenClaim = await tx.registrationRequest.updateMany({
      where: {
        id: request.id,
        status: "PENDIENTE",
        verificationTokenHash: tokenHash,
      },
      data: {
        verificationTokenHash: null,
      },
    });

    if (tokenClaim.count !== 1) {
      const error = new Error("El enlace de verificacion ya fue usado o esta siendo procesado");
      error.statusCode = 409;
      throw error;
    }

    const { user, request: updatedRequest } = await createTeacherFromRegistrationRequest(tx, request, {
      emailVerifiedAt: new Date(),
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      reviewComment: "Correo institucional verificado",
    });

    return {
      user,
      request: updatedRequest,
    };
  });

  sendEmailInBackground(
    () => sendInstitutionalAccountActivatedEmail(result.request),
    "institutional_account_activated"
  );

  return serializeUser(result.user);
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
  createInstitutionalRegistrationRequest,
  verifyInstitutionalEmail,
  createTeacherFromRegistrationRequest,
  serializeUser,
  login,
  getMe
};
