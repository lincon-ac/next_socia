const fs = require('fs');
const path = require('path');

// Load knowledge base
const knowledgePath = path.join(__dirname, '../../data/knowledge.json');
let knowledgeBase = null;

// Load knowledge base on startup
try {
    const data = fs.readFileSync(knowledgePath, 'utf8');
    knowledgeBase = JSON.parse(data);
    console.log('✅ Knowledge base loaded successfully');
} catch (error) {
    console.error('❌ Error loading knowledge base:', error);
    process.exit(1);
}

/**
 * Get all categories
 */
exports.getCategories = (req, res) => {
    try {
        const categories = Object.keys(knowledgeBase.knowledge).map(key => ({
            id: key,
            ...knowledgeBase.knowledge[key].metadata
        }));

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Search knowledge base
 * Query params: q (query string), category (optional)
 */
exports.searchKnowledge = (req, res) => {
    try {
        const { q, category } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required'
            });
        }

        const query = q.toLowerCase();
        const results = [];

        // Search through knowledge base
        const categoriesToSearch = category
            ? [category]
            : Object.keys(knowledgeBase.knowledge);

        categoriesToSearch.forEach(cat => {
            if (!knowledgeBase.knowledge[cat]) return;

            const categoryData = knowledgeBase.knowledge[cat];

            Object.keys(categoryData).forEach(topicKey => {
                if (topicKey === 'metadata') return;

                const topic = categoryData[topicKey];

                // Check if query matches keywords or title
                const matchesKeywords = topic.keywords &&
                    topic.keywords.some(keyword => keyword.includes(query));
                const matchesTitle = topic.title &&
                    topic.title.toLowerCase().includes(query);

                if (matchesKeywords || matchesTitle) {
                    results.push({
                        category: cat,
                        topicId: topicKey,
                        title: topic.title,
                        keywords: topic.keywords,
                        content: topic.content,
                        relevance: matchesTitle ? 'high' : 'medium'
                    });
                }
            });
        });

        // Sort by relevance
        results.sort((a, b) => {
            const relevanceOrder = { high: 0, medium: 1, low: 2 };
            return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
        });

        res.json({
            success: true,
            query: q,
            count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get specific topic details
 */
exports.getTopicDetails = (req, res) => {
    try {
        const { category, topic } = req.params;

        if (!knowledgeBase.knowledge[category]) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        if (!knowledgeBase.knowledge[category][topic]) {
            return res.status(404).json({
                success: false,
                error: 'Topic not found'
            });
        }

        res.json({
            success: true,
            data: {
                category,
                topicId: topic,
                ...knowledgeBase.knowledge[category][topic]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get all knowledge (for debugging/admin)
 */
exports.getAllKnowledge = (req, res) => {
    try {
        res.json({
            success: true,
            data: knowledgeBase.knowledge
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get metadata
 */
exports.getMetadata = (req, res) => {
    try {
        res.json({
            success: true,
            data: knowledgeBase.metadata
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
