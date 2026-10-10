import {
    Request,
    Response,
    NextFunction
} from 'express';

import jwt from 'jsonwebtoken';

import {
    RowDataPacket
} from 'mysql2/promise';

import pool from '../config/database';

import 'dotenv/config';


// ======================================================
// CONFIGURAÇÃO JWT
// ======================================================

const JWT_SECRET =
    process.env.JWT_SECRET;


if (!JWT_SECRET) {

    throw new Error(
        'JWT_SECRET não foi definida no arquivo .env.'
    );
}


// ======================================================
// TIPOS
// ======================================================

interface UsuarioAutenticadoBanco
    extends RowDataPacket {

    id: number;
    email: string;
    tipo_perfil: string;
}


export interface AuthenticatedRequest
    extends Request {

    usuario?: {
        id: number;
        email?: string;
        tipo_perfil?: string;
    };
}


// ======================================================
// VERIFICAR TOKEN
// ======================================================

export const verificarToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {

    try {

        const authHeader =
            req.headers.authorization;


        if (!authHeader) {

            return res.status(401).json({
                erro:
                    'Token de autenticação não informado.'
            });
        }


        const partes =
            authHeader.split(' ');


        if (
            partes.length !== 2 ||
            partes[0] !== 'Bearer'
        ) {

            return res.status(401).json({
                erro:
                    'Formato do token inválido.'
            });
        }


        const token =
            partes[1];


        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );


        if (
            typeof decoded === 'string'
        ) {

            return res.status(401).json({
                erro:
                    'Token inválido.'
            });
        }


        const usuarioId =
            Number(decoded.id);


        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {

            return res.status(401).json({
                erro:
                    'Token inválido.'
            });
        }


        /*
         * O JWT serve apenas para identificar
         * o usuário.
         *
         * O perfil atual e a existência do usuário
         * são confirmados diretamente no banco.
         *
         * Isso impede que um token antigo continue
         * concedendo permissões depois que o usuário
         * for removido ou tiver seu perfil alterado.
         */

        const [usuarios] =
            await pool.execute<
                UsuarioAutenticadoBanco[]
            >(
                `
                SELECT
                    id,
                    email,
                    tipo_perfil
                FROM usuarios
                WHERE id = ?
                LIMIT 1
                `,
                [usuarioId]
            );


        if (usuarios.length === 0) {

            return res.status(401).json({
                erro:
                    'Usuário associado ao token não existe mais.'
            });
        }


        const usuario =
            usuarios[0];


        req.usuario = {
            id: usuario.id,
            email: usuario.email,
            tipo_perfil:
                usuario.tipo_perfil
        };


        next();


    } catch (erro) {

        return res.status(401).json({
            erro:
                'Token inválido ou expirado.'
        });
    }
};


// ======================================================
// VERIFICAR ADMINISTRADOR
// ======================================================

export const verificarAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {

    if (!req.usuario) {

        return res.status(401).json({
            erro:
                'Usuário não autenticado.'
        });
    }


    /*
     * O tipo_perfil presente aqui já veio
     * da consulta atual ao banco realizada
     * pelo verificarToken.
     */

    if (
        req.usuario.tipo_perfil !==
        'ADMIN'
    ) {

        return res.status(403).json({
            erro:
                'Acesso permitido apenas para administradores.'
        });
    }


    next();
};