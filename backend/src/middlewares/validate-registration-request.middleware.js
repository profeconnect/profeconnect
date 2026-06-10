const { z } = require("zod");
const { ApiResponse } = require("../config/api.response");
const { resolveCedulaPath } = require("../lib/cedula-storage");
const {
  isStorageUri,
  parseStorageUri,
  removeStorageObjects,
  removeLocalFile,
} = require("../lib/storage");

const registrationRequestBodySchema = z.object({
  institutionalEmail: z
    .string()
    .trim()
    .email("Correo invalido")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres"),
  firstName: z.string().trim().min(1, "Nombres obligatorios"),
  lastName: z.string().trim().min(1, "Apellidos obligatorios"),
  area: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

async function cleanupCedulaUpload(req) {
  try {
    if (!req.cedulaPhotoPath) return;

    if (isStorageUri(req.cedulaPhotoPath)) {
      await removeStorageObjects([parseStorageUri(req.cedulaPhotoPath)]);
      return;
    }

    removeLocalFile(resolveCedulaPath(req.cedulaPhotoPath));
  } catch (error) {
    console.warn("No se pudo limpiar foto de cedula tras validacion fallida", error.message);
  }
}

async function validateRegistrationRequest(req, res, next) {
  if (!req.file) {
    return res
      .status(400)
      .json(new ApiResponse(false, 400, "La foto de cedula es obligatoria"));
  }

  const parsed = registrationRequestBodySchema.safeParse(req.body);

  if (!parsed.success) {
    await cleanupCedulaUpload(req);
    const message =
      parsed.error.issues[0]?.message || "Datos de registro invalidos";
    return res.status(400).json(new ApiResponse(false, 400, message));
  }

  req.body = parsed.data;
  next();
}

module.exports = validateRegistrationRequest;
