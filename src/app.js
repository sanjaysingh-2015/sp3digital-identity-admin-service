const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const db = require('./models'); // Imports index.js which loads all models & sequelize
const { authenticate, authorize } = require('./middleware/authentication');
const { auditWrites } = require('./middleware/audit');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public: JWKS for verifying tokens this service issues, and the endpoints
// that issue those tokens in the first place. These must NOT go through the
// authenticate/authorize middleware below — a caller has no token yet.
app.use('/.well-known', require('./routes/wellKnownRoutes'));
app.use('/api/v1/identity-admin/auth', require('./routes/authRoutes'));

const authorizeAdminRequest = (req, res, next) => {
  const permission = req.method === 'GET' || req.method === 'HEAD'
    ? 'identity-admin:read'
    : 'identity-admin:write';
  return authorize(permission)(req, res, next);
};

app.use('/api/v1/identity-admin', authenticate, authorizeAdminRequest, auditWrites);

// Base routes
app.use('/api/v1/identity-admin/identity-providers', require('./routes/idpRoutes'));
app.use('/api/v1/identity-admin/users', require('./routes/userRoutes'));
app.use('/api/v1/identity-admin/authorization', require('./routes/authorizationRoutes'));
app.use('/api/v1/identity-admin/oauth', require('./routes/oAuthClientRoutes'));
app.use('/api/v1/identity-admin/security-policy', require('./routes/securityPolicyRoutes'));
app.use('/api/v1/identity-admin/users/:userId/mfa', require('./routes/mfaRoutes'));
app.use('/api/v1/identity-admin', require('./routes/sessionRoutes'));
app.use('/api/v1/identity-admin', require('./routes/accessControlRoutes'));
app.use('/api/v1/identity-admin/service-accounts', require('./routes/serviceAccountRoutes'));
app.use('/api/v1/identity-admin/audit-logs', require('./routes/auditRoutes'));
app.use('/api/v1/identity-admin/auth-configs', require('./routes/authConfigRoutes'));
app.use('/api/v1/identity-admin/api-clients', require('./routes/apiClientRoutes'));

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

startServer();
