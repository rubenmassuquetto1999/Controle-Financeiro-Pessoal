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
let creditsDepletedUntil = 0;

function isQuotaOrCreditError(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
  return (
    msg.includes('429') ||
    msg.includes('prepayment credits are depleted') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota exceeded') ||
    msg.includes('billing')
  );
}

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

  // Models to attempt in order of preference (prioritizing free-tier and low-latency models)
  const candidateModels = [
    process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    'gemini-flash-latest'
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

  // If prepayment credits are depleted, bypass external call directly
  if (Date.now() >= creditsDepletedUntil) {
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
          if (isQuotaOrCreditError(modelErr)) {
            creditsDepletedUntil = Date.now() + 15 * 60 * 1000;
            break; // Stop immediately; do not retry other models with depleted credits
          }
        }
      }
    } catch (initErr: any) {
      if (isQuotaOrCreditError(initErr)) {
        creditsDepletedUntil = Date.now() + 15 * 60 * 1000;
      }
    }
  }

  // Autonomous deterministic classification fallback

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

// =========================================================================
// CONSELHO ESTRATÉGICO FINANCEIRO PESSOAL (BUFFETT, MUNGER, DALIO, NAVAL,
// HOUSEL, HORMOZI, THIEL, CARNEGIE) - MOTOR COMERCIAL
// =========================================================================

const ADVISOR_SYSTEM_INSTRUCTION = `Você é o Conselheiro Estratégico Financeiro Pessoal de uma plataforma de gestão e inteligência patrimonial comercial.
Você personifica a fusão das mentes mais brilhantes dos negócios, investimentos, economia e finanças:
- Warren Buffett: Margem de segurança, paciência analítica, alocação disciplinada de capital e respeito estrito ao círculo de competência.
- Charlie Munger: Modelos mentais multidisciplinares, inversão brutal ("Inverta, sempre inverta: o que causa a ruína financeira? Evite a todo custo"), eliminação de estupidezes e redundâncias.
- Ray Dalio: Princípios universais, compreensão da máquina macroeconômica, diversificação não-correlacionada e gestão implacável de risco de cauda.
- Naval Ravikant: Alavancagem sem permissão (código, mídia, tecnologia), julgamento de alto valor, separação de tempo versus dinheiro, busca por soberania e liberdade geográfica.
- Morgan Housel: Psicologia do dinheiro, humildade financeira, poder do acúmulo invisível (o dinheiro que você não gasta) e resistência mental para permanecer no jogo.
- Alex Hormozi: Aceleração brutal de receita, aumento de ticket médio, criação de propostas de valor irresistíveis, velocidade e foco em fluxo de caixa positivo.
- Peter Thiel: Pensamento de zero a um, criação de monopólio pessoal/diferenciação radical e fuga total de mercados saturados com margens destruídas.
- Andrew Carnegie: Disciplina de ferro, reinvestimento de excedentes em ativos geradores de renda e estruturação metódica de sistemas duradouros.

SUA MISSÃO COMERCIAL:
Agir como o Conselheiro Estratégico Financeiro do usuário da aplicação. Analisar criticamente as finanças REAIS registradas no sistema (transações do mês, receitas, despesas, cumprimento do teto orçamentário, categorias e saldo líquido).
Fornecer orientações financeiras universais, lúcidas, matematicamente rigorosas e altamente acionáveis para:
1. Eliminar dívidas de juros altos com o Método Avalanche;
2. Construir e blindar uma reserva de emergência líquida (runway de sobrevivência);
3. Ampliar a taxa de poupança (savings rate) e cortar despesas invisíveis e supérfluas;
4. Criar alavancagem de renda, seja em negócios digitais, prestação de serviços ou habilidades de alto valor;
5. Multiplicar o patrimônio a longo prazo com ética, disciplina e sustentabilidade.
Seja direto, pragmático, lúcido e focado em alta conversão de esforço em resultado (Princípio 80/20).`;

