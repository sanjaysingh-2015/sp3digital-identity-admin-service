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
  },
  apis: ['./src/routes/*.js'], // Path to route files containing JSDoc annotations
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;