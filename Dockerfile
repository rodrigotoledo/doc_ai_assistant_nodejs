FROM node:20-alpine AS base

WORKDIR /app

# Instala dependências primeiro (melhor cache)
COPY package*.json ./
RUN npm ci || npm install

# Copia o restante do código
COPY . .

# Copia entrypoint que instala dependências em tempo de execução quando necessário
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=development
EXPOSE 3000

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
