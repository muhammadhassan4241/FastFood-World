const { z, phone, bool, paginationQuery } = require("./common");

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM time");
const restaurantFields = {
  name: z.string().trim().min(2).max(150), description: z.string().trim().max(2000).optional(), phone,
  email: z.string().trim().email().max(254), address: z.string().trim().min(4).max(300), city: z.string().trim().min(2).max(100),
  image: z.string().url().max(2048).optional().or(z.literal("")), openingTime: time.optional(), closingTime: time.optional(), isOpen: z.boolean().optional(), isActive: z.boolean().optional(),
};
const createRestaurantSchema = z.object(restaurantFields);
const updateRestaurantSchema = z.object(restaurantFields).partial().refine((data) => Object.keys(data).length > 0, "Provide at least one field");
const restaurantQuerySchema = paginationQuery.extend({ search: z.string().trim().max(100).optional(), city: z.string().trim().max(100).optional(), isActive: bool.optional(), isOpen: bool.optional() });
module.exports = { createRestaurantSchema, updateRestaurantSchema, restaurantQuerySchema };
