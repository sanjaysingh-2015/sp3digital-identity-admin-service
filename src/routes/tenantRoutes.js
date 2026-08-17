const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// Route path relative to /api/v1/identity-admin
router.get('/tenants/search', tenantController.searchTenants);

module.exports = router;