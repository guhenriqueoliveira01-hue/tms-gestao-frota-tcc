import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. CADASTRAR USUÁRIO (Com Criptografia)
export const cadastrarUsuario = async (req: Request, res: Response) => {
    const { nome, email, senha, tipo_perfil } = req.body;

    try {
        // Verifica se o email já existe
        const [existente]: any = await pool.query('SELECT email FROM usuarios WHERE email = ?', [email]);
        if (existente.length > 0) {
            return res.status(400).json({ erro: 'Este email já está cadastrado.' });
        }

        // Criptografando a senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Salvando no banco
        // IMPORTANTE: Certifique-se que sua coluna no MySQL se chama 'senha_hash'
        await pool.query(
            'INSERT INTO usuarios (nome, email, senha_hash, tipo_perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senhaHash, tipo_perfil ? tipo_perfil.toUpperCase() : 'USER']
        );

        return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
    } catch (erro) {
        console.error('Erro no cadastro:', erro);
        return res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
    }
};

// 2. LOGIN DE USUÁRIO (Com Verificação de Hash e JWT)
export const loginUsuario = async (req: Request, res: Response) => {
    const { email, senha } = req.body;

    try {
        // 1. Busca o usuário
        const [usuarios]: any = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (usuarios.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        const usuario = usuarios[0];

        // 2. Compara a senha digitada com o hash do banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Senha incorreta. Acesso negado.' });
        }

        // 3. Gerando o Token JWT (O "Crachá")
        const token = jwt.sign(
            { id: usuario.id, tipo_perfil: usuario.tipo_perfil }, 
            'chave_secreta_do_tcc', 
            { expiresIn: '8h' }
        );

        // 4. Retorna os dados para o Front-end
        return res.status(200).json({
            mensagem: 'Login autorizado com sucesso!',
            token: token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo_perfil: usuario.tipo_perfil
            }
        });

    } catch (erro) {
        console.error('Erro no login:', erro);
        return res.status(500).json({ erro: 'Erro interno ao realizar o login.' });
    }
};

// 3. LISTAR USUÁRIOS
export const listarUsuarios = async (req: Request, res: Response) => {
    try {
        const [usuarios] = await pool.query('SELECT id, nome, email, tipo_perfil, criado_em FROM usuarios');
        return res.status(200).json(usuarios);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao buscar usuários.' });
    }
};

// 4. ATUALIZAR USUÁRIO
export const atualizarUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome, tipo_perfil } = req.body;

    try {
        const [result]: any = await pool.query(
            'UPDATE usuarios SET nome = ?, tipo_perfil = ? WHERE id = ?',
            [nome, tipo_perfil.toUpperCase(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }

        return res.status(200).json({ mensagem: 'Usuário atualizado com sucesso!' });
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao atualizar usuário.' });
    }
};

// 5. EXCLUIR USUÁRIO
export const excluirUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const [result]: any = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }
        return res.status(200).json({ mensagem: 'Usuário removido com sucesso!' });
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao excluir usuário.' });
    }
};