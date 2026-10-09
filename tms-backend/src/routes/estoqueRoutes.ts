import { Router } from 'express';

import {
    adicionarEstoque,
    retirarEstoque
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

// Saída manual de estoque
router.post(
    '/estoque/:sku/saida',
    verificarToken,
    verificarAdmin,
    retirarEstoque
);

export default router;