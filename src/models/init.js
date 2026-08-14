const db = require('./index');

async function initializeDatabase({ alter = false, force = false } = {}) {
  await db.sequelize.authenticate();
  if (alter || force) {
    await db.sequelize.sync({ alter, force });
  }
  return db;
}

module.exports = initializeDatabase;
