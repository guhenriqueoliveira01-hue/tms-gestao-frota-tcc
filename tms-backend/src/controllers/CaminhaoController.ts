import { Request, Response } from 'express';
import pool from '../config/database'; // Puxando a conexão com o banco

// Função para cadastrar um novo caminhão (POST)
// Função para cadastrar um novo caminhão (POST)
export const cadastrarCaminhao = async (req: Request, res: Response) => {
    // 1. Mudamos aqui para receber 'capacidade_kg'
    const { placa, modelo, capacidade_kg, status } = req.body;

    try {
        const [caminhaoExistente]: any = await pool.query('SELECT placa FROM caminhoes WHERE placa = ?', [placa]);

        if (caminhaoExistente.length > 0) {
            return res.status(400).json({ erro: 'Este caminhão já está cadastrado no sistema.' });
        }

        // 2. Atualizamos a query para usar 'capacidade_kg' no lugar exato
        const query = 'INSERT INTO caminhoes (placa, modelo, capacidade_kg, status) VALUES (?, ?, ?, ?)';
        await pool.query(query, [placa, modelo, capacidade_kg, status]);

        return res.status(201).json({
            mensagem: 'Caminhão cadastrado com sucesso!',
            placaCadastrada: placa
        });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao cadastrar o caminhão.' });
    }
};
// Função para listar todos os caminhões (GET)
export const listarCaminhoes = async (req: Request, res: Response) => {
    try {
        const [caminhoes] = await pool.query('SELECT * FROM caminhoes');
        return res.status(200).json(caminhoes);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao buscar os caminhões.' });
    }
};
// Função para atualizar um caminhão (PUT)
export const atualizarCaminhao = async (req: Request, res: Response) => {
    const { placa } = req.params; // Pegamos a placa pela URL
    const { modelo, capacidade_kg, status } = req.body; // Dados novos vêm no corpo

    try {
        // Executa o UPDATE no banco
        const [resultado]: any = await pool.query(
            'UPDATE caminhoes SET modelo = ?, capacidade_kg = ?, status = ? WHERE placa = ?',
            [modelo, capacidade_kg, status, placa]
        );

        // Se o banco não encontrou a placa para atualizar
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Caminhão não encontrado.' });
        }

        return res.status(200).json({ mensagem: 'Dados do caminhão atualizados com sucesso!' });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao atualizar o caminhão.' });
    }
};
// Função para excluir um caminhão (DELETE)
export const excluirCaminhao = async (req: Request, res: Response) => {
    const { placa } = req.params;

    try {
        const [resultado]: any = await pool.query('DELETE FROM caminhoes WHERE placa = ?', [placa]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Caminhão não encontrado para exclusão.' });
        }

        return res.status(200).json({ mensagem: 'Caminhão removido do sistema com sucesso!' });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao excluir o caminhão.' });
    }
};