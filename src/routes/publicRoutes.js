const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Route path relative to /api/v1/identity-admin
/**
 * @openapi
 * /api/v1/identity-admin/public/tenants/search:
 *   get:
 *     summary: Search tenants (filterable by status/ip; defaults to ACTIVE)
 *     tags: [Public APIs]
 */
router.get('/public/tenants/search', publicController.searchTenants);

module.exports = router;