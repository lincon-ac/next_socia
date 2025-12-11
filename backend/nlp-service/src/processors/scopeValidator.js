/**
 * Topics within SocIA's scope
 */
const IN_SCOPE_TOPICS = {
    programasSociais: [
        'auxílio brasil', 'bolsa família', 'fgts', 'seguro desemprego',
        'pis', 'pasep', 'abono salarial', 'benefícios sociais',
        'cadastro único', 'cadunico', 'bpc', 'benefício de prestação continuada'
    ],
    contasBancarias: [
        'conta corrente', 'conta poupança', 'abertura de conta',
        'conta digital', 'conta salário', 'caixa tem'
    ],
    credito: [
        'empréstimo', 'crédito', 'financiamento', 'crédito imobiliário',
        'crédito pessoal', 'consignado', 'fgts crédito', 'casa verde amarela',
        'minha casa minha vida'
    ],
    cartoes: [
        'cartão de crédito', 'cartão de débito', 'cartão caixa',
        'elo', 'mastercard', 'visa'
    ],
    habitacao: [
        'habitação', 'imóvel', 'financiamento habitacional',
        'construção', 'reforma', 'terreno'
    ],
    loterias: [
        'loteria', 'mega-sena', 'quina', 'lotofácil', 'lotomania',
        'timemania', 'dupla sena', 'dia de sorte', 'super sete'
    ],
    investimentos: [
        'poupança', 'investimento', 'aplicação', 'renda fixa',
        'previdência', 'título de capitalização'
    ],
    outros: [
        'caixa', 'agência', 'atendimento', 'app caixa', 'internet banking',
        'caixa eletrônico', 'saque', 'depósito', 'transferência', 'pix'
    ]
};

/**
 * Out of scope response
 */
const OUT_OF_SCOPE_RESPONSE = "Agradeço sua pergunta, mas meu foco é auxiliar especificamente com informações sobre Programas Sociais do Governo Federal e serviços e produtos da Caixa Econômica Federal. Posso ajudar com questões sobre contas, FGTS, benefícios sociais, crédito, financiamentos, cartões ou loterias. Como posso te ajudar dentro desses temas?";

/**
 * Check if message is within scope
 */
function isInScope(message) {
    const lowerMessage = message.toLowerCase();

    // Check if contains any topic
    for (const category in IN_SCOPE_TOPICS) {
        for (const topic of IN_SCOPE_TOPICS[category]) {
            if (lowerMessage.includes(topic)) {
                return true;
            }
        }
    }

    // Generic keywords that indicate Caixa services
    const genericKeywords = ['caixa', 'banco', 'dinheiro', 'pagamento', 'benefício'];
    return genericKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Validate if message is within SocIA's scope
 */
exports.validateScope = (message) => {
    const inScope = isInScope(message);

    return {
        inScope: inScope,
        response: inScope ? null : OUT_OF_SCOPE_RESPONSE,
        timestamp: new Date().toISOString()
    };
};

/**
 * Get all in-scope topics (for reference)
 */
exports.getInScopeTopics = () => {
    return IN_SCOPE_TOPICS;
};
