const { ServiceAccounts } = require('../models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class ServiceAccountService {
  async getServiceAccounts() {
    return await ServiceAccounts.findAll();
  }

  async createServiceAccount(data) {
    return await ServiceAccounts.create({
      service_uuid: uuidv4(),
      service_code: data.serviceCode || `SA_${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      service_name: data.accountName,
      description: data.description,
      organization_id: data.organizationId || null,
      expires_on: data.expiresOn || null,
      status: 'ACTIVE'
    });
  }
}

module.exports = new ServiceAccountService();
