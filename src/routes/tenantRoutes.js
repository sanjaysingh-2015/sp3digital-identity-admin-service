const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// Route path relative to /api/v1/identity-admin
/**
 * @openapi
 * /api/v1/identity-admin/tenants:
 *   get:
 *     summary: Get list of tenants (filterable by status/ip; defaults to ACTIVE)
 *     tags: [Tenants]
 */
router.get('/', tenantController.getTenants);

module.exports = router;