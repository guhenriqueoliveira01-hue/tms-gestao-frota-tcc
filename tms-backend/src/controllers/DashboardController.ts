import {
    Request,
    Response
} from 'express';

import {
    obterResumoDashboard,
    DashboardServiceError
} from '../services/DashboardService';


export const buscarResumoDashboard = async (
    req: Request,
    res: Response
) => {

    try {

        const resumo =
            await obterResumoDashboard();


        return res.status(200).json({
            mensagem: 'Resumo do dashboard gerado com sucesso!',
            dashboard: resumo
        });


    } catch (erro) {

        if (erro instanceof DashboardServiceError) {

            return res.status(
                erro.statusHttp
            ).json({
                erro: erro.message
            });
        }


        console.error(
            'Erro no controller do dashboard:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao gerar dashboard.'
        });
    }
};