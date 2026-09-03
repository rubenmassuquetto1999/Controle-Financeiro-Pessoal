# 💰 Controle Financeiro com IA (Gemini + Firebase)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-orange.svg)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_API-blueviolet.svg)](https://aistudio.google.com/)

Um sistema moderno, rápido e seguro para controle financeiro pessoal, integrando **inteligência artificial (Google Gemini)** para leitura e classificação automática de despesas e receitas, com armazenamento em tempo real no **Firebase Firestore** e arquitetura de segurança reforçada de ponta a ponta.

---

## ✨ Funcionalidades Principais

- 🤖 **Classificação Automática por IA**:
  - Digite descrições em linguagem natural (ex: *"Comprei ferramentas no GoBoox Drop por 120 no crédito"* ou *"Salário líquido da empresa 4500"*).
  - O modelo Google Gemini extrai automaticamente: **Valor**, **Data**, **Tipo** (*Despesa* ou *Receita*), **Forma de Pagamento**, **Estabelecimento/Local**, **Grupo de Orçamento** e **Categoria**.

- 🎯 **Grupos de Orçamento Estruturados**:
  - Organização financeira completa em 6 grupos essenciais:
    - 🏠 **Essencial**: Moradia, alimentação, água, luz, internet, farmácia, transporte.
    - 📈 **Investimento**: Aportes, renda fixa, ações, FIIs, reserva de emergência.
    - 📚 **Educação**: Cursos, livros, treinamentos, faculdade, concursos.
    - ✈️ **Lazer**: Restaurantes, viagens, cinema, passeios, streaming.
    - 🛍️ **Adicional**: Revenda/comércio, vestuário, assinaturas extras, imprevistos.
    - 💰 **Receita**: Salário, pró-labore, vendas online, rendas passivas.

- 🧠 **Memória de Locais & Aprendizado Contínuo**:
  - O sistema memoriza e salva estabelecimentos frequentes.
  - Ao cadastrar ou editar um local, você pode fixar a categoria e grupo padrão para que lançamentos futuros venham prontos automaticamente.

- 📊 **Metas e Orçamento Mensal**:
  - Definição de teto orçamentário para cada grupo a cada mês.
  - Barras visuais de progresso e alertas de consumo de orçamento em tempo real.

- 📈 **Dashboard & Indicadores Financeiros**:
  - Gráficos analíticos de despesas por categoria e grupo.
  - Evolução de fluxo de caixa (Entradas vs. Saídas).
  - Histórico de transações com busca, paginação, filtros de data e exportação em formato **CSV**.

- ✏️ **Edição Completa & Personalizada**:
  - Modal de edição de transações com seletor interativo em 1 clique para todos os 6 grupos de orçamento.
  - Atalhos dinâmicos com sugestões de categorias de acordo com o grupo escolhido.

---

## 🔒 Protocolos de Segurança Implementados

Para disponibilizar este projeto com segurança no GitHub e em ambientes de produção, foram adotados rígidos padrões de proteção:

1. **Isolamento de Chaves de API (Zero Client-Side Secrets)**:
   - A chave da **Gemini API (`GEMINI_API_KEY`)** é consumida **exclusivamente pelo backend Node/Express (`server.ts`)**.
   - O frontend nunca tem acesso nem expõe a chave da IA em bundles ou requisições do navegador.

2. **Autenticação Restrita (Whitelist de E-mail)**:
   - Login seguro integrado com o **Google Authentication**.
   - Apenas o e-mail do proprietário definido em `AUTHORIZED_EMAIL` / `VITE_AUTHORIZED_EMAIL` tem permissão para visualizar e gerenciar os dados da aplicação.

3. **Regras de Segurança Granulares no Firestore (`firestore.rules`)**:
   - Bloqueio padrão para todas as coleções (`allow read, write: if false;`).
   - Permissão concedida apenas para requisições autenticadas cujo token JWT corresponda ao e-mail do proprietário autorizado.
   - Validação de formato e tamanho de IDs de documentos para prevenir injeções.

4. **Vínculo de Dispositivo e Restrição por IP (`ip-security`)**:
   - Mecanismo integrado no backend que permite amarrar a execução da aplicação exclusivamente ao IP da sua máquina/rede autorizada.
   - Bloqueia chamadas para endpoints sensíveis caso a requisição venha de um IP não autorizado.

