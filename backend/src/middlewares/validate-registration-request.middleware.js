const { z } = require("zod");
const { ApiResponse } = require("../config/api.response");

const registrationRequestBodySchema = z.object({
  institutionalEmail: z
    .string()
    .trim()
    .email("Correo inválido")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
  firstName: z.string().trim().min(1, "Nombres obligatorios"),
  lastName: z.string().trim().min(1, "Apellidos obligatorios"),
  area: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

function validateRegistrationRequest(req, res, next) {
  if (!req.file) {
    return res
      .status(400)
      .json(new ApiResponse(false, 400, "La foto de cédula es obligatoria"));
  }

  const parsed = registrationRequestBodySchema.safeParse(req.body);

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message || "Datos de registro inválidos";
    return res.status(400).json(new ApiResponse(false, 400, message));
  }

  req.body = parsed.data;
  next();
}

module.exports = validateRegistrationRequest;
