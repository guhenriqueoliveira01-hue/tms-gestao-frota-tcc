import {
    ResultSetHeader,
    RowDataPacket
} from 'mysql2/promise';

import pool from '../config/database';

interface DespesaListagem extends RowDataPacket {
    id: number;
    viagem_id: number;
    tipo_despesa: string;
    valor: string;
    descricao: string | null;
    data_hora: Date;
}

interface TotalDespesas extends RowDataPacket {
    total: string;
}


interface CriarDespesaEntrada {
    viagem_id: number;
    tipo_despesa: string;
    valor: number;
    descricao?: string | null;
}


interface ViagemDespesa extends RowDataPacket {
    id: number;
    status: string;
}


export class DespesaServiceError extends Error {

    statusHttp: number;

    constructor(
        mensagem: string,
        statusHttp: number
    ) {

        super(mensagem);

        this.name = 'DespesaServiceError';
        this.statusHttp = statusHttp;
    }
}


export const criarDespesa = async (
    dados: CriarDespesaEntrada
) => {

    const {
        viagem_id,
        tipo_despesa,
        valor,
        descricao = null
    } = dados;


    /*
     * Validação da viagem.
     */
    if (
        !Number.isInteger(viagem_id) ||
        viagem_id <= 0
    ) {

        throw new DespesaServiceError(
            'ID da viagem inválido.',
            400
        );
    }


    /*
     * Tipos de despesa aceitos pelo sistema.
     */
    const tiposPermitidos = [
        'COMBUSTIVEL',
        'PEDAGIO',
        'MANUTENCAO',
        'OUTROS'
    ];


    if (!tiposPermitidos.includes(tipo_despesa)) {

        throw new DespesaServiceError(
            'Tipo de despesa inválido.',
            400
        );
    }


    /*
     * O valor precisa ser maior que zero.
     */
    if (
        typeof valor !== 'number' ||
        !Number.isFinite(valor) ||
        valor <= 0
    ) {

        throw new DespesaServiceError(
            'O valor da despesa deve ser maior que zero.',
            400
        );
    }


    /*
     * A coluna descricao possui VARCHAR(255).
     */
    if (
        descricao !== null &&
        descricao.length > 255
    ) {

        throw new DespesaServiceError(
            'A descrição deve possuir no máximo 255 caracteres.',
            400
        );
    }


    const conexao = await pool.getConnection();


    try {

        await conexao.beginTransaction();


        /*
         * Confirma que a viagem realmente existe.
         */
        const [viagens] =
            await conexao.execute<ViagemDespesa[]>(
                `
                SELECT
                    id,
                    status
                FROM viagens
                WHERE id = ?
                FOR UPDATE
                `,
                [viagem_id]
            );


        if (viagens.length === 0) {

            throw new DespesaServiceError(
                'Viagem não encontrada.',
                404
            );
        }


        /*
         * Para o MVP, despesas operacionais são registradas
         * somente depois que a viagem começou.
         */
        if (
            ![
                'EM_ANDAMENTO',
                'CONCLUIDA'
            ].includes(viagens[0].status)
        ) {

            throw new DespesaServiceError(
                'Despesas só podem ser registradas em viagens EM_ANDAMENTO ou CONCLUIDAS.',
                409
            );
        }


        const [resultado] =
            await conexao.execute<ResultSetHeader>(
                `
                INSERT INTO despesas (
                    viagem_id,
                    tipo_despesa,
                    valor,
                    descricao
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    viagem_id,
                    tipo_despesa,
                    valor,
                    descricao
                        ? descricao.trim()
                        : null
                ]
            );


        await conexao.commit();


        return {
            id: resultado.insertId,
            viagem_id,
            tipo_despesa,
            valor,
            descricao:
                descricao
                    ? descricao.trim()
                    : null
        };


    } catch (erro) {

        await conexao.rollback();


        if (erro instanceof DespesaServiceError) {
            throw erro;
        }


        console.error(
            'Erro ao criar despesa:',
            erro
        );


        throw new DespesaServiceError(
            'Erro interno ao criar despesa.',
            500
        );


    } finally {

        conexao.release();
    }
};

export const listarDespesasPorViagem = async (
    viagem_id: number
) => {

    if (
        !Number.isInteger(viagem_id) ||
        viagem_id <= 0
    ) {

        throw new DespesaServiceError(
            'ID da viagem inválido.',
            400
        );
    }


    try {

        /*
         * Confirma que a viagem existe.
         */
        const [viagens] =
            await pool.execute<ViagemDespesa[]>(
                `
                SELECT
                    id,
                    status
                FROM viagens
                WHERE id = ?
                LIMIT 1
                `,
                [viagem_id]
            );


        if (viagens.length === 0) {

            throw new DespesaServiceError(
                'Viagem não encontrada.',
                404
            );
        }


        /*
         * Busca todas as despesas da viagem.
         */
        const [despesas] =
            await pool.execute<DespesaListagem[]>(
                `
                SELECT
                    id,
                    viagem_id,
                    tipo_despesa,
                    valor,
                    descricao,
                    data_hora
                FROM despesas
                WHERE viagem_id = ?
                ORDER BY
                    data_hora ASC,
                    id ASC
                `,
                [viagem_id]
            );


        /*
         * Calcula o total gasto na viagem.
         */
        const [totais] =
            await pool.execute<TotalDespesas[]>(
                `
                SELECT
                    COALESCE(
                        SUM(valor),
                        0
                    ) AS total
                FROM despesas
                WHERE viagem_id = ?
                `,
                [viagem_id]
            );


        return {
            viagem_id,
            total_despesas:
                Number(totais[0].total),
            despesas: despesas.map(
                (despesa) => ({
                    ...despesa,
                    valor: Number(despesa.valor)
                })
            )
        };


    } catch (erro) {

        if (erro instanceof DespesaServiceError) {
            throw erro;
        }


        console.error(
            'Erro ao listar despesas da viagem:',
            erro
        );


        throw new DespesaServiceError(
            'Erro interno ao listar despesas da viagem.',
            500
        );
    }
};