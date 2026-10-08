const { z, phone } = require("./common");
const createOrderSchema = z.object({ deliveryAddress: z.object({ address: z.string().trim().min(4).max(300), city: z.string().trim().min(2).max(100), postalCode: z.string().trim().max(20).optional() }), phone, paymentMethod: z.enum(["cash", "card", "wallet"]), notes: z.string().trim().max(1000).optional() });
const statusSchema = z.object({ status: z.enum(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled", "rejected"]) });
module.exports = { createOrderSchema, statusSchema };
