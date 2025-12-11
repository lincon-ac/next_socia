const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const chatController = require('./controllers/chatController');

const app = express();
const PORT = process.env.PORT || 3000;

// Load Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, '../../docs/openapi.yaml'));

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'chat-api-gateway',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.post('/api/chat/message', chatController.processMessage);
app.get('/api/chat/greeting', chatController.getGreeting);
app.get('/api/chat/suggestions', chatController.getSuggestions);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Chat API Gateway running on port ${PORT}`);
    console.log(`📚 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🔍 API Base: http://localhost:${PORT}/api/chat`);
});

module.exports = app;
