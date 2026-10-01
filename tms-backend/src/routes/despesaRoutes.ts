import { Router } from 'express';

import {
    cadastrarDespesa,
    buscarDespesasDaViagem
} from '../controllers/DespesaController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';


const router = Router();


router.post(
    '/despesas',
    verificarToken,
    verificarAdmin,
    cadastrarDespesa
);

router.get(
    '/viagens/:id/despesas',
    verificarToken,
    verificarAdmin,
    buscarDespesasDaViagem
);


export default router;