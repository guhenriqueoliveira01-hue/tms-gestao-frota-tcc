import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. CADASTRAR USUÁRIO
export const cadastrarUsuario = async (req: Request, res: Response) => {
    // Recebemos a "senha" pura do front-end/Thunder Client
    const { nome, email, senha, tipo_perfil } = req.body;

    try {
        // Verifica se o email já existe
        const [existente]: any = await pool.query('SELECT email FROM usuarios WHERE email = ?', [email]);
        if (existente.length > 0) {
            return res.status(400).json({ erro: 'Este email já está cadastrado.' });
        }

        // Criptografando a senha antes de salvar no banco
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Salvando no banco (nota: a coluna chama senha_hash, mas o id e o criado_em são automáticos!)
        await pool.query(
            'INSERT INTO usuarios (nome, email, senha_hash, tipo_perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senhaHash, tipo_perfil.toUpperCase()]
        );

        return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
    }
};

// 2. LISTAR USUÁRIOS
export const listarUsuarios = async (req: Request, res: Response) => {
    try {
        // Por segurança, listamos todos os dados, MENOS a senha_hash
        const [usuarios] = await pool.query('SELECT id, nome, email, tipo_perfil, criado_em FROM usuarios');
        return res.status(200).json(usuarios);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao buscar usuários.' });
    }
};

// 3. ATUALIZAR USUÁRIO (Apenas dados básicos, sem mexer na senha aqui)
export const atualizarUsuario = async (req: Request, res: Response) => {
    const { id } = req.params; // O parâmetro na URL será o ID numérico
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

// 4. EXCLUIR USUÁRIO
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
// Função para realizar o Login
// Função para realizar o Login
export const loginUsuario = async (req: Request, res: Response) => {
    const { email, senha } = req.body;

    try {
        // 1. Procura o usuário pelo e-mail no banco
        const [usuarios]: any = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        // Se a lista de usuários estiver vazia, significa que o e-mail não existe
        if (usuarios.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        const usuario = usuarios[0];

        // 2. Compara a senha digitada no Thunder Client com o hash salvo no banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        // Se a senha estiver errada, bloqueia o acesso
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Senha incorreta. Acesso negado.' });
        }

        // 3. GERANDO O CRACHÁ (TOKEN JWT)
        // O servidor cria o token guardando o ID e o Perfil do usuário dentro dele
        const token = jwt.sign(
            { id: usuario.id, tipo_perfil: usuario.tipo_perfil }, 
            'chave_secreta_do_tcc', 
            { expiresIn: '8h' } // O token vai expirar em 8 horas
        );

        // 4. Retorna sucesso, os dados do usuário e o TOKEN na resposta!
        return res.status(200).json({
            mensagem: 'Login autorizado com sucesso!',
            token: token, // Entregando o crachá para o front-end/Thunder Client
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo_perfil: usuario.tipo_perfil
            }
        });

    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro interno ao realizar o login.' });
    }
};