const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid MongoDB ObjectId");
const phone = z.string().trim().min(7).max(30).regex(/^[+()\-\s\d]+$/, "Invalid phone number");
const password = z.string().min(8).max(128).regex(/[a-z]/, "Password needs a lowercase letter").regex(/[A-Z]/, "Password needs an uppercase letter").regex(/\d/, "Password needs a number");
const bool = z.enum(["true", "false"]).transform((value) => value === "true");
const paginationQuery = z.object({ page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().min(1).max(100).optional() });

module.exports = { z, objectId, phone, password, bool, paginationQuery };
