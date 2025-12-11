// ============================================
// SocIA Chatbot - Interactive Functionality
// ============================================

// ============================================
// SocIA Persona & Configuration
// ============================================

/**
 * SocIA Persona Definition
 * - Comportamento: Humanizado, feminino, amigável e profissional
 * - Tom: Pausado e amigável
 * - Escopo: APENAS Programas Sociais do Governo Federal e Serviços/Produtos da Caixa
 */
const SOCIA_PERSONA = {
    name: 'SocIA',
    tone: 'friendly_professional',
    gender: 'feminine',
    scope: [
        'Programas Sociais do Governo Federal',
        'Serviços da Caixa Econômica Federal',
        'Produtos da Caixa Econômica Federal'
    ]
};

/**
 * Tópicos dentro do escopo da SocIA
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

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const quickActionButtons = document.querySelectorAll('.quick-action-btn');
const voiceToggleBtn = document.getElementById('voiceToggleBtn');
const micBtn = document.getElementById('micBtn');

// ============================================
// Speech Recognition (STT) Configuration
// ============================================

let recognition = null;
let isRecording = false;

/**
 * Initialize Speech Recognition (Speech-to-Text)
 */
function initializeSpeechRecognition() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('⚠️ Speech Recognition not supported in this browser');
        if (micBtn) {
            micBtn.style.display = 'none';
        }
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('recording');
        console.log('🎤 Recording started');
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');

        messageInput.value = transcript;
        console.log('📝 Transcript:', transcript);
    };

    recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        stopRecording();
    };

    recognition.onend = () => {
        stopRecording();
    };

    console.log('✅ Speech Recognition initialized');
}

/**
 * Start recording voice input
 */
function startRecording() {
    if (!recognition) {
        alert('Reconhecimento de voz não disponível neste navegador.');
        return;
    }

    try {
        recognition.start();
    } catch (error) {
        console.error('Error starting recognition:', error);
    }
}

/**
 * Stop recording voice input
 */
function stopRecording() {
    isRecording = false;
    if (micBtn) {
        micBtn.classList.remove('recording');
    }
    console.log('🛑 Recording stopped');
}

/**
 * Toggle recording on/off
 */
function toggleRecording() {
    if (isRecording) {
        recognition.stop();
    } else {
        startRecording();
    }
}

// ============================================
// Text-to-Speech Configuration
// ============================================

let voiceEnabled = false;
let selectedVoice = null;
const speechSynthesis = window.speechSynthesis;

/**
 * Initialize TTS with feminine Portuguese voice
 */
function initializeTTS() {
    // Wait for voices to load
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = selectFeminineVoice;
    }
    selectFeminineVoice();
}

/**
 * Select best feminine Portuguese voice with engaging tone
 */
function selectFeminineVoice() {
    const voices = speechSynthesis.getVoices();

    // Priority order for voice selection (different feminine voices)
    const preferredVoices = [
        'Microsoft Francisca - Portuguese (Brazil)', // Feminine, natural
        'Luciana', // Edge - warm and friendly
        'Fernanda', // macOS - clear and pleasant
        'Google português do Brasil', // Natural
        'Microsoft Maria - Portuguese (Brazil)', // Alternative
        'Joana', // Another option
    ];

    // Try to find preferred voice
    for (const preferred of preferredVoices) {
        const voice = voices.find(v =>
            v.name.includes(preferred) ||
            (v.lang.includes('pt-BR') && v.name.toLowerCase().includes(preferred.toLowerCase()))
        );
        if (voice) {
            selectedVoice = voice;
            console.log('✅ TTS Voice selected:', voice.name);
            return;
        }
    }

    // Fallback: any Portuguese female voice
    selectedVoice = voices.find(v =>
        (v.lang.includes('pt-BR') || v.lang.includes('pt')) &&
        (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('feminino') ||
            v.name.toLowerCase().includes('francisca') ||
            v.name.toLowerCase().includes('luciana') ||
            v.name.toLowerCase().includes('fernanda') ||
            v.name.toLowerCase().includes('maria') ||
            v.name.toLowerCase().includes('ana'))
    );

    // Last resort: any Portuguese voice
    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt'));
    }

    if (selectedVoice) {
        console.log('✅ TTS Voice selected:', selectedVoice.name);
    } else {
        console.warn('⚠️ No Portuguese voice found, using default');
    }
}

/**
 * Speak text using TTS with engaging feminine voice
 * @param {string} text - Text to speak
 */
