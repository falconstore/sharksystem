# FreePro System - Sistema de Controle de Clientes

Sistema modular de gerenciamento de clientes e procedimentos com Firebase Firestore em tempo real.

## 🚀 Características

- **Dashboard Interativo**: Visão geral do sistema com cards informativos
- **Controle de Clientes**: Gestão completa de assinaturas e clientes
- **Controle de Procedimentos**: Organização de procedimentos com status e valores
- **Tema Dark/Light**: Alternância entre temas claro e escuro
- **Firebase Realtime**: Sincronização em tempo real com Firestore
- **100% Responsivo**: Adaptável para desktop, tablet e mobile
- **Autenticação Firebase**: Sistema seguro de login/autenticação

## 📁 Estrutura do Projeto

```
freepro-system/
├── src/
│   ├── config/
│   │   └── firebase.js         # Configuração Firebase
│   ├── styles/
│   │   └── main.css           # Estilos principais
│   ├── js/
│   │   ├── theme.js          # Gerenciamento de tema
│   │   ├── tabs.js           # Sistema de navegação por abas
│   │   ├── auth.js           # Autenticação e usuário
│   │   ├── clientes.js       # CRUD de clientes
│   │   ├── procedimentos.js  # CRUD de procedimentos
│   │   └── app.js           # Controlador principal
│   └── index.html           # Página principal
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Firebase Firestore
- **Autenticação**: Firebase Auth
- **Deploy**: Vercel
- **Versionamento**: Git/GitHub

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/freepro-system.git
cd freepro-system
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Firebase (opcional - já configurado):
- O projeto já está configurado com as credenciais do Firebase
- Para usar seu próprio projeto Firebase, edite `src/config/firebase.js`

## 🚀 Deploy no Vercel

1. Instale o Vercel CLI:
```bash
npm i -g vercel
```

2. Faça login no Vercel:
```bash
vercel login
```

3. Deploy do projeto:
```bash
vercel
```

4. Para deploy em produção:
```bash
vercel --prod
```

## 💻 Desenvolvimento Local

Para rodar localmente:

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

## 📱 Funcionalidades

### Dashboard
- Visão geral do sistema
- Cards informativos
- Mensagem de boas-vindas personalizada

### Controle Semanal (Clientes)
- **Estatísticas em tempo real**: Total, ativos, vencendo, vencidos
- **Receita**: Total e mensal
- **Tabela de clientes** com:
  - Informações completas
  - Edição inline
  - Status de vencimento
  - Links para Telegram
  - Métodos de pagamento

### Controle de Procedimentos
- **Formulário completo** de cadastro
- **Tabela editável** com todos os campos
- **Status categorizados** com badges coloridos
- **Valores** de freebet e final
- **CRUD completo** com rename automático de IDs

### Sistema de Temas
- Alternância entre tema claro e escuro
- Persistência da preferência do usuário
- Detecção automática do tema do sistema

## 🔒 Segurança

- Autenticação via Firebase Auth
- Regras de segurança no Firestore
- Headers de segurança configurados no Vercel
- Validação de dados no frontend

## 📊 Estrutura do Banco de Dados

### Coleção: `clientes`
```javascript
{
  nome: String,
  email: String,
  telegram: String,
  dataVenda: Date,
  duracao: Number,
  valorPago: Number,
  metodoPagamento: String,
  statusGrupo: String,
  observacoes: String,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Coleção: `procedimentos`
```javascript
{
  data: Date,
  numero: Number,
  plataforma: String,
  promocao: String,
  categoria: String,
  status: String,
  refFreebet: String,
  valorFreebet: Number,
  valorFinal: Number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Coleção: `users`
```javascript
{
  name: String,
  email: String,
  // outros campos do perfil
}
```

## 🎨 Personalização

### Cores
Edite as variáveis CSS em `src/styles/main.css`:

```css
:root {
  --primary: #3b82f6;
  --secondary: #10b981;
  --accent: #8b5cf6;
  /* ... */
}
```

### Adicionar Novas Abas
1. Adicione a configuração em `src/js/tabs.js`
2. Crie a section correspondente no HTML
3. Adicione o botão no navigation

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Prepara para produção
- `npm start` - Inicia servidor de produção

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Suporte

Para suporte, entre em contato através do sistema de Issues do GitHub.

## 🔄 Atualizações Futuras

- [ ] Sistema de filtros avançados para clientes
- [ ] Exportação de dados para Excel/CSV
- [ ] Gráficos e relatórios
- [ ] Sistema de notificações
- [ ] Backup automático
- [ ] Multi-idioma
- [ ] PWA (Progressive Web App)

## ⚠️ Notas Importantes

1. **Firebase**: O sistema já está configurado com um projeto Firebase. Para usar seu próprio projeto, atualize as credenciais em `src/config/firebase.js`.

2. **Autenticação**: O sistema oculta todo o conteúdo até que o usuário esteja autenticado.

3. **Modo Local**: Se o Firebase não estiver disponível, o sistema funciona em modo local com dados temporários.

4. **Responsividade**: O sistema é totalmente responsivo, com navegação adaptada para mobile.

## 🚀 Deploy Rápido

```bash
# Clone
git clone https://github.com/seu-usuario/freepro-system.git

# Entre na pasta
cd freepro-system

# Instale dependências
npm install

# Deploy no Vercel
vercel --prod
```

---

**Desenvolvido com ❤️ para gestão eficiente de clientes e procedimentos**