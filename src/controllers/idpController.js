const identityProviderService = require('../services/idpService');
const {
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
} = require('../services/identityProvider.validation');

exports.getIdentityProviders = async (req, res, next) => {
  try {
    const { page, limit, status, providerType, search } = req.query;
    const providers = await identityProviderService.getIdentityProviders(req.auth.tenantUuid, {
      page,
      limit,
      status,
      providerType,
      search,
    });
    return res.status(200).json(providers);
  } catch (error) {
    return next(error);
  }
};

exports.getIdentityProviderById = async (req, res, next) => {
  try {
    const provider = await identityProviderService.getIdentityProviderById(
      req.params.identityProviderId,
      req.auth.tenantUuid,
    );
    return res.status(200).json(provider);
  } catch (error) {
    return next(error);
  }
};

exports.createIdentityProvider = async (req, res, next) => {
  try {
    validateCreatePayload(req.body);
    const provider = await identityProviderService.createIdentityProvider(
      req.body,
      req.auth.userId,
    );
    return res.status(201).json(provider);
  } catch (error) {
    return next(error);
  }
};

exports.updateIdentityProvider = async (req, res, next) => {
  try {
    validateUpdatePayload(req.body);
    const provider = await identityProviderService.updateIdentityProvider(
      req.params.identityProviderId,
      req.body,
      req.auth.userId,
    );
    return res.status(200).json(provider);
  } catch (error) {
    return next(error);
  }
};

exports.deleteIdentityProvider = async (req, res, next) => {
  try {
    const provider = await identityProviderService.deleteIdentityProvider(
      req.params.identityProviderId,
      req.auth.tenantUuid,
      req.auth.userId,
    );
    return res.status(200).json(provider);
  } catch (error) {
    return next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    validateStatusPayload(req.body);
    const provider = await identityProviderService.updateStatus(
      req.params.identityProviderId,
      req.body.status,
      req.auth.tenantUuid,
      req.auth.userId,
    );
    return res.status(200).json(provider);
  } catch (error) {
    return next(error);
  }
};

exports.testProvider = async (req, res, next) => {
  try {
    const result = await identityProviderService.testProvider(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};