function speak(text) {
    if (!voiceEnabled || !text) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Clean text for speech (remove emojis and special chars)
    const cleanText = text
        .replace(/[📱💰🏠💳🎰💸📞📅💡📋😊]/g, '') // Remove emojis
        .replace(/\n\n/g, '. ') // Replace double newlines with period
        .replace(/\n/g, ', ') // Replace single newlines with comma
        .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Configure voice settings for engaging feminine tone
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95; // Slightly slower for natural clarity
    utterance.pitch = 1.15; // Feminine and pleasant tone
    utterance.volume = 0.95; // Slightly softer for warmth

    // Error handling
    utterance.onerror = (event) => {
        console.error('TTS Error:', event.error);
    };

    // Speak
    speechSynthesis.speak(utterance);
}

/**
 * Toggle voice on/off
 */
function toggleVoice() {
    voiceEnabled = !voiceEnabled;

    // Update button state
    voiceToggleBtn.classList.toggle('active', voiceEnabled);

    // Update status text
    const statusText = voiceToggleBtn.querySelector('.voice-status');
    statusText.textContent = voiceEnabled ? 'Voz' : 'Voz';

    // Cancel any ongoing speech when disabling
    if (!voiceEnabled) {
        speechSynthesis.cancel();
    }

    // Provide feedback
    if (voiceEnabled) {
        speak('Resposta em voz ativada. Olá, eu sou a SocIA!');
    }

    console.log(`🔊 Voice ${voiceEnabled ? 'enabled' : 'disabled'}`);
}

// ============================================
// Message Handling
// ============================================

/**
 * Creates a message element
 * @param {string} text - Message text
 * @param {boolean} isBot - Whether message is from bot
 * @returns {HTMLElement} Message wrapper element
 */
function createMessage(text, isBot = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isBot ? 'bot-message' : 'user-message'}`;

    const time = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (isBot) {
        wrapper.innerHTML = `
            <img src="avatar.png" alt="SocIA" class="message-avatar">
            <div class="message-bubble bot">
                <p>${text}</p>
                <span class="message-time">${time}</span>
                <button class="listen-btn" onclick="speakMessage(this)" aria-label="Ouvir mensagem">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
                              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Ouvir
                </button>
            </div>
        `;
    } else {
        wrapper.innerHTML = `
            <div class="message-bubble user">
                <p>${text}</p>
                <span class="message-time">${time}</span>
            </div>
        `;
    }

    return wrapper;
}

/**
 * Speak message when listen button is clicked
 * @param {HTMLElement} button - The listen button element
 */
function speakMessage(button) {
    const messageText = button.closest('.message-bubble').querySelector('p').textContent;
    speak(messageText);
}

/**
 * Adds a message to the chat
 * @param {string} text - Message text
 * @param {boolean} isBot - Whether message is from bot
 */
function addMessage(text, isBot = false) {
    const message = createMessage(text, isBot);

    // Remove quick actions if they exist
    const quickActions = chatMessages.querySelector('.quick-actions');
    if (quickActions && !isBot) {
        quickActions.remove();
    }

    chatMessages.appendChild(message);
    scrollToBottom();

    // Speak bot messages if voice is enabled
    if (isBot && voiceEnabled) {
        speak(text);
    }
}

/**
 * Scrolls chat to bottom
 */
function scrollToBottom() {
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
}

/**
 * Shows typing indicator
 */
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message-wrapper bot-message typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <img src="avatar.png" alt="SocIA" class="message-avatar">
        <div class="message-bubble bot">
            <p>Digitando...</p>
        </div>
    `;

    chatMessages.appendChild(indicator);
    scrollToBottom();
}

/**
 * Removes typing indicator
 */
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Verifica se a mensagem está dentro do escopo da SocIA
 * @param {string} message - Mensagem do usuário
 * @returns {boolean} True se está no escopo
 */
