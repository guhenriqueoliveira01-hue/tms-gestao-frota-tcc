import { Request, Response } from 'express';
import pool from '../config/database';

// 1. CADASTRAR PRODUTO
export const cadastrarProduto = async (req: Request, res: Response) => {
    const { sku, nome, descricao, preco_base } = req.body;

    try {
        if (!sku || !nome || preco_base === undefined) {
            return res.status(400).json({
                erro: 'SKU, nome e preço base são obrigatórios.'
            });
        }

        const skuNormalizado = String(sku).trim().toUpperCase();
        const nomeNormalizado = String(nome).trim();
        const preco = Number(preco_base);

        if (Number.isNaN(preco) || preco < 0) {
            return res.status(400).json({
                erro: 'Preço base inválido.'
            });
        }

        const [produtoExistente]: any = await pool.query(
            'SELECT id FROM produtos WHERE sku = ?',
            [skuNormalizado]
        );

        if (produtoExistente.length > 0) {
            return res.status(409).json({
                erro: 'Já existe um produto com este SKU.'
            });
        }

        const [resultado]: any = await pool.query(
            `INSERT INTO produtos
            (sku, nome, descricao, preco_base)
            VALUES (?, ?, ?, ?)`,
            [
                skuNormalizado,
                nomeNormalizado,
                descricao ? String(descricao).trim() : null,
                preco
            ]
        );

        // Cria automaticamente o registro de estoque do novo produto.
        await pool.query(
            `INSERT INTO estoque
            (produto_id, quantidade_fisica, quantidade_reservada)
            VALUES (?, 0, 0)`,
            [resultado.insertId]
        );

        return res.status(201).json({
            mensagem: 'Produto cadastrado com sucesso!',
            produto: {
                id: resultado.insertId,
                sku: skuNormalizado,
                nome: nomeNormalizado,
                descricao: descricao ? String(descricao).trim() : null,
                preco_base: preco,
                status: 'ATIVO'
            }
        });

    } catch (erro) {
        console.error('Erro ao cadastrar produto:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao cadastrar produto.'
        });
    }
};

// 2. LISTAR PRODUTOS
export const listarProdutos = async (req: Request, res: Response) => {
    try {
        const [produtos] = await pool.query(`
            SELECT
                p.id,
                p.sku,
                p.nome,
                p.descricao,
                p.preco_base,
                p.status,
                e.quantidade_fisica,
                e.quantidade_reservada,
                (e.quantidade_fisica - e.quantidade_reservada) AS quantidade_disponivel,
                p.criado_em,
                p.atualizado_em
            FROM produtos p
            INNER JOIN estoque e ON e.produto_id = p.id
            ORDER BY p.id DESC
        `);

        return res.status(200).json(produtos);

    } catch (erro) {
        console.error('Erro ao listar produtos:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao listar produtos.'
        });
    }
};

// 3. BUSCAR PRODUTO POR SKU
export const buscarProdutoPorSku = async (
    req: Request,
    res: Response
) => {
    const { sku } = req.params;

    try {
        const skuNormalizado = String(sku).trim().toUpperCase();

        const [produtos]: any = await pool.query(
            `
            SELECT
                p.id,
                p.sku,
                p.nome,
                p.descricao,
                p.preco_base,
                p.status,
                e.quantidade_fisica,
                e.quantidade_reservada,
                (e.quantidade_fisica - e.quantidade_reservada) AS quantidade_disponivel,
                p.criado_em,
                p.atualizado_em
            FROM produtos p
            INNER JOIN estoque e ON e.produto_id = p.id
            WHERE p.sku = ?
            `,
            [skuNormalizado]
        );

        if (produtos.length === 0) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        return res.status(200).json(produtos[0]);

    } catch (erro) {
        console.error('Erro ao buscar produto:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao buscar produto.'
        });
    }
};