import { Router } from 'express';
import { 
    cadastrarUsuario, 
    listarUsuarios, 
    atualizarUsuario, 
    excluirUsuario,
    loginUsuario // Esta função vai conter a lógica de busca no banco
} from '../controllers/UsuarioController';

const router = Router();

// Rotas do Usuário
router.post('/cadastro', cadastrarUsuario); // Ajustado para bater com seu cadastro.html
router.get('/usuarios', listarUsuarios);
router.put('/usuarios/:id', atualizarUsuario);
router.delete('/usuarios/:id', excluirUsuario);

// Rota de Login (apenas uma vez!)
router.post('/login', loginUsuario);

export default router;