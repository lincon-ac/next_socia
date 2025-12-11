# SocIA Backend - Microservices Architecture

Arquitetura backend completa do chatbot SocIA utilizando microsserviços, com foco em escalabilidade e integração futura.

## 🏗️ Arquitetura

O backend é composto por **três microsserviços independentes**:

```
┌─────────────────┐
│   Frontend UI   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Chat API Gateway       │  ← Porta 3000 (Ponto de entrada)
│  - Orquestra serviços   │
│  - Swagger UI           │
└───────┬─────────────────┘
        │
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ NLP Service  │ │ Knowledge    │ │   Future     │
│ Porta 3001   │ │ Base         │ │   Services   │
│              │ │ Porta 3002   │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Módulos

#### 1. **Knowledge Base Service** (Porta 3002)
- Base de conhecimento hierárquica em JSON
- API RESTful para consulta de informações
- Estrutura organizada por temas e sub-categorias
- Fácil adição de novos tópicos

#### 2. **NLP Processing Service** (Porta 3001)
- Processamento de linguagem natural
- Reconhecimento de intenções (intent recognition)
- Validação de escopo rigorosa
- Extração de entidades
- Extensível para integração com ML/IA

#### 3. **Chat API Gateway** (Porta 3000)
- Ponto de entrada principal
- Orquestra comunicação entre serviços
- Documentação Swagger UI integrada
- Gerenciamento de sessões (futuro)

---

## 📁 Estrutura do Projeto

```
backend/
├── chat-api/                    # API Gateway
│   ├── src/
│   │   ├── server.js           # Servidor Express
│   │   └── controllers/
│   │       └── chatController.js
│   ├── package.json
│   └── Dockerfile
│
├── nlp-service/                 # Serviço NLP
│   ├── src/
│   │   ├── server.js
│   │   └── processors/
│   │       ├── intentProcessor.js
│   │       └── scopeValidator.js
│   ├── package.json
│   └── Dockerfile
│
├── knowledge-base/              # Base de Conhecimento
│   ├── data/
│   │   └── knowledge.json      # Dados hierárquicos
│   ├── src/
│   │   ├── server.js
│   │   └── controllers/
│   │       └── knowledgeController.js
│   ├── package.json
│   └── Dockerfile
│
├── docs/
│   └── openapi.yaml            # Documentação OpenAPI 3.0
│
└── docker-compose.yml          # Orquestração de containers
```

---

## 🚀 Como Executar

### Opção 1: Docker Compose (Recomendado)

```bash
# Navegar para o diretório backend
cd backend

# Iniciar todos os serviços
docker-compose up

# Ou em modo detached
docker-compose up -d

# Parar serviços
docker-compose down
```

### Opção 2: Execução Local (Desenvolvimento)

**Pré-requisitos:** Node.js 18+

```bash
# Instalar dependências em cada serviço
cd knowledge-base && npm install
cd ../nlp-service && npm install
cd ../chat-api && npm install

# Terminal 1: Knowledge Base
cd knowledge-base
npm start

# Terminal 2: NLP Service
cd nlp-service
npm start

# Terminal 3: Chat API Gateway
cd chat-api
npm start
```

---

## 📖 Documentação da API

Após iniciar os serviços, acesse:

- **Swagger UI**: http://localhost:3000/api-docs
- **Health Checks**:
  - Chat API: http://localhost:3000/health
  - NLP Service: http://localhost:3001/health
  - Knowledge Base: http://localhost:3002/health

---

## 🔌 Endpoints Principais

### Chat API Gateway (3000)

```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "Como consultar meu FGTS?",
  "sessionId": "session-123"
}
```

```http
GET /api/chat/greeting
GET /api/chat/suggestions
```

### NLP Service (3001)

```http
POST /api/nlp/process
Content-Type: application/json

