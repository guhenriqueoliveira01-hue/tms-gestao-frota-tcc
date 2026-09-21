import { Router } from 'express';

import {
    adicionarEstoque,
    retirarEstoque,
    reservarEstoque,
    liberarReservaEstoque
} from '../controllers/EstoqueController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';

const router = Router();

// Entrada de estoque
router.post(
    '/estoque/:sku/entrada',
    verificarToken,
    verificarAdmin,
    adicionarEstoque
);

// Saída de estoque
router.post(
    '/estoque/:sku/saida',
    verificarToken,
    verificarAdmin,
    retirarEstoque
);

// Reserva de estoque
router.post(
    '/estoque/:sku/reservar',
    verificarToken,
    verificarAdmin,
    reservarEstoque
);

// Liberar reserva de estoque
router.post(
    '/estoque/:sku/liberar-reserva',
    verificarToken,
    verificarAdmin,
    liberarReservaEstoque
);

export default router;