const tenantService = require("../services/tenantService");

const {
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
} = require("../validations/tenant.validation");

class TenantController {
  getTenantList = async (req, res, next) => {
    try {
      const { page, limit, status, search } = req.query;
      const tenants = await tenantService.getTenantList({
        page,
        limit,
        status,
        search,
      });
      return res.status(200).json(tenants);
    } catch (error) {
      return next(error);
    }
  };

  getTenantById = async (req, res, next) => {
    try {
      const tenant = await tenantService.getTenantById(req.params.tenantUuid);
      return res.status(200).json(tenant);
    } catch (error) {
      return next(error);
    }
  };

  createTenant = async (req, res, next) => {
    try {
      validateCreatePayload(req.body);
      const tenant = await tenantService.createTenant(
        req.body,
        req.auth.userId,
      );
      return res.status(201).json(tenant);
    } catch (error) {
      return next(error);
    }
  };

  updateTenant = async (req, res, next) => {
    try {
      validateUpdatePayload(req.body);
      const provider = await tenantService.updateTenant(
        req.params.tenantUuid,
        req.body,
        req.auth.userId,
      );
      return res.status(200).json(provider);
    } catch (error) {
      return next(error);
    }
  };

  deleteTenant = async (req, res, next) => {
    try {
      const provider = await tenantService.deleteTenant(
        req.params.tenantUuid,
        req.auth.userId,
      );
      return res.status(200).json(provider);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      validateStatusPayload(req.body);
      const provider = await tenantService.updateStatus(
        req.params.tenantUuid,
        req.body.status,
        req.auth.userId,
      );
      return res.status(200).json(provider);
    } catch (error) {
      return next(error);
    }
  };

  //For Dropdowns
  getTenants = async (req, res) => {
    try {
      const tenants = await tenantService.getTenants();
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
}

module.exports = new TenantController();
