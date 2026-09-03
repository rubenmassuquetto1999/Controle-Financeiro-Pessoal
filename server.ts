import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const DEFAULT_AUTHORIZED_USER =
  process.env.AUTHORIZED_EMAIL ||
  process.env.VITE_AUTHORIZED_EMAIL ||
  'rubenmassuquetto1999@gmail.com';

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1';
}

// IP Security Endpoints (IP lock disabled to prevent dynamic IPv6 rotation lockouts)
app.get('/api/security/ip-status', (req, res) => {
  const clientIp = getClientIp(req);
  res.json({
    clientIp,
    boundIp: null,
    boundAt: null,
    boundUser: DEFAULT_AUTHORIZED_USER,
    isLocked: false,
    isAuthorized: true
  });
});

app.post('/api/security/bind-ip', (req, res) => {
  const clientIp = getClientIp(req);
  res.json({
    success: true,
    clientIp,
    boundIp: null,
    boundAt: null,
    isLocked: false,
    message: 'Trava de IP desativada permanentemente.'
  });
});

app.post('/api/security/unbind-ip', (req, res) => {
  res.json({ success: true, message: 'Trava de IP desativada.' });
});

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables.');
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

const SEED_CATEGORIES_REFERENCE = `
Categorias Permitidas para Classificação:
1. ENTRADAS:
   - Salário
   - Pró-labore
   - Aluguéis
   - Dividendos
   - Outras rendas
2. SAÍDAS ESSENCIAIS (budget_group: essencial):
   - Aluguel
   - Internet
   - Luz
   - Telefone
   - Supermercado/Alimentação
   - Farmácia
   - Transporte (Uber, Ônibus, Combustível)
3. SAÍDAS INVESTIMENTOS (budget_group: investimento):
   - Renda Fixa
   - Ações
   - FIIs
   - Cripto
4. SAÍDAS EDUCAÇÃO (budget_group: educacao):
   - Cursos
   - Concurso
5. SAÍDAS LAZER (budget_group: lazer):
   - Netflix
   - YouTube
   - Disney
   - Viagem
6. SAÍDAS ADICIONAIS (budget_group: adicional):
   - Doações
   - Assinaturas (Canva, CapCut)
   - Vestuário
   - IPTU
`;

