const axios = require('axios');

const KNOWLEDGE_BASE_URL = process.env.KNOWLEDGE_BASE_URL || 'http://localhost:3002';

/**
 * Intent patterns with priority scoring
 * Higher priority patterns are checked first
 */
const INTENT_PATTERNS = {
    // Greetings (Priority: High)
    greeting: {
        patterns: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'alo', 'alô', 'opa'],
        category: 'greeting',
        priority: 10
    },

    // Programas Sociais (Priority: High)
    fgts: {
        patterns: ['fgts', 'fundo de garantia', 'saque fgts', 'consultar fgts', 'saldo fgts'],
        category: 'programas_sociais',
        topic: 'fgts',
        priority: 9
    },
    auxilio_brasil: {
        patterns: ['auxílio brasil', 'auxilio brasil', 'bolsa família', 'bolsa familia', 'benefício social'],
        category: 'programas_sociais',
        topic: 'auxilio_brasil',
        priority: 9
    },
    seguro_desemprego: {
        patterns: ['seguro desemprego', 'seguro-desemprego', 'desemprego', 'solicitar seguro'],
        category: 'programas_sociais',
        topic: 'seguro_desemprego',
        priority: 9
    },
    pis_pasep: {
        patterns: ['pis', 'pasep', 'abono salarial', 'abono'],
        category: 'programas_sociais',
        topic: 'pis_pasep',
        priority: 9
    },

    // Serviços Caixa (Priority: Medium-High)
    contas: {
        patterns: ['conta', 'conta corrente', 'poupança', 'abertura de conta', 'abrir conta', 'nova conta'],
        category: 'servicos_caixa',
        topic: 'contas',
        priority: 8
    },
    pix: {
        patterns: ['pix', 'transferência', 'pagamento instantâneo', 'chave pix', 'fazer pix'],
        category: 'servicos_caixa',
        topic: 'pix',
        priority: 8
    },
    caixa_tem: {
        patterns: ['caixa tem', 'conta digital', 'app caixa tem', 'aplicativo caixa tem'],
        category: 'servicos_caixa',
        topic: 'caixa_tem',
        priority: 8
    },
    atendimento: {
        patterns: ['atendimento', 'agência', 'telefone', 'suporte', 'contato', 'falar com atendente'],
        category: 'servicos_caixa',
        topic: 'atendimento',
        priority: 7
    },

    // Produtos Caixa (Priority: Medium)
    credito_imobiliario: {
        patterns: ['crédito imobiliário', 'credito imobiliario', 'financiamento imóvel', 'financiamento imovel',
            'casa verde amarela', 'minha casa minha vida', 'comprar casa', 'financiar casa'],
        category: 'produtos_caixa',
        topic: 'credito_imobiliario',
        priority: 8
    },
    credito_pessoal: {
        patterns: ['empréstimo', 'crédito pessoal', 'consignado', 'credito', 'emprestar dinheiro', 'pegar emprestado'],
        category: 'produtos_caixa',
        topic: 'credito_pessoal',
        priority: 7
    },
    cartoes: {
        patterns: ['cartão', 'cartao', 'cartão de crédito', 'cartão de débito', 'solicitar cartão'],
        category: 'produtos_caixa',
        topic: 'cartoes',
        priority: 7
    },
    loterias: {
        patterns: ['loteria', 'mega-sena', 'mega sena', 'quina', 'lotofácil', 'lotofacil', 'lotomania', 'apostar'],
        category: 'produtos_caixa',
        topic: 'loterias',
        priority: 6
    },
    investimentos: {
        patterns: ['poupança', 'poupanca', 'investimento', 'aplicação', 'aplicacao', 'investir', 'render dinheiro'],
        category: 'produtos_caixa',
        topic: 'investimentos',
        priority: 6
    },

    // Help (Priority: Low)
    help: {
        patterns: ['ajuda', 'help', 'outros tópicos', 'outros topicos', 'o que você faz', 'pode me ajudar'],
        category: 'help',
        priority: 5
    }
};

/**
 * Entity types to extract
 */
const ENTITY_EXTRACTORS = {
    // Monetary values
    money: {
        pattern: /R\$\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/g,
        type: 'monetary_value'
    },
    // Dates
    date: {
        pattern: /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
        type: 'date'
    },
    // Product types
    product_type: {
        keywords: ['imobiliário', 'imobiliario', 'pessoal', 'consignado', 'habitacional'],
        type: 'product_type'
    },
    // Service types
    service_type: {
        keywords: ['corrente', 'poupança', 'poupanca', 'digital', 'salário', 'salario'],
        type: 'service_type'
    },
    // Action types
    action: {
        keywords: ['consultar', 'abrir', 'solicitar', 'sacar', 'transferir', 'pagar', 'simular', 'contratar'],
        type: 'action'
    }
};

