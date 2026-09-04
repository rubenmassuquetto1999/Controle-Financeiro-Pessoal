# 💰 Controle Financeiro com IA (Gemini + Firebase)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-orange.svg)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_API-blueviolet.svg)](https://aistudio.google.com/)
[![Google Cloud Run](https://img.shields.io/badge/Deploy-Google_Cloud_Run-4285F4.svg)](https://cloud.google.com/run)

Um sistema completo, rápido e seguro para controle financeiro pessoal, integrando **inteligência artificial (Google Gemini)** para leitura e categorização automática de despesas e receitas, armazenamento em tempo real no **Firebase Firestore**, e arquitetura com autenticação Google restrita ao proprietário.

🌐 **Ambiente de Produção Ativo**: [https://ruben-massuquetto-financeiro.ai.studio/](https://ruben-massuquetto-financeiro.ai.studio/)

---

## ✨ Funcionalidades Principais

- 💻 **Instalável como Aplicativo no Computador e Celular (PWA - Progressive Web App)**:
  - **Execução Nativa no Desktop**: Instalação direta pelo Google Chrome, Edge ou Brave no Windows, macOS ou Linux.
  - **Janela Dedicada e Atalho Próprio**: Abre em janela limpa independente sem barras de endereço ou abas do navegador, com ícone próprio na Área de Trabalho e no Menu Iniciar / Dock.
  - **Botão de Instalação no Header**: Botão `Instalar App` integrado com detecção de prontidão do navegador e assistente com passo a passo.
  - **Suporte Offline com Cache Seguro**: Carregamento instantâneo via service workers e aviso visual caso a conexão oscile.

- 📱 **Interface 100% Responsiva (Mobile, Tablet & Desktop)**:
  - **Design Bento Grid Adaptativo**: Layout fluido que se ajusta automaticamente a smartphones, tablets (retrato/paisagem) e monitores ultrawide.
  - **Navegação Móvel Otimizada**: Header responsivo com barra de navegação segmentada touch-friendly em telas menores e abas completas no desktop.
  - **Visualização em Cards para Dispositivos Móveis**: Transações apresentadas em cards elegantes com toque rápido, tags de grupo de orçamento e botões de ação ergonômicos (mínimo 44px) em telas `< md`.
  - **Dashboard de Métricas Compacto**: Grade 2x2 de indicadores em smartphones para visualização imediata de receitas, despesas, saldo e taxa de poupança sem necessidade de rolagem excessiva.
  - **Filtros e Controles Tácteis**: Seletores de mês, tipo e grupo reorganizados em grade inteligente para fácil uso com uma mão.

- 🤖 **Classificação Automática por IA (Google Gemini)**:
  - Digite transações em linguagem natural (ex: *"Comprei ferramentas no GoBoox Drop por 120 no crédito"* ou *"Salário líquido da empresa 4500"*).
  - O Gemini extrai automaticamente: **Valor**, **Data**, **Tipo** (*Despesa* ou *Receita*), **Forma de Pagamento**, **Estabelecimento/Local**, **Grupo de Orçamento** e **Categoria**.

- 🎯 **Grupos de Orçamento Estruturados**:
  - Organização financeira em 6 grupos essenciais:
    - 🏠 **Essencial**: Moradia, alimentação, água, luz, internet, farmácia, transporte.
    - 📈 **Investimento**: Aportes, renda fixa, ações, fundos imobiliários, reserva de emergência.
    - 📚 **Educação**: Cursos, livros, treinamentos, faculdade.
    - ✈️ **Lazer**: Restaurantes, viagens, cinema, passeios, streaming.
    - 🛍️ **Adicional**: Revenda/comércio, vestuário, assinaturas extras, imprevistos.
    - 💰 **Receita**: Salário, pró-labore, vendas online, rendas passivas.

- 🧠 **Memória de Locais & Aprendizado Contínuo**:
  - O sistema memoriza e salva estabelecimentos frequentes.
  - Ao cadastrar ou editar um local, é possível fixar a categoria e o grupo padrão para que lançamentos futuros sejam preenchidos automaticamente.

- 📊 **Metas e Orçamento Mensal**:
  - Definição de teto orçamentário para cada grupo a cada mês.
  - Barras visuais de progresso, percentuais de uso e alertas inteligentes de consumo em tempo real.

- 📈 **Dashboard & Indicadores em Tempo Real**:
  - Cards com Saldo Atual, Total de Receitas, Total de Despesas e Total de Investimentos.
  - Gráfico de pizza analítico de despesas por categoria e grupo orçamentário.
  - Ranking dos locais com maior volume de gastos.
  - Histórico de transações com busca textual, paginação, filtros por período e exportação para **CSV**.

- ✏️ **Edição Completa & Gestão de Categorias**:
  - Modal de edição de transações com seletor interativo em 1 clique para os 6 grupos de orçamento.
  - Atalhos dinâmicos com sugestões de categorias de acordo com o grupo escolhido.
  - Modal para gerenciamento e criação de categorias personalizadas.

---

## 🔒 Protocolos de Segurança Implementados

Para disponibilizar este projeto com segurança no GitHub e em ambientes de nuvem, foram adotados rígidos padrões de proteção:

1. **Isolamento Total da Chave da IA (Zero Client-Side Secrets)**:
   - A chave da **Gemini API (`GEMINI_API_KEY`)** é consumida **exclusivamente pelo backend Express (`server.ts`)**.
   - O frontend nunca tem acesso e nunca expõe a chave da IA em bundles ou requisições do navegador.

2. **Autenticação com Whitelist de E-mail (Google OAuth)**:
   - Login seguro integrado ao **Firebase Auth via Google**.
   - Apenas o e-mail do proprietário autorizado (`AUTHORIZED_EMAIL` / `VITE_AUTHORIZED_EMAIL`) tem permissão para visualizar e interagir com os dados.
   - Contas Google não autorizadas são bloqueadas imediatamente na camada de apresentação (`AuthGate.tsx`).

3. **Bloqueio de Abas Anônimas (Anti-Incognito)**:
   - Detecção ativa de navegação anônima no navegador via `detectIncognito()`.
   - Bloqueia o carregamento dos dados caso o usuário tente abrir a aplicação em uma aba anônima, garantindo acesso exclusivo pelo perfil oficial do navegador.

4. **Regras Granulares no Firestore (`firestore.rules`)**:
   - Bloqueio padrão para todas as coleções (`allow read, write: if false;`).
   - Permissão de leitura e escrita concedida estritamente a requisições com token JWT autenticado do e-mail do proprietário.
   - Validação de formato e tamanho de IDs de documentos para prevenir manipulações indevidas.

5. **Proteção de Arquivos Sensíveis (`.gitignore`)**:
   - Todos os arquivos `.env`, `.env.local` e credenciais estão rigorosamente ignorados no versionamento Git.
   - É disponibilizado um modelo documentado `.env.example` e `firebase-applet-config.example.json`.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior — recomendada v20+)
- Gerenciador de pacotes `npm`
- Chave de API do Google Gemini (gratuita no [Google AI Studio](https://aistudio.google.com/))
- Projeto criado no [Firebase Console](https://console.firebase.google.com/)

---

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/SEU_USUARIO/controle-financeiro-ia.git
cd controle-financeiro-ia
```

### Passo 2: Instalar as Dependências

```bash
npm install
```

---

### Passo 3: Configurar as Variáveis de Ambiente

Copie o arquivo de exemplo para criar o seu `.env`:

```bash
cp .env.example .env
```

Abra o arquivo `.env` e preencha suas variáveis:

```env
# Chave da API Gemini (Google AI Studio)
GEMINI_API_KEY="AIzaSy..."

# URL da aplicação em desenvolvimento
APP_URL="http://localhost:3000"

# E-mail do proprietário que terá acesso exclusivo
AUTHORIZED_EMAIL="seu_email@gmail.com"
VITE_AUTHORIZED_EMAIL="seu_email@gmail.com"
```

---

### Passo 4: Configurar o Firebase

1. No [Firebase Console](https://console.firebase.google.com/), crie um novo projeto.
2. Ative o **Firebase Authentication** com o provedor **Google**.
3. Ative o **Cloud Firestore** em modo de produção.
4. Registre uma aplicação Web no Firebase e copie as credenciais.
5. Crie o arquivo `firebase-applet-config.json` na raiz do projeto (use como base o `firebase-applet-config.example.json`):

```json
{
  "projectId": "seu-projeto-firebase",
  "appId": "1:000000000000:web:abcdef123456",
  "apiKey": "AIzaSy...",
  "authDomain": "seu-projeto-firebase.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "seu-projeto-firebase.firebasestorage.app",
  "messagingSenderId": "000000000000",
  "measurementId": "",
  "oAuthClientId": "000000000000-xxxx.apps.googleusercontent.com",
  "recaptchaSiteKey": ""
}
```

6. **Regras de Segurança do Firestore**:
   Copie o conteúdo de `firestore.rules` e publique na aba **Regras (Rules)** do Firestore no Firebase Console, substituindo o e-mail pelo seu próprio e-mail configurado.

---

### Passo 5: Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse no seu navegador: **`http://localhost:3000`**

---

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor Express com o middleware Vite em tempo real na porta 3000 |
| `npm run build` | Compila o frontend com Vite e empacota o backend Node/Express com `esbuild` em `dist/server.cjs` |
| `npm start` | Inicia a aplicação em modo de produção (`node dist/server.cjs`) |
| `npm run lint` | Executa a validação de tipagem estática com TypeScript (`tsc --noEmit`) |
| `npm run clean` | Limpa a pasta de build (`dist/`) |

---

## 📂 Estrutura do Projeto

```
├── .env.example                        # Modelo de variáveis de ambiente
├── .gitignore                          # Arquivos ignorados pelo Git (segurança)
├── firebase-applet-config.example.json # Modelo de configuração pública do Firebase
├── firestore.rules                     # Regras de segurança granulares do Firestore
├── index.html                          # Entry-point HTML com metatags responsivas
├── package.json                        # Dependências e scripts de execução
├── server.ts                           # Servidor Express com proxy seguro da Gemini API
├── tsconfig.json                       # Configurações do compilador TypeScript
├── vite.config.ts                      # Configurações do Vite e Tailwind CSS
└── src/
    ├── App.tsx                         # Dashboard principal e controle de abas
    ├── main.tsx                        # Ponto de montagem do React 19
    ├── index.css                       # Estilização global com Tailwind CSS
    ├── types.ts                        # Interfaces TypeScript (Transações, Grupos, Categorias)
    ├── components/
    │   ├── AuthGate.tsx                # Barreira de segurança (Google Auth + Anti-Incognito)
    │   ├── BudgetAlertBanner.tsx       # Alertas de teto orçamentário por grupo
    │   ├── BudgetPieChart.tsx          # Gráfico de despesas por categoria/grupo
    │   ├── CategoriesModal.tsx         # Modal de cadastro e gestão de categorias
    │   ├── DashboardCards.tsx          # Cards de resumo financeiro (Receitas, Despesas, Saldo)
    │   ├── EditTransactionModal.tsx    # Edição com seletor de grupos e sugestões rápidas
    │   ├── Header.tsx                  # Barra superior com mês ativo e perfil do usuário
    │   ├── MonthlyBudgetView.tsx       # Visão detalhada de orçamento e metas mensais
    │   ├── TopLocalsBarChart.tsx       # Gráfico de estabelecimentos com maiores gastos
    │   ├── TransactionForm.tsx         # Formulário com entrada de texto livre processada por IA
    │   └── TransactionsTable.tsx       # Tabela com filtros, ordenação e exportação CSV
    └── lib/
        ├── firebase.ts                 # Conexão segura com Firebase Auth e Firestore
        ├── security.ts                 # Utilitários de proteção e detecção de aba anônima
        ├── seedData.ts                 # Categorias padrão brasileiras e valores iniciais
        └── utils.ts                    # Formatadores de moeda (BRL), datas e funções auxiliares
```

---

## 🛡️ Checklist para Publicar no GitHub

Antes de fazer o seu primeiro `git commit` e `git push`, confirme os seguintes itens:

- [x] O arquivo `.gitignore` inclui `.env`, `.env.*`, `.env.local` e `dist/`.
- [x] Nenhuma chave da API Gemini está exposta nos arquivos de código-fonte (`.ts`, `.tsx`, `.js`).
- [x] O arquivo `.env.example` contém apenas variáveis de modelo sem segredos reais.
- [x] As credenciais de produção do Firestore estão protegidas pelas regras em `firestore.rules`.
- [x] O comando `npm run lint` executa com sucesso sem erros de tipagem.
- [x] O comando `npm run build` compila o frontend e o backend sem avisos ou erros impeditivos.

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