// API route for transaction AI classification
app.post('/api/classify', async (req, res) => {
  const { local_name = '', description = '', type = 'saida' } = req.body || {};

  if (!local_name || !description || !type) {
    return res.status(400).json({
      error: 'Campos obrigatórios ausentes: local_name, description e type devem ser fornecidos.'
    });
  }

  // Models to attempt in order of preference during spikes
  const candidateModels = [
    process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
  ];

  const prompt = `Você é um motor estrito de classificação financeira pessoal.
Classifique a transação com base unicamente nestas 3 entradas:
- Local: "${local_name}"
- Descritivo: "${description}"
- Tipo: "${type}"

${SEED_CATEGORIES_REFERENCE}

Regras:
1. "category" DEVE ser estritamente uma das categorias existentes na lista acima (ex: "Supermercado/Alimentação", "Transporte (Uber, Ônibus, Combustível)", "Internet", "Luz", "Aluguel", "Farmácia", "Salário", "Investimento", "Netflix", "Vestuário", "Assinaturas (Canva, CapCut)", etc.).
2. "subcategory" deve ser um detalhamento conciso (ex: "Uber", "Combustível", "Streaming", "Supermercado", "Conta residencial", "Bolsa de Valores").
3. "budget_group" deve ser um destes valores exatos: "essencial", "investimento", "educacao", "lazer", "adicional" (ou "receita" se o tipo for entrada).
4. "local_type" deve ser "fisico" se for estabelecimento físico/presencial (mercados físicos, postos, farmácias de rua) ou "online" se for serviço digital, aplicativo, site ou streaming (Netflix, Uber, e-commerce, internet, assinaturas).`;

  let lastModelError: any = null;

  try {
    const ai = getGemini();

    for (const modelName of candidateModels) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout de requisição')), 4000)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    description: 'Categoria exata da lista do seed'
                  },
                  subcategory: {
                    type: Type.STRING,
                    description: 'Subcategoria detalhada'
                  },
                  budget_group: {
                    type: Type.STRING,
                    description: 'essencial, investimento, educacao, lazer, adicional ou receita'
                  },
                  local_type: {
                    type: Type.STRING,
                    description: 'fisico ou online'
                  }
                },
                required: ['category', 'subcategory', 'budget_group', 'local_type']
              }
            }
          }),
          timeoutPromise
        ]);

        const responseText = response.text?.trim() || '{}';
        const parsedData = JSON.parse(responseText);

        // Normalize budget_group and local_type
        let budgetGroup = parsedData.budget_group?.toLowerCase();
        if (type === 'entrada' && budgetGroup !== 'receita') {
          budgetGroup = 'receita';
        } else if (type === 'saida' && budgetGroup === 'receita') {
          budgetGroup = 'essencial';
        }

        const localType = parsedData.local_type?.toLowerCase() === 'online' ? 'online' : 'fisico';

        return res.json({
          category: parsedData.category || (type === 'entrada' ? 'Salário' : 'Supermercado/Alimentação'),
          subcategory: parsedData.subcategory || description,
          budget_group: budgetGroup || (type === 'entrada' ? 'receita' : 'essencial'),
          local_type: localType,
          modelUsed: modelName
        });
      } catch (modelErr: any) {
        lastModelError = modelErr;
        console.warn(`Modelo ${modelName} temporariamente indisponível: ${modelErr?.message || modelErr}`);
      }
    }
  } catch (initErr: any) {
    lastModelError = initErr;
    console.warn('Erro ao inicializar cliente Gemini:', initErr?.message || initErr);
  }

  // Graceful fallback in case of high demand spikes or temporary provider limits
  console.warn('Utilizando fallback inteligente de regras locais para garantir disponibilidade ininterrupta.');

  const text = `${local_name} ${description}`.toLowerCase();
  let fallbackCategory = type === 'entrada' ? 'Outras rendas' : 'Supermercado/Alimentação';
  let fallbackSub = description || 'Geral';
  let fallbackGroup = type === 'entrada' ? 'receita' : 'essencial';
  let fallbackLocal: 'fisico' | 'online' = 'fisico';

  if (text.includes('netflix') || text.includes('youtube') || text.includes('disney') || text.includes('spotify') || text.includes('viagem') || text.includes('cinema')) {
    fallbackCategory = 'Netflix';
    fallbackGroup = 'lazer';
    fallbackLocal = 'online';
  } else if (text.includes('uber') || text.includes('99') || text.includes('gasolina') || text.includes('combustivel') || text.includes('posto') || text.includes('onibus')) {
    fallbackCategory = 'Transporte (Uber, Ônibus, Combustível)';
    fallbackGroup = 'essencial';
    fallbackLocal = text.includes('uber') || text.includes('99') ? 'online' : 'fisico';
  } else if (text.includes('curso') || text.includes('livro') || text.includes('concurso') || text.includes('faculdade') || text.includes('udemy')) {
    fallbackCategory = 'Cursos';
    fallbackGroup = 'educacao';
    fallbackLocal = 'online';
  } else if (text.includes('acao') || text.includes('fii') || text.includes('cdb') || text.includes('cripto') || text.includes('bitcoin') || text.includes('investimento')) {
    fallbackCategory = 'Renda Fixa';
    fallbackGroup = 'investimento';
    fallbackLocal = 'online';
  } else if (text.includes('luz') || text.includes('energia') || text.includes('copel') || text.includes('enel')) {
    fallbackCategory = 'Luz';
    fallbackGroup = 'essencial';
    fallbackLocal = 'online';
  } else if (text.includes('internet') || text.includes('claro') || text.includes('vivo') || text.includes('fibra')) {
    fallbackCategory = 'Internet';
    fallbackGroup = 'essencial';
    fallbackLocal = 'online';
  } else if (text.includes('farmacia') || text.includes('droga') || text.includes('remedio') || text.includes('panvel') || text.includes('raia')) {
    fallbackCategory = 'Farmácia';
    fallbackGroup = 'essencial';
    fallbackLocal = 'fisico';
  } else if (text.includes('aluguel')) {
    fallbackCategory = 'Aluguel';
    fallbackGroup = 'essencial';
    fallbackLocal = 'online';
  } else if (text.includes('salario') || text.includes('pro-labore') || text.includes('renda')) {
    fallbackCategory = 'Salário';
    fallbackGroup = 'receita';
    fallbackLocal = 'online';
  }

  return res.json({
    category: fallbackCategory,
    subcategory: fallbackSub,
    budget_group: fallbackGroup,
    local_type: fallbackLocal,
    fallbackUsed: true,
    warning: 'Classificação preliminar aplicada devido a alta demanda temporária.'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
