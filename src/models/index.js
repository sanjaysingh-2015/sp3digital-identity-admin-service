const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const db = {};

// Read all `.model.js` files dynamically
fs.readdirSync(__dirname).forEach((file) => {
  if (file.endsWith('.model.js')) {
    const modelModule = require(path.join(__dirname, file));

    // Handle both functional exports module.exports = (sequelize, DataTypes) => ...
    // and direct exports module.exports = Model
    const model = typeof modelModule === 'function' 
      ? modelModule(sequelize, DataTypes) 
      : modelModule;

    db[model.name] = model;
  }
});

// Register associations after all models are loaded
if (fs.existsSync(path.join(__dirname, 'associations.js'))) {
  require('./associations')(db);
}

// Export the instance, class, and models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;