import express from 'express';
import pool from './config/database';
import caminhaoRoutes from './routes/caminhaoRoutes'; // <-- 1. Importando a rota nova!
import motoristaRoutes from './routes/motoristaRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import cors from 'cors'; // <-- 1. Importe o cors aqui
import produtoRoutes from './routes/produtoRoutes';
import estoqueRoutes from './routes/estoqueRoutes';
import pedidoRoutes from './routes/pedidoRoutes';

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// 2. Avisando o servidor para usar as rotas de caminhões
app.use(caminhaoRoutes); 
app.use(motoristaRoutes);
app.use(usuarioRoutes);
app.use(produtoRoutes);
app.use(estoqueRoutes);
app.use(pedidoRoutes);

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