import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import pool from '../config/database';


interface ProdutoExistente extends RowDataPacket {
    id: number;
}


// ======================================================
// 1. CADASTRAR PRODUTO
// ======================================================

export const cadastrarProduto = async (
    req: Request,
    res: Response
) => {

    const {
        sku,
        nome,
        descricao,
        preco_base
    } = req.body;


    if (
        !sku ||
        !nome ||
        preco_base === undefined
    ) {
        return res.status(400).json({
            erro:
                'SKU, nome e preço base são obrigatórios.'
        });
    }


    const skuNormalizado =
        String(sku)
            .trim()
            .toUpperCase();

    const nomeNormalizado =
        String(nome).trim();

    const descricaoNormalizada =
        descricao
            ? String(descricao).trim()
            : null;

    const preco =
        Number(preco_base);


    if (
        Number.isNaN(preco) ||
        preco < 0
    ) {
        return res.status(400).json({
            erro: 'Preço base inválido.'
        });
    }


    const conexao =
        await pool.getConnection();


    try {

        await conexao.beginTransaction();


        // ==================================================
        // VERIFICA SE O SKU JÁ EXISTE
        // ==================================================

        const [produtoExistente] =
            await conexao.execute<ProdutoExistente[]>(
                `
                SELECT id
                FROM produtos
                WHERE sku = ?
                LIMIT 1
                FOR UPDATE
                `,
                [skuNormalizado]
            );


        if (produtoExistente.length > 0) {

            await conexao.rollback();

            return res.status(409).json({
                erro:
                    'Já existe um produto com este SKU.'
            });
        }


        // ==================================================
        // CRIA O PRODUTO
        // ==================================================

        const [resultado] =
            await conexao.execute<ResultSetHeader>(
                `
                INSERT INTO produtos (
                    sku,
                    nome,
                    descricao,
                    preco_base
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    skuNormalizado,
                    nomeNormalizado,
                    descricaoNormalizada,
                    preco
                ]
            );


        // ==================================================
        // CRIA O ESTOQUE DO PRODUTO
        // ==================================================

        await conexao.execute<ResultSetHeader>(
            `
            INSERT INTO estoque (
                produto_id,
                quantidade_fisica,
                quantidade_reservada
            )
            VALUES (?, 0, 0)
            `,
            [resultado.insertId]
        );


        /*
         * Produto e estoque fazem parte da mesma operação.
         * Só confirmamos a transação depois que os dois
         * registros forem criados corretamente.
         */
        await conexao.commit();


        return res.status(201).json({
            mensagem:
                'Produto cadastrado com sucesso!',

            produto: {
                id: resultado.insertId,
                sku: skuNormalizado,
                nome: nomeNormalizado,
                descricao: descricaoNormalizada,
                preco_base: preco,
                status: 'ATIVO'
            }
        });


    } catch (erro) {

        await conexao.rollback();


        console.error(
            'Erro ao cadastrar produto:',
            erro
        );


        return res.status(500).json({
            erro:
                'Erro interno ao cadastrar produto.'
        });


    } finally {

        conexao.release();
    }
};


// ======================================================
// 2. LISTAR PRODUTOS
// ======================================================

export const listarProdutos = async (
    req: Request,
    res: Response
) => {

    try {

        const [produtos] =
            await pool.query(
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
                    (
                        e.quantidade_fisica -
                        e.quantidade_reservada
                    ) AS quantidade_disponivel,
                    p.criado_em,
                    p.atualizado_em

                FROM produtos p

                INNER JOIN estoque e
                    ON e.produto_id = p.id

                ORDER BY p.id DESC
                `
            );


        return res.status(200).json(
            produtos
        );


    } catch (erro) {

        console.error(
            'Erro ao listar produtos:',
            erro
        );


        return res.status(500).json({
            erro:
                'Erro interno ao listar produtos.'
        });
    }
};


// ======================================================
// 3. BUSCAR PRODUTO POR SKU
// ======================================================

export const buscarProdutoPorSku = async (
    req: Request,
    res: Response
) => {

    const { sku } = req.params;


    try {

        const skuNormalizado =
            String(sku)
                .trim()
                .toUpperCase();


        const [produtos]: any =
            await pool.query(
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
                    (
                        e.quantidade_fisica -
                        e.quantidade_reservada
                    ) AS quantidade_disponivel,
                    p.criado_em,
                    p.atualizado_em

                FROM produtos p

                INNER JOIN estoque e
                    ON e.produto_id = p.id

                WHERE p.sku = ?
                `,
                [skuNormalizado]
            );


        if (produtos.length === 0) {

            return res.status(404).json({
                erro:
                    'Produto não encontrado.'
            });
        }


        return res.status(200).json(
            produtos[0]
        );


    } catch (erro) {

        console.error(
            'Erro ao buscar produto:',
            erro
        );


        return res.status(500).json({
            erro:
                'Erro interno ao buscar produto.'
        });
    }
};