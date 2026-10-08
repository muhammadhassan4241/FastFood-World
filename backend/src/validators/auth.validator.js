const { z, phone, password } = require("./common");

const registerSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), password, phone });
const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });
const updateProfileSchema = z.object({ name: z.string().trim().min(2).max(100).optional(), phone: phone.optional() }).refine((data) => Object.keys(data).length > 0, "Provide at least one field");
const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password });
module.exports = { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema };
