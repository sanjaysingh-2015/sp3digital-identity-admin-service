const { OrganizationsUsers, FacilitiesUsers } = require('../models');

class AccessControlService {
  async assignOrganization(userId, organizationId) {
    return await OrganizationsUsers.create({
      user_id: userId,
      organization_id: organizationId,
      status: 'ACTIVE'
    });
  }

  async assignFacility(userId, facilityId) {
    return await FacilitiesUsers.create({
      user_id: userId,
      facility_id: facilityId,
      status: 'ACTIVE'
    });
  }

  async getUserOrganizations(userId) {
    return await OrganizationsUsers.findAll({ where: { user_id: userId } });
  }

  async getUserFacilities(userId) {
    return await FacilitiesUsers.findAll({ where: { user_id: userId } });
  }
}

module.exports = new AccessControlService();