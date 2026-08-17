const tenantService = require('../services/tenantService');

class TenantController {
  searchTenants = async (req, res) => {
    try {
      const tenantName = req.query.q;

      const tenants = await tenantService.searchByName(tenantName);

      return res.status(200).json({
        success: true,
        count: tenants.length,
        data: tenants
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error fetching tenants'
      });
    }
  };
}

module.exports = new TenantController();