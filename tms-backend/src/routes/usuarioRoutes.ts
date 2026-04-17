import { Router } from 'express';
import { 
    cadastrarUsuario, 
    listarUsuarios, 
    atualizarUsuario, 
    excluirUsuario,
    loginUsuario
} from '../controllers/UsuarioController';

const router = Router();

// Definindo as rotas (CRUD) usando o ID numérico automático como parâmetro nas rotas PUT e DELETE
router.post('/usuarios', cadastrarUsuario);
router.get('/usuarios', listarUsuarios);
router.put('/usuarios/:id', atualizarUsuario);
router.delete('/usuarios/:id', excluirUsuario);
router.post('/login', loginUsuario); // <-- Nova rota de login
export default router;