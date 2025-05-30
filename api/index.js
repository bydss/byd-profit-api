import { sql } from '../config/database.js';

export default async function handler(req, res) {
    // Adiciona um try/catch global para garantir que nenhum erro passe despercebido
    try {
        // Tratamento de favicon - agora antes de qualquer outra operação
        if (req.url.includes('favicon')) {
            // Simplesmente retorna 204 No Content para requisições de favicon
            res.status(204).end();
            return;
        }

        // Log detalhado da requisição
        console.log('Iniciando nova requisição:', {
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        // Configuração básica de CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Tratamento de requisições OPTIONS
        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }

        // Verificação da conexão com o banco de dados
        console.log('Verificando conexão com o banco de dados...');
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL não está configurada');
        }

        // Teste simples de conexão com o banco
        console.log('Executando query de teste...');
        const result = await sql`SELECT 1 as test;`;
        console.log('Conexão com banco bem sucedida:', result);

        // Resposta padrão
        res.status(200).json({
            status: 'success',
            message: 'API funcionando corretamente',
            timestamp: new Date().toISOString(),
            dbTest: result[0].test,
            env: process.env.NODE_ENV,
            region: process.env.VERCEL_REGION || 'local'
        });

    } catch (error) {
        // Log detalhado do erro
        console.error('Erro na API:', {
            message: error.message,
            stack: error.stack,
            url: req?.url,
            method: req?.method,
            timestamp: new Date().toISOString()
        });

        // Resposta de erro mais informativa
        res.status(500).json({
            status: 'error',
            message: 'Erro interno no servidor',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
} 