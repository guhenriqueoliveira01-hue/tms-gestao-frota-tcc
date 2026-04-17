import { Request, Response } from 'express';
import pool from '../config/database';

// 1. CADASTRAR MOTORISTA
export const cadastrarMotorista = async (req: Request, res: Response) => {
    const { cnh, nome, telefone, status } = req.body;

    try {
        const [existente]: any = await pool.query('SELECT cnh FROM motoristas WHERE cnh = ?', [cnh]);
        if (existente.length > 0) {
            return res.status(400).json({ erro: 'Esta CNH já está cadastrada.' });
        }

        await pool.query(
            'INSERT INTO motoristas (cnh, nome, telefone, status) VALUES (?, ?, ?, ?)',
            [cnh, nome, telefone, status.toUpperCase()]
        );

        return res.status(201).json({ mensagem: 'Motorista cadastrado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao cadastrar motorista.' });
    }
};

// 2. LISTAR MOTORISTAS
export const listarMotoristas = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query('SELECT * FROM motoristas');
        return res.status(200).json(rows);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao listar motoristas.' });
    }
};

// 3. ATUALIZAR MOTORISTA
export const atualizarMotorista = async (req: Request, res: Response) => {
    const { cnh } = req.params;
    const { nome, telefone, status } = req.body;

    try {
        const [result]: any = await pool.query(
            'UPDATE motoristas SET nome = ?, telefone = ?, status = ? WHERE cnh = ?',
            [nome, telefone, status.toUpperCase(), cnh]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Motorista não encontrado.' });
        }

        return res.status(200).json({ mensagem: 'Motorista atualizado com sucesso!' });
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao atualizar motorista.' });
    }
};

// 4. EXCLUIR MOTORISTA
export const excluirMotorista = async (req: Request, res: Response) => {
    const { cnh } = req.params;

    try {
        const [result]: any = await pool.query('DELETE FROM motoristas WHERE cnh = ?', [cnh]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Motorista não encontrado.' });
        }
        return res.status(200).json({ mensagem: 'Motorista removido com sucesso!' });
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao excluir motorista.' });
    }
};