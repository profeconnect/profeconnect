const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { ApiResponse } = require("../config/api.response");

/**
 * Middleware para validar token de autenticación
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(new ApiResponse(false, 401, "Token de autenticación requerido"));
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json(new ApiResponse(false, 401, "Usuario no encontrado"));
    }

    if (user.status !== "ACTIVO") {
      return res.status(403).json(new ApiResponse(false, 403, "Usuario inactivo o bloqueado"));
    }

    if (!user.role || !user.role.active) {
      return res.status(403).json(new ApiResponse(false, 403, "Rol inválido o inactivo"));
    }

    req.user = {
      id: user.id,
      institutionalEmail: user.institutionalEmail,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    };

    next();
  } catch (error) {
    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
      return res.status(401).json(new ApiResponse(false, 401, "Token inválido o expirado, vuelva a ingresar porfavor"));
    }

    return next(error);
  }
}

module.exports = authMiddleware;