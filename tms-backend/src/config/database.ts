import mysql from 'mysql2/promise';

// Criando a "piscina" de conexões com o banco de dados do XAMPP
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',       // O usuário padrão do XAMPP
    password: '',       // A senha padrão do XAMPP é vazia
    database: 'tms_logistica' // O banco que você criou ontem!
});

export default pool;