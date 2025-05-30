#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Iniciando deploy para produção...${NC}"

# Instalar dependências
echo "Instalando dependências..."
npm install --production || { echo -e "${RED}Erro ao instalar dependências${NC}" ; exit 1; }

# Build do projeto
echo "Gerando build de produção..."
npm run build || { echo -e "${RED}Erro no build${NC}" ; exit 1; }

# Verificar variáveis de ambiente
echo "Verificando variáveis de ambiente..."
if [ ! -f .env ]; then
    echo -e "${RED}Arquivo .env não encontrado!${NC}"
    echo "Copiando .env.example para .env..."
    cp .env.example .env
    echo -e "${RED}Por favor, configure as variáveis no arquivo .env${NC}"
    exit 1
fi

# Instalar PM2 globalmente se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
fi

# Iniciar/Reiniciar aplicação com PM2
echo "Iniciando aplicação com PM2..."
pm2 delete byd-profit 2>/dev/null || true
pm2 start npm --name "byd-profit" -- start || { echo -e "${RED}Erro ao iniciar PM2${NC}" ; exit 1; }

echo -e "${GREEN}Deploy concluído com sucesso!${NC}"
echo -e "Para monitorar os logs: ${GREEN}pm2 logs byd-profit${NC}"
echo -e "Para verificar status: ${GREEN}pm2 status${NC}" 