const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const idpRoutes = require('./routes/idpRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Swagger Documentation Route
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base API Routes
app.use('/api/v1/identity-admin/identity-providers', idpRoutes);
app.use('/api/v1/identity-admin/users', userRoutes);

// Root health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

const PORT = process.env.PORT || 3000;

// Keep the event loop active by starting the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});

// Handle unhandled rejections or runtime crashes
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection Error:', err);
});