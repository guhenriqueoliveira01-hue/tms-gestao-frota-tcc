import {
    Request,
    Response
} from 'express';

import {
    ResultSetHeader,
    RowDataPacket
} from 'mysql2/promise';

import pool from '../config/database';


interface Caminhao extends RowDataPacket {
    id: number;
    placa: string;
    modelo: string;
    capacidade_kg: number;
    status: string;
}


const STATUS_PERMITIDOS = [
    'DISPONIVEL',
    'EM_MANUTENCAO',
    'INATIVO'
];


/*
 * =========================================================
 * CADASTRAR CAMINHÃO
 * POST /caminhoes
 * =========================================================
 */
export const cadastrarCaminhao = async (
    req: Request,
    res: Response
) => {

    const {
        placa,
        modelo,
        capacidade_kg,
        status
    } = req.body;


    /*
     * Validação dos campos obrigatórios.
     */
    if (
        !placa ||
        !modelo ||
        capacidade_kg === undefined ||
        !status
    ) {

        return res.status(400).json({
            erro: 'Placa, modelo, capacidade e status são obrigatórios.'
        });
    }


    const placaNormalizada =
        String(placa)
            .trim()
            .toUpperCase();


    const modeloNormalizado =
        String(modelo).trim();


    const capacidade =
        Number(capacidade_kg);


    const statusNormalizado =
        String(status)
            .trim()
            .toUpperCase();


    if (!placaNormalizada) {

        return res.status(400).json({
            erro: 'Placa inválida.'
        });
    }


    if (!modeloNormalizado) {

        return res.status(400).json({
            erro: 'Modelo inválido.'
        });
    }


    if (
        !Number.isFinite(capacidade) ||
        capacidade <= 0
    ) {

        return res.status(400).json({
            erro: 'A capacidade deve ser maior que zero.'
        });
    }


    if (
        !STATUS_PERMITIDOS.includes(
            statusNormalizado
        )
    ) {

        return res.status(400).json({
            erro: 'Status do caminhão inválido.'
        });
    }


    try {

        /*
         * Verifica placa duplicada.
         */
        const [caminhoesExistentes] =
            await pool.execute<Caminhao[]>(
                `
                SELECT
                    id,
                    placa,
                    modelo,
                    capacidade_kg,
                    status
                FROM caminhoes
                WHERE placa = ?
                LIMIT 1
                `,
                [
                    placaNormalizada
                ]
            );


        if (
            caminhoesExistentes.length > 0
        ) {

            return res.status(409).json({
                erro: 'Este caminhão já está cadastrado no sistema.'
            });
        }


        /*
         * Cadastra o caminhão.
         */
        const [resultado] =
            await pool.execute<ResultSetHeader>(
                `
                INSERT INTO caminhoes (
                    placa,
                    modelo,
                    capacidade_kg,
                    status
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    placaNormalizada,
                    modeloNormalizado,
                    capacidade,
                    statusNormalizado
                ]
            );


        return res.status(201).json({

            mensagem:
                'Caminhão cadastrado com sucesso!',

            caminhao: {
                id: resultado.insertId,
                placa: placaNormalizada,
                modelo: modeloNormalizado,
                capacidade_kg: capacidade,
                status: statusNormalizado
            }
        });


    } catch (erro) {

        console.error(
            'Erro ao cadastrar caminhão:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao cadastrar o caminhão.'
        });
    }
};


/*
 * =========================================================
 * LISTAR CAMINHÕES
 * GET /caminhoes
 * =========================================================
 */
export const listarCaminhoes = async (
    req: Request,
    res: Response
) => {

    try {

        const [caminhoes] =
            await pool.execute<Caminhao[]>(
                `
                SELECT
                    id,
                    placa,
                    modelo,
                    capacidade_kg,
                    status
                FROM caminhoes
                ORDER BY id
                `
            );


        return res.status(200).json(
            caminhoes
        );


    } catch (erro) {

        console.error(
            'Erro ao listar caminhões:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao buscar os caminhões.'
        });
    }
};


/*
 * =========================================================
 * ATUALIZAR CAMINHÃO
 * PUT /caminhoes/:placa
 * =========================================================
 */
export const atualizarCaminhao = async (
    req: Request,
    res: Response
) => {

    const placa =
        String(req.params.placa)
            .trim()
            .toUpperCase();


    const {
        modelo,
        capacidade_kg,
        status
    } = req.body;


    if (
        !modelo ||
        capacidade_kg === undefined ||
        !status
    ) {

        return res.status(400).json({
            erro: 'Modelo, capacidade e status são obrigatórios.'
        });
    }


    const modeloNormalizado =
        String(modelo).trim();


    const capacidade =
        Number(capacidade_kg);


    const statusNormalizado =
        String(status)
            .trim()
            .toUpperCase();


    if (
        !Number.isFinite(capacidade) ||
        capacidade <= 0
    ) {

        return res.status(400).json({
            erro: 'A capacidade deve ser maior que zero.'
        });
    }


    if (
        !STATUS_PERMITIDOS.includes(
            statusNormalizado
        )
    ) {

        return res.status(400).json({
            erro: 'Status do caminhão inválido.'
        });
    }


    try {

        const [resultado] =
            await pool.execute<ResultSetHeader>(
                `
                UPDATE caminhoes
                SET
                    modelo = ?,
                    capacidade_kg = ?,
                    status = ?
                WHERE placa = ?
                `,
                [
                    modeloNormalizado,
                    capacidade,
                    statusNormalizado,
                    placa
                ]
            );


        if (
            resultado.affectedRows === 0
        ) {

            return res.status(404).json({
                erro: 'Caminhão não encontrado.'
            });
        }


        return res.status(200).json({

            mensagem:
                'Dados do caminhão atualizados com sucesso!',

            caminhao: {
                placa,
                modelo: modeloNormalizado,
                capacidade_kg: capacidade,
                status: statusNormalizado
            }
        });


    } catch (erro) {

        console.error(
            'Erro ao atualizar caminhão:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao atualizar o caminhão.'
        });
    }
};


/*
 * =========================================================
 * EXCLUIR CAMINHÃO
 * DELETE /caminhoes/:placa
 * =========================================================
 */
export const excluirCaminhao = async (
    req: Request,
    res: Response
) => {

    const placa =
        String(req.params.placa)
            .trim()
            .toUpperCase();


    try {

        /*
         * Primeiro localizamos o caminhão.
         */
        const [caminhoes] =
            await pool.execute<Caminhao[]>(
                `
                SELECT
                    id,
                    placa,
                    modelo,
                    capacidade_kg,
                    status
                FROM caminhoes
                WHERE placa = ?
                LIMIT 1
                `,
                [
                    placa
                ]
            );


        if (
            caminhoes.length === 0
        ) {

            return res.status(404).json({
                erro: 'Caminhão não encontrado para exclusão.'
            });
        }


        const caminhao =
            caminhoes[0];


        /*
         * Protege o histórico operacional.
         *
         * Um caminhão que já participou de uma viagem
         * não deve ser apagado fisicamente do banco.
         */
        const [viagens] =
            await pool.execute<RowDataPacket[]>(
                `
                SELECT id
                FROM viagens
                WHERE caminhao_id = ?
                LIMIT 1
                `,
                [
                    caminhao.id
                ]
            );


        if (
            viagens.length > 0
        ) {

            return res.status(409).json({
                erro:
                    'Este caminhão possui histórico de viagens e não pode ser excluído.'
            });
        }


        const [resultado] =
            await pool.execute<ResultSetHeader>(
                `
                DELETE FROM caminhoes
                WHERE id = ?
                `,
                [
                    caminhao.id
                ]
            );


        if (
            resultado.affectedRows === 0
        ) {

            return res.status(404).json({
                erro: 'Caminhão não encontrado para exclusão.'
            });
        }


        return res.status(200).json({
            mensagem:
                'Caminhão removido do sistema com sucesso!'
        });


    } catch (erro) {

        console.error(
            'Erro ao excluir caminhão:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao excluir o caminhão.'
        });
    }
};