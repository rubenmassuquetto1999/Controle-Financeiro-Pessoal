# 💰 Controle Financeiro com IA (Gemini + Firebase)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-orange.svg)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_GenAI_SDK-blueviolet.svg)](https://aistudio.google.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-success.svg)](https://web.dev/progressive-web-apps/)

Um sistema completo, veloz e seguro para controle financeiro pessoal, integrando **inteligência artificial (Google Gemini via `@google/genai`)** para leitura e categorização automática de despesas e receitas, armazenamento em tempo real no **Firebase Firestore**, design responsivo de alta precisão otimizado para **iOS (iPhone) e Android**, e arquitetura com autenticação Google restrita ao proprietário.

🌐 **Ambiente de Produção Ativo**: [https://ruben-massuquetto-financeiro.ai.studio/](https://ruben-massuquetto-financeiro.ai.studio/)

---

## ✨ Funcionalidades Principais

- 🧠 **Conselheiro Estratégico Financeiro Pessoal (8 Mestres da Riqueza)**:
  - **Síntese Estratégica Unificada**: Combina os modelos mentais e princípios de **Warren Buffett**, **Charlie Munger**, **Ray Dalio**, **Naval Ravikant**, **Morgan Housel**, **Alex Hormozi**, **Peter Thiel** e **Andrew Carnegie**.
  - **Posicionamento de Destaque**: Localizado estrategicamente na tela de controle financeiro, **imediatamente acima da tabela de transações registradas**, permitindo auditar a saúde financeira antes de inspecionar os lançamentos.
  - **Cruzamento em Tempo Real**: Cruza automaticamente as transações reais do mês (receitas, despesas, saldo líquido, cumprimento do teto e despesas por grupo) com o plano mestre de multiplicação de patrimônio sustentável.
  - **Diagnóstico & KPIs Estratégicos**:
    - Score de saúde financeira (0 a 100) calibrado matematicamente com base nos dados do usuário.
    - 4 indicadores executivos: *Taxa de Poupança/Queima*, *Disciplina Orçamentária*, *Meta de Passivos e Dívidas* e *Runway & Liquidez de Emergência*.
    - Módulos direcionados de *Estratégia Avalanche* (eliminação de juros altos) e *Alavancagem de Renda & Escala*.
  - **Os 4 Pilares dos Mestres**:
    - 🛡️ *Inversão e Margem de Segurança* (Buffett & Munger): Proteção de caixa e prevenção de erros capitais.
    - ⚙️ *A Máquina Econômica e Gestão de Risco* (Dalio & Carnegie): Tratamento do orçamento como sistema de engenharia e busca por fluxos previsíveis de caixa.
    - ⚡ *Alavancagem de Margem e Escala* (Hormozi & Thiel): Foco em aumento de ticket médio, diferenciação e produtos/serviços de alto valor.
    - 🧘 *Alavancagem Sem Permissão e Psicologia* (Naval & Housel): Uso de tecnologia e disciplina mental para construir liberdade financeira duradoura.
  - **Plano de Ação 80/20 & Rota**: Ações prioritárias ranqueadas por urgência e impacto para os próximos 30 dias.
  - **Janela Interativa de Decisão ("Conselho dos 8 Mestres")**:
    - Modal imersivo e responsivo (`AdvisorChatModal.tsx`) para diálogo aprofundado com a banca de mentores.
    - Histórico sequencial de conversa mantido durante toda a sessão.
    - Sugestões estratégicas rápidas em 1 clique (avaliação de compras parceladas, investimentos, corte de custos supérfluos, runway e escala de renda).
    - Respostas formatadas em Markdown com diagnósticos diretos, perspectivas contrastadas por mestre e plano de execução prático.

- 📱 **Otimização Extrema para Mobile (iPhone / iOS & Android)**:
  - **Botão "Reavaliar" com Ergonomia Tátil**: Botão em largura total (`w-full`) e altura de toque expandida (`py-2.5`, `rounded-xl`) no mobile, seguindo o padrão ergonômico do banner de alertas.
  - **Alinhamento Ótico de Precisão**: Centralização vertical rigorosa entre o título do Conselheiro e o badge *8 Mestres da Riqueza*, com ocultação seletiva da lista de nomes em smartphones (`hidden sm:block`) para evitar poluição visual.
  - **Prevenção de Transbordamento em Formulários**: Inputs com `min-w-0` e botões de envio com `shrink-0` e `whitespace-nowrap`, garantindo que o botão "Perguntar" permaneça perfeitamente enquadrado em qualquer tamanho de tela.
  - **Formulário com Alturas Uniformes**: Campos de entrada (**Data**, **Tipo**, **Valor**, **Local** e **Descritivo**) padronizados com altura de 44px (`h-11`), em total conformidade com as diretrizes da Apple (*Human Interface Guidelines*).
  - **Prevenção de Zoom Indesejado no iOS**: Inputs configurados a 16px no mobile e normalizados com `-webkit-appearance: none` para impedir que o Safari aplique zoom automático ou distorça seletores de data.
  - **Banner de Orçamento Responsivo**: Mensagens de teto e porcentagens de consumo com quebra de linha inteligente e botões de ação com largura total no celular para evitar sobreposições.
  - **Gráfico de Pizza Interativo & Anti-Sobreposição**: Cartão de detalhes flutuante (tooltip) com fundo 100% opaco (`bg-[#121215]`), alta prioridade visual (`z-50`) e ocultação automática do valor central durante a inspeção de fatias para manter a legibilidade limpa.

- 💻 **Instalável como Aplicativo Nativo (PWA - Progressive Web App)**:
  - **Instalação no Computador e Celular**: Suporte a PWA com Service Worker (`vite-plugin-pwa`), ícones de alta resolução e manifesto web completo.
  - **Execução em Janela Dedicada**: Abre sem barras de navegação ou abas do navegador, funcionando com atalho próprio no Menu Iniciar / Dock ou na Tela de Início do smartphone.
  - **Modal de Instalação Guiada**: Instruções passo a passo contextualizadas para Chrome/Edge no Desktop, Safari no iOS (*Compartilhar > Adicionar à Tela de Início*) e Chrome no Android.
  - **Indicador de Conexão Offline**: Detecção em tempo real do status da rede com alertas visuais amigáveis caso a conexão oscile.

- 🤖 **Classificação Automática por IA (Google Gemini)**:
  - Entrada de transações em linguagem natural (ex: *"Almoço com a equipe no restaurante X 85 no pix"* ou *"Salário quinzenal 3200"*).
  - O Gemini identifica automaticamente: **Valor**, **Data**, **Tipo** (*Saída* ou *Entrada*), **Estabelecimento/Local**, **Grupo Orçamentário** e **Categoria**.

- 🎯 **Metodologia de 6 Grupos de Orçamento**:
  - Organização financeira balanceada:
    - 🏠 **Essencial**: Moradia, alimentação, contas fixas, transporte, saúde.
    - 📈 **Investimento**: Aportes, reserva de emergência, ações, fundos.
    - 📚 **Educação**: Livros, cursos presenciais/online, faculdade.
    - ✈️ **Lazer**: Viagens, restaurantes, passeios, streaming.
    - 🛍️ **Adicional**: Compras extras, vestuário, imprevistos.
    - 💰 **Receita**: Salários, rendas ativas e dividendos.

- 🧠 **Base de Dados de Locais com Inteligência**:
  - Reconhecimento automático e salvamento de estabelecimentos frequentes.
  - Suporte a marcação de estabelecimentos **Físicos** vs. **Online** com preenchimento preditivo.

- 📊 **Metas e Orçamento Mensal Hierárquico por Itens Rotineiros**:
  - **Lançamento de Itens Específicos por Grupo**: Permite cadastrar despesas e contas rotineiras diretamente em cada categoria (ex: em *Essencial*: Aluguel, Água, Luz, Internet, Supermercado; em *Investimento*: CDB, Tesouro, FIIs, Ações, Cripto; em *Lazer*: Restaurantes, Netflix/Streaming, Passeios).
  - **Soma Dinâmica nos Separadores**: Cada cabeçalho de grupo exibe automaticamente o valor total somado em tempo real ao lado da identificação da categoria (ex: `Lazer (Restaurantes, Viagens, Streaming) - Total: R$ 0,00`).
  - **Flexibilidade Total**: Opção de adicionar e remover qualquer item rotineiro com 1 clique, além de chips com sugestões rápidas de despesas frequentes.
  - **Acompanhamento no Painel**: Visualização dos itens planejados vinculada ao acompanhamento em tempo real de realizado vs. planejado.
  - **Regra 50-30-20 & Cópia Inteligente**: Atalho para aplicar distribuição percentual automática e botão para replicar toda a estrutura do mês anterior.

- 📈 **Painel de Métricas & Exportação**:
  - Indicadores de Saldo Atual, Receitas, Despesas e Investimentos.
  - Gráfico de pizza analítico com participação percentual de cada categoria.
  - Gráfico de ranking com os estabelecimentos de maior volume financeiro.
  - Histórico de transações com busca em tempo real, paginação, filtros por mês/ano e exportação para **CSV**.

- ✏️ **Edição Completa & Gestão de Categorias**:
  - Modal de edição de transações com seletor interativo em 1 clique para os 6 grupos.
  - Gerenciador de categorias customizadas e sugestões contextuais.

---

## 🔒 Protocolos de Segurança Implementados

1. **Isolamento Total da Chave da IA (Zero Client-Side Secrets)**:
   - A chave **`GEMINI_API_KEY`** é utilizada **exclusivamente no servidor Express (`server.ts`)** para todas as operações da IA: tanto para a categorização de transações (`/api/classify`) quanto para as auditorias estratégicas e chat do conselho (`/api/advisor/analyze` e `/api/advisor/ask`).
   - O frontend nunca expõe a chave da IA em requisições ou arquivos estáticos enviados ao navegador.

2. **Autenticação com Restrição de E-mail (Google OAuth)**:
   - Login seguro integrado via **Firebase Authentication**.
   - Apenas o e-mail autorizado (`AUTHORIZED_EMAIL` / `VITE_AUTHORIZED_EMAIL`) possui permissão para acessar os dados.
   - Contas não autorizadas são bloqueadas imediatamente pelo componente `AuthGate.tsx`.

3. **Bloqueio de Abas Anônimas (Anti-Incognito)**:
   - Verificação ativa via `detectIncognito()` para impedir o carregamento do aplicativo em janelas privadas.

4. **Regras Granulares no Firestore (`firestore.rules`)**:
   - Política restritiva de segurança: permissões de leitura e escrita concedidas unicamente a requisições autenticadas com o e-mail do proprietário.

5. **Proteção de Arquivos Sensíveis (`.gitignore`)**:
   - Arquivos `.env`, `.env.local` e credenciais privadas estão rigorosamente excluídos do controle de versão.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior — recomendada v20+)
