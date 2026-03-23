import express from 'express';
import pool from './config/database';
import caminhaoRoutes from './routes/caminhaoRoutes'; // <-- 1. Importando a rota nova!

const app = express();
const PORTA = 3000;

app.use(express.json());

// 2. Avisando o servidor para usar as rotas de caminhões
app.use(caminhaoRoutes); 

app.get('/teste-banco', async (req, res) => {
    try {
        const [linhas] = await pool.query('SELECT 1 + 1 AS resultado');
        res.send({ sucesso: true, mensagem: 'Banco conectado!', prova: linhas });
    } catch (erro) {
        res.status(500).send({ sucesso: false, erro: erro });
    }
});

app.listen(PORTA, () => {
    console.log(`🚀 Servidor logístico rodando na porta ${PORTA}`);
});