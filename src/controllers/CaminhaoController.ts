import { Request, Response } from 'express';
import pool from '../config/database';

// Função 1: Buscar todos os caminhões (GET)
export const listarCaminhoes = async (req: Request, res: Response) => {
    try {
        const [caminhoes] = await pool.query('SELECT * FROM caminhoes');
        res.status(200).json(caminhoes);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar os caminhões.' });
    }
};

// Função 2: Cadastrar um caminhão novo (POST)
export const cadastrarCaminhao = async (req: Request, res: Response) => {
    try {
        // Pegando os dados que vão chegar do usuário (no corpo da requisição)
        const { placa, modelo, capacidade_kg, status } = req.body;

        // Comando SQL para inserir no banco de dados
        const query = 'INSERT INTO caminhoes (placa, modelo, capacidade_kg, status) VALUES (?, ?, ?, ?)';
        
        // Executando a inserção
        const [resultado] = await pool.query(query, [placa, modelo, capacidade_kg, status]);

        res.status(201).json({ 
            mensagem: 'Caminhão cadastrado com sucesso!',
            placaCadastrada: placa 
        });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao cadastrar o caminhão.' });
    }
};