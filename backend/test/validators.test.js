const test = require("node:test");
const assert = require("node:assert/strict");
const { registerSchema } = require("../src/validators/auth.validator");
const { createOrderSchema } = require("../src/validators/order.validator");

test("registration requires a strong password", () => {
  assert.equal(registerSchema.safeParse({ name: "Test User", email: "test@example.com", password: "weak", phone: "+923001234567" }).success, false);
});
test("order input strips frontend totals", () => {
  const result = createOrderSchema.safeParse({ deliveryAddress: { address: "10 Main Street", city: "Karachi" }, phone: "+923001234567", paymentMethod: "cash", total: 1 });
  assert.equal(result.success, true);
  assert.equal(result.data.total, undefined);
});
