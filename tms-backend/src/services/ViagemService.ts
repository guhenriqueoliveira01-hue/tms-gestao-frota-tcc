import {
    ResultSetHeader,
    RowDataPacket
} from 'mysql2/promise';

import pool from '../config/database';

import {
    confirmarSaidaEstoqueTransacional,
    EstoqueServiceError
} from './EstoqueService';

interface ViagemStatusAtual extends RowDataPacket {
    id: number;
    pedido_id: number;
    status: string;
}


interface CriarViagemEntrada {
    pedido_id: number;
    motorista_cnh: string;
    caminhao_id: number;
    saida_prevista?: string | null;
}


interface PedidoViagem extends RowDataPacket {
    id: number;
    status: string;
}


interface MotoristaViagem extends RowDataPacket {
    cnh: string;
    status: string;
}


interface CaminhaoViagem extends RowDataPacket {
    id: number;
    status: string;
}


interface ViagemExistente extends RowDataPacket {
    id: number;
}


interface ViagemListagem extends RowDataPacket {
    id: number;
    pedido_id: number;
    pedido_status: string;

    motorista_cnh: string;
    motorista_nome: string;

    caminhao_id: number;
    caminhao_placa: string;
    caminhao_modelo: string;

    status: string;

    saida_prevista: Date | null;
    iniciado_em: Date | null;
    finalizado_em: Date | null;

    criado_em: Date;
    atualizado_em: Date;
}

interface ItemViagemEstoque extends RowDataPacket {
    produto_id: number;
    quantidade: number;
}


export class ViagemServiceError extends Error {

    statusHttp: number;

    constructor(
        mensagem: string,
        statusHttp: number
    ) {

        super(mensagem);

        this.name = 'ViagemServiceError';
        this.statusHttp = statusHttp;
    }
}


