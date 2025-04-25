# Instruções de Deploy - Dolrath Battle App

Este documento contém instruções para fazer o deploy da aplicação Dolrath Battle App em um ambiente de produção.

## Requisitos

- Node.js 18+ instalado
- npm ou yarn
- Um servidor com suporte a Node.js (Vercel, Netlify, DigitalOcean, etc.)

## Preparação para o Deploy

### 1. Build da aplicação

```bash
# Instalar dependências
npm install

# Gerar o build de produção
npm run build
```

### 2. Variáveis de ambiente

Certifique-se de configurar as seguintes variáveis de ambiente no seu servidor:

```
DATABASE_URL=sua_url_do_banco_de_dados
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=sua_chave_secreta
NODE_ENV=production
```

### 3. Deploy em diferentes plataformas

#### Vercel (Recomendado para Next.js)

1. Crie uma conta na [Vercel](https://vercel.com)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente
4. Deploy automático após push

#### Deploy manual em VPS (DigitalOcean, AWS, etc.)

1. Copie os arquivos para o servidor
2. Instale as dependências: `npm install --production`
3. Execute o build: `npm run build`
4. Inicie a aplicação: `npm run start:prod`

### 4. Configuração de PM2 (recomendado para VPS)

Para manter a aplicação rodando em background:

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar a aplicação
pm2 start npm --name "dolrath-app" -- run start:prod

# Configurar para iniciar automaticamente após reboot
pm2 startup
pm2 save
```

## Teste de produção

1. Certifique-se de que tanto a aplicação Next.js quanto o servidor Socket.IO estão funcionando
2. Teste a criação de salas e a conexão entre múltiplos usuários
3. Verifique se o histórico de batalhas está sendo registrado corretamente

## Troubleshooting

### O servidor Socket.IO não está se conectando

- Verifique se as portas necessárias estão abertas no firewall
- Certifique-se de que a URL do servidor está configurada corretamente no frontend

### Erros de CORS

- Verifique as configurações de CORS no servidor Socket.IO
- Certifique-se de que o domínio da aplicação está na lista de origens permitidas

### Problemas com WebSockets

- Alguns provedores podem exigir configurações especiais para WebSockets
- Consulte a documentação do seu provedor para suporte a WebSockets 