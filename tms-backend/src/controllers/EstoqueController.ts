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
// 2. REGISTRAR SAÍDA DE ESTOQUE
export const retirarEstoque = async (req: Request, res: Response) => {
    const { sku } = req.params;
    const { quantidade } = req.body;

    try {
        const skuNormalizado = String(sku).trim().toUpperCase();
        const quantidadeNumerica = Number(quantidade);

        // Valida a quantidade informada
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
            `
            SELECT id, sku, nome
            FROM produtos
            WHERE sku = ?
            `,
            [skuNormalizado]
        );

        if (produtos.length === 0) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        const produto = produtos[0];

        /*
         * A retirada só acontece se existir estoque disponível suficiente.
         *
         * disponível = quantidade_fisica - quantidade_reservada
         *
         * Dessa forma nunca retiramos unidades que já estejam reservadas.
         */
        const [resultado]: any = await pool.query(
            `
            UPDATE estoque
            SET quantidade_fisica = quantidade_fisica - ?
            WHERE produto_id = ?
              AND (quantidade_fisica - quantidade_reservada) >= ?
            `,
            [
                quantidadeNumerica,
                produto.id,
                quantidadeNumerica
            ]
        );

        // Nenhuma linha alterada = estoque insuficiente ou registro inexistente
        if (resultado.affectedRows === 0) {
            const [estoqueAtual]: any = await pool.query(
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

            if (estoqueAtual.length === 0) {
                return res.status(404).json({
                    erro: 'Registro de estoque não encontrado.'
                });
            }

            return res.status(409).json({
                erro: 'Estoque disponível insuficiente para realizar a saída.',
                estoque: estoqueAtual[0]
            });
        }

        // Consulta o estoque após a retirada
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
            mensagem: 'Saída de estoque registrada com sucesso!',
            produto: {
                id: produto.id,
                sku: produto.sku,
                nome: produto.nome
            },
            estoque: estoqueAtualizado[0]
        });

    } catch (erro) {
        console.error('Erro ao retirar estoque:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao retirar estoque.'
        });
    }
};

// 3. RESERVAR ESTOQUE
export const reservarEstoque = async (req: Request, res: Response) => {
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

        // Busca o produto
        const [produtos]: any = await pool.query(
            `
            SELECT id, sku, nome
            FROM produtos
            WHERE sku = ?
            `,
            [skuNormalizado]
        );

        if (produtos.length === 0) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        const produto = produtos[0];

        /*
         * A reserva só será feita se existir
         * quantidade disponível suficiente.
         *
         * disponível =
         * quantidade_fisica - quantidade_reservada
         */
        const [resultado]: any = await pool.query(
            `
            UPDATE estoque
            SET quantidade_reservada = quantidade_reservada + ?
            WHERE produto_id = ?
              AND (quantidade_fisica - quantidade_reservada) >= ?
            `,
            [
                quantidadeNumerica,
                produto.id,
                quantidadeNumerica
            ]
        );

        // Caso não exista estoque disponível suficiente
        if (resultado.affectedRows === 0) {
            const [estoqueAtual]: any = await pool.query(
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

            if (estoqueAtual.length === 0) {
                return res.status(404).json({
                    erro: 'Registro de estoque não encontrado.'
                });
            }

            return res.status(409).json({
                erro: 'Estoque disponível insuficiente para realizar a reserva.',
                estoque: estoqueAtual[0]
            });
        }

        // Consulta o estoque depois da reserva
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
            mensagem: 'Estoque reservado com sucesso!',
            produto: {
                id: produto.id,
                sku: produto.sku,
                nome: produto.nome
            },
            estoque: estoqueAtualizado[0]
        });

    } catch (erro) {
        console.error('Erro ao reservar estoque:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao reservar estoque.'
        });
    }
};

// 4. LIBERAR RESERVA DE ESTOQUE
export const liberarReservaEstoque = async (
    req: Request,
    res: Response
) => {
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
            `
            SELECT id, sku, nome
            FROM produtos
            WHERE sku = ?
            `,
            [skuNormalizado]
        );

        if (produtos.length === 0) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        const produto = produtos[0];

        /*
         * Só permite liberar uma quantidade que
         * realmente esteja reservada.
         */
        const [resultado]: any = await pool.query(
            `
            UPDATE estoque
            SET quantidade_reservada = quantidade_reservada - ?
            WHERE produto_id = ?
              AND quantidade_reservada >= ?
            `,
            [
                quantidadeNumerica,
                produto.id,
                quantidadeNumerica
            ]
        );

        if (resultado.affectedRows === 0) {
            const [estoqueAtual]: any = await pool.query(
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

            if (estoqueAtual.length === 0) {
                return res.status(404).json({
                    erro: 'Registro de estoque não encontrado.'
                });
            }

            return res.status(409).json({
                erro: 'Quantidade reservada insuficiente para realizar a liberação.',
                estoque: estoqueAtual[0]
            });
        }

        // Consulta estoque atualizado
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
            mensagem: 'Reserva de estoque liberada com sucesso!',
            produto: {
                id: produto.id,
                sku: produto.sku,
                nome: produto.nome
            },
            estoque: estoqueAtualizado[0]
        });

    } catch (erro) {
        console.error('Erro ao liberar reserva de estoque:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao liberar reserva de estoque.'
        });
    }
};