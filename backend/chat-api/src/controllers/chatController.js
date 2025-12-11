const axios = require('axios');

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:3001';
const KNOWLEDGE_BASE_URL = process.env.KNOWLEDGE_BASE_URL || 'http://localhost:3002';

/**
 * Out of scope response with helpful suggestions
 */
const OUT_OF_SCOPE_RESPONSES = [
    "Peço desculpas, mas meu foco é apenas nos serviços da Caixa e nos programas sociais. Você gostaria de perguntar sobre, por exemplo, o FGTS ou uma linha de crédito?",
    "Agradeço sua pergunta, mas posso ajudar apenas com informações sobre Programas Sociais do Governo Federal e serviços da Caixa Econômica Federal. Gostaria de saber sobre FGTS, Auxílio Brasil, contas ou empréstimos?",
    "Desculpe, mas esse assunto está fora do meu escopo. Estou especializada em Programas Sociais e serviços da Caixa. Posso te ajudar com crédito imobiliário, PIX, ou benefícios sociais?"
];

/**
 * Get random out of scope response
 */
function getOutOfScopeResponse() {
    const randomIndex = Math.floor(Math.random() * OUT_OF_SCOPE_RESPONSES.length);
    return OUT_OF_SCOPE_RESPONSES[randomIndex];
}

/**
 * Extract most relevant answer from knowledge base content
 * Analyzes the content structure and user entities to find best match
 */
function extractRelevantAnswer(content, entities, intent) {
    let answer = '';
    let additionalInfo = [];

    // Priority 1: Check for action-specific answers
    if (entities.action) {
        const action = entities.action;

        // Map common actions to content keys
        const actionMap = {
            'consultar': ['consulta', 'como_usar', 'verificar'],
            'abrir': ['abertura', 'como_abrir', 'requisitos'],
            'solicitar': ['solicitacao', 'como_solicitar', 'requisitos'],
            'sacar': ['saque', 'como_sacar', 'modalidades'],
            'simular': ['simulacao', 'como_simular', 'caracteristicas'],
            'contratar': ['contratacao', 'requisitos', 'como_contratar']
        };

        const possibleKeys = actionMap[action] || [];
        for (const key of possibleKeys) {
            if (content[key] && content[key].answer) {
                answer = content[key].answer;
                break;
            }
        }
    }

    // Priority 2: Check for product/service type specific answers
    if (!answer && (entities.product_type || entities.service_type)) {
        const type = entities.product_type || entities.service_type;

        if (content.tipos && content.tipos.answer) {
            answer = content.tipos.answer;
        } else if (content.modalidades && content.modalidades.answer) {
            answer = content.modalidades.answer;
        }
    }

    // Priority 3: Check common question patterns
    if (!answer) {
        const commonKeys = ['consulta', 'como_usar', 'tipos', 'modalidades', 'caracteristicas',
            'inscricao', 'solicitacao', 'requisitos', 'pagamento'];

        for (const key of commonKeys) {
            if (content[key] && content[key].answer) {
                answer = content[key].answer;
                break;
            }
        }
    }

    // Priority 4: Use description as fallback
    if (!answer && content.description) {
        answer = content.description;
    }

    // Add relevant additional information
    if (content.contato) {
        additionalInfo.push(`📞 ${content.contato}`);
    }
    if (content.calendario) {
        additionalInfo.push(`📅 ${content.calendario}`);
    }
    if (content.canais && Array.isArray(content.canais)) {
        additionalInfo.push(`\n💡 Canais disponíveis: ${content.canais.join(', ')}`);
    }

    // Combine answer with additional info
    if (additionalInfo.length > 0) {
        answer += '\n\n' + additionalInfo.join('\n');
    }

    return answer;
}

/**
 * Generate contextual response based on intent, entities, and knowledge
 */
