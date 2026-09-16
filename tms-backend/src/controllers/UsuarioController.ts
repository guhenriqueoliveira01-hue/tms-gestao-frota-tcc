import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// ======================================================
// CONFIGURAÇÃO DO JWT
// ======================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET não foi definida no arquivo .env.'
    );
}

const JWT_EXPIRES_IN =
    (process.env.JWT_EXPIRES_IN || '8h') as jwt.SignOptions['expiresIn'];

// ======================================================
// 1. CADASTRAR USUÁRIO
// ======================================================

export const cadastrarUsuario = async (
    req: Request,
    res: Response
) => {
    const { nome, email, senha } = req.body;

    try {
        // Validação básica
        if (!nome || !email || !senha) {
            return res.status(400).json({
                erro: 'Nome, e-mail e senha são obrigatórios.'
            });
        }

        // Normaliza o e-mail
        const emailNormalizado = email
            .trim()
            .toLowerCase();

        // Verifica se o e-mail já existe
        const [existente]: any = await pool.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [emailNormalizado]
        );

        if (existente.length > 0) {
            return res.status(400).json({
                erro: 'Este e-mail já está cadastrado.'
            });
        }

        // Gera hash da senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(
            senha,
            salt
        );

        /*
         * IMPORTANTE:
         *
         * Não permitimos que o frontend escolha o perfil.
         * Isso impediria alguém de enviar:
         *
         * tipo_perfil: "ADMIN"
         *
         * e criar uma conta administrativa.
         *
         * Por enquanto usamos MOTORISTA porque esse valor
         * já existe no ENUM atual do banco.
         *
         * Depois revisaremos os perfis do sistema.
         */
        const tipoPerfilPadrao = 'MOTORISTA';

        // Salva o usuário
        await pool.query(
            `
            INSERT INTO usuarios
                (nome, email, senha_hash, tipo_perfil)
            VALUES
                (?, ?, ?, ?)
            `,
            [
                nome.trim(),
                emailNormalizado,
                senhaHash,
                tipoPerfilPadrao
            ]
        );

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!'
        });

    } catch (erro) {
        console.error(
            'Erro no cadastro:',
            erro
        );

        return res.status(500).json({
            erro: 'Erro interno ao cadastrar usuário.'
        });
    }
};

// ======================================================
// 2. LOGIN DE USUÁRIO
// ======================================================

export const loginUsuario = async (
    req: Request,
    res: Response
) => {
    const { email, senha } = req.body;

    try {
        // Validação básica
        if (!email || !senha) {
            return res.status(400).json({
                erro: 'E-mail e senha são obrigatórios.'
            });
        }

        const emailNormalizado = email
            .trim()
            .toLowerCase();

        // Busca o usuário
        const [usuarios]: any = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [emailNormalizado]
        );

        /*
         * Não informamos se foi o e-mail ou a senha
         * que estava incorreto.
         *
         * Isso evita revelar se determinada conta
         * existe no sistema.
         */
        if (usuarios.length === 0) {
            return res.status(401).json({
                erro: 'E-mail ou senha inválidos.'
            });
        }

        const usuario = usuarios[0];

        // Compara a senha com o hash armazenado
        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaValida) {
            return res.status(401).json({
                erro: 'E-mail ou senha inválidos.'
            });
        }

        // Gera JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                tipo_perfil: usuario.tipo_perfil
            },
            JWT_SECRET,
            {
                expiresIn: JWT_EXPIRES_IN
            }
        );

        return res.status(200).json({
            mensagem: 'Login autorizado com sucesso!',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo_perfil: usuario.tipo_perfil
            }
        });

    } catch (erro) {
        console.error(
            'Erro no login:',
            erro
        );

        return res.status(500).json({
            erro: 'Erro interno ao realizar o login.'
        });
    }
};

// ======================================================
// 3. LISTAR USUÁRIOS
// ======================================================

export const listarUsuarios = async (
    req: Request,
    res: Response
) => {
    try {
        const [usuarios] = await pool.query(
            `
            SELECT
                id,
                nome,
                email,
                tipo_perfil,
                criado_em
            FROM usuarios
            `
        );

        return res.status(200).json(
            usuarios
        );

    } catch (erro) {
        console.error(
            'Erro ao listar usuários:',
            erro
        );

        return res.status(500).json({
            erro: 'Erro ao buscar usuários.'
        });
    }
};

// ======================================================
// 4. ATUALIZAR USUÁRIO
// ======================================================

export const atualizarUsuario = async (
    req: Request,
    res: Response
) => {
    const { id } = req.params;
    const { nome, tipo_perfil } = req.body;

    try {
        if (!nome || !tipo_perfil) {
            return res.status(400).json({
                erro: 'Nome e tipo de perfil são obrigatórios.'
            });
        }

        const perfilNormalizado =
            tipo_perfil.toUpperCase();

        const [result]: any = await pool.query(
            `
            UPDATE usuarios
            SET
                nome = ?,
                tipo_perfil = ?
            WHERE id = ?
            `,
            [
                nome.trim(),
                perfilNormalizado,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado.'
            });
        }

        return res.status(200).json({
            mensagem: 'Usuário atualizado com sucesso!'
        });

    } catch (erro) {
        console.error(
            'Erro ao atualizar usuário:',
            erro
        );

        return res.status(500).json({
            erro: 'Erro ao atualizar usuário.'
        });
    }
};

// ======================================================
// 5. EXCLUIR USUÁRIO
// ======================================================

export const excluirUsuario = async (
    req: Request,
    res: Response
) => {
    const { id } = req.params;

    try {
        const [result]: any = await pool.query(
            'DELETE FROM usuarios WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado.'
            });
        }

        return res.status(200).json({
            mensagem: 'Usuário removido com sucesso!'
        });

    } catch (erro) {
        console.error(
            'Erro ao excluir usuário:',
            erro
        );

        return res.status(500).json({
            erro: 'Erro ao excluir usuário.'
        });
    }
};