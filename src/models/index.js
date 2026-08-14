const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes, Model } = require('sequelize');

// Destructure `sequelize` from db.js config
const { sequelize } = require('../config/db');

const db = {};

fs.readdirSync(__dirname).forEach((file) => {
  // Only process model files, skipping index.js and associations.js
  if (file.endsWith('.model.js')) {
    const modelModule = require(path.join(__dirname, file));

    let model;

    // 1. If the exported module is an ES6 class extending Sequelize.Model
    if (typeof modelModule === 'function' && modelModule.prototype instanceof Model) {
      model = modelModule.init(modelModule.schema || {}, { sequelize });
    } 
    // 2. If the exported module is a standard factory function: (sequelize, DataTypes) => ...
    else if (typeof modelModule === 'function') {
      model = modelModule(sequelize, DataTypes);
    } 
    // 3. If it's already a defined model object
    else {
      model = modelModule;
    }

    if (model && model.name) {
      db[model.name] = model;
    }
  }
});

// Register model associations after all models are loaded
if (fs.existsSync(path.join(__dirname, 'associations.js'))) {
  require('./associations')(db);
}

// Export sequelize instance, class, and loaded models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;