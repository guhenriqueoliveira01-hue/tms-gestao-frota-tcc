import { Router } from 'express';
import {
    cadastrarProduto,
    listarProdutos,
    buscarProdutoPorSku
} from '../controllers/ProdutoController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';

const router = Router();

// Listar produtos
router.get(
    '/produtos',
    verificarToken,
    listarProdutos
);

// Buscar produto por SKU
router.get(
    '/produtos/:sku',
    verificarToken,
    buscarProdutoPorSku
);

// Cadastrar produto
router.post(
    '/produtos',
    verificarToken,
    verificarAdmin,
    cadastrarProduto
);

export default router;