import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error(
        'DATABASE_URL não foi definida no arquivo .env.'
    );
}

const url = new URL(databaseUrl);

if (url.protocol !== 'mysql:') {
    throw new Error(
        'DATABASE_URL inválida. O protocolo deve ser mysql://'
    );
}

const nomeBanco = url.pathname.replace('/', '');

if (!nomeBanco) {
    throw new Error(
        'DATABASE_URL inválida. O nome do banco não foi informado.'
    );
}

const pool = mysql.createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: nomeBanco,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;