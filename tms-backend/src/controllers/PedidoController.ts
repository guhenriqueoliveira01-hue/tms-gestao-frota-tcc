import { Request, Response } from 'express';

import {
    criarPedido,
    PedidoServiceError
} from '../services/PedidoService';

import {
    EstoqueServiceError
} from '../services/EstoqueService';


export const criarNovoPedido = async (
    req: Request,
    res: Response
) => {

    try {

        const pedido = await criarPedido(req.body);

        return res.status(201).json({
            mensagem: 'Pedido criado com sucesso!',
            pedido
        });


    } catch (erro) {

        if (
            erro instanceof PedidoServiceError ||
            erro instanceof EstoqueServiceError
        ) {

            return res.status(erro.statusHttp).json({
                erro: erro.message,
                estoque:
                    erro instanceof EstoqueServiceError
                        ? erro.estoque
                        : undefined
            });
        }


        console.error(
            'Erro inesperado no controller de pedidos:',
            erro
        );


        return res.status(500).json({
            erro: 'Erro interno ao criar pedido.'
        });
    }
};