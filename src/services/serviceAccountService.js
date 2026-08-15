const { ServiceAccount } = require('../models');
const { v4: uuidv4 } = require('uuid');

class ServiceAccountService {
  async getServiceAccounts() {
    return await ServiceAccount.findAll();
  }

  async createServiceAccount(data) {
    return await ServiceAccount.create({
      account_uuid: uuidv4(),
      account_name: data.accountName,
      description: data.description,
      status: 'ACTIVE'
    });
  }
}

module.exports = new ServiceAccountService();