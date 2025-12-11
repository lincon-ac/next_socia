const express = require('express');
const cors = require('cors');
const knowledgeController = require('./controllers/knowledgeController');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'knowledge-base',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.get('/api/knowledge/categories', knowledgeController.getCategories);
app.get('/api/knowledge/search', knowledgeController.searchKnowledge);
app.get('/api/knowledge/topic/:category/:topic', knowledgeController.getTopicDetails);
app.get('/api/knowledge/all', knowledgeController.getAllKnowledge);
app.get('/api/knowledge/metadata', knowledgeController.getMetadata);

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
    console.log(`🧠 Knowledge Base Service running on port ${PORT}`);
    console.log(`📚 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API Base: http://localhost:${PORT}/api/knowledge`);
});

module.exports = app;
