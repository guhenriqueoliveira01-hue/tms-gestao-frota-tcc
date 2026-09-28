import { Request, Response } from 'express';

import {
    criarViagem,
    listarViagens,
    buscarViagemPorId,
    atualizarStatusViagem,
    ViagemServiceError
} from '../services/ViagemService';

export const criarNovaViagem = async (
    req: Request,
    res: Response
) => {

    try {

        const viagem = await criarViagem(req.body);

        return res.status(201).json({
            mensagem: 'Viagem criada com sucesso!',
            viagem
        });

    } catch (erro) {

        if (erro instanceof ViagemServiceError) {

            return res.status(erro.statusHttp).json({
                erro: erro.message
            });
        }


        console.error(
            'Erro inesperado ao criar viagem:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao criar viagem.'
        });
    }
};

export const listarTodasViagens = async (
    req: Request,
    res: Response
) => {

    try {

        const viagens = await listarViagens();

        return res.status(200).json({
            viagens
        });

    } catch (erro) {

        if (erro instanceof ViagemServiceError) {

            return res.status(erro.statusHttp).json({
                erro: erro.message
            });
        }


        console.error(
            'Erro inesperado ao listar viagens:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao listar viagens.'
        });
    }
};

export const buscarViagemDetalhada = async (
    req: Request,
    res: Response
) => {

    try {

        const id = Number(req.params.id);

        const viagem = await buscarViagemPorId(id);

        return res.status(200).json({
            viagem
        });

    } catch (erro) {

        if (erro instanceof ViagemServiceError) {

            return res.status(erro.statusHttp).json({
                erro: erro.message
            });
        }


        console.error(
            'Erro inesperado ao buscar viagem:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao buscar viagem.'
        });
    }
};

export const atualizarStatusDaViagem = async (
    req: Request,
    res: Response
) => {

    try {

        const id = Number(req.params.id);
        const { status } = req.body;

        const viagem =
            await atualizarStatusViagem(
                id,
                status
            );

        return res.status(200).json({
            mensagem: 'Status da viagem atualizado com sucesso!',
            viagem
        });

    } catch (erro) {

        if (erro instanceof ViagemServiceError) {

            return res.status(erro.statusHttp).json({
                erro: erro.message
            });
        }


        console.error(
            'Erro inesperado ao atualizar status da viagem:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao atualizar status da viagem.'
        });
    }
};