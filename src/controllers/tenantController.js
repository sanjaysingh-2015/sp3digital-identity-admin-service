const tenantService = require('../services/tenantService');

class TenantController {
  searchTenants = async (req, res) => {
    try {
      const tenantName = req.query.q;
console.log("Start Search");
      const tenants = await tenantService.searchByName(tenantName);
console.log("End Search");
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