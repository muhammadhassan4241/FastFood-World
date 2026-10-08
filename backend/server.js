const app = require("./src/app");
const { connectDatabase } = require("./src/config/database");
const { port, validateEnvironment } = require("./src/config/env");

async function start() {
  validateEnvironment();
  await connectDatabase();
  app.listen(port, () => console.log(`API listening on http://localhost:${port}/api`));
}

if (require.main === module) start().catch((error) => { console.error("Failed to start API:", error.message); process.exit(1); });
module.exports = { app, start };
