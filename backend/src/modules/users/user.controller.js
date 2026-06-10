const userService = require("./user.service");
const { ApiResponse } = require("../../config/api.response");

async function getUsers(req, res, next) {
  try {
    const users = await userService.getUsers();

    if (!users) {
      const err = new Error("No se encontraron usuarios");
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json(new ApiResponse(true, 200, "Usuarios obtenidos correctamente", users));
  } catch (error) {
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const user = await userService.updateUserStatus(
      req.params.id,
      req.body.status
    );

    return res.status(200).json(new ApiResponse(true, 200, "Estado de usuario actualizado correctamente", user));
  } catch (error) {
    next(error);
  }
}

async function getUserCedulaPhoto(req, res, next) {
  try {
    const photo = await userService.getUserCedulaPhoto(req.params.id);

    res.setHeader("Content-Type", photo.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${photo.filename}"`
    );

    if (photo.buffer) {
      return res.send(photo.buffer);
    }

    return res.sendFile(photo.fullPath, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  updateUserStatus,
  getUserCedulaPhoto,
};
