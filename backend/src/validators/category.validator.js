const { z } = require("./common");
const fields = { name: z.string().trim().min(2).max(100), description: z.string().trim().max(1000).optional(), image: z.string().url().max(2048).optional().or(z.literal("")), sortOrder: z.coerce.number().int().min(0).max(10000).optional(), isActive: z.boolean().optional() };
const createCategorySchema = z.object(fields);
const updateCategorySchema = z.object(fields).partial().refine((data) => Object.keys(data).length > 0, "Provide at least one field");
module.exports = { createCategorySchema, updateCategorySchema };
