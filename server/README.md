# Servidor Socket.io para Dolrath NFT Game

Este é o servidor Socket.io para o jogo Dolrath NFT.

## Configuração Local

1. Instale as dependências:
```
npm install
```

2. Crie um arquivo `.env` na pasta `server/` com base no exemplo abaixo:
```
# Configurações do servidor Socket.io
PORT=3001
HOST=0.0.0.0

# URLs de CORS (separadas por vírgula)
CORS_ORIGINS=http://localhost:3000

# Ambiente
NODE_ENV=development
```

3. Inicie o servidor:
```
node server.js
```

## Deploy no Render

1. Crie uma conta em [render.com](https://render.com/)
2. Escolha "Web Service"
3. Conecte seu repositório GitHub 
4. Configure:
   - Nome: `dolrath-socket-server`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server/server.js`
   - Plano: Free

5. Configure as variáveis de ambiente:
   - `PORT` = 10000 (Render atribui uma porta automaticamente)
   - `CORS_ORIGINS` = URL da sua aplicação Vercel (ex: https://dolrath-app.vercel.app)
   - `NODE_ENV` = production

## Conectando o Frontend

No painel da Vercel, adicione a seguinte variável de ambiente:

- `NEXT_PUBLIC_SOCKET_URL` = URL do servidor no Render (ex: https://dolrath-socket-server.onrender.com)

## Depuração

O servidor inclui um endpoint de verificação de saúde:

```
GET /api/health
```

Use este endpoint para verificar se o servidor está funcionando corretamente. 