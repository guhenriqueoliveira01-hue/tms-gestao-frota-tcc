import { Router } from 'express';

import {
    criarNovoPedido
} from '../controllers/PedidoController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';


const router = Router();


router.post(
    '/pedidos',
    verificarToken,
    verificarAdmin,
    criarNovoPedido
);


export default router;