function isInScope(message) {
    const lowerMessage = message.toLowerCase();

    // Verifica se contém algum tópico válido
    for (const category in IN_SCOPE_TOPICS) {
        for (const topic of IN_SCOPE_TOPICS[category]) {
            if (lowerMessage.includes(topic)) {
                return true;
            }
        }
    }

    // Palavras-chave genéricas que indicam interesse em serviços da Caixa
    const genericKeywords = ['caixa', 'banco', 'dinheiro', 'pagamento', 'benefício'];
    return genericKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Simulates bot response with persona and scope validation
 * @param {string} userMessage - User's message
 */
function getBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    // Respostas para saudações
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'alo', 'alô'];
    if (greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' '))) {
        return 'Olá! Fico feliz em conversar com você. Estou aqui para ajudar com informações sobre Programas Sociais do Governo e todos os serviços da Caixa. O que você gostaria de saber?';
    }

    // Respostas específicas por categoria
    const responses = {
        // Contas e Serviços Bancários
        conta: 'A Caixa oferece diversos tipos de contas: Conta Corrente, Poupança, Conta Digital Caixa Tem e muito mais. Para abrir uma conta, você pode ir a uma agência com RG, CPF e comprovante de residência, ou fazer pelo aplicativo Caixa Tem. Gostaria de saber mais sobre algum tipo específico de conta?',

        saldo: 'Para consultar seu saldo, você tem várias opções: pelo aplicativo Caixa, internet banking (www.caixa.gov.br), caixas eletrônicos ou ligando para a Central de Atendimento 4004-0104 (capitais) ou 0800 104 0104 (demais localidades). Qual opção você prefere?',

        // FGTS e Programas Sociais
        fgts: 'O FGTS (Fundo de Garantia do Tempo de Serviço) é um direito do trabalhador. Você pode consultar seu saldo pelo aplicativo FGTS, no site da Caixa ou em agências. O saque pode ser feito em casos como demissão sem justa causa, aposentadoria, compra da casa própria, entre outros. Sobre o que você gostaria de saber: saldo, saque ou outras informações?',

        auxilioBrasil: 'O Auxílio Brasil é o programa de transferência de renda do Governo Federal. Para se inscrever, é necessário estar cadastrado no Cadastro Único (CadÚnico) e atender aos critérios de renda. O pagamento é feito pela Caixa através do Cartão Bolsa Família ou Caixa Tem. Posso ajudar com mais informações sobre inscrição, pagamento ou calendário?',

        seguroDesemprego: 'O Seguro-Desemprego é um benefício para trabalhadores dispensados sem justa causa. Você pode solicitar pelo aplicativo Carteira de Trabalho Digital ou em agências credenciadas. O pagamento é feito pela Caixa. Gostaria de saber sobre requisitos, como solicitar ou calendário de pagamentos?',

        // Crédito e Financiamento
        credito: 'A Caixa oferece diversas linhas de crédito: Crédito Pessoal, Consignado, Crédito Imobiliário (Casa Verde e Amarela), Crédito com garantia de FGTS, entre outros. As taxas variam conforme o tipo de crédito e seu perfil. Qual modalidade te interessa?',

        creditoImobiliario: 'O Crédito Imobiliário da Caixa financia até 80% do valor do imóvel, com até 35 anos para pagar. Temos o programa Casa Verde e Amarela (antiga Minha Casa Minha Vida) com condições especiais. Você pode simular pelo site ou aplicativo da Caixa. Gostaria de fazer uma simulação ou saber mais sobre os requisitos?',

        emprestimo: 'A Caixa tem várias modalidades de empréstimo: Consignado (desconto em folha), Pessoal, Penhor, Crédito com garantia de imóvel ou FGTS. As taxas e condições variam. Qual tipo de empréstimo você procura?',

        // Cartões
        cartao: 'A Caixa oferece cartões de crédito e débito das bandeiras Visa, Mastercard e Elo, com diversas opções: Caixa Simples, Elo Mais, Mastercard Gold, entre outros. Alguns têm anuidade zero. Você já é cliente Caixa ou gostaria de abrir uma conta?',

        // Loterias
        loteria: 'As Loterias Caixa incluem: Mega-Sena, Quina, Lotofácil, Lotomania, Timemania, Dupla Sena, Dia de Sorte e Super Sete. Você pode apostar em casas lotéricas, pelo aplicativo Loterias Caixa ou pelo site. Sobre qual loteria você gostaria de saber?',

        // Habitação
        habitacao: 'A Caixa é o maior banco em crédito habitacional do Brasil. Oferecemos financiamento para compra, construção, reforma e terreno. Temos o programa Casa Verde e Amarela com subsídios para famílias de baixa renda. O que você precisa: comprar, construir ou reformar?',

        // PIX e Transferências
        pix: 'O PIX é o sistema de pagamentos instantâneos do Banco Central. Na Caixa, você pode fazer PIX pelo aplicativo, internet banking ou caixas eletrônicos 24h. É gratuito para pessoas físicas. Precisa de ajuda para cadastrar chaves PIX ou fazer uma transferência?',

        // Ajuda Geral
        ajuda: 'Estou aqui para ajudar! Posso fornecer informações sobre:\n\n📱 Contas e serviços bancários\n💰 FGTS e benefícios sociais (Auxílio Brasil, Seguro-Desemprego)\n🏠 Crédito imobiliário e habitação\n💳 Cartões e crédito pessoal\n🎰 Loterias Caixa\n💸 PIX e transferências\n\nSobre qual desses temas você gostaria de saber mais?',

        // Resposta padrão dentro do escopo
        default: 'Entendo. Posso ajudar com informações sobre contas, FGTS, benefícios sociais, crédito, financiamentos, cartões, loterias e outros serviços da Caixa. Poderia me dar mais detalhes sobre o que você precisa?'
    };

    // Verifica se está fora do escopo
    if (!isInScope(userMessage)) {
        return 'Agradeço sua pergunta, mas meu foco é auxiliar especificamente com informações sobre Programas Sociais do Governo Federal e serviços e produtos da Caixa Econômica Federal. Posso ajudar com questões sobre contas, FGTS, benefícios sociais, crédito, financiamentos, cartões ou loterias. Como posso te ajudar dentro desses temas?';
    }

    // Identifica o tópico e retorna resposta apropriada
    if (lowerMessage.includes('conta') || lowerMessage.includes('abrir conta') || lowerMessage.includes('abertura')) {
        return responses.conta;
    } else if (lowerMessage.includes('saldo') || lowerMessage.includes('consultar saldo')) {
        return responses.saldo;
    } else if (lowerMessage.includes('fgts')) {
        return responses.fgts;
    } else if (lowerMessage.includes('auxílio brasil') || lowerMessage.includes('auxilio brasil') || lowerMessage.includes('bolsa família') || lowerMessage.includes('bolsa familia')) {
        return responses.auxilioBrasil;
    } else if (lowerMessage.includes('seguro') && lowerMessage.includes('desemprego')) {
        return responses.seguroDesemprego;
    } else if (lowerMessage.includes('crédito imobiliário') || lowerMessage.includes('credito imobiliario') || lowerMessage.includes('casa verde') || lowerMessage.includes('minha casa')) {
        return responses.creditoImobiliario;
    } else if (lowerMessage.includes('empréstimo') || lowerMessage.includes('emprestimo')) {
        return responses.emprestimo;
    } else if (lowerMessage.includes('crédito') || lowerMessage.includes('credito') || lowerMessage.includes('financiamento')) {
        return responses.credito;
    } else if (lowerMessage.includes('cartão') || lowerMessage.includes('cartao')) {
        return responses.cartao;
    } else if (lowerMessage.includes('loteria') || lowerMessage.includes('mega') || lowerMessage.includes('quina') || lowerMessage.includes('lotofácil')) {
        return responses.loteria;
    } else if (lowerMessage.includes('habitação') || lowerMessage.includes('habitacao') || lowerMessage.includes('imóvel') || lowerMessage.includes('imovel') || lowerMessage.includes('casa')) {
        return responses.habitacao;
    } else if (lowerMessage.includes('pix')) {
        return responses.pix;
    } else if (lowerMessage.includes('ajuda') || lowerMessage.includes('help') || lowerMessage.includes('outros tópicos') || lowerMessage.includes('outros topicos')) {
        return responses.ajuda;
    } else {
        return responses.default;
    }
}

