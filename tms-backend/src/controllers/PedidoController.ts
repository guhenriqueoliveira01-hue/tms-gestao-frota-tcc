import { Request, Response } from 'express';

import {
    criarPedido,
    PedidoServiceError,
    listarPedidos,
    buscarPedidoPorId,
    atualizarStatusPedido
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

export const listarTodosPedidos = async (
    req: Request,
    res: Response
) => {

    try {

        const pedidos = await listarPedidos();

        return res.status(200).json({
            pedidos
        });

    } catch (erro) {

        console.error(
            'Erro ao listar pedidos:',
            erro
        );

        return res.status(500).json({
            erro: 'Erro interno ao listar pedidos.'
        });
    }
};

export const buscarPedidoDetalhado = async (
    req: Request,
    res: Response
) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'ID do pedido inválido.'
            });
        }

        const pedido = await buscarPedidoPorId(id);

        return res.status(200).json({
            pedido
        });

    } catch (erro) {

        if (erro instanceof PedidoServiceError) {
            return res.status(erro.statusHttp).json({
                erro: erro.message
            });
        }

        console.error(
            'Erro ao buscar pedido:',
            erro
        );

        return res.status(500).json({
            erro: 'Erro interno ao buscar pedido.'
        });
    }
};

export const atualizarStatusDoPedido = async (
    req: Request,
    res: Response
) => {

    try {

        const id = Number(req.params.id);
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                erro: 'O novo status é obrigatório.'
            });
        }

        const resultado = await atualizarStatusPedido(
            id,
            status
        );

        return res.status(200).json({
            mensagem: 'Status do pedido atualizado com sucesso!',
            pedido: resultado
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
            'Erro inesperado ao atualizar status do pedido:',
            erro
        );

        return res.status(500).json({
            erro: 'Erro interno ao atualizar status do pedido.'
        });
    }
};