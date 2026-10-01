import {
    Request,
    Response
} from 'express';

import {
    criarDespesa,
    listarDespesasPorViagem,
    DespesaServiceError
} from '../services/DespesaService';

export const cadastrarDespesa = async (
    req: Request,
    res: Response
) => {

    try {

        const {
            viagem_id,
            tipo_despesa,
            valor,
            descricao
        } = req.body;


        const despesa = await criarDespesa({
            viagem_id,
            tipo_despesa,
            valor,
            descricao
        });


        return res.status(201).json({
            mensagem: 'Despesa cadastrada com sucesso!',
            despesa
        });


    } catch (erro) {

        if (erro instanceof DespesaServiceError) {

            return res.status(
                erro.statusHttp
            ).json({
                erro: erro.message
            });
        }


        console.error(
            'Erro no controller de despesas:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao cadastrar despesa.'
        });
    }
};

export const buscarDespesasDaViagem = async (
    req: Request,
    res: Response
) => {

    try {

        const viagem_id = Number(req.params.id);


        const resultado =
            await listarDespesasPorViagem(
                viagem_id
            );


        return res.status(200).json({
            mensagem: 'Despesas da viagem encontradas com sucesso!',
            ...resultado
        });


    } catch (erro) {

        if (erro instanceof DespesaServiceError) {

            return res.status(
                erro.statusHttp
            ).json({
                erro: erro.message
            });
        }


        console.error(
            'Erro ao buscar despesas da viagem:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao buscar despesas da viagem.'
        });
    }
};