function generateResponse(intentData) {
    // Handle greetings
    if (intentData.intent === 'greeting') {
        return {
            message: "Olá! Fico feliz em conversar com você. Estou aqui para ajudar com informações sobre Programas Sociais do Governo e todos os serviços da Caixa. O que você gostaria de saber?",
            type: 'greeting',
            suggestions: [
                "Como consultar meu FGTS?",
                "Quero abrir uma conta",
                "Informações sobre crédito imobiliário",
                "Como fazer PIX?"
            ]
        };
    }

    // Handle help requests
    if (intentData.intent === 'help') {
        return {
            message: "Estou aqui para ajudar! Posso fornecer informações sobre:\n\n📱 Contas e serviços bancários\n💰 FGTS e benefícios sociais (Auxílio Brasil, Seguro-Desemprego)\n🏠 Crédito imobiliário e habitação\n💳 Cartões e crédito pessoal\n🎰 Loterias Caixa\n💸 PIX e transferências\n\nSobre qual desses temas você gostaria de saber mais?",
            type: 'help',
            suggestions: [
                "FGTS",
                "Abrir conta",
                "Empréstimos",
                "PIX"
            ]
        };
    }

    // Handle unknown intent (likely out of scope)
    if (intentData.intent === 'unknown' || intentData.confidence < 0.4) {
        return {
            message: getOutOfScopeResponse(),
            type: 'low_confidence',
            confidence: intentData.confidence,
            suggestions: [
                "Consultar FGTS",
                "Informações sobre contas",
                "Crédito e empréstimos",
                "Benefícios sociais"
            ]
        };
    }

    // Handle knowledge-based responses
    if (intentData.knowledge && intentData.knowledge.content) {
        const content = intentData.knowledge.content;
        const entities = intentData.entities || {};

        // Extract most relevant answer
        let message = extractRelevantAnswer(content, entities, intentData.intent);

        // If no specific answer found, provide general info
        if (!message || message.trim().length === 0) {
            message = `Encontrei informações sobre ${intentData.knowledge.title}. `;

            if (content.description) {
                message += content.description;
            } else {
                message += "Poderia ser mais específico sobre o que você gostaria de saber?";
            }
        }

        // Generate contextual follow-up suggestions
        const suggestions = generateFollowUpSuggestions(intentData.category, intentData.topic, entities);

        return {
            message: message.trim(),
            type: 'knowledge',
            topic: intentData.topic,
            category: intentData.category,
            confidence: intentData.confidence,
            suggestions: suggestions
        };
    }

    // Default response for recognized but unmapped intents
    return {
        message: 'Entendo que você está interessado em informações sobre a Caixa. Posso ajudar com contas, FGTS, benefícios sociais, crédito, financiamentos, cartões e loterias. Poderia me dar mais detalhes sobre o que você precisa?',
        type: 'default',
        suggestions: [
            "Como funciona o FGTS?",
            "Quero abrir uma conta",
            "Informações sobre empréstimos",
            "Ajuda"
        ]
    };
}

/**
 * Generate contextual follow-up suggestions based on topic
 */
function generateFollowUpSuggestions(category, topic, entities) {
    const suggestionMap = {
        'fgts': [
            "Como sacar o FGTS?",
            "Qual o saldo do FGTS?",
            "Modalidades de saque"
        ],
        'auxilio_brasil': [
            "Como me inscrever?",
            "Quando recebo o pagamento?",
            "Requisitos do Auxílio Brasil"
        ],
        'contas': [
            "Documentos necessários",
            "Tipos de conta disponíveis",
            "Como abrir pelo app?"
        ],
        'credito_imobiliario': [
            "Fazer uma simulação",
            "Requisitos para financiamento",
            "Casa Verde e Amarela"
        ],
        'pix': [
            "Cadastrar chave PIX",
            "Limites do PIX",
            "Como fazer transferência"
        ]
    };

    return suggestionMap[topic] || [
        "Mais informações",
        "Outros serviços",
        "Ajuda"
    ];
}

/**
 * Process incoming chat message
 * Main orchestration function
 */
exports.processMessage = async (req, res) => {
    try {
        const { message, sessionId, context } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log(`[Chat API] Processing message: "${message}"`);

        // Step 1: Process with NLP service (includes scope validation)
        const nlpResponse = await axios.post(`${NLP_SERVICE_URL}/api/nlp/process`, {
            message,
            context
        });

        if (!nlpResponse.data.success) {
            throw new Error('NLP processing failed');
        }

        // Step 2: Check if in scope (strict guardrail)
        if (!nlpResponse.data.inScope) {
            console.log(`[Chat API] Message out of scope: "${message}"`);

            return res.json({
                success: true,
                response: {
                    message: nlpResponse.data.message || getOutOfScopeResponse(),
                    type: 'out_of_scope',
                    suggestions: [
                        "Consultar FGTS",
                        "Abrir uma conta",
                        "Crédito imobiliário",
                        "Benefícios sociais"
                    ],
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Step 3: Generate intelligent response
        const intentData = nlpResponse.data.intent;
        const response = generateResponse(intentData);

        console.log(`[Chat API] Response generated - Type: ${response.type}, Intent: ${intentData.intent}, Confidence: ${intentData.confidence}`);

        res.json({
            success: true,
            response: {
                ...response,
                intent: intentData.intent,
                confidence: intentData.confidence,
                entities: intentData.entities,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[Chat API] Error processing message:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get initial greeting
 */
exports.getGreeting = (req, res) => {
    res.json({
        success: true,
        greeting: {
            message: "Olá! Eu sou a SocIA, sua assistente virtual especializada em Programas Sociais do Governo e todos os serviços e produtos da Caixa Econômica Federal. Como posso te ajudar hoje?",
            suggestions: [
                "Abertura de Contas",
                "Crédito Imobiliário",
                "Benefícios Sociais",
                "Outros Tópicos"
            ],
            timestamp: new Date().toISOString()
        }
    });
};

/**
 * Get topic suggestions
 */
exports.getSuggestions = (req, res) => {
    res.json({
        success: true,
        suggestions: [
            {
                title: "Consultar Saldo",
                query: "Como consultar meu saldo?"
            },
            {
                title: "FGTS",
                query: "Gostaria de informações sobre FGTS"
            },
            {
                title: "Empréstimos",
                query: "Quero saber sobre empréstimos"
            },
            {
                title: "Ajuda",
                query: "Preciso de ajuda com outros tópicos"
            }
        ],
        timestamp: new Date().toISOString()
    });
};
