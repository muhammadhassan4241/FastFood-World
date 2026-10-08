const { z, objectId, bool, paginationQuery } = require("./common");
const fields = { category: objectId, name: z.string().trim().min(2).max(150), description: z.string().trim().max(2000).optional(), price: z.coerce.number().finite().min(0), discountPrice: z.coerce.number().finite().min(0).nullable().optional(), image: z.string().url().max(2048).optional().or(z.literal("")), ingredients: z.array(z.string().trim().min(1).max(100)).max(30).optional(), isAvailable: z.boolean().optional(), isActive: z.boolean().optional(), preparationTime: z.coerce.number().int().min(0).max(360).optional() };
const priceCheck = (data) => data.discountPrice == null || data.price == null || data.discountPrice <= data.price;
const createMenuSchema = z.object(fields).refine(priceCheck, { message: "discountPrice cannot exceed price", path: ["discountPrice"] });
const updateMenuSchema = z.object(fields).partial().refine((data) => Object.keys(data).length > 0, "Provide at least one field");
const menuQuerySchema = paginationQuery.extend({ category: objectId.optional(), search: z.string().trim().max(100).optional(), minPrice: z.coerce.number().min(0).optional(), maxPrice: z.coerce.number().min(0).optional(), isAvailable: bool.optional() }).refine((data) => data.maxPrice == null || data.minPrice == null || data.minPrice <= data.maxPrice, { message: "minPrice cannot exceed maxPrice", path: ["minPrice"] });
const availabilitySchema = z.object({ isAvailable: z.boolean() });
module.exports = { createMenuSchema, updateMenuSchema, menuQuerySchema, availabilitySchema };
