import { Router } from 'express';
// Aqui em cima eu já organizei todas as funções que o arquivo precisa
import { 
    cadastrarCaminhao, 
    listarCaminhoes, 
    atualizarCaminhao, 
    excluirCaminhao 
} from '../controllers/CaminhaoController';

const router = Router();

// Aqui estão as 4 operações (CRUD) completas:
router.post('/caminhoes', cadastrarCaminhao);      // Criar
router.get('/caminhoes', listarCaminhoes);         // Ler
router.put('/caminhoes/:placa', atualizarCaminhao);   // Atualizar
router.delete('/caminhoes/:placa', excluirCaminhao); // Excluir

export default router;