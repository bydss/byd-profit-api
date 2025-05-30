import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

// Cria e exporta a conexão com o banco
export const sql = neon(process.env.DATABASE_URL); 