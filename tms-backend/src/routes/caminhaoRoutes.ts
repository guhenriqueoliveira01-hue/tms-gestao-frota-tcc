import { Router } from 'express';

import {
    cadastrarCaminhao,
    listarCaminhoes,
    atualizarCaminhao,
    excluirCaminhao
} from '../controllers/CaminhaoController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';


const router = Router();


router.post(
    '/caminhoes',
    verificarToken,
    verificarAdmin,
    cadastrarCaminhao
);


router.get(
    '/caminhoes',
    verificarToken,
    verificarAdmin,
    listarCaminhoes
);


router.put(
    '/caminhoes/:placa',
    verificarToken,
    verificarAdmin,
    atualizarCaminhao
);


router.delete(
    '/caminhoes/:placa',
    verificarToken,
    verificarAdmin,
    excluirCaminhao
);


export default router;