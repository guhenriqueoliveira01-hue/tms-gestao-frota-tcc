import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Esta função é o nosso "segurança"
export const verificarToken = (req: Request, res: Response, next: NextFunction) => {
    // 1. O crachá (token) deve vir no "cabeçalho" (header) de autorização da requisição
    const cabecalhoAuth = req.headers.authorization;

    // Se o usuário tentar entrar sem mostrar o crachá, é barrado na hora
    if (!cabecalhoAuth) {
        return res.status(401).json({ erro: 'Acesso negado. Crachá (Token) não fornecido.' });
    }

    // O padrão da web é enviar o cabeçalho no formato: "Bearer eyJhbGciOi..."
    // Precisamos separar a palavra "Bearer" (portador) do código do token em si
    const partes = cabecalhoAuth.split(' ');
    
    if (partes.length !== 2 || partes[0] !== 'Bearer') {
        return res.status(401).json({ erro: 'Formato do crachá inválido.' });
    }

    const token = partes[1];

    try {
        // 2. O segurança usa a chave secreta do servidor para ver se o crachá é verdadeiro
        const decodificado = jwt.verify(token, 'chave_secreta_do_tcc');

        // Se o crachá for verdadeiro, guardamos os dados decodificados na requisição
        (req as any).usuario = decodificado;
        
        // 3. Tudo certo! O comando 'next()' é o segurança abrindo a porta para o Controller
        next();
    } catch (erro) {
        // Se o token for falso, tiver sido alterado ou se as 8 horas tiverem passado
        return res.status(401).json({ erro: 'Crachá (Token) inválido ou expirado. Faça login novamente.' });
    }
};