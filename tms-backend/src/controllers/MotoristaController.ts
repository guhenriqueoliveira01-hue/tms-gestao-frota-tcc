import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';


// ======================================================
// TIPOS
// ======================================================

interface MotoristaExistente extends RowDataPacket {
    cnh: string;
}


interface ViagemMotorista extends RowDataPacket {
    id: number;
}


const STATUS_PERMITIDOS = [
    'DISPONIVEL',
    'INATIVO'
];


// ======================================================
// CADASTRAR MOTORISTA
// ======================================================

export const cadastrarMotorista = async (
    req: Request,
    res: Response
) => {

    const {
        cnh,
        nome,
        telefone,
        status
    } = req.body;


    const cnhNormalizada =
        String(cnh ?? '').trim();

    const nomeNormalizado =
        String(nome ?? '').trim();

    const telefoneNormalizado =
        String(telefone ?? '').trim();

    const statusNormalizado =
        String(status ?? '')
            .trim()
            .toUpperCase();


    if (!cnhNormalizada) {

        return res.status(400).json({
            erro: 'A CNH é obrigatória.'
        });
    }


    if (!nomeNormalizado) {

        return res.status(400).json({
            erro: 'O nome do motorista é obrigatório.'
        });
    }


    if (
        !STATUS_PERMITIDOS.includes(
            statusNormalizado
        )
    ) {

        return res.status(400).json({
            erro: 'Status do motorista inválido.'
        });
    }


    try {

        const [existente] =
            await pool.query<MotoristaExistente[]>(
                `
                SELECT cnh
                FROM motoristas
                WHERE cnh = ?
                LIMIT 1
                `,
                [cnhNormalizada]
            );


        if (existente.length > 0) {

            return res.status(409).json({
                erro: 'Esta CNH já está cadastrada.'
            });
        }


        await pool.execute<ResultSetHeader>(
            `
            INSERT INTO motoristas (
                cnh,
                nome,
                telefone,
                status
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                cnhNormalizada,
                nomeNormalizado,
                telefoneNormalizado || null,
                statusNormalizado
            ]
        );


        return res.status(201).json({
            mensagem:
                'Motorista cadastrado com sucesso!'
        });


    } catch (erro) {

        console.error(
            'Erro ao cadastrar motorista:',
            erro
        );


        return res.status(500).json({
            erro:
                'Erro interno ao cadastrar motorista.'
        });
    }
};


// ======================================================
// LISTAR MOTORISTAS
// ======================================================

export const listarMotoristas = async (
    req: Request,
    res: Response
) => {

    try {

        const [motoristas] =
            await pool.query(
                `
                SELECT
                    cnh,
                    nome,
                    telefone,
                    status
                FROM motoristas
                ORDER BY nome
                `
            );


        return res.status(200).json(
            motoristas
        );


    } catch (erro) {

        console.error(
            'Erro ao listar motoristas:',
            erro
        );


        return res.status(500).json({
            erro:
                'Erro interno ao listar motoristas.'
        });
    }
};


// ======================================================
// ATUALIZAR MOTORISTA
// ======================================================

export const atualizarMotorista = async (
    req: Request,
    res: Response
) => {

    const cnh =
        String(req.params.cnh ?? '').trim();


    const {
        nome,
        telefone,
        status
    } = req.body;


    const nomeNormalizado =
        String(nome ?? '').trim();

    const telefoneNormalizado =
        String(telefone ?? '').trim();

    const statusNormalizado =
        String(status ?? '')
            .trim()
            .toUpperCase();


    if (!cnh) {

        return res.status(400).json({
            erro: 'CNH inválida.'
        });
    }


    if (!nomeNormalizado) {

        return res.status(400).json({
            erro: 'O nome do motorista é obrigatório.'
        });
    }


    if (
        !STATUS_PERMITIDOS.includes(
            statusNormalizado
        )
    ) {

        return res.status(400).json({
            erro: 'Status do motorista inválido.'
        });
    }


    try {

        const [resultado] =
            await pool.execute<ResultSetHeader>(
                `
                UPDATE motoristas
                SET
                    nome = ?,
                    telefone = ?,
                    status = ?
                WHERE cnh = ?
                `,
                [
                    nomeNormalizado,
                    telefoneNormalizado || null,
                    statusNormalizado,
                    cnh
                ]
            );


        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                erro:
                    'Motorista não encontrado.'
            });
        }


        return res.status(200).json({
            mensagem:
                'Motorista atualizado com sucesso!'
        });


    } catch (erro) {

        console.error(
            'Erro ao atualizar motorista:',
            erro
        );


        return res.status(500).json({
            erro:
                'Erro interno ao atualizar motorista.'
        });
    }
};


// ======================================================
// EXCLUIR MOTORISTA
// ======================================================

export const excluirMotorista = async (
    req: Request,
    res: Response
) => {

    const cnh =
        String(req.params.cnh ?? '').trim();


    if (!cnh) {

        return res.status(400).json({
            erro: 'CNH inválida.'
        });
    }


    const conexao =
        await pool.getConnection();


    try {

        await conexao.beginTransaction();


        const [motoristas] =
            await conexao.query<MotoristaExistente[]>(
                `
                SELECT cnh
                FROM motoristas
                WHERE cnh = ?
                FOR UPDATE
                `,
                [cnh]
            );


        if (motoristas.length === 0) {

            await conexao.rollback();


            return res.status(404).json({
                erro:
                    'Motorista não encontrado.'
            });
        }


        /*
         * Mantemos o histórico operacional.
         * Se o motorista já participou de viagens,
         * ele não pode ser apagado fisicamente.
         */

        const [viagens] =
            await conexao.query<ViagemMotorista[]>(
                `
                SELECT id
                FROM viagens
                WHERE motorista_cnh = ?
                LIMIT 1
                `,
                [cnh]
            );


        if (viagens.length > 0) {

            await conexao.rollback();


            return res.status(409).json({
                erro:
                    'Este motorista possui histórico de viagens e não pode ser excluído.'
            });
        }


        await conexao.execute<ResultSetHeader>(
            `
            DELETE FROM motoristas
            WHERE cnh = ?
            `,
            [cnh]
        );


        await conexao.commit();


        return res.status(200).json({
            mensagem:
                'Motorista removido do sistema com sucesso!'
        });


    } catch (erro) {

        await conexao.rollback();


        console.error(
            'Erro ao excluir motorista:',
            erro
        );


        return res.status(500).json({
            erro:
                'Erro interno ao excluir motorista.'
        });


    } finally {

        conexao.release();
    }
};