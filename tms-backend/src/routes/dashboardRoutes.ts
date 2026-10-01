import { Router } from 'express';

import {
    buscarResumoDashboard
} from '../controllers/DashboardController';

import {
    verificarToken,
    verificarAdmin
} from '../middlewares/authMiddleware';


const router = Router();


router.get(
    '/dashboard/resumo',
    verificarToken,
    verificarAdmin,
    buscarResumoDashboard
);


export default router;