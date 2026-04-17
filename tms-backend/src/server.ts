import express from 'express';
import pool from './config/database';
import caminhaoRoutes from './routes/caminhaoRoutes'; // <-- 1. Importando a rota nova!
import motoristaRoutes from './routes/motoristaRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import cors from 'cors'; // <-- 1. Importe o cors aqui

const app = express();
const PORTA = 3000;

app.use(express.json());
app.use(cors());

// 2. Avisando o servidor para usar as rotas de caminhões
app.use(caminhaoRoutes); 
app.use(motoristaRoutes);
app.use(usuarioRoutes);

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