const { z } = require("zod");

const tagsSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}, z.array(z.coerce.number().int().positive()));

const createPublicationDto = z.object({
  title: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(150, "Máximo 150 caracteres"),

  content: z
    .string()
    .trim()
    .min(1, "El contenido es obligatorio"),
      
  isAnonymous: z
    .union([
      z.boolean(),
      z.string().transform(
        value => value === "true"
      )
    ])
    .optional(),

    tags: tagsSchema.default([]),
});

const updatePublicationDto = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .optional(),

  content: z
    .string()
    .trim()
    .min(1)
    .optional(),

  isAnonymous: z
    .union([
      z.boolean(),
      z.string().transform(value => value === "true"),
    ])
    .optional(),

  status: z.enum([
    "PUBLISHED",
    "ARCHIVED",
    "HIDDEN",
  ]).optional(),

  tags: tagsSchema.optional(),
});

module.exports = {
  createPublicationDto,
  updatePublicationDto,
};