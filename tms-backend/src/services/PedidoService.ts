import {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket
} from 'mysql2/promise';

import pool from '../config/database';

import {
    reservarEstoqueTransacional,
    EstoqueServiceError
} from './EstoqueService';


interface ItemPedidoEntrada {
    sku: string;
    quantidade: number;
}


interface CriarPedidoEntrada {
    cliente_nome: string;
    cliente_email?: string;
    cliente_telefone?: string;
    endereco_entrega: string;
    itens: ItemPedidoEntrada[];
}


interface ProdutoBanco extends RowDataPacket {
    id: number;
    sku: string;
    nome: string;
    preco_base: string;
    status: 'ATIVO' | 'INATIVO';
}


interface ItemPedidoProcessado {
    produto_id: number;
    sku: string;
    nome: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
}


export class PedidoServiceError extends Error {
    statusHttp: number;

    constructor(
        mensagem: string,
        statusHttp: number
    ) {
        super(mensagem);

        this.name = 'PedidoServiceError';
        this.statusHttp = statusHttp;
    }
}


const validarDadosPedido = (
    dados: CriarPedidoEntrada
) => {

    if (
        !dados.cliente_nome ||
        String(dados.cliente_nome).trim().length === 0
    ) {
        throw new PedidoServiceError(
            'O nome do cliente é obrigatório.',
            400
        );
    }


    if (
        !dados.endereco_entrega ||
        String(dados.endereco_entrega).trim().length === 0
    ) {
        throw new PedidoServiceError(
            'O endereço de entrega é obrigatório.',
            400
        );
    }


    if (
        !Array.isArray(dados.itens) ||
        dados.itens.length === 0
    ) {
        throw new PedidoServiceError(
            'O pedido deve possuir pelo menos um item.',
            400
        );
    }
};


const validarItensDuplicados = (
    itens: ItemPedidoEntrada[]
) => {

    const skus = new Set<string>();

    for (const item of itens) {

        const skuNormalizado = String(item.sku)
            .trim()
            .toUpperCase();


        if (skus.has(skuNormalizado)) {
            throw new PedidoServiceError(
                `O produto ${skuNormalizado} foi informado mais de uma vez no pedido.`,
                400
            );
        }


        skus.add(skuNormalizado);
    }
};


const processarItensPedido = async (
    conexao: PoolConnection,
    itens: ItemPedidoEntrada[]
): Promise<ItemPedidoProcessado[]> => {

    const itensProcessados: ItemPedidoProcessado[] = [];


    for (const item of itens) {

        const skuNormalizado = String(item.sku)
            .trim()
            .toUpperCase();

        const quantidade = Number(item.quantidade);


        if (!skuNormalizado) {
            throw new PedidoServiceError(
                'Todos os itens devem possuir um SKU válido.',
                400
            );
        }


        if (
            !Number.isInteger(quantidade) ||
            quantidade <= 0
        ) {
            throw new PedidoServiceError(
                `Quantidade inválida para o produto ${skuNormalizado}.`,
                400
            );
        }


        const [produtos] =
            await conexao.execute<ProdutoBanco[]>(
                `
                SELECT
                    id,
                    sku,
                    nome,
                    preco_base,
                    status
                FROM produtos
                WHERE sku = ?
                `,
                [skuNormalizado]
            );


        if (produtos.length === 0) {
            throw new PedidoServiceError(
                `Produto ${skuNormalizado} não encontrado.`,
                404
            );
        }


        const produto = produtos[0];


        if (produto.status !== 'ATIVO') {
            throw new PedidoServiceError(
                `O produto ${skuNormalizado} está inativo.`,
                409
            );
        }


        const precoUnitario =
            Number(produto.preco_base);

        const subtotal =
            Number(
                (
                    precoUnitario *
                    quantidade
                ).toFixed(2)
            );


        await reservarEstoqueTransacional(
            conexao,
            produto.id,
            quantidade
        );


        itensProcessados.push({
            produto_id: produto.id,
            sku: produto.sku,
            nome: produto.nome,
            quantidade,
            preco_unitario: precoUnitario,
            subtotal
        });
    }


    return itensProcessados;
};


export const criarPedido = async (
    dados: CriarPedidoEntrada
) => {

    validarDadosPedido(dados);

    validarItensDuplicados(dados.itens);


    const conexao = await pool.getConnection();


    try {

        await conexao.beginTransaction();


        const itensProcessados =
            await processarItensPedido(
                conexao,
                dados.itens
            );


        const valorTotal =
            Number(
                itensProcessados
                    .reduce(
                        (total, item) =>
                            total + item.subtotal,
                        0
                    )
                    .toFixed(2)
            );


        const [resultadoPedido] =
            await conexao.execute<ResultSetHeader>(
                `
                INSERT INTO pedidos (
                    cliente_nome,
                    cliente_email,
                    cliente_telefone,
                    endereco_entrega,
                    status,
                    valor_total
                )
                VALUES (?, ?, ?, ?, 'PENDENTE', ?)
                `,
                [
                    String(dados.cliente_nome).trim(),
                    dados.cliente_email
                        ? String(dados.cliente_email).trim()
                        : null,
                    dados.cliente_telefone
                        ? String(dados.cliente_telefone).trim()
                        : null,
                    String(dados.endereco_entrega).trim(),
                    valorTotal
                ]
            );


        const pedidoId =
            resultadoPedido.insertId;


        for (const item of itensProcessados) {

            await conexao.execute(
                `
                INSERT INTO itens_pedido (
                    pedido_id,
                    produto_id,
                    quantidade,
                    preco_unitario,
                    subtotal
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    pedidoId,
                    item.produto_id,
                    item.quantidade,
                    item.preco_unitario,
                    item.subtotal
                ]
            );
        }


        await conexao.commit();


        return {
            id: pedidoId,
            cliente_nome:
                String(dados.cliente_nome).trim(),

            cliente_email:
                dados.cliente_email
                    ? String(dados.cliente_email).trim()
                    : null,

            cliente_telefone:
                dados.cliente_telefone
                    ? String(dados.cliente_telefone).trim()
                    : null,

            endereco_entrega:
                String(dados.endereco_entrega).trim(),

            status: 'PENDENTE',

            valor_total: valorTotal,

            itens: itensProcessados
        };


    } catch (erro) {

        await conexao.rollback();


        if (
            erro instanceof PedidoServiceError ||
            erro instanceof EstoqueServiceError
        ) {
            throw erro;
        }


        console.error(
            'Erro ao criar pedido:',
            erro
        );


        throw new PedidoServiceError(
            'Erro interno ao criar pedido.',
            500
        );


    } finally {

        conexao.release();
    }
};