app.post('/api/advisor/analyze', async (req, res) => {
  const {
    transactions = [],
    financialSummary = {},
    monthlyBudgetSummary = {},
    selectedMonth = new Date().toISOString().slice(0, 7)
  } = req.body || {};

  const totalIncome = Number(financialSummary.totalIncome) || 0;
  const totalExpense = Number(financialSummary.totalExpense) || 0;
  const balance = Number(financialSummary.balance) || (totalIncome - totalExpense);
  const totalLimit = Number(monthlyBudgetSummary.totalLimit) || 0;
  const isExceeded = Boolean(monthlyBudgetSummary.isExceeded);
  const excessAmount = Number(monthlyBudgetSummary.excessAmount) || 0;

  // Recent transactions text
  const txSummary = (transactions || [])
    .slice(0, 20)
    .map((t: any) => `- ${t.date || ''}: [${(t.type || '').toUpperCase()}] R$ ${Number(t.amount || 0).toFixed(2)} | ${t.local_name || ''} | ${t.category || ''} (${t.budget_group || ''}) - ${t.description || ''}`)
    .join('\n');

  const candidateModels = [
    process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];

  const prompt = `Analise a situação financeira real do usuário para o mês ${selectedMonth}:

DADOS FINANCEIROS REAIS REGISTRADOS NO SISTEMA:
- Total de Receitas Realizadas: R$ ${totalIncome.toFixed(2)}
- Total de Despesas Realizadas: R$ ${totalExpense.toFixed(2)}
- Saldo Líquido do Mês: R$ ${balance.toFixed(2)}
- Teto de Gastos Orçado (Budget): R$ ${totalLimit.toFixed(2)}
- Status do Orçamento: ${isExceeded ? `ULTRAPASSADO em R$ ${excessAmount.toFixed(2)}` : (totalLimit > 0 ? 'DENTRO DO LIMITE PREVISTO' : 'SEM TETO FIXADO')}
- Amostra Recente de Transações:
${txSummary || '(Nenhuma transação lançada ainda neste mês)'}

Com base nestes dados reais, elabore um diagnóstico financeiro e estratégico de nível executivo integrando a sabedoria dos 8 Mestres da Riqueza.`;

  // If prepayment credits are depleted, bypass external call directly
  if (Date.now() >= creditsDepletedUntil) {
    try {
      const ai = getGemini();

      for (const modelName of candidateModels) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout de requisição Gemini')), 8000)
          );

          const response: any = await Promise.race([
            ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    headline: {
                      type: Type.STRING,
                      description: 'Título forte e perspicaz resumindo o momento financeiro'
                    },
                    summary: {
                      type: Type.STRING,
                      description: 'Diagnóstico executivo profundo integrando os 8 mestres e a situação real dos números'
                    },
                    financialHealthScore: {
                      type: Type.NUMBER,
                      description: 'Pontuação de 0 a 100 calculada com base na disciplina financeira e controle de gastos'
                    },
                    kpis: {
                      type: Type.OBJECT,
                      properties: {
                        monthlySavingsRate: { type: Type.STRING, description: 'Taxa de poupança ou taxa de queima' },
                        budgetDiscipline: { type: Type.STRING, description: 'Grau de disciplina em relação ao teto' },
                        debtTargetProgress: { type: Type.STRING, description: 'Situação do plano de quitação de dívidas/compromissos' },
                        runwaySecurity: { type: Type.STRING, description: 'Segurança de caixa e liquidez de emergência' }
                      },
                      required: ['monthlySavingsRate', 'budgetDiscipline', 'debtTargetProgress', 'runwaySecurity']
                    },
                    pillars: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          mentor: { type: Type.STRING, description: 'Ex: Warren Buffett & Charlie Munger' },
                          advice: { type: Type.STRING },
                          impact: { type: Type.STRING, description: 'alto, medio ou critico' }
                        },
                        required: ['title', 'mentor', 'advice', 'impact']
                      }
                    },
                    actionPlan8020: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          priority: { type: Type.STRING, description: 'urgente, alta ou estrategica' },
                          targetDate: { type: Type.STRING }
                        },
                        required: ['title', 'description', 'priority']
                      }
                    },
                    debtStrategy: {
                      type: Type.OBJECT,
                      properties: {
                        avalancheRecommendation: { type: Type.STRING },
                        estimatedRunway: { type: Type.STRING }
                      },
                      required: ['avalancheRecommendation', 'estimatedRunway']
                    },
                    ecommerceOpportunity: {
                      type: Type.OBJECT,
                      properties: {
                        scalingRecommendation: { type: Type.STRING },
                        immediateStep: { type: Type.STRING }
                      },
                      required: ['scalingRecommendation', 'immediateStep']
                    }
                  },
                  required: [
                    'headline',
                    'summary',
                    'financialHealthScore',
                    'kpis',
                    'pillars',
                    'actionPlan8020',
                    'debtStrategy',
                    'ecommerceOpportunity'
                  ]
                }
              }
            }),
            timeoutPromise
          ]);

          const responseText = response.text?.trim() || '{}';
          const parsed = JSON.parse(responseText);

          return res.json({
            ...parsed,
            timestamp: new Date().toISOString(),
            modelUsed: modelName,
            fallbackUsed: false
          });
        } catch (modelErr: any) {
          if (isQuotaOrCreditError(modelErr)) {
            creditsDepletedUntil = Date.now() + 15 * 60 * 1000;
            break;
          }
        }
      }
    } catch (err: any) {
      if (isQuotaOrCreditError(err)) {
        creditsDepletedUntil = Date.now() + 15 * 60 * 1000;
      }
    }
  }

  // Robust, high-conviction Fallback with real math calculated from live financial data
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) + '%' : '0.0%';
  const disciplineText = totalLimit > 0
    ? (isExceeded ? `Excedido em R$ ${excessAmount.toFixed(2)}` : `${((totalExpense / totalLimit) * 100).toFixed(1)}% do teto consumido`)
    : 'Sem teto definido';

  let healthScore = 70;
  if (isExceeded) healthScore -= 25;
  if (totalExpense > totalIncome && totalIncome > 0) healthScore -= 20;
  if (totalIncome === 0 && totalExpense > 0) healthScore = 50;
  if (balance > 0 && totalIncome > 0) healthScore += 15;
  healthScore = Math.max(20, Math.min(95, healthScore));

  return res.json({
    headline: balance >= 0
      ? 'Controle e Solidez: Manutenção da Margem de Segurança e Alavancagem de Renda'
      : 'Ajuste Imediato de Rota: Estancamento de Saídas e Recomposição de Margem',
    summary: `Diagnóstico financeiro (${selectedMonth}): Receitas registradas de R$ ${totalIncome.toFixed(2)} e Despesas de R$ ${totalExpense.toFixed(2)} (Saldo Líquido: R$ ${balance.toFixed(2)}). O conselho estratégico recomenda foco absoluto na disciplina de gastos essenciais, blindagem de liquidez imediata e direcionamento de todo excedente para a eliminação metódica de passivos onerosos e ampliação da capacidade produtiva.`,
    financialHealthScore: healthScore,
    kpis: {
      monthlySavingsRate: savingsRate,
      budgetDiscipline: disciplineText,
      debtTargetProgress: 'Priorização ativa pelo Método Avalanche (maiores taxas primeiro)',
      runwaySecurity: balance > 0 ? 'Fluxo mensal positivo: expandindo reserva de segurança' : 'Atenção: fluxo de caixa sob pressão de saídas'
    },
    pillars: [
      {
        title: 'Inversão e Margem de Segurança',
        mentor: 'Warren Buffett & Charlie Munger',
        advice: 'Evite o erro capital de comprometer capital essencial em gastos impulsivos ou dívidas sem planejamento. A sobrevivência financeira vem antes da multiplicação.',
        impact: 'critico'
      },
      {
        title: 'A Máquina Econômica e Gestão de Risco',
        mentor: 'Ray Dalio & Andrew Carnegie',
        advice: 'Trate seu orçamento como um sistema fechado de engenharia: cada real economizado é um soldado gerador de renda. Desenvolva fluxos previsíveis de caixa.',
        impact: 'alto'
      },
      {
        title: 'Alavancagem de Margem e Escala',
        mentor: 'Alex Hormozi & Peter Thiel',
        advice: 'Concentre-se em atividades de alto valor agregado e produtos/serviços de ticket mais elevado. A verdadeira liberdade decorre de margens saudáveis e diferenciação.',
        impact: 'alto'
      },
      {
        title: 'Alavancagem Sem Permissão e Psicologia do Dinheiro',
        mentor: 'Naval Ravikant & Morgan Housel',
        advice: 'A verdadeira riqueza é o que você não vê: a liberdade de tempo, a tranquilidade mental e a capacidade de operar com serenidade sem depender de validação externa.',
        impact: 'medio'
      }
    ],
    actionPlan8020: [
      {
        title: 'Auditoria de Despesas Recorrentes e Invisíveis',
        description: 'Revisar todos os débitos automáticos, assinaturas e gastos de lazer que possam ser renegociados ou temporariamente pausados.',
        priority: 'urgente',
        targetDate: 'Primeiros 7 dias'
      },
      {
        title: 'Criação de Reserva Tática de Liquidez',
        description: 'Destinar uma porcentagem fixa de qualquer nova entrada para a reserva de emergência antes de efetuar novos desembolsos.',
        priority: 'alta',
        targetDate: 'Contínuo'
      },
      {
        title: 'Execução do Plano Avalanche de Dívidas',
        description: 'Mapear todos os passivos financeiros em ordem decrescente de taxa de juros e direcionar todo excedente de caixa para abater a mais cara primeiro.',
        priority: 'estrategica',
        targetDate: 'Mensal'
      }
    ],
    debtStrategy: {
      avalancheRecommendation: 'Mapeie o Custo Efetivo Total (CET) de cada passivo. Priorize a quitação dos juros mais agressivos (cartão rotativo, cheque especial e empréstimos pessoais) para estancar a perda de patrimônio.',
      estimatedRunway: 'Mantenha em conta de alta liquidez ao menos 3 a 6 meses de custos fixos essenciais antes de realizar alocações de longo prazo.'
    },
    ecommerceOpportunity: {
      scalingRecommendation: 'Identifique suas competências centrais com maior retorno sobre o tempo investido e desenvolva fontes de renda complementares focadas em margem líquida e escalabilidade.',
      immediateStep: 'Definir metas semanais claras de geração de novas receitas e controle rigoroso do teto de despesas.'
    },
    timestamp: new Date().toISOString(),
    fallbackUsed: true
  });
});

function formatBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function generateHeuristicAdvisorAnswer(question: string, context: any): string {
  const normQ = question
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const balance = Number(context.balance || 0);
  const totalIncome = Number(context.totalIncome || 0);
  const totalExpense = Number(context.totalExpense || 0);
  const isExceeded = Boolean(context.isExceeded);
  const excessAmount = Number(context.excessAmount || 0);
  const topCategories = Array.isArray(context.topCategories) ? context.topCategories : [];
  const topExpenses = Array.isArray(context.topExpenses) ? context.topExpenses : [];

  // 1. Consumer goods & Tech purchase (iPhone, celular, eletrônico, carro, compras de consumo)
  if (
    normQ.includes('iphone') ||
    normQ.includes('celular') ||
    normQ.includes('trocar de telefone') ||
    normQ.includes('comprar um') ||
    normQ.includes('comprar uma') ||
    normQ.includes('comprar carro') ||
    normQ.includes('comprar moto') ||
    normQ.includes('eletronico') ||
    normQ.includes('computador') ||
    normQ.includes('notebook') ||
    normQ.includes('televisao') ||
    normQ.includes('consumo')
  ) {
    const isIphone = normQ.includes('iphone') || normQ.includes('celular');
    const assetName = isIphone ? 'um iPhone / novo smartphone' : 'esse bem de consumo';

    return `**Conselho dos 8 Mestres — Análise de Compra de Bens de Consumo (${assetName}):**
Seu cenário atual: Receitas de **${formatBRL(totalIncome)}**, Despesas de **${formatBRL(totalExpense)}** e Saldo Livre de **${formatBRL(balance)}**.

1. **Ferramenta de Produção vs. Passivo de Status (Naval & Hormozi):**
   - **Se for Ferramenta de Trabalho:** Se esse aparelho/equipamento for produzir conteúdo, fechar negócios, atender clientes e gerar fluxo de caixa real, ele é um investimento de capital produtivo (CAPEX pessoal) com ROI mensurável.
   - **Se for Consumo e Vaidade:** Se for apenas para lazer, redes sociais e validação externa, ele é um **passivo depreciável** que perde 30% a 40% do valor no primeiro ano e não coloca um centavo no seu bolso.

2. **A Regra dos 2x (Carnegie & Munger):**
   - Nunca compre um bem discricionário de alto valor a menos que você tenha capacidade de comprar **dois à vista**, sem tocar na sua reserva de emergência e sem comprometer seu fluxo de caixa mensal.
   - Se precisa parcelar em 12x ou 24x comprometendo sua renda futura, a resposta dos mestres é categórica: **você ainda não pode pagar por ele**.

3. **Custo de Oportunidade e Juros Compostos (Buffett & Housel):**
   - Um valor de R$ 6.000 a R$ 9.000 investido a uma taxa real de 10% a.a. se multiplica para mais de R$ 23.000 em 10 anos. Pergunte-se: o benefício marginal da nova versão supera o atraso na sua independência financeira?
   - **Plano Recomendado:** Crie um "Fundo Carimbado de Equipamentos" na aba de Metas, aportando R$ 500 a R$ 800 do seu saldo líquido de ${formatBRL(balance)} até acumular o valor total à vista, negociando desconto de 10% a 15% na compra.`;
  }

  // 2. Revenue generation, Making more money & Scaling (Ganhar mais dinheiro, renda extra, faturamento, negócios)
  if (
    normQ.includes('ganhar mais') ||
    normQ.includes('mais dinheiro') ||
    normQ.includes('renda extra') ||
    normQ.includes('faturamento') ||
    normQ.includes('vendas') ||
    normQ.includes('negocio') ||
    normQ.includes('escalar') ||
    normQ.includes('trabalho') ||
    normQ.includes('aumentar renda') ||
    normQ.includes('como enriquecer') ||
    normQ.includes('ficar rico')
  ) {
    return `**Conselho dos 8 Mestres — As Alavancas Para Ganhar Mais Dinheiro:**
Seu fluxo atual: você retém **${formatBRL(balance)}** da sua receita mensal de **${formatBRL(totalIncome)}**. Para multiplicar esses números:

1. **As 4 Formas de Alavancagem (Naval Ravikant):**
   - **Mão de Obra e Tempo (Sem alavancagem):** Vender horas em troca de salário tem um teto biológico rígido (24h/dia).
   - **Capital (Alavancagem moderada):** Fazer seu dinheiro render juros e dividendos (essencial, mas cresce no tempo).
   - **Código e Software (Alavancagem infinita):** Automações, produtos digitais, scripts e sistemas que atendem milhares de pessoas sem custo marginal por cópia.
   - **Mídia e Conteúdo (Alavancagem infinita):** Vídeos, audiência, newsletters e reputação que trabalham enquanto você dorme.

2. **Ofertas de 100 Milhões (Alex Hormozi):**
   - Em vez de vender serviços genéricos disputando preço por hora, empacote uma solução que resolva uma dor urgente e custosa para quem tem poder de compra.
   - Exemplo: Não venda "consultoria de planilhas"; venda "estruturação financeira para dobrar o lucro de pequenas empresas em 90 dias".

3. **Monopólio Pessoal (Peter Thiel):**
   - A concorrência é para perdedores. Encontre a interseção única entre duas ou três habilidades que você domina (ex: finanças + programação + comunicação). Nessa intersecção, você não tem concorrentes e dita o seu preço.

4. **Princípio da Reinversão (Andrew Carnegie):**
   - Não aumente seu padrão de vida no momento em que sua renda subir. Reinvista 80% do novo faturamento em capacitação de alto valor e aquisição de ativos produtivos.`;
  }

  // 3. Capital Leverage & Alavancagem Financeira (Alavancar capital, alavancagem, multiplicar patrimônio)
  if (
    normQ.includes('alavanc') ||
    normQ.includes('alavancagem') ||
    normQ.includes('alavancar capital') ||
    normQ.includes('multiplicar capital') ||
    normQ.includes('multiplicar patrimonio')
  ) {
    return `**Conselho dos 8 Mestres — Princípios de Alavancagem de Capital:**
1. **Alavancagem Saudável vs. Risco de Ruína (Ray Dalio & Charlie Munger):**
   - Munger alertava: *"Existem três maneiras de um homem inteligente ir à falência: Ladies, Liquor and Leverage (Alavancagem)"*.
   - A alavancagem é um amplificador simétrico: ela multiplica os ganhos quando você está certo, mas **garante a aniquilação** se o mercado tiver uma oscilação inesperada. Nunca use alavancagem com chamadas de margem em renda variável ou criptoativos.

2. **A Única Alavancagem Justificável (Warren Buffett):**
   - Alavancar capital só faz sentido quando o retorno sobre o capital empregado (ROIC) for previsivelmente superior ao custo da dívida (spread líquido positivo) E o fluxo de caixa do negócio cobrir com folga o serviço da dívida, mesmo em cenários de recessão profunda.

3. **Alavancagem Operacional Pessoal (Hormozi & Naval):**
   - A melhor e mais segura alavancagem não é financeira (pegar empréstimo para especular), mas sim **operacional**: usar processos, inteligência artificial, delegação e canais digitais para multiplicar sua capacidade de entrega sem aumentar seu endividamento.`;
  }

  // 4. Credit, Loans & Financing (Crédito, empréstimo, financiamento, juros bancários)
  if (
    normQ.includes('credito') ||
    normQ.includes('emprestimo') ||
    normQ.includes('financiamento') ||
    normQ.includes('banco') ||
    normQ.includes('consignado') ||
    normQ.includes('cheque especial')
  ) {
    return `**Conselho dos 8 Mestres — Gestão de Crédito e Empréstimos:**
1. **A Anatomia do Juro Bancário (Ray Dalio):**
   - O spread bancário brasileiro está entre os mais altos do planeta. Tomar crédito pessoal, rotativo ou empréstimo sem garantia real é transferir compulsoriamente sua riqueza futura para os acionistas dos bancos.
   
2. **Dívida Boa vs. Dívida Tóxica (Buffett & Carnegie):**
   - **Dívida Tóxica (Reprove imediatamente):** Crédito para comprar bens de consumo, viagens, roupas, carros que depreciam ou cobrir buraco de despesas correntes. Destrói sua margem de segurança.
   - **Dívida Tolerável/Boa:** Financiamento imobiliário de longo prazo com taxa subsidiada abaixo da inflação + juros reais, ou capital de giro em negócio com margem líquida comprovada 3x maior que o custo da dívida.

3. **A Regra de Ouro (Munger):**
   - Se você tem empréstimos em aberto, seu maior e mais rentável investimento é **quitá-los antecipadamente com desconto de amortização**, obtendo uma rentabilidade garantida e livre de imposto de renda igual ao CET da dívida.`;
  }

  // 5. Travel & Leisure (Viagem, férias, viajar, lazer, entretenimento, passeios)
  if (
    normQ.includes('viag') ||
    normQ.includes('viajar') ||
    normQ.includes('ferias') ||
    normQ.includes('lazer') ||
    normQ.includes('passeio') ||
    normQ.includes('descanso') ||
    normQ.includes('restaurante') ||
    normQ.includes('curtir')
  ) {
    return `**Conselho dos 8 Mestres — Viagens e Lazer Sem Culpa e Sem Dívidas:**
1. **O Verdadeiro Papel do Dinheiro (Morgan Housel):**
   - O objetivo final do dinheiro não é acumular moedas em uma tumba, mas comprar liberdade de tempo e construir memórias inesquecíveis com as pessoas que importam. Lazer e viagens são combustíveis indispensáveis para a criatividade e produtividade.

2. **A Armadilha das 12 Parcelas (Ray Dalio & Carnegie):**
   - O maior erro financeiro do lazer é viajar parcelando em 12 vezes no cartão. Quando você volta de férias, o bronzeado some em 2 semanas, mas o boleto continua consumindo sua renda pelos próximos 350 dias, impedindo você de guardar dinheiro para a próxima viagem.

3. **O Sistema do Fundo Carimbado (Munger & Dalio):**
   - Trate o lazer como um centro de custo planejado: com seu saldo mensal atual de **${formatBRL(balance)}**, destine de 10% a 15% (cerca de R$ 600 a R$ 900/mês) para uma conta separada de "Lazer e Viagens".
   - **Regra dos Mestres:** Só embarque quando a viagem estiver **100% paga à vista com antecedência**. Você desfrutará o dobro, sem ansiedade de extrato.`;
  }

  // 6. Education, Studies & Self-Investment (Estudos, cursos, faculdade, pos-graduacao, livros, certificacao)
  if (
    normQ.includes('estudo') ||
    normQ.includes('curso') ||
    normQ.includes('faculdade') ||
    normQ.includes('pos') ||
    normQ.includes('mba') ||
    normQ.includes('livro') ||
    normQ.includes('certificacao') ||
    normQ.includes('aprender') ||
    normQ.includes('capacitacao')
  ) {
    return `**Conselho dos 8 Mestres — Investimento em Educação e Habilidades:**
1. **O Ativo de Maior Retorno do Planeta (Warren Buffett):**
   - *"De longe, o melhor investimento que você pode fazer é em você mesmo. Ninguém pode taxar seu cérebro, ninguém pode confiscar o que você aprendeu e a inflação não pode corroer suas habilidades."*
   - O retorno sobre uma habilidade prática de alta demanda supera qualquer ação da bolsa de valores ou título de renda fixa.

2. **Cuidado com Diplomas Decorativos vs. Habilidades Raras (Naval & Thiel):**
   - Fuja da armadilha de gastar dezenas de milhares de reais em títulos acadêmicos formais que apenas ensinam teorias obsoletas.
   - Invista pesadamente em habilidades de alta alavancagem: **Programação/IA, Vendas/Negociação, Gestão Financeira, Copywriting e Liderança**. Aprenda a construir ou aprenda a vender; se souber os dois, você será imparável.

3. **Métrica de Decisão (Alex Hormozi):**
   - Antes de comprar um curso ou mentoria, faça o cálculo de ROI: *"Esse conhecimento tem o potencial de aumentar minha renda ou economizar meus custos em pelo menos 5x o valor do treinamento no próximo ano?"* Se sim, invista sem hesitar usando parte do seu excedente mensal de ${formatBRL(balance)}.`;
  }

  // 7. Where am I spending the most? (Gastos por categoria / maiores despesas)
  if (
    normQ.includes('onde') ||
    normQ.includes('gastando mais') ||
    normQ.includes('gasto mais') ||
    normQ.includes('maiores gastos') ||
    normQ.includes('maior gasto') ||
    normQ.includes('maior despesa') ||
    normQ.includes('onde gasto') ||
    normQ.includes('onde foi') ||
    normQ.includes('categorias') ||
    normQ.includes('quem consome') ||
    normQ.includes('despesas')
  ) {
    if (topCategories.length > 0) {
      const top3 = topCategories.slice(0, 3);
      const catListStr = top3
        .map(
          (c: any, idx: number) =>
            `${idx + 1}. **${c.category} (${c.percentage || 0}% das saídas):** ${formatBRL(Number(c.amount || 0))}`
        )
        .join('\n');

      const biggest = top3[0];

      return `**Conselho dos 8 Mestres — Auditoria dos Maiores Gastos:**
Analisando suas transações do mês (${context.selectedMonth || 'atual'}), identificamos os principais pontos de saída do seu capital:
${catListStr}

1. **A Máquina Orçamentária (Dalio):** Seu maior centro de despesa é **${biggest.category}**, consumindo ${formatBRL(Number(biggest.amount || 0))} (${biggest.percentage}% do total). Audite se todos esses custos são verdadeiramente essenciais ou se há vazamentos silenciosos.
2. **Princípio 80/20 de Alavancagem (Hormozi):** 80% do resultado do seu orçamento vem de controlar os 20% maiores desembolsos. Renegocie tarifas, busque alternativas ou adote limites semanais claros para essas categorias líderes.
3. **Margem de Segurança (Buffett & Munger):** Seu saldo livre no período é de ${formatBRL(balance)}. Mantenha o teto rigoroso para garantir que as saídas nunca ultrapassem a taxa sustentável de caixa.`;
    }

    return `**Conselho dos 8 Mestres — Auditoria dos Gastos:**
Analisando seu cenário atual (Despesas Totais: ${formatBRL(totalExpense)}, Receitas: ${formatBRL(totalIncome)}, Saldo Líquido: ${formatBRL(balance)}):
1. **Sistemas Fechados (Dalio):** Monitore seus três grandes blocos de despesas (Moradia, Transporte e Alimentação), pois costumam representar mais de 70% de todo desembolso pessoal.
2. **Psicologia dos Gastos (Housel):** A verdadeira riqueza é o que você retém e investe, não o que você consome para validação externa.
3. **Ação Imediata (Carnegie):** Cadastre e audite cada transação individual na aba de Lançamentos para que o Conselho aponte a linha exata do maior vazamento de caixa.`;
  }

  // 2. Debts and Financing (Dívidas, 15 mil, juros, quitação, método avalanche)
  if (
    normQ.includes('divid') ||
    normQ.includes('dividade') ||
    normQ.includes('devendo') ||
    normQ.includes('emprestimo') ||
    normQ.includes('financiamento') ||
    normQ.includes('cartao') ||
    normQ.includes('juros') ||
    normQ.includes('quitar') ||
    normQ.includes('pagar divida') ||
    normQ.includes('passivo')
  ) {
    // Extract debt amount from text if present (e.g. 15 mil, 15000, 15.000, 15k)
    let debtAmount = 0;
    const match = normQ.match(/(?:r\$\s*)?(\d+(?:[.,]\d+)?)\s*(mil|k)?/i);
    if (match) {
      let val = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      if (match[2] && (match[2].toLowerCase() === 'mil' || match[2].toLowerCase() === 'k')) {
        val *= 1000;
      } else if (val < 100 && normQ.includes('mil')) {
        val *= 1000;
      }
      debtAmount = val;
    }
    if (debtAmount === 0 && (normQ.includes('15 mil') || normQ.includes('15mil') || normQ.includes('quinze mil'))) {
      debtAmount = 15000;
    }

    const hasAmount = debtAmount > 0;
    const debtStr = hasAmount ? formatBRL(debtAmount) : 'suas dívidas';

    let payoffInsight = '';
    if (hasAmount && balance > 0) {
      const monthlyPace = balance * 0.75;
      const months = Math.max(1, Math.ceil(debtAmount / monthlyPace));
      payoffInsight = `Com o seu saldo líquido mensal atual de **${formatBRL(balance)}**, se você direcionar 75% deste excedente (${formatBRL(monthlyPace)}/mês) para amortização, você liquidará integralmente esses **${debtStr}** em aproximadamente **${months} ${months === 1 ? 'mês' : 'meses'}**, sem contrair novos empréstimos!`;
    } else if (hasAmount && balance <= 0) {
      payoffInsight = `Seu saldo líquido este mês está comprimido em ${formatBRL(balance)}. É mandatório congelar despesas discricionárias para abrir margem de fluxo antes de refinanciar passivos.`;
    } else {
      payoffInsight = `Seu saldo líquido atual é de ${formatBRL(balance)}, fornecendo capacidade direta para amortização agressiva de principal.`;
    }

    return `**Conselho dos 8 Mestres — Estratégia de Eliminação de Dívidas (${debtStr}):**
${payoffInsight}

1. **Inversão Racional (Munger & Buffett):** Pagar juros altos (cartão rotativo, cheque especial ou empréstimo com CET elevado) é uma rentabilidade líquida garantida e sem risco. Destrua juros compostos negativos imediatamente.
2. **Método Avalanche (Carnegie):** Liste todos os contratos por ordem decrescente de taxa de juros. Direcione 100% do excedente de caixa livre para abater a dívida mais cara primeiro, mantendo apenas as parcelas mínimas das demais.
3. **Margem de Segurança Intocável (Dalio):** Nunca desidrate completamente sua conta corrente para pagar dívidas sem preservar um colchão emergencial de sobrevivência de 1 mês, evitando recorrer a novos créditos emergenciais.`;
  }

  // 3. Cutting Expenses / Budget optimization (Cortar, reduzir, economizar, teto)
  if (
    normQ.includes('cortar') ||
    normQ.includes('reduzir') ||
    normQ.includes('economizar') ||
    normQ.includes('teto') ||
    normQ.includes('orcamento') ||
    normQ.includes('poupanca')
  ) {
    return `**Conselho dos 8 Mestres — Otimização de Gastos & Teto Orçamentário:**
1. **A Máquina Orçamentária (Dalio):** O segredo de um orçamento inabalável não é cortar pequenos cafezinhos, mas blindar os três pilares que consomem a renda: Moradia, Transporte e Alimentação recorrente.
2. **Psicologia do Dinheiro (Housel):** Gastar para demonstrar status a quem você não conhece é trocar sua liberdade de tempo por validação alheia. A verdadeira riqueza é o capital acumulado invisível.
3. **Diagnóstico do Período:** ${
      isExceeded
        ? `Seu teto de gastos está ultrapassado em ${formatBRL(excessAmount)}. Congele desembolsos discricionários (lazer e compras supérfluas) nos próximos 15 dias para restabelecer o equilíbrio.`
        : `Você está operando rigorosamente dentro do teto orçamentário. Converta essa folga de ${formatBRL(balance)} em aumento sistemático da sua taxa de poupança mensal.`
    }`;
  }

  // 4. Emergency Fund / Liquidity (Reserva, emergência, runway, segurança)
  if (
    normQ.includes('reserva') ||
    normQ.includes('emergencia') ||
    normQ.includes('seguranca') ||
    normQ.includes('runway') ||
    normQ.includes('liquidez')
  ) {
    const runway3m = totalExpense * 3;
    const runway6m = totalExpense * 6;

    return `**Conselho dos 8 Mestres — Construção de Reserva e Liquidez:**
Com base no seu custo de vida mensal atual (${formatBRL(totalExpense)}/mês):
- **Reserva Mínima (3 meses):** ${formatBRL(runway3m)}
- **Reserva Recomendada (6 meses):** ${formatBRL(runway6m)}

1. **Margem de Segurança (Buffett):** A reserva não tem o papel de gerar rentabilidade recorde, mas sim de garantir autonomia emocional para você nunca ser forçado a vender ativos sob pânico ou aceitar acordos desfavoráveis.
2. **Alocação Racional (Dalio & Munger):** Mantenha esse colchão estritamente em ativos pós-fixados de liquidez diária D+0 ou D+1 (como Tesouro Selic ou CDB com liquidez imediata emitido por instituições sólidas).
3. **Pague-se Primeiro (Carnegie):** Ao receber qualquer receita, transfira automaticamente de 15% a 20% para a conta da reserva antes de pagar qualquer boleto de consumo.`;
  }

  // 5. Investments & Compounding (Investir, ações, FII, CDB, Bolsa)
  if (
    normQ.includes('invest') ||
    normQ.includes('acoes') ||
    normQ.includes('fii') ||
    normQ.includes('renda fixa') ||
    normQ.includes('cdb') ||
    normQ.includes('bolsa') ||
    normQ.includes('patrimonio')
  ) {
    return `**Conselho dos 8 Mestres — Alocação e Multiplicação de Ativos:**
1. **Círculo de Competência (Buffett & Munger):** Só aplique capital naquilo que você compreende com perfeição. Se você não consegue explicar como uma empresa gera caixa livre em duas frases, você não está investindo, está especulando.
2. **Hierarquia Racional de Capital:**
   - 1º Estanque passivos com juros caros (avalanche).
   - 2º Forme sua reserva tática de liquidez de 3 a 6 meses.
   - 3º Alocação diversificada e perene em ativos produtivos reais (empresas sólidas e renda fixa indexada à inflação).
3. **O Fator Tempo (Housel):** O maior poder de Warren Buffett não é ter os melhores anos especulativos, mas sim estar investido ininterruptamente há mais de sete décadas. Deixe os juros compostos trabalharem.`;
  }

  // 6. Revenue generation & Scaling (Aumentar renda, renda extra, faturamento, negócios)
  if (
    normQ.includes('aumentar') ||
    normQ.includes('ganhar mais') ||
    normQ.includes('renda extra') ||
    normQ.includes('faturamento') ||
    normQ.includes('vendas') ||
    normQ.includes('negocio') ||
    normQ.includes('escalar') ||
    normQ.includes('trabalho')
  ) {
    return `**Conselho dos 8 Mestres — Alavancagem de Renda & Escala:**
1. **Alavancagem Sem Permissão (Naval):** Trocar tempo linear por horas de trabalho tem teto físico. Para criar patrimônio exponencial, você precisa alavancar código, mídia, conteúdo, audiência e produtos que trabalham enquanto você dorme.
2. **Ofertas Irrecusáveis (Hormozi):** Em vez de concorrer por preço, empacote soluções com valor percebido alto, garantias inquestionáveis e margem líquida acima de 60%.
3. **Diferenciação Radical (Thiel):** Vá de zero a um. O monopólio pessoal em um nicho de alta demanda gera infinitamente mais lucro do que disputar migalhas em mercados saturados.`;
  }

  // Default custom answer with user's live financial numbers
  return `**Conselho Estratégico Unificado dos 8 Mestres:**
Avaliando sua pergunta "${question}" sob o prisma dos seus dados reais atuais (Receitas: ${formatBRL(totalIncome)}, Despesas: ${formatBRL(totalExpense)}, Saldo Líquido: ${formatBRL(balance)}):
1. **Regra Número 1 (Buffett & Munger):** Nunca perca dinheiro. Regra número 2: nunca esqueça a regra número 1. Qualquer decisão sobre essa dúvida deve resguardar sua margem de segurança.
2. **Sistemas e Realimentação (Dalio):** Trate suas finanças como uma máquina de engenharia previsível. Se uma nova ação reduzir sua taxa de poupança mensal abaixo de 20%, reconsidere imediatamente.
3. **Foco em Alta Alavancagem (Naval & Hormozi):** Dedique sua energia ao que gera 80% do retorno com menor atrito — maximizar o fluxo de caixa livre mensal e aportá-lo em ativos de valor.`;
}

// Interactive Advisor Chat Endpoint: Ask the 8 Masters any strategic question
app.post('/api/advisor/ask', async (req, res) => {
  const { question = '', context = {} } = req.body || {};

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Pergunta obrigatória.' });
  }

  const balance = Number(context.balance || 0);
  const totalIncome = Number(context.totalIncome || 0);
  const totalExpense = Number(context.totalExpense || 0);
  const excessAmount = Number(context.excessAmount || 0);
  const topCategories = Array.isArray(context.topCategories) ? context.topCategories : [];
  const topExpenses = Array.isArray(context.topExpenses) ? context.topExpenses : [];

  const categoriesText =
    topCategories.length > 0
      ? topCategories
          .slice(0, 6)
          .map((c: any) => `- ${c.category}: ${formatBRL(Number(c.amount || 0))} (${c.percentage || 0}% do total de despesas)`)
          .join('\n')
      : 'Nenhuma categoria registrada especificamente neste período.';

  const expensesText =
    topExpenses.length > 0
      ? topExpenses
          .slice(0, 5)
          .map((e: any) => `- ${e.description}: ${formatBRL(Number(e.amount || 0))} [${e.category}]`)
          .join('\n')
      : 'Nenhum gasto individual listado.';

  const prompt = `Pergunta do Usuário:
"${question}"

Dados Financeiros Reais do Usuário (Período: ${context.selectedMonth || 'atual'}):
- Total de Receitas (Entradas): ${formatBRL(totalIncome)}
- Total de Despesas (Saídas): ${formatBRL(totalExpense)}
- Saldo Líquido do Mês: ${formatBRL(balance)}
- Situação do Teto de Gastos: ${context.isExceeded ? `Ultrapassado em ${formatBRL(excessAmount)}` : 'Dentro do limite previsto'}

Detalhamento dos Maiores Gastos do Usuário no Período:
${categoriesText}

Principais Lançamentos de Saída:
${expensesText}

Diretrizes Estritas de Resposta:
1. Responda especificamente ao que o usuário perguntou.
   - Se ele perguntou "onde estou gastando mais", liste as categorias reais de maiores gastos dele com os valores e porcentagens exatas mostradas acima, e dê conselhos práticos dos mestres para reduzi-los.
   - Se ele perguntou sobre dívidas (ex: "estou com uma dívida de 15 mil reais"), calcule exatamente em quantos meses ele consegue quitá-la usando seu saldo líquido de ${formatBRL(balance)} e o Método Avalanche.
   - Se ele perguntou sobre reserva, teto, investimentos ou negócios, baseie sua resposta nos números reais dele.
2. Atue como o Conselho Estratégico Unificado dos 8 Mestres (Warren Buffett, Charlie Munger, Ray Dalio, Naval Ravikant, Morgan Housel, Alex Hormozi, Peter Thiel, Andrew Carnegie).
3. Cite os nomes dos mestres e princípios associados a cada recomendação.
4. Formate sempre valores monetários no padrão monetário brasileiro (ex: R$ 8.215,64). Use títulos e numeração estruturada.`;

  try {
    const ai = getGemini();
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash'
    ];

    for (const modelName of candidateModels) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout na resposta do modelo')), 6000)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
              temperature: 0.7
            }
          }),
          timeoutPromise
        ]);

        const answer = response.text?.trim();
        if (answer) {
          return res.json({ answer, modelUsed: modelName });
        }
      } catch (modelErr: any) {
        // Continue to next candidate model if available
      }
    }
  } catch (_initErr: any) {
    // Silent fallback to dynamic heuristic generator
  }

  // Fallback to our dynamic, context-aware heuristic advisor
  const heuristicAnswer = generateHeuristicAdvisorAnswer(question, context);
  return res.json({
    answer: heuristicAnswer,
    fallbackUsed: true
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
