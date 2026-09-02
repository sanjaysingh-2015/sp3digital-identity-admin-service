const tenantService = require("../services/tenantService");
const registrationService = require("../services/registrationService");

class PublicController {
  searchTenants = async (req, res) => {
    try {
      const tenantName = req.query.q;
      const tenants = await tenantService.searchByName(tenantName);
      return res.status(200).json({
        success: true,
        count: tenants.length,
        data: tenants,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error fetching tenants",
      });
    }
  };

  /**
   * POST /api/v1/identity-admin/public/register-organization
   * Unauthenticated — see registrationService.registerOrganization for the
   * full orchestration (tenant -> organization -> user -> role -> login).
   * Routed through next(error) rather than a local try/catch so it gets
   * the same statusCode/code handling as every other error in this
   * service (see app.js's error middleware).
   */
  registerOrganization = async (req, res, next) => {
    try {
      const result = await registrationService.registerOrganization(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new PublicController();
