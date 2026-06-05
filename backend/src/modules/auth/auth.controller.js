const authService = require("./auth.service");
const { ApiResponse } = require("../../config/api.response");

/**
 * Registrar solicitud de registro
 */
async function registerRequest(req, res, next) {
  try {
    const request = await authService.createRegistrationRequest({
      ...req.body,
      cedulaPhotoPath: req.cedulaPhotoPath,
      cedulaPhotoMime: req.cedulaPhotoMime,
      cedulaPhotoName: req.cedulaPhotoName,
    });

    const apiResponse = new ApiResponse(true, 201, "Solicitud de registro enviada correctamente. Un administrador revisará la información.", request);

    return res.status(201).json(apiResponse);
  } catch (error) {
    next(error);
  }
}

/**
 * Login de usuario
 */
async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);

    const apiResponse = new ApiResponse(true, 200, "Inicio de sesión correcto", result);

    return res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);

    if (!user) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;

      throw error;
    }
    
    const apiResponse = new ApiResponse(true, 200, "Información de usuario obtenida exitosamente", user);

    return res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerRequest,
  login,
  me,
};