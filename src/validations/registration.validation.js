const { Joi } = require("../middleware/validate");

/**
 * POST /api/v1/identity-admin/public/register-organization
 *
 * Public/unauthenticated by design — this IS how a brand-new org gets its
 * first tenant + user, so there's no bearer token to check yet (same
 * reasoning as /auth/login). Abuse protection is the rate limiter applied
 * at the route (see app.js), not auth.
 */
const registerOrganizationSchema = Joi.object({
  // --- Organization (organization-admin-service) ---
  organizationName: Joi.string().trim().min(2).max(200).required(),
  organizationType: Joi.string().trim().max(50).required(),
  parentOrganizationId: Joi.number().integer().positive().allow(null).optional(),

  // --- Organization address (organization-admin-service) — same shape as
  // that service's own addressFields (organization.validation.js), filled
  // in on step 1 of the "Create Organization" wizard alongside the
  // organization's own details, before step 2 collects the administrator.
  addressLine1: Joi.string().trim().max(250).allow(null, "").optional(),
  addressLine2: Joi.string().trim().max(250).allow(null, "").optional(),
  city: Joi.string().trim().max(100).allow(null, "").optional(),
  subDistrictName: Joi.string().trim().max(100).allow(null, "").optional(),
  districtName: Joi.string().trim().max(100).allow(null, "").optional(),
  stateName: Joi.string().trim().max(100).allow(null, "").optional(),
  postalCode: Joi.string().trim().max(20).allow(null, "").optional(),
  country: Joi.string().trim().max(100).allow(null, "").optional(),
  latitude: Joi.number().min(-90).max(90).allow(null).optional(),
  longitude: Joi.number().min(-180).max(180).allow(null).optional(),

  // --- User (identity-admin-service) ---
  username: Joi.string().trim().min(3).max(100).required(),
  email: Joi.string().trim().email().max(320).required(),
  firstName: Joi.string().trim().max(100).required(),
  lastName: Joi.string().trim().max(100).required(),
  middleName: Joi.string().trim().max(100).allow("").optional(),
  displayName: Joi.string().trim().max(250).allow("").optional(),
  phoneCountryCode: Joi.string().trim().max(10).required(),
  phoneNumber: Joi.string().trim().max(30).required(),

  // --- Credential ---
  password: Joi.string().min(8).max(256).required(),
});

module.exports = { registerOrganizationSchema };
