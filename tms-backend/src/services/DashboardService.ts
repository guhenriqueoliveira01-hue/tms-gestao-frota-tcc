import {
    RowDataPacket
} from 'mysql2/promise';

import pool from '../config/database';


interface ContagemStatus extends RowDataPacket {
    status: string;
    total: number;
}


interface TotalDespesas extends RowDataPacket {
    total: string | null;
}


interface DespesasPorTipo extends RowDataPacket {
    tipo_despesa: string;
    total: string;
}


interface ResumoFrota extends RowDataPacket {
    total: number;
    disponiveis: number;
}


export class DashboardServiceError extends Error {

    statusHttp: number;

    constructor(
        mensagem: string,
        statusHttp: number
    ) {

        super(mensagem);

        this.name = 'DashboardServiceError';
        this.statusHttp = statusHttp;
    }
}


export const obterResumoDashboard = async () => {

    try {

        /*
         * PEDIDOS POR STATUS
         */
        const [pedidosPorStatus] =
            await pool.execute<ContagemStatus[]>(
                `
                SELECT
                    status,
                    COUNT(*) AS total
                FROM pedidos
                GROUP BY status
                `
            );


        /*
         * VIAGENS POR STATUS
         */
        const [viagensPorStatus] =
            await pool.execute<ContagemStatus[]>(
                `
                SELECT
                    status,
                    COUNT(*) AS total
                FROM viagens
                GROUP BY status
                `
            );


        /*
         * TOTAL GERAL DE DESPESAS
         */
        const [totalDespesas] =
            await pool.execute<TotalDespesas[]>(
                `
                SELECT
                    COALESCE(
                        SUM(valor),
                        0
                    ) AS total
                FROM despesas
                `
            );


        /*
         * DESPESAS AGRUPADAS POR TIPO
         */
        const [despesasPorTipo] =
            await pool.execute<DespesasPorTipo[]>(
                `
                SELECT
                    tipo_despesa,
                    COALESCE(
                        SUM(valor),
                        0
                    ) AS total
                FROM despesas
                GROUP BY tipo_despesa
                ORDER BY tipo_despesa
                `
            );


        /*
         * RESUMO DOS CAMINHÕES
         */
        const [caminhoes] =
            await pool.execute<ResumoFrota[]>(
                `
                SELECT
                    COUNT(*) AS total,
                    SUM(
                        CASE
                            WHEN status = 'DISPONIVEL'
                            THEN 1
                            ELSE 0
                        END
                    ) AS disponiveis
                FROM caminhoes
                `
            );


        /*
         * RESUMO DOS MOTORISTAS
         */
        const [motoristas] =
            await pool.execute<ResumoFrota[]>(
                `
                SELECT
                    COUNT(*) AS total,
                    SUM(
                        CASE
                            WHEN status = 'DISPONIVEL'
                            THEN 1
                            ELSE 0
                        END
                    ) AS disponiveis
                FROM motoristas
                `
            );


        /*
         * Calcula total de pedidos.
         */
        const totalPedidos =
            pedidosPorStatus.reduce(
                (total, item) =>
                    total + Number(item.total),
                0
            );


        /*
         * Calcula total de viagens.
         */
        const totalViagens =
            viagensPorStatus.reduce(
                (total, item) =>
                    total + Number(item.total),
                0
            );


        return {

            pedidos: {
                total: totalPedidos,

                por_status:
                    Object.fromEntries(
                        pedidosPorStatus.map(
                            (item) => [
                                item.status,
                                Number(item.total)
                            ]
                        )
                    )
            },


            viagens: {
                total: totalViagens,

                por_status:
                    Object.fromEntries(
                        viagensPorStatus.map(
                            (item) => [
                                item.status,
                                Number(item.total)
                            ]
                        )
                    )
            },


            despesas: {
                total:
                    Number(
                        totalDespesas[0]?.total ?? 0
                    ),

                por_tipo:
                    Object.fromEntries(
                        despesasPorTipo.map(
                            (item) => [
                                item.tipo_despesa,
                                Number(item.total)
                            ]
                        )
                    )
            },


            frota: {

                caminhoes: {
                    total:
                        Number(
                            caminhoes[0]?.total ?? 0
                        ),

                    disponiveis:
                        Number(
                            caminhoes[0]?.disponiveis ?? 0
                        )
                },


                motoristas: {
                    total:
                        Number(
                            motoristas[0]?.total ?? 0
                        ),

                    disponiveis:
                        Number(
                            motoristas[0]?.disponiveis ?? 0
                        )
                }
            }
        };


    } catch (erro) {

        console.error(
            'Erro ao gerar resumo do dashboard:',
            erro
        );


        throw new DashboardServiceError(
            'Erro interno ao gerar resumo do dashboard.',
            500
        );
    }
};