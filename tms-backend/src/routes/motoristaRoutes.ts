import { Router } from 'express';

import {
    cadastrarMotorista,
    listarMotoristas,
    atualizarMotorista,
    excluirMotorista
} from '../controllers/MotoristaController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';


const router = Router();


// ======================================================
// CADASTRAR MOTORISTA
// ======================================================

router.post(
    '/motoristas',
    verificarToken,
    verificarAdmin,
    cadastrarMotorista
);


// ======================================================
// LISTAR MOTORISTAS
// ======================================================

router.get(
    '/motoristas',
    verificarToken,
    verificarAdmin,
    listarMotoristas
);


// ======================================================
// ATUALIZAR MOTORISTA
// ======================================================

router.put(
    '/motoristas/:cnh',
    verificarToken,
    verificarAdmin,
    atualizarMotorista
);


// ======================================================
// EXCLUIR MOTORISTA
// ======================================================

router.delete(
    '/motoristas/:cnh',
    verificarToken,
    verificarAdmin,
    excluirMotorista
);


export default router;