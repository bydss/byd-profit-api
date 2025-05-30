import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(dirname(__dirname));
const envPath = join(rootDir, '.env');

console.log('Procurando arquivo .env em:', envPath);
console.log('Arquivo .env existe:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    console.log('Conteúdo do diretório:', fs.readdirSync(rootDir));
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log('Primeiros caracteres do arquivo .env:', envContent.substring(0, 50));
    } catch (error) {
        console.error('Erro ao ler arquivo .env:', error);
    }
}

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Erro ao carregar o arquivo .env:', result.error);
    process.exit(1);
}

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL não está definida no arquivo .env');
    process.exit(1);
}

console.log('DATABASE_URL está definida:', !!process.env.DATABASE_URL);

const sql = neon(process.env.DATABASE_URL);

export default sql; 