- Gerenciador de pacotes `npm`
- Chave de API do Google Gemini ([Google AI Studio](https://aistudio.google.com/))
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

Preencha os valores no arquivo `.env`:

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

1. No [Firebase Console](https://console.firebase.google.com/), crie um projeto.
2. Ative o **Firebase Authentication** com provedor **Google**.
3. Ative o **Cloud Firestore** em modo de produção.
4. Crie o arquivo `firebase-applet-config.json` na raiz do projeto:

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

5. **Regras de Segurança do Firestore**:
   Publique as regras contidas em `firestore.rules` no Firestore Console.

---

### Passo 5: Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse no navegador: **`http://localhost:3000`**

---

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor Express com suporte a Vite em tempo real na porta 3000 |
| `npm run build` | Compila o frontend React/Vite e empacota o backend Node/Express com `esbuild` em `dist/server.cjs` |
| `npm start` | Inicia a aplicação compilada em modo de produção (`node dist/server.cjs`) |
| `npm run lint` | Valida a tipagem estática do TypeScript sem emitir arquivos (`tsc --noEmit`) |
| `npm run clean` | Remove artefatos de compilação da pasta `dist/` |

---

## 📂 Estrutura do Projeto

```
├── .env.example                        # Modelo de variáveis de ambiente
├── .gitignore                          # Arquivos ignorados pelo Git
├── firebase-applet-config.example.json # Modelo de configuração pública do Firebase
├── firestore.rules                     # Regras de segurança granulares do Firestore
├── index.html                          # Entry-point HTML com metatags responsivas e PWA
├── package.json                        # Dependências e scripts de execução
├── server.ts                           # Servidor Express com rotas protegidas (/api/classify, /api/advisor/*)
├── tsconfig.json                       # Configurações do compilador TypeScript
├── vite.config.ts                      # Configuração do Vite, Tailwind CSS e PWA
└── src/
    ├── App.tsx                         # Dashboard principal e navegação de abas
    ├── main.tsx                        # Ponto de montagem do React 19
    ├── index.css                       # Estilização global e normalizações mobile/WebKit
    ├── types.ts                        # Interfaces TypeScript (Transações, Grupos, Metas, Advisor)
    ├── components/
    │   ├── AdvisorChatModal.tsx        # Modal interativo de consulta ao Conselho dos 8 Mestres
    │   ├── AIStrategicAdvisorCard.tsx  # Card do Conselheiro Estratégico (8 Mestres, KPIs, 80/20, Chat)
    │   ├── AuthGate.tsx                # Barreira de segurança (Google Auth + Anti-Incognito)
    │   ├── BudgetAlertBanner.tsx       # Banner responsivo de acompanhamento de teto orçamentário
    │   ├── BudgetPieChart.tsx          # Gráfico de pizza com tooltip opaco e foco de fatias
    │   ├── CategoriesModal.tsx         # Modal de gerenciamento de categorias
    │   ├── DashboardCards.tsx          # Cards de resumo financeiro (Receitas, Despesas, Saldo)
    │   ├── EditTransactionModal.tsx    # Edição de transações com atalhos de grupo
    │   ├── Header.tsx                  # Barra superior com status PWA, mês ativo e perfil
    │   ├── MonthlyBudgetView.tsx       # Visão analítica de metas orçamentárias mensais
    │   ├── OfflineIndicator.tsx        # Alerta visual de status de rede offline/online
    │   ├── PWAInstallButton.tsx        # Botão integrado de instalação do PWA no cabeçalho
    │   ├── PWAInstallModal.tsx         # Modal com passo a passo de instalação no iOS/Android
    │   ├── TopLocalsBarChart.tsx       # Gráfico de estabelecimentos com maiores gastos
    │   ├── TransactionForm.tsx         # Formulário responsivo touch com IA do Gemini
    │   └── TransactionsTable.tsx       # Tabela com filtros, ordenação e exportação CSV
    └── lib/
        ├── firebase.ts                 # Inicialização do Firebase Auth e Firestore
        ├── security.ts                 # Utilitários de proteção e detecção de aba anônima
        ├── seedData.ts                 # Categorias padrão brasileiras e valores iniciais
        └── utils.ts                    # Formatadores de moeda (BRL), datas e funções auxiliares
```

---

## 🔌 Rotas da API Server-Side (`server.ts`)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Checagem de integridade do servidor Express |
| `POST` | `/api/classify` | Interpretação e categorização de despesas/receitas via Gemini em linguagem natural |
| `POST` | `/api/advisor/analyze` | Diagnóstico estratégico completo cruzando transações reais do mês com os 8 Mestres |
| `POST` | `/api/advisor/ask` | Consultoria interativa em tempo real com os 8 Mestres para dúvidas financeiras e simulações |

---

## 🛡️ Checklist para Publicar no GitHub

- [x] O arquivo `.gitignore` inclui `.env`, `.env.*`, `.env.local` e `dist/`.
- [x] Nenhuma chave da API Gemini está exposta no bundle do cliente.
- [x] O arquivo `.env.example` contém apenas variáveis de modelo sem segredos.
- [x] O banco de dados do Firestore está protegido com regras de proprietário.
- [x] O comando `npm run lint` passa sem erros de tipagem.
- [x] O comando `npm run build` compila o frontend e o backend perfeitamente.

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
