import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET não foi definida no arquivo .env.'
    );
}

export interface AuthenticatedRequest extends Request {
    usuario?: {
        id: number;
        email?: string;
        tipo_perfil?: string;
    };
}

export const verificarToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                erro: 'Token de autenticação não informado.'
            });
        }

        const partes = authHeader.split(' ');

        if (
            partes.length !== 2 ||
            partes[0] !== 'Bearer'
        ) {
            return res.status(401).json({
                erro: 'Formato do token inválido.'
            });
        }

        const token = partes[1];

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

        if (typeof decoded === 'string') {
            return res.status(401).json({
                erro: 'Token inválido.'
            });
        }

        req.usuario = {
            id: Number(decoded.id),
            email:
                typeof decoded.email === 'string'
                    ? decoded.email
                    : undefined,
            tipo_perfil:
                typeof decoded.tipo_perfil === 'string'
                    ? decoded.tipo_perfil
                    : undefined
        };

        next();

    } catch (erro) {
        return res.status(401).json({
            erro: 'Token inválido ou expirado.'
        });
    }
};

export const verificarAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.usuario) {
        return res.status(401).json({
            erro: 'Usuário não autenticado.'
        });
    }

    if (req.usuario.tipo_perfil !== 'ADMIN') {
        return res.status(403).json({
            erro: 'Acesso permitido apenas para administradores.'
        });
    }

    next();
};