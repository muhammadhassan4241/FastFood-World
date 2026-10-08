const { z, objectId } = require("./common");
const addItemSchema = z.object({ menuItemId: objectId, quantity: z.coerce.number().int().min(1).max(99) });
const updateItemSchema = z.object({ quantity: z.coerce.number().int().min(1).max(99) });
module.exports = { addItemSchema, updateItemSchema };
