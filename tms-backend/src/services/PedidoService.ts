import {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket
} from 'mysql2/promise';

import pool from '../config/database';

import {
    reservarEstoqueTransacional,
    liberarReservaEstoqueTransacional,
    confirmarSaidaEstoqueTransacional,
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

interface PedidoResumo extends RowDataPacket {
    id: number;
    cliente_nome: string;
    cliente_email: string | null;
    cliente_telefone: string | null;
    endereco_entrega: string;
    status: string;
    valor_total: string;
    criado_em: Date;
    atualizado_em: Date;
}


export const listarPedidos = async () => {

    const [pedidos] = await pool.execute<PedidoResumo[]>(
        `
        SELECT
            id,
            cliente_nome,
            cliente_email,
            cliente_telefone,
            endereco_entrega,
            status,
            valor_total,
            criado_em,
            atualizado_em
        FROM pedidos
        ORDER BY criado_em DESC, id DESC
        `
    );


    return pedidos.map((pedido) => ({
        ...pedido,
        valor_total: Number(pedido.valor_total)
    }));
};

interface PedidoDetalhado extends RowDataPacket {
    id: number;
    cliente_nome: string;
    cliente_email: string | null;
    cliente_telefone: string | null;
    endereco_entrega: string;
    status: string;
    valor_total: string;
    criado_em: Date;
    atualizado_em: Date;
}

interface ItemPedidoDetalhado extends RowDataPacket {
    id: number;
    produto_id: number;
    sku: string;
    nome: string;
    quantidade: number;
    preco_unitario: string;
    subtotal: string;
}

export const buscarPedidoPorId = async (id: number) => {

    const [pedidos] = await pool.execute<PedidoDetalhado[]>(
        `
        SELECT
            id,
            cliente_nome,
            cliente_email,
            cliente_telefone,
            endereco_entrega,
            status,
            valor_total,
            criado_em,
            atualizado_em
        FROM pedidos
        WHERE id = ?
        `,
        [id]
    );

    if (pedidos.length === 0) {
        throw new PedidoServiceError(
            'Pedido não encontrado.',
            404
        );
    }

    const pedido = pedidos[0];

    const [itens] = await pool.execute<ItemPedidoDetalhado[]>(
        `
        SELECT
            ip.id,
            ip.produto_id,
            p.sku,
            p.nome,
            ip.quantidade,
            ip.preco_unitario,
            ip.subtotal
        FROM itens_pedido ip
        INNER JOIN produtos p
            ON p.id = ip.produto_id
        WHERE ip.pedido_id = ?
        ORDER BY ip.id ASC
        `,
        [id]
    );

    return {
        ...pedido,
        valor_total: Number(pedido.valor_total),
        itens: itens.map((item) => ({
            ...item,
            preco_unitario: Number(item.preco_unitario),
            subtotal: Number(item.subtotal)
        }))
    };
};

type PedidoStatus =
    | 'PENDENTE'
    | 'SEPARANDO'
    | 'PRONTO_PARA_ENVIO'
    | 'EM_TRANSPORTE'
    | 'ENTREGUE'
    | 'CANCELADO';


interface PedidoStatusBanco extends RowDataPacket {
    id: number;
    status: PedidoStatus;
}


interface ItemMovimentacaoEstoque extends RowDataPacket {
    produto_id: number;
    quantidade: number;
}


const statusValidos: PedidoStatus[] = [
    'PENDENTE',
    'SEPARANDO',
    'PRONTO_PARA_ENVIO',
    'EM_TRANSPORTE',
    'ENTREGUE',
    'CANCELADO'
];


const transicoesPermitidas: Record<
    PedidoStatus,
    PedidoStatus[]
> = {

    PENDENTE: [
        'SEPARANDO',
        'CANCELADO'
    ],

    SEPARANDO: [
        'PRONTO_PARA_ENVIO',
        'CANCELADO'
    ],

    PRONTO_PARA_ENVIO: [
        'EM_TRANSPORTE',
        'CANCELADO'
    ],

    EM_TRANSPORTE: [
        'ENTREGUE'
    ],

    ENTREGUE: [],

    CANCELADO: []
};


export const atualizarStatusPedido = async (
    pedidoId: number,
    novoStatusRecebido: string
) => {

    if (
        !Number.isInteger(pedidoId) ||
        pedidoId <= 0
    ) {
        throw new PedidoServiceError(
            'ID do pedido inválido.',
            400
        );
    }


    const novoStatus =
        String(novoStatusRecebido)
            .trim()
            .toUpperCase() as PedidoStatus;


    if (!statusValidos.includes(novoStatus)) {
        throw new PedidoServiceError(
            'Status de pedido inválido.',
            400
        );
    }


    const conexao = await pool.getConnection();


    try {

        await conexao.beginTransaction();


        const [pedidos] =
            await conexao.execute<PedidoStatusBanco[]>(
                `
                SELECT
                    id,
                    status
                FROM pedidos
                WHERE id = ?
                FOR UPDATE
                `,
                [pedidoId]
            );


        if (pedidos.length === 0) {
            throw new PedidoServiceError(
                'Pedido não encontrado.',
                404
            );
        }


        const statusAtual =
            pedidos[0].status;


        if (statusAtual === novoStatus) {
            throw new PedidoServiceError(
                `O pedido já está com o status ${novoStatus}.`,
                409
            );
        }


        if (
            !transicoesPermitidas[
                statusAtual
            ].includes(novoStatus)
        ) {

            throw new PedidoServiceError(
                `Não é permitido alterar o pedido de ${statusAtual} para ${novoStatus}.`,
                409
            );
        }


        if (
            novoStatus === 'CANCELADO' ||
            novoStatus === 'EM_TRANSPORTE'
        ) {

            const [itens] =
                await conexao.execute<ItemMovimentacaoEstoque[]>(
                    `
                    SELECT
                        produto_id,
                        quantidade
                    FROM itens_pedido
                    WHERE pedido_id = ?
                    ORDER BY id ASC
                    `,
                    [pedidoId]
                );


            if (itens.length === 0) {
                throw new PedidoServiceError(
                    'O pedido não possui itens para movimentação de estoque.',
                    409
                );
            }


            for (const item of itens) {

                if (novoStatus === 'CANCELADO') {

                    await liberarReservaEstoqueTransacional(
                        conexao,
                        item.produto_id,
                        item.quantidade
                    );

                }


                if (novoStatus === 'EM_TRANSPORTE') {

                    await confirmarSaidaEstoqueTransacional(
                        conexao,
                        item.produto_id,
                        item.quantidade
                    );

                }
            }
        }


        await conexao.execute<ResultSetHeader>(
            `
            UPDATE pedidos
            SET status = ?
            WHERE id = ?
            `,
            [
                novoStatus,
                pedidoId
            ]
        );


        await conexao.commit();


        return {
            id: pedidoId,
            status_anterior: statusAtual,
            status_atual: novoStatus
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
            'Erro ao atualizar status do pedido:',
            erro
        );


        throw new PedidoServiceError(
            'Erro interno ao atualizar status do pedido.',
            500
        );


    } finally {

        conexao.release();
    }
};