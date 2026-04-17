import { Router } from 'express';
// Aqui ficam as importações das suas funções do controller de motoristas
import { 
    cadastrarMotorista, 
    listarMotoristas, 
    atualizarMotorista, 
    excluirMotorista 
} from '../controllers/MotoristaController';

// 1. Importando o nosso segurança
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

// 2. Colocando o segurança na porta de todas as rotas de motoristas!
router.post('/motoristas', verificarToken, cadastrarMotorista);
router.get('/motoristas', verificarToken, listarMotoristas);
router.put('/motoristas/:id', verificarToken, atualizarMotorista); // Obs: pode ser :cpf no seu projeto
router.delete('/motoristas/:id', verificarToken, excluirMotorista);

export default router;