5. **Proteção de Arquivos Sensíveis (`.gitignore`)**:
   - Todos os arquivos `.env`, `.env.local`, logs e estados locais de segurança (`ip-security.json`) estão rigorosamente ignorados no versionamento Git.
   - É disponibilizado um modelo seguro `.env.example` e `firebase-applet-config.example.json`.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Gerenciador de pacotes `npm` (ou `yarn` / `bun`)
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

Copie o arquivo de exemplo para criar seu `.env`:

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

# Vínculo opcional de IP (deixe vazio para vincular via painel)
AUTHORIZED_CLIENT_IP=
```

---

### Passo 4: Configurar o Firebase

1. No [Firebase Console](https://console.firebase.google.com/), crie um projeto.
2. Ative o **Firebase Authentication** com o provedor **Google**.
3. Ative o **Cloud Firestore** em modo de produção.
4. Registre uma aplicação Web no Firebase e copie as credenciais.
5. Crie o arquivo `firebase-applet-config.json` na raiz do projeto (utilize o modelo `firebase-applet-config.example.json`):

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
   Copie o conteúdo de `firestore.rules` e cole na aba **Regras (Rules)** do Firestore no Firebase Console, substituindo o e-mail pelo seu próprio e-mail cadastrado.

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
| `npm run build` | Compila os ativos do frontend com Vite e empacota o backend Node/Express com `esbuild` em `dist/server.cjs` |
| `npm start` | Executa a versão compilada de produção (`node dist/server.cjs`) |
| `npm run lint` | Executa a checagem de tipos estática do TypeScript (`tsc --noEmit`) |
| `npm run clean` | Limpa as pastas de build e distribuição |

---

## 📂 Estrutura de Pastas

```
├── .env.example                     # Modelo de variáveis de ambiente
├── .gitignore                       # Arquivos ignorados pelo Git (segurança)
├── firebase-applet-config.example.json # Modelo de configuração do Firebase
├── firestore.rules                  # Regras de segurança do Firestore
├── index.html                       # Entry-point HTML com metatags
├── package.json                     # Dependências e scripts de execução
├── server.ts                        # Servidor Express com proxy seguro da Gemini API e controle de IP
├── tsconfig.json                    # Configurações do compilador TypeScript
├── vite.config.ts                   # Configurações do Vite e Tailwind CSS
└── src/
    ├── App.tsx                      # Componente principal e rotas
    ├── main.tsx                     # Inicialização do React 19
    ├── index.css                    # Estilização global com Tailwind CSS
    ├── types.ts                     # Interfaces TypeScript (Transações, Grupos, Categorias)
    ├── components/
    │   ├── BudgetManager.tsx        # Painel de gestão de orçamentos mensais
    │   ├── EditTransactionModal.tsx # Modal de edição com seleção de 6 grupos e categorias
    │   ├── FinancialCharts.tsx      # Gráficos e relatórios financeiros
    │   ├── Header.tsx               # Barra superior com status de autenticação e IP
    │   ├── IpSecurityModal.tsx      # Modal de gestão de amarração de IP de máquina
    │   ├── SummaryCards.tsx         # Cards com saldos, receitas e despesas
    │   ├── TransactionForm.tsx      # Formulário de entrada com IA Gemini
    │   └── TransactionsTable.tsx    # Tabela com listagem, busca e exportação CSV
    └── lib/
        ├── firebase.ts              # Inicialização de Auth e Firestore com assinaturas em tempo real
        ├── seedData.ts              # Categorias padrão brasileiras e dados iniciais
        └── utils.ts                 # Formatadores de moeda (BRL), datas e utilitários
```

---

## 🛡️ Checklist para Publicar no GitHub

Antes de fazer o seu primeiro `git commit` e `git push`, confirme os seguintes itens:

- [x] O arquivo `.gitignore` inclui `.env`, `.env.*` e `ip-security.json`.
- [x] Nenhuma chave da API Gemini está escrita diretamente nos arquivos de código-fonte (`.ts`, `.tsx`, `.js`).
- [x] O arquivo `.env.example` contém apenas valores fictícios ou explicativos.
- [x] As credenciais de produção do Firebase estão protegidas pelas regras em `firestore.rules`.
- [x] O comando `npm run lint` executa sem erros de tipagem.
- [x] O comando `npm run build` compila com sucesso tanto o frontend quanto o backend.

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
