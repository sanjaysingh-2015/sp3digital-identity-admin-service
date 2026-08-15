const { UserOrganization, UserFacility } = require('../models');

class AccessControlService {
  async assignOrganization(userId, organizationId) {
    return await UserOrganization.create({
      user_id: userId,
      organization_id: organizationId,
      status: 'ACTIVE'
    });
  }

  async assignFacility(userId, facilityId) {
    return await UserFacility.create({
      user_id: userId,
      facility_id: facilityId,
      status: 'ACTIVE'
    });
  }

  async getUserOrganizations(userId) {
    return await UserOrganization.findAll({ where: { user_id: userId } });
  }

  async getUserFacilities(userId) {
    return await UserFacility.findAll({ where: { user_id: userId } });
  }
}

module.exports = new AccessControlService();