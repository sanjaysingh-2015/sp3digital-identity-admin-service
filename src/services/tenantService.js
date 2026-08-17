const { Op } = require('sequelize');
const IdentityTenants = require('../models');

class TenantService {
  async searchByName(tenantName) {
    const whereClause = {
      status: 'ACTIVE' // Returns active tenants by default
    };

    if (tenantName) {
      whereClause.tenantName = {
        [Op.like]: `%${tenantName.trim()}%`
      };
    }

    const tenants = await IdentityTenant.findAll({
      where: whereClause,
      attributes: [
        ['tenant_uuid', 'tenantUuid'],
        ['tenant_code', 'tenantCode'],
        ['tenant_name', 'tenantName'],
        'status',
        ['created_on', 'createdOn'],
        ['modified_on', 'modifiedOn']
      ],
      order: [['tenant_name', 'ASC']],
      raw: true
    });

    return tenants;
  }
}

module.exports = new TenantService();