const swaggerJSDoc = require('swagger-jsdoc');

const BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SP3 Digital Notification & Social Analytics API',
      version: '1.0.0',
      description: 'Unified service for sending multi-channel notifications (Email, SMS, WhatsApp, LinkedIn) and processing social media message analytics.',
      contact: {
        name: 'SP3 Digital Support',
        email: 'contact@sp3digital.com',
      },
    },
    servers: [
      {
        url: BASE_URL,
        description: NODE_ENV,
      },
    ],
    tags: [
      { name: 'Authentication', description: 'Login, MFA, token refresh, logout, and password changes.' },
      { name: 'Users', description: 'Tenant user accounts.' },
      { name: 'Roles', description: 'RBAC roles.' },
      { name: 'Permissions', description: 'RBAC permissions and role-permission assignment.' },
      { name: 'Identity Providers', description: 'SSO / federated identity provider configuration.' },
      { name: 'Audit', description: 'Administrative audit trail.' },
      { name: 'Access Control', description: 'User-to-organization and user-to-facility scoping.' },
      { name: 'API Clients', description: 'Machine-to-machine API client credentials.' },
      { name: 'OAuth Clients', description: 'OAuth2 client registrations.' },
      { name: 'MFA', description: 'Multi-factor authentication enrollment and management.' },
      { name: 'Sessions', description: 'Active user sessions.' },
      { name: 'Service Accounts', description: 'Non-human service identities.' },
      { name: 'Security Policy', description: 'Tenant-level password/lockout policy configuration.' },
      { name: 'Auth Config', description: 'Tenant-level authentication configuration.' },
      { name: 'Resource Actions', description: 'Catalog of resources and actions available for permissions.' },
      { name: 'Tenants', description: 'Tenant lookup.' },
      { name: 'Public', description: 'Unauthenticated, publicly-reachable endpoints.' },
      { name: 'Well-Known', description: 'OIDC/OAuth well-known discovery documents.' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'usernameOrEmail is required' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalItems: { type: 'integer', example: 123 },
            totalPages: { type: 'integer', example: 7 },
          },
        },
      },
      responses: {
        ValidationError: {
          description: 'Request failed validation',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Unauthorized: {
          description: 'Missing or invalid bearer token',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Forbidden: {
          description: 'Authenticated caller lacks the required permission',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'], // Path to route files containing JSDoc annotations
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;