/**
 * Handles sending a message
 */
function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) return;

    // Hide quick actions when user starts interacting
    const quickActionsContainer = document.querySelector('.quick-actions-container');
    if (quickActionsContainer) {
        quickActionsContainer.style.display = 'none';
    }

    // Add user message
    addMessage(text, false);
    messageInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Simulate bot response delay
    setTimeout(() => {
        removeTypingIndicator();
        const response = getBotResponse(text);
        addMessage(response, true);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
}

// ============================================
// Event Listeners
// ============================================

// Send button click
sendBtn.addEventListener('click', sendMessage);


// Enter key to send
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Quick action buttons
quickActionButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Hide quick actions container when clicked
        const quickActionsContainer = document.querySelector('.quick-actions-container');
        if (quickActionsContainer) {
            quickActionsContainer.style.display = 'none';
        }

        // Use the data-action attribute directly as the message text
        const text = button.dataset.action;
        messageInput.value = text;
        sendMessage();
    });
});

// Microphone button for voice input (STT)
if (micBtn) {
    micBtn.addEventListener('click', toggleRecording);
}

// Voice toggle button (TTS)
if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener('click', toggleVoice);
}

// Auto-focus input on load
window.addEventListener('load', () => {
    messageInput.focus();
    scrollToBottom();
    initializeTTS();
    initializeSpeechRecognition();
});

// ============================================
// Accessibility: Announce new messages to screen readers
// ============================================
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('message-wrapper')) {
                    // Announce to screen readers
                    const message = node.querySelector('.message-bubble p');
                    if (message) {
                        const announcement = document.createElement('div');
                        announcement.className = 'sr-only';
                        announcement.setAttribute('role', 'status');
                        announcement.setAttribute('aria-live', 'polite');
                        announcement.textContent = message.textContent;
                        document.body.appendChild(announcement);
                        setTimeout(() => announcement.remove(), 1000);
                    }
                }
            });
        }
    });
});

observer.observe(chatMessages, { childList: true });

// ============================================
// Console welcome message
// ============================================
console.log('%c🤖 SocIA - Assistente Virtual da Caixa', 'color: #00A9E0; font-size: 16px; font-weight: bold;');
console.log('%cVersão 1.1.0 - Persona Humanizada', 'color: #003D7A; font-size: 12px;');
console.log('%cEscopo: Programas Sociais + Serviços Caixa', 'color: #6C757D; font-size: 11px;');
