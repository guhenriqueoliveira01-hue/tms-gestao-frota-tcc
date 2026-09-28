import { Router } from 'express';

import {
    criarNovaViagem,
    listarTodasViagens,
    buscarViagemDetalhada,
    atualizarStatusDaViagem
} from '../controllers/ViagemController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';


const router = Router();

router.get(
    '/viagens',
    verificarToken,
    verificarAdmin,
    listarTodasViagens
);
router.get(
    '/viagens/:id',
    verificarToken,
    verificarAdmin,
    buscarViagemDetalhada
);

router.patch(
    '/viagens/:id/status',
    verificarToken,
    verificarAdmin,
    atualizarStatusDaViagem
);

router.post(
    '/viagens',
    verificarToken,
    verificarAdmin,
    criarNovaViagem
);


export default router;