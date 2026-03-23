import { Router } from 'express';
import { listarCaminhoes, cadastrarCaminhao } from '../controllers/CaminhaoController';

const router = Router();

// Rota GET: Para buscar informações
router.get('/caminhoes', listarCaminhoes);

// Rota POST: Para enviar informações e cadastrar
router.post('/caminhoes', cadastrarCaminhao);

export default router;