export const criarViagem = async (
    dados: CriarViagemEntrada
) => {

    const {
        pedido_id,
        motorista_cnh,
        caminhao_id,
        saida_prevista = null
    } = dados;


    if (
        !Number.isInteger(pedido_id) ||
        pedido_id <= 0
    ) {

        throw new ViagemServiceError(
            'ID do pedido inválido.',
            400
        );
    }


    if (
        !motorista_cnh ||
        !String(motorista_cnh).trim()
    ) {

        throw new ViagemServiceError(
            'CNH do motorista é obrigatória.',
            400
        );
    }


    if (
        !Number.isInteger(caminhao_id) ||
        caminhao_id <= 0
    ) {

        throw new ViagemServiceError(
            'ID do caminhão inválido.',
            400
        );
    }


    const conexao = await pool.getConnection();


    try {

        await conexao.beginTransaction();


        // Verifica e bloqueia o pedido durante a criação da viagem.
        const [pedidos] =
            await conexao.execute<PedidoViagem[]>(
                `
                SELECT
                    id,
                    status
                FROM pedidos
                WHERE id = ?
                FOR UPDATE
                `,
                [pedido_id]
            );


        if (pedidos.length === 0) {

            throw new ViagemServiceError(
                'Pedido não encontrado.',
                404
            );
        }


        if (
            pedidos[0].status !==
            'PRONTO_PARA_ENVIO'
        ) {

            throw new ViagemServiceError(
                'Somente pedidos PRONTO_PARA_ENVIO podem gerar uma viagem.',
                409
            );
        }


        // Impede mais de uma viagem para o mesmo pedido.
// Impede mais de uma viagem ATIVA para o mesmo pedido.
// Viagens CANCELADAS ficam preservadas no histórico
// e não impedem um novo planejamento.
            const [viagensPedido] =
                await conexao.execute<ViagemExistente[]>(
                    `
                    SELECT id
                    FROM viagens
                    WHERE pedido_id = ?
                    AND status IN (
                        'PLANEJADA',
                        'EM_ANDAMENTO'
                    )
                    LIMIT 1
                    `,
                    [pedido_id]
                );

            if (viagensPedido.length > 0) {

                throw new ViagemServiceError(
                    'Este pedido já possui uma viagem ativa.',
                    409
                );
            }


        // Verifica o motorista.
        const [motoristas] =
            await conexao.execute<MotoristaViagem[]>(
                `
                SELECT
                    cnh,
                    status
                FROM motoristas
                WHERE cnh = ?
                FOR UPDATE
                `,
                [String(motorista_cnh).trim()]
            );


        if (motoristas.length === 0) {

            throw new ViagemServiceError(
                'Motorista não encontrado.',
                404
            );
        }


        if (
            motoristas[0].status !==
            'DISPONIVEL'
        ) {

            throw new ViagemServiceError(
                'Motorista não está disponível.',
                409
            );
        }


        // Impede o mesmo motorista de ficar em duas viagens ativas.
        const [viagensMotorista] =
            await conexao.execute<ViagemExistente[]>(
                `
                SELECT id
                FROM viagens
                WHERE motorista_cnh = ?
                  AND status IN (
                      'PLANEJADA',
                      'EM_ANDAMENTO'
                  )
                LIMIT 1
                `,
                [String(motorista_cnh).trim()]
            );


        if (viagensMotorista.length > 0) {

            throw new ViagemServiceError(
                'Motorista já está associado a uma viagem ativa.',
                409
            );
        }


        // Verifica o caminhão.
        const [caminhoes] =
            await conexao.execute<CaminhaoViagem[]>(
                `
                SELECT
                    id,
                    status
                FROM caminhoes
                WHERE id = ?
                FOR UPDATE
                `,
                [caminhao_id]
            );


        if (caminhoes.length === 0) {

            throw new ViagemServiceError(
                'Caminhão não encontrado.',
                404
            );
        }


        if (
            caminhoes[0].status !==
            'DISPONIVEL'
        ) {

            throw new ViagemServiceError(
                'Caminhão não está disponível.',
                409
            );
        }


        // Impede o mesmo caminhão de ficar em duas viagens ativas.
        const [viagensCaminhao] =
            await conexao.execute<ViagemExistente[]>(
                `
                SELECT id
                FROM viagens
                WHERE caminhao_id = ?
                  AND status IN (
                      'PLANEJADA',
                      'EM_ANDAMENTO'
                  )
                LIMIT 1
                `,
                [caminhao_id]
            );


        if (viagensCaminhao.length > 0) {

            throw new ViagemServiceError(
                'Caminhão já está associado a uma viagem ativa.',
                409
            );
        }


        const [resultado] =
            await conexao.execute<ResultSetHeader>(
                `
                INSERT INTO viagens (
                    pedido_id,
                    motorista_cnh,
                    caminhao_id,
                    status,
                    saida_prevista
                )
                VALUES (?, ?, ?, 'PLANEJADA', ?)
                `,
                [
                    pedido_id,
                    String(motorista_cnh).trim(),
                    caminhao_id,
                    saida_prevista
                ]
            );


        await conexao.commit();


        return {
            id: resultado.insertId,
            pedido_id,
            motorista_cnh:
                String(motorista_cnh).trim(),
            caminhao_id,
            status: 'PLANEJADA',
            saida_prevista
        };


    } catch (erro) {

        await conexao.rollback();


        if (
            erro instanceof
            ViagemServiceError
        ) {

            throw erro;
        }


        console.error(
            'Erro ao criar viagem:',
            erro
        );


        throw new ViagemServiceError(
            'Erro interno ao criar viagem.',
            500
        );


    } finally {

        conexao.release();
    }
};


export const listarViagens = async () => {

    try {

        const [viagens] =
            await pool.execute<ViagemListagem[]>(
                `
                SELECT
                    v.id,
                    v.pedido_id,
                    p.status AS pedido_status,

                    v.motorista_cnh,
                    m.nome AS motorista_nome,

                    v.caminhao_id,
                    c.placa AS caminhao_placa,
                    c.modelo AS caminhao_modelo,

                    v.status,

                    v.saida_prevista,
                    v.iniciado_em,
                    v.finalizado_em,

                    v.criado_em,
                    v.atualizado_em

                FROM viagens v

                INNER JOIN pedidos p
                    ON p.id = v.pedido_id

                INNER JOIN motoristas m
                    ON m.cnh = v.motorista_cnh

                INNER JOIN caminhoes c
                    ON c.id = v.caminhao_id

                ORDER BY
                    v.criado_em DESC,
                    v.id DESC
                `
            );


        return viagens;


    } catch (erro) {

        console.error(
            'Erro ao listar viagens:',
            erro
        );


        throw new ViagemServiceError(
            'Erro interno ao listar viagens.',
            500
        );
    }
};

export const buscarViagemPorId = async (
    id: number
) => {

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new ViagemServiceError(
            'ID da viagem inválido.',
            400
        );
    }


    try {

        const [viagens] =
            await pool.execute<ViagemListagem[]>(
                `
                SELECT
                    v.id,
                    v.pedido_id,
                    p.status AS pedido_status,

                    v.motorista_cnh,
                    m.nome AS motorista_nome,

                    v.caminhao_id,
                    c.placa AS caminhao_placa,
                    c.modelo AS caminhao_modelo,

                    v.status,

                    v.saida_prevista,
                    v.iniciado_em,
                    v.finalizado_em,

                    v.criado_em,
                    v.atualizado_em

                FROM viagens v

                INNER JOIN pedidos p
                    ON p.id = v.pedido_id

                INNER JOIN motoristas m
                    ON m.cnh = v.motorista_cnh

                INNER JOIN caminhoes c
                    ON c.id = v.caminhao_id

                WHERE v.id = ?

                LIMIT 1
                `,
                [id]
            );


        if (viagens.length === 0) {

            throw new ViagemServiceError(
                'Viagem não encontrada.',
                404
            );
        }


        return viagens[0];


    } catch (erro) {

        if (erro instanceof ViagemServiceError) {
            throw erro;
        }


        console.error(
            'Erro ao buscar viagem:',
            erro
        );


        throw new ViagemServiceError(
            'Erro interno ao buscar viagem.',
            500
        );
    }
};

