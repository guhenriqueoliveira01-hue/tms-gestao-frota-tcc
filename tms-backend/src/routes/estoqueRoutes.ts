import { Router } from 'express';
import { adicionarEstoque } from '../controllers/EstoqueController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';

const router = Router();

// Adicionar entrada de estoque
router.post(
    '/estoque/:sku/entrada',
    verificarToken,
    verificarAdmin,
    adicionarEstoque
);

export default router;