import { Request, Response } from 'express';
import pool from '../config/database';

// 1. ADICIONAR ENTRADA DE ESTOQUE
export const adicionarEstoque = async (req: Request, res: Response) => {
    const { sku } = req.params;
    const { quantidade } = req.body;

    try {
        const skuNormalizado = String(sku).trim().toUpperCase();
        const quantidadeNumerica = Number(quantidade);

        // Validação da quantidade
        if (
            !Number.isInteger(quantidadeNumerica) ||
            quantidadeNumerica <= 0
        ) {
            return res.status(400).json({
                erro: 'A quantidade deve ser um número inteiro maior que zero.'
            });
        }

        // Busca o produto pelo SKU
        const [produtos]: any = await pool.query(
            'SELECT id, sku, nome FROM produtos WHERE sku = ?',
            [skuNormalizado]
        );

        if (produtos.length === 0) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        const produto = produtos[0];

        // Adiciona a quantidade ao estoque físico
        await pool.query(
            `
            UPDATE estoque
            SET quantidade_fisica = quantidade_fisica + ?
            WHERE produto_id = ?
            `,
            [quantidadeNumerica, produto.id]
        );

        // Consulta o estoque atualizado
        const [estoqueAtualizado]: any = await pool.query(
            `
            SELECT
                quantidade_fisica,
                quantidade_reservada,
                (quantidade_fisica - quantidade_reservada)
                    AS quantidade_disponivel
            FROM estoque
            WHERE produto_id = ?
            `,
            [produto.id]
        );

        return res.status(200).json({
            mensagem: 'Entrada de estoque registrada com sucesso!',
            produto: {
                id: produto.id,
                sku: produto.sku,
                nome: produto.nome
            },
            estoque: estoqueAtualizado[0]
        });

    } catch (erro) {
        console.error('Erro ao adicionar estoque:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao adicionar estoque.'
        });
    }
};