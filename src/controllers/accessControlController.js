const accessControlService = require('../services/accessControlService');

class AccessControlController {
  async assignOrganization(req, res, next) {
    try {
      const { organizationId } = req.body;
      const resData = await accessControlService.assignOrganization(req.params.userId, organizationId);
      return res.status(201).json(resData);
    } catch (err) { next(err); }
  }

  async assignFacility(req, res, next) {
    try {
      const { facilityId } = req.body;
      const resData = await accessControlService.assignFacility(req.params.userId, facilityId);
      return res.status(201).json(resData);
    } catch (err) { next(err); }
  }
}

module.exports = new AccessControlController();