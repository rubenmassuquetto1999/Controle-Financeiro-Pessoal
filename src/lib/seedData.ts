import { Category, Transaction } from '../types';

export const SEED_CATEGORIES: Omit<Category, 'id'>[] = [
  // Entradas
  { name: 'Salário', parent_category: 'Entradas', type: 'income', budget_group: 'receita' },
  { name: 'Pró-labore', parent_category: 'Entradas', type: 'income', budget_group: 'receita' },
  { name: 'Aluguéis', parent_category: 'Entradas', type: 'income', budget_group: 'receita' },
  { name: 'Dividendos', parent_category: 'Entradas', type: 'income', budget_group: 'receita' },
  { name: 'Outras rendas', parent_category: 'Entradas', type: 'income', budget_group: 'receita' },

  // Saídas Essenciais
  { name: 'Aluguel', parent_category: 'Saídas Essenciais', type: 'expense', budget_group: 'essencial' },
  { name: 'Internet', parent_category: 'Saídas Essenciais', type: 'expense', budget_group: 'essencial' },
  { name: 'Luz', parent_category: 'Saídas Essenciais', type: 'expense', budget_group: 'essencial' },
  { name: 'Telefone', parent_category: 'Saídas Essenciais', type: 'expense', budget_group: 'essencial' },
  { name: 'Supermercado/Alimentação', parent_category: 'Saídas Essenciais', type: 'expense', budget_group: 'essencial' },
  { name: 'Farmácia', parent_category: 'Saídas Essenciais', type: 'expense', budget_group: 'essencial' },
  { name: 'Transporte (Uber, Ônibus, Combustível)', parent_category: 'Saídas Essenciais', type: 'expense', budget_group: 'essencial' },

  // Saídas Investimentos
  { name: 'Renda Fixa', parent_category: 'Saídas Investimentos', type: 'expense', budget_group: 'investimento' },
  { name: 'Ações', parent_category: 'Saídas Investimentos', type: 'expense', budget_group: 'investimento' },
  { name: 'FIIs', parent_category: 'Saídas Investimentos', type: 'expense', budget_group: 'investimento' },
  { name: 'Cripto', parent_category: 'Saídas Investimentos', type: 'expense', budget_group: 'investimento' },

  // Saídas Educação
  { name: 'Cursos', parent_category: 'Saídas Educação', type: 'expense', budget_group: 'educacao' },
  { name: 'Concurso', parent_category: 'Saídas Educação', type: 'expense', budget_group: 'educacao' },

  // Saídas Lazer
  { name: 'Netflix', parent_category: 'Saídas Lazer', type: 'expense', budget_group: 'lazer' },
  { name: 'YouTube', parent_category: 'Saídas Lazer', type: 'expense', budget_group: 'lazer' },
  { name: 'Disney', parent_category: 'Saídas Lazer', type: 'expense', budget_group: 'lazer' },
  { name: 'Viagem', parent_category: 'Saídas Lazer', type: 'expense', budget_group: 'lazer' },

  // Saídas Adicionais
  { name: 'Doações', parent_category: 'Saídas Adicionais', type: 'expense', budget_group: 'adicional' },
  { name: 'Assinaturas (Canva, CapCut)', parent_category: 'Saídas Adicionais', type: 'expense', budget_group: 'adicional' },
  { name: 'Vestuário', parent_category: 'Saídas Adicionais', type: 'expense', budget_group: 'adicional' },
  { name: 'IPTU', parent_category: 'Saídas Adicionais', type: 'expense', budget_group: 'adicional' },
];

export const COMMON_LOCAL_SUGGESTIONS = [
  'Mercado Vem que Tem',
  'Supermercado Pão de Açúcar',
  'Carrefour Hipermercado',
  'Netflix Brasil',
  'Uber Viagens',
  'YouTube Premium',
  'Disney Plus',
  'Copel Energia',
  'Enel Distribuição',
  'Claro Fibra Internet',
  'Vivo Fibra',
  'Farmácia Droga Raia',
  'Farmácias Panvel',
  'Posto Ipiranga Combustíveis',
  'Posto Shell',
  'Canva Pro Assinatura',
  'CapCut Pro',
  'Udemy Cursos Online',
  'Hotmart Treinamentos',
  'Corretora XP - Tesouro Selic',
  'Binance Criptoativos',
  'Zara Vestuário',
  'Prefeitura Municipal (IPTU)',
  'Empresa Empregadora SA (Salário)'
];

export const INITIAL_DEMO_TRANSACTIONS: Omit<Transaction, 'id'>[] = [];

