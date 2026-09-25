import { Router } from 'express';

import {
    criarNovoPedido,
    listarTodosPedidos,
    buscarPedidoDetalhado,
      atualizarStatusDoPedido
} from '../controllers/PedidoController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';


const router = Router();

router.get(
    '/pedidos',
    verificarToken,
    verificarAdmin,
    listarTodosPedidos,
);
router.get(
    '/pedidos/:id',
    verificarToken,
    verificarAdmin,
    buscarPedidoDetalhado
);

router.patch(
    '/pedidos/:id/status',
    verificarToken,
    verificarAdmin,
    atualizarStatusDoPedido
);

router.post(
    '/pedidos',
    verificarToken,
    verificarAdmin,
    criarNovoPedido
);


export default router;