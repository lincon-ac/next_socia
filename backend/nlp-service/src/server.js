const express = require('express');
const cors = require('cors');
const intentProcessor = require('./processors/intentProcessor');
const scopeValidator = require('./processors/scopeValidator');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'nlp-processing',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.post('/api/nlp/process', async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Validate scope
        const scopeValidation = scopeValidator.validateScope(message);

        if (!scopeValidation.inScope) {
            return res.json({
                success: true,
                inScope: false,
                message: scopeValidation.response
            });
        }

        // Process intent
        const intent = await intentProcessor.processIntent(message, context);

        res.json({
            success: true,
            inScope: true,
            intent: intent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/nlp/validate-scope', (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        const validation = scopeValidator.validateScope(message);

        res.json({
            success: true,
            data: validation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

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
    console.log(`🧠 NLP Processing Service running on port ${PORT}`);
    console.log(`📚 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API Base: http://localhost:${PORT}/api/nlp`);
});

module.exports = app;