{
  "message": "Quero saber sobre empréstimos"
}
```

```http
POST /api/nlp/validate-scope
```

### Knowledge Base (3002)

```http
GET /api/knowledge/search?q=fgts
GET /api/knowledge/categories
GET /api/knowledge/topic/programas_sociais/fgts
GET /api/knowledge/metadata
```

---

## 📊 Base de Conhecimento

A base de conhecimento está estruturada hierarquicamente em JSON:

```json
{
  "knowledge": {
    "programas_sociais": {
      "fgts": { ... },
      "auxilio_brasil": { ... },
      "seguro_desemprego": { ... }
    },
    "servicos_caixa": {
      "contas": { ... },
      "pix": { ... },
      "caixa_tem": { ... }
    },
    "produtos_caixa": {
      "credito_imobiliario": { ... },
      "cartoes": { ... },
      "loterias": { ... }
    }
  }
}
```

### Adicionar Novo Tópico

Edite `knowledge-base/data/knowledge.json`:

```json
{
  "knowledge": {
    "categoria_existente": {
      "novo_topico": {
        "title": "Título do Tópico",
        "keywords": ["palavra1", "palavra2"],
        "content": {
          "description": "Descrição",
          "pergunta": {
            "question": "Como fazer X?",
            "answer": "Resposta detalhada..."
          }
        }
      }
    }
  }
}
```

---

## 🔄 Fluxo de Processamento

1. **Frontend** envia mensagem para Chat API Gateway
2. **Chat API** encaminha para NLP Service
3. **NLP Service**:
   - Valida escopo
   - Extrai intenção
   - Consulta Knowledge Base
4. **Knowledge Base** retorna dados relevantes
5. **Chat API** gera resposta final
6. **Frontend** recebe e exibe resposta

---

## 🔐 Variáveis de Ambiente

Crie arquivos `.env` em cada serviço:

### chat-api/.env
```env
PORT=3000
NLP_SERVICE_URL=http://localhost:3001
KNOWLEDGE_BASE_URL=http://localhost:3002
NODE_ENV=development
```

### nlp-service/.env
```env
PORT=3001
KNOWLEDGE_BASE_URL=http://localhost:3002
NODE_ENV=development
```

### knowledge-base/.env
```env
PORT=3002
NODE_ENV=development
```

---

## 🧪 Testes

```bash
# Em cada serviço
npm test

# Testes de integração
npm run test:integration

# Validar OpenAPI
npm run test:api
```

---

## 🚀 Deploy

### Docker (Produção)

```bash
# Build de produção
docker-compose -f docker-compose.prod.yml up --build

# Com variáveis de ambiente
docker-compose --env-file .env.prod up
```

### Kubernetes

```bash
# Aplicar configurações
kubectl apply -f k8s/

# Verificar pods
kubectl get pods -n socia
```

### Cloud (AWS/Azure/GCP)

- **AWS**: ECS + ALB + RDS
- **Azure**: AKS + Application Gateway
- **GCP**: GKE + Cloud Load Balancing

---

## 🔮 Integrações Futuras

### Substituir NLP Rule-Based por IA

```javascript
// nlp-service/src/processors/intentProcessor.js

// Opção 1: OpenAI
const openai = require('openai');
const response = await openai.chat.completions.create({...});

// Opção 2: Dialogflow
const dialogflow = require('@google-cloud/dialogflow');
const sessionClient = new dialogflow.SessionsClient();

// Opção 3: IBM Watson
const AssistantV2 = require('ibm-watson/assistant/v2');
```

### Adicionar Autenticação

```javascript
// Middleware JWT
const jwt = require('jsonwebtoken');
app.use('/api', authenticateToken);
```

### Cache com Redis

```javascript
const redis = require('redis');
const client = redis.createClient();
// Cache de respostas frequentes
```

### Banco de Dados para Histórico

```javascript
// PostgreSQL para conversas
const { Pool } = require('pg');
const pool = new Pool({...});
```

---

## 📈 Monitoramento

### Logs

```bash
# Ver logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f chat-api
```

### Métricas (Futuro)

- Prometheus + Grafana
- New Relic
- DataDog

---

## 🤝 Contribuindo

1. Adicione novos tópicos em `knowledge.json`
2. Expanda padrões de intent em `intentProcessor.js`
3. Adicione novos endpoints conforme necessário
4. Atualize documentação OpenAPI

---

## 📝 Licença

MIT License - SocIA Team

---

## 📞 Suporte

- **Documentação**: http://localhost:3000/api-docs
- **Issues**: GitHub Issues
- **Email**: socia@caixa.gov.br
