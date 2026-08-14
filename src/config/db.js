// src/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'sp3digital_identity',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

async function initDB() {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connection established successfully via Sequelize.');
    await sequelize.sync({ alter: true });
    console.log('Sequelize Models synchronized with Database.');
  } catch (error) {
    console.error('Unable to connect to MySQL database:', error.message);
  }
}

// Attach initDB function directly to the instance
sequelize.initDB = initDB;

module.exports = sequelize;