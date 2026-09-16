import { Router } from 'express';

import {
    cadastrarUsuario,
    loginUsuario,
    listarUsuarios,
    atualizarUsuario,
    excluirUsuario
} from '../controllers/UsuarioController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';

const router = Router();

// ======================================================
// ROTAS PÚBLICAS
// ======================================================

// Cadastro de usuário
router.post('/cadastro', cadastrarUsuario);

// Login de usuário
router.post('/login', loginUsuario);

// ======================================================
// ROTAS PROTEGIDAS
// ======================================================

router.get(
    '/usuarios',
    verificarToken,
    verificarAdmin,
    listarUsuarios
);

router.put(
    '/usuarios/:id',
    verificarToken,
    verificarAdmin,
    atualizarUsuario
);

router.delete(
    '/usuarios/:id',
    verificarToken,
    verificarAdmin,
    excluirUsuario
);

export default router;