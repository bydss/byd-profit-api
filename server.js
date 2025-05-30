import http from 'http';
import { neon } from '@neondatabase/serverless';
import { config } from './config.js';
import cors from 'cors';

// Usar DATABASE_URL do ambiente ou fallback para configuração local
const sql = neon(process.env.DATABASE_URL || config.databaseUrl);

// Configuração do CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://bydprofit.com', 'https://www.bydprofit.com']
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

const corsMiddleware = cors(corsOptions);

const requestHandler = async (req, res) => {
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
    
    try {
        const result = await sql`SELECT version()`;
        const { version } = result[0];
        res.writeHead(200, { 
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        });
        res.end(JSON.stringify({
            status: 'success',
            version: version,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            server: 'Vercel'
        }));
    } catch (error) {
        console.error('Erro na consulta:', error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            status: 'error',
            message: error.message
        }));
    }
};

// Criar e iniciar o servidor se não estiver no Vercel
if (!process.env.VERCEL) {
    const server = http.createServer(requestHandler);
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
        console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Exportar o handler para o Vercel
export default requestHandler; 