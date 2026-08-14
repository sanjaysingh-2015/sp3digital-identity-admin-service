require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
//const routes = require('./src/routes/api');
const { initDB } = require('./src/config/db');

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

// Serve Swagger Interactive Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount API Routes
//app.use('/api/v1', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await initDB();
  console.log(`sp3digital-notification-service running on port ${PORT}`);
  console.log(`Swagger UI Documentation available at: http://localhost:${PORT}/api-docs`);
});