# Build stage
FROM node:18-alpine AS builder

# Aceitar build arg
ARG REACT_APP_API_URL

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --legacy-peer-deps

# Copiar código fonte
COPY . .

# Definir variável de ambiente para o build do React
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build da aplicação React
RUN npm run build

# Production stage com nginx
FROM nginx:alpine

# Copiar build do React
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Nginx roda em foreground por padrão
CMD ["nginx", "-g", "daemon off;"]
