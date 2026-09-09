const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const db = require('./models'); // Imports index.js which loads all models & sequelize
const { authenticate, authorize, methodToActions } = require('./middleware/authentication');
const { auditWrites } = require('./middleware/audit');
const publicController = require('./controllers/publicController');
const { validate } = require('./middleware/validate');
const { registerOrganizationSchema } = require('./validations/registration.validation');
const wellKnownRoutes = require('./routes/wellKnownRoutes');
const rateLimit = require('express-rate-limit');


const app = express();

// ALLOWED_ORIGINS: comma-separated list, e.g.
//   ALLOWED_ORIGINS=https://admin.sp3digital.com,https://staging-admin.sp3digital.com
// Falls back to allowing all origins ONLY when unset, so local dev keeps working
// without extra setup — but every real environment must set this explicitly.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors(
  allowedOrigins.length
    ? {
        origin: allowedOrigins,
        credentials: true,
      }
    : undefined // no ALLOWED_ORIGINS set -> permissive default, dev-only
));
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/.well-known', wellKnownRoutes);

// Self-service org registration — unauthenticated by design (there's no
// token to check yet), so it gets its own IP-based rate limiter instead,
// same reasoning as authRoutes.js's loginRateLimiter.
const registerOrganizationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Try again later.' } },
});
app.post(
  '/api/v1/identity-admin/public/register-organization',
  registerOrganizationRateLimiter,
  validate(registerOrganizationSchema),
  publicController.registerOrganization
);

const authorizeAdminRequest = (req, res, next) => {
  const permission = req.method === 'GET' || req.method === 'HEAD'
    ? 'identity-admin:read'
    : 'identity-admin:write';
  return authorize(permission, methodToActions(req.method))(req, res, next);
};

// NOTE: /auth/login is intentionally NOT registered here. It is handled
// exclusively by authRoutes.js below, which wraps it in loginRateLimiter
// (IP-based brute-force protection) and Joi request validation. A
// duplicate, unprotected registration of this exact path used to live
// here; because Express matches routes in registration order, it was
// shadowing authRoutes.js's protected handler and silently defeating
// both the rate limiter and the input validation on the single most-
// attacked endpoint in this service. Do not re-add a direct app.post/
// app.get registration for this path.
app.get('/api/v1/identity-admin/public/tenants/search', publicController.searchTenants);

// authRoutes.js's own routes (login/mfa, token/refresh, logout, change-password)
// must stay reachable without a bearer token — that's their whole purpose (you
// don't have a valid access token yet, or it just expired, which is exactly
// when you need these). They get their own targeted protection instead:
// change-password's forceChange=true path requires admin auth explicitly
// (see requireAdminForForceChange in authRoutes.js); the rest authenticate via
// their body payload (mfaToken / refreshToken), same pattern as /auth/login.
app.use('/api/v1/identity-admin/auth', require('./routes/authRoutes'));

app.use('/api/v1/identity-admin', authenticate, authorizeAdminRequest, auditWrites);

// Base routes
app.use('/api/v1/identity-admin/identity-providers', require('./routes/idpRoutes'));
app.use('/api/v1/identity-admin/users', require('./routes/userRoutes'));
app.use('/api/v1/identity-admin/authorization', require('./routes/authorizationRoutes'));
app.use('/api/v1/identity-admin/tenants', require('./routes/tenantRoutes'));
app.use('/api/v1/identity-admin/oauth', require('./routes/oAuthClientRoutes'));
app.use('/api/v1/identity-admin/security-policy', require('./routes/securityPolicyRoutes'));
app.use('/api/v1/identity-admin/users/:userId/mfa', require('./routes/mfaRoutes'));
app.use('/api/v1/identity-admin', require('./routes/sessionRoutes'));
app.use('/api/v1/identity-admin', require('./routes/accessControlRoutes'));
app.use('/api/v1/identity-admin/service-accounts', require('./routes/serviceAccountRoutes'));
app.use('/api/v1/identity-admin/audit-logs', require('./routes/auditRoutes'));
app.use('/api/v1/identity-admin/auth-configs', require('./routes/authConfigRoutes'));
app.use('/api/v1/identity-admin/api-clients', require('./routes/apiClientRoutes'));
app.use('/api/v1/identity-admin', require('./routes/resourceActionRoutes'));


app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.isJoi) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.details.map((detail) => detail.message)
      }
    });
  }

  console.error(error);
  return res.status(error.statusCode || 500).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.expose ? error.message : 'An unexpected error occurred'
    }
  });
});

const PORT = process.env.PORT || 3000;

// Initialize Database and Start App
async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('MySQL Connection established successfully via Sequelize.');

    // Sync database models
    await db.sequelize.sync({ alter: false }); 
    console.log('Sequelize Models synchronized with Database.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    console.error(error);
    console.error('Unable to connect to MySQL database:', error.message);
  }
}

// Only auto-start when this file is run directly (`node src/app.js` /
// `npm start`). When required from a test (`require('../src/app')`),
// the caller gets the configured `app` instance without a live server
// or DB connection being started as a side effect of `require`.
if (require.main === module) {
  startServer();
}

module.exports = app;
