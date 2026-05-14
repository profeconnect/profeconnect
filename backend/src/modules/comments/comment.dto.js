const { z } = require("zod");

const createCommentDto = z.object({
  content: z
    .string()
    .trim()
    .min(1, "El comentario es obligatorio")
    .max(1000, "Máximo 1000 caracteres"),
});

module.exports = {
  createCommentDto,
};