export const atualizarStatusViagem = async (
    id: number,
    novoStatus: string
) => {

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new ViagemServiceError(
            'ID da viagem inválido.',
            400
        );
    }


    const statusPermitidos = [
        'EM_ANDAMENTO',
        'CONCLUIDA',
        'CANCELADA'
    ];


    if (!statusPermitidos.includes(novoStatus)) {

        throw new ViagemServiceError(
            'Status da viagem inválido.',
            400
        );
    }


    const conexao = await pool.getConnection();


    try {

        await conexao.beginTransaction();


        const [viagens] =
            await conexao.execute<ViagemStatusAtual[]>(
                `
                SELECT
                    id,
                    pedido_id,
                    status
                FROM viagens
                WHERE id = ?
                FOR UPDATE
                `,
                [id]
            );


        if (viagens.length === 0) {

            throw new ViagemServiceError(
                'Viagem não encontrada.',
                404
            );
        }


        const viagem = viagens[0];


        // ======================================================
        // PLANEJADA → EM_ANDAMENTO
        // ======================================================

        if (novoStatus === 'EM_ANDAMENTO') {

            if (viagem.status !== 'PLANEJADA') {

                throw new ViagemServiceError(
                    `Não é permitido alterar a viagem de ${viagem.status} para EM_ANDAMENTO.`,
                    409
                );
            }


            /*
             * Primeiro alteramos o pedido.
             *
             * Como tudo está dentro da mesma transação,
             * qualquer erro posterior desfaz essa alteração.
             */

            const [pedidoAtualizado] =
                await conexao.execute<ResultSetHeader>(
                    `
                    UPDATE pedidos
                    SET status = 'EM_TRANSPORTE'
                    WHERE id = ?
                      AND status = 'PRONTO_PARA_ENVIO'
                    `,
                    [viagem.pedido_id]
                );


            if (pedidoAtualizado.affectedRows === 0) {

                throw new ViagemServiceError(
                    'O pedido não está PRONTO_PARA_ENVIO.',
                    409
                );
            }


            // ==================================================
            // BUSCA OS ITENS DO PEDIDO
            // ==================================================

            const [itensPedido] =
                await conexao.execute<ItemViagemEstoque[]>(
                    `
                    SELECT
                        produto_id,
                        quantidade
                    FROM itens_pedido
                    WHERE pedido_id = ?
                    ORDER BY id ASC
                    `,
                    [viagem.pedido_id]
                );


            if (itensPedido.length === 0) {

                throw new ViagemServiceError(
                    'O pedido não possui itens para movimentação de estoque.',
                    409
                );
            }


            // ==================================================
            // CONFIRMA A SAÍDA FÍSICA DO ESTOQUE
            // ==================================================

            for (const item of itensPedido) {

                await confirmarSaidaEstoqueTransacional(
                    conexao,
                    item.produto_id,
                    item.quantidade
                );
            }


            // ==================================================
            // INICIA A VIAGEM
            // ==================================================

            await conexao.execute<ResultSetHeader>(
                `
                UPDATE viagens
                SET
                    status = 'EM_ANDAMENTO',
                    iniciado_em = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
                [id]
            );


            await conexao.commit();


            return {
                id,
                status_anterior: viagem.status,
                status_atual: 'EM_ANDAMENTO',
                pedido_status: 'EM_TRANSPORTE'
            };
        }


        // ======================================================
        // EM_ANDAMENTO → CONCLUIDA
        // ======================================================

        if (novoStatus === 'CONCLUIDA') {

            if (viagem.status !== 'EM_ANDAMENTO') {

                throw new ViagemServiceError(
                    `Não é permitido alterar a viagem de ${viagem.status} para CONCLUIDA.`,
                    409
                );
            }


            const [pedidoAtualizado] =
                await conexao.execute<ResultSetHeader>(
                    `
                    UPDATE pedidos
                    SET status = 'ENTREGUE'
                    WHERE id = ?
                      AND status = 'EM_TRANSPORTE'
                    `,
                    [viagem.pedido_id]
                );


            if (pedidoAtualizado.affectedRows === 0) {

                throw new ViagemServiceError(
                    'O pedido não está EM_TRANSPORTE.',
                    409
                );
            }


            await conexao.execute<ResultSetHeader>(
                `
                UPDATE viagens
                SET
                    status = 'CONCLUIDA',
                    finalizado_em = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
                [id]
            );


            await conexao.commit();


            return {
                id,
                status_anterior: viagem.status,
                status_atual: 'CONCLUIDA',
                pedido_status: 'ENTREGUE'
            };
        }


        // ======================================================
        // PLANEJADA → CANCELADA
        // ======================================================

        if (novoStatus === 'CANCELADA') {

            if (viagem.status !== 'PLANEJADA') {

                throw new ViagemServiceError(
                    `Não é permitido alterar a viagem de ${viagem.status} para CANCELADA.`,
                    409
                );
            }


            /*
             * Uma viagem PLANEJADA ainda não iniciou
             * o transporte.
             *
             * Portanto, o pedido continua disponível
             * para um novo planejamento.
             */

            const [pedidos] =
                await conexao.execute<PedidoViagem[]>(
                    `
                    SELECT
                        id,
                        status
                    FROM pedidos
                    WHERE id = ?
                    FOR UPDATE
                    `,
                    [viagem.pedido_id]
                );


            if (pedidos.length === 0) {

                throw new ViagemServiceError(
                    'Pedido associado à viagem não foi encontrado.',
                    404
                );
            }


            if (
                pedidos[0].status !==
                'PRONTO_PARA_ENVIO'
            ) {

                throw new ViagemServiceError(
                    'O pedido associado não está PRONTO_PARA_ENVIO.',
                    409
                );
            }


            await conexao.execute<ResultSetHeader>(
                `
                UPDATE viagens
                SET status = 'CANCELADA'
                WHERE id = ?
                `,
                [id]
            );


            await conexao.commit();


            return {
                id,
                status_anterior: viagem.status,
                status_atual: 'CANCELADA',
                pedido_status: 'PRONTO_PARA_ENVIO'
            };
        }


        throw new ViagemServiceError(
            'Transição de status inválida.',
            400
        );


    } catch (erro) {

        await conexao.rollback();


        if (erro instanceof ViagemServiceError) {
            throw erro;
        }


        /*
         * Converte um erro do EstoqueService
         * para o padrão de erro do módulo de viagens.
         */

        if (erro instanceof EstoqueServiceError) {

            throw new ViagemServiceError(
                erro.message,
                erro.statusHttp
            );
        }


        console.error(
            'Erro ao atualizar status da viagem:',
            erro
        );


        throw new ViagemServiceError(
            'Erro interno ao atualizar status da viagem.',
            500
        );


    } finally {

        conexao.release();
    }
};