/**
 * Enhanced entity extraction with multiple types
 */
function extractEntities(message) {
    const entities = {};
    const lowerMessage = message.toLowerCase();

    // Extract monetary values
    const moneyMatches = message.match(ENTITY_EXTRACTORS.money.pattern);
    if (moneyMatches) {
        entities.amounts = moneyMatches;
    }

    // Extract dates
    const dateMatches = message.match(ENTITY_EXTRACTORS.date.pattern);
    if (dateMatches) {
        entities.dates = dateMatches;
    }

    // Extract product types
    const productTypes = ENTITY_EXTRACTORS.product_type.keywords.filter(kw =>
        lowerMessage.includes(kw)
    );
    if (productTypes.length > 0) {
        entities.product_type = productTypes[0];
    }

    // Extract service types
    const serviceTypes = ENTITY_EXTRACTORS.service_type.keywords.filter(kw =>
        lowerMessage.includes(kw)
    );
    if (serviceTypes.length > 0) {
        entities.service_type = serviceTypes[0];
    }

    // Extract actions
    const actions = ENTITY_EXTRACTORS.action.keywords.filter(kw =>
        lowerMessage.includes(kw)
    );
    if (actions.length > 0) {
        entities.action = actions[0];
    }

    return entities;
}

/**
 * Calculate confidence score based on pattern match quality
 */
function calculateConfidence(message, pattern, intentData) {
    const lowerMessage = message.toLowerCase().trim();
    let confidence = 0.5; // Base confidence

    // Exact match increases confidence
    if (lowerMessage === pattern) {
        confidence = 0.95;
    }
    // Pattern at start of message
    else if (lowerMessage.startsWith(pattern)) {
        confidence = 0.90;
    }
    // Pattern is a whole word
    else if (new RegExp(`\\b${pattern}\\b`).test(lowerMessage)) {
        confidence = 0.85;
    }
    // Pattern is contained
    else if (lowerMessage.includes(pattern)) {
        confidence = 0.75;
    }

    // Boost confidence if multiple patterns match
    const matchCount = intentData.patterns.filter(p => lowerMessage.includes(p)).length;
    if (matchCount > 1) {
        confidence += 0.05 * (matchCount - 1);
    }

    // Cap at 0.98
    return Math.min(confidence, 0.98);
}

/**
 * Detect intent from message with priority-based matching
 */
function detectIntent(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Sort intents by priority
    const sortedIntents = Object.entries(INTENT_PATTERNS).sort((a, b) =>
        (b[1].priority || 0) - (a[1].priority || 0)
    );

    // Check each intent pattern in priority order
    for (const [intentName, intentData] of sortedIntents) {
        for (const pattern of intentData.patterns) {
            if (lowerMessage.includes(pattern)) {
                const confidence = calculateConfidence(message, pattern, intentData);

                return {
                    intent: intentName,
                    category: intentData.category,
                    topic: intentData.topic,
                    confidence: confidence,
                    matchedPattern: pattern
                };
            }
        }
    }

    // No match found
    return {
        intent: 'unknown',
        category: null,
        topic: null,
        confidence: 0.2,
        matchedPattern: null
    };
}

/**
 * Process user message and extract intent + entities
 */
exports.processIntent = async (message, context = {}) => {
    try {
        // Detect intent
        const intentData = detectIntent(message);

        // Extract entities
        const entities = extractEntities(message);

        // Query knowledge base if we have a category and topic
        let knowledgeData = null;
        if (intentData.category && intentData.topic &&
            intentData.category !== 'greeting' && intentData.category !== 'help') {
            try {
                const response = await axios.get(
                    `${KNOWLEDGE_BASE_URL}/api/knowledge/topic/${intentData.category}/${intentData.topic}`
                );
                if (response.data.success) {
                    knowledgeData = response.data.data;
                }
            } catch (error) {
                console.error('Error fetching knowledge:', error.message);
            }
        }

        // Log processing for debugging
        console.log(`[NLP] Intent: ${intentData.intent} | Confidence: ${intentData.confidence} | Entities:`, entities);

        return {
            originalMessage: message,
            intent: intentData.intent,
            category: intentData.category,
            topic: intentData.topic,
            confidence: intentData.confidence,
            matchedPattern: intentData.matchedPattern,
            entities: entities,
            knowledge: knowledgeData,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        throw new Error(`Intent processing failed: ${error.message}`);
    }
};
