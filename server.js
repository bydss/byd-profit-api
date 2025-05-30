import http from 'http';
import { neon } from '@neondatabase/serverless';
import { config } from './config.js';
import cors from 'cors';

// Função para logging
const log = (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (error) {
        console.error(`[${timestamp}] Error:`, error);
    }
};

// Inicialização da conexão com o banco
let sql;
try {
    const databaseUrl = process.env.DATABASE_URL || config.databaseUrl;
    log(`Iniciando conexão com o banco de dados... URL: ${databaseUrl.split('@')[1]}`); // Log apenas do host, sem credenciais
    sql = neon(databaseUrl);
    log('Conexão com o banco inicializada com sucesso');
} catch (error) {
    log('Erro ao inicializar conexão com o banco', error);
    throw error;
}

// Configuração do CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://bydprofit.com', 'https://www.bydprofit.com']
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

const corsMiddleware = cors(corsOptions);

// Handler principal
const requestHandler = async (req, res) => {
    try {
        // Log da requisição
        log(`Nova requisição: ${req.method} ${req.url}`);

        // Aplicar CORS
        await new Promise(resolve => corsMiddleware(req, res, resolve));

        // Headers de segurança
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Verificar se é uma requisição OPTIONS (preflight)
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Teste de conexão com o banco
        log('Executando query de teste no banco...');
        const result = await sql`SELECT version()`;
        log('Query executada com sucesso');

        const responseData = {
            status: 'success',
            version: result[0].version,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            server: 'Vercel'
        };

        log('Enviando resposta de sucesso');
        res.writeHead(200, { 
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        });
        res.end(JSON.stringify(responseData));

    } catch (error) {
        log('Erro durante o processamento da requisição', error);
        
        const errorResponse = {
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString(),
            path: req.url,
            method: req.method
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
        }

        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify(errorResponse));
    }
};

// Criar e iniciar o servidor se não estiver no Vercel
if (!process.env.VERCEL) {
    const server = http.createServer(requestHandler);
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        log(`Servidor rodando na porta ${port}`);
        log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Exportar o handler para o Vercel
export default requestHandler; 