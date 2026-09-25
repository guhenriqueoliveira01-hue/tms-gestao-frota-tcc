import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';


interface EstoqueAtual extends RowDataPacket {
    quantidade_fisica: number;
    quantidade_reservada: number;
    quantidade_disponivel: number;
}


export class EstoqueServiceError extends Error {
    statusHttp: number;
    estoque?: EstoqueAtual;

    constructor(
        mensagem: string,
        statusHttp: number,
        estoque?: EstoqueAtual
    ) {
        super(mensagem);

        this.name = 'EstoqueServiceError';
        this.statusHttp = statusHttp;
        this.estoque = estoque;
    }
}


// RESERVAR ESTOQUE DENTRO DE UMA TRANSAÇÃO
export const reservarEstoqueTransacional = async (
    conexao: PoolConnection,
    produtoId: number,
    quantidade: number
) => {

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        throw new EstoqueServiceError(
            'A quantidade deve ser um número inteiro maior que zero.',
            400
        );
    }


    const [resultado] = await conexao.execute<ResultSetHeader>(
        `
        UPDATE estoque
        SET quantidade_reservada = quantidade_reservada + ?
        WHERE produto_id = ?
          AND (quantidade_fisica - quantidade_reservada) >= ?
        `,
        [
            quantidade,
            produtoId,
            quantidade
        ]
    );


    if (resultado.affectedRows === 0) {

        const [estoqueAtual] = await conexao.execute<EstoqueAtual[]>(
            `
            SELECT
                quantidade_fisica,
                quantidade_reservada,
                (quantidade_fisica - quantidade_reservada)
                    AS quantidade_disponivel
            FROM estoque
            WHERE produto_id = ?
            `,
            [produtoId]
        );


        if (estoqueAtual.length === 0) {
            throw new EstoqueServiceError(
                'Registro de estoque não encontrado.',
                404
            );
        }


        throw new EstoqueServiceError(
            'Estoque disponível insuficiente para realizar a reserva.',
            409,
            estoqueAtual[0]
        );
    }
};


// LIBERAR RESERVA DENTRO DE UMA TRANSAÇÃO
export const liberarReservaEstoqueTransacional = async (
    conexao: PoolConnection,
    produtoId: number,
    quantidade: number
) => {

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        throw new EstoqueServiceError(
            'A quantidade deve ser um número inteiro maior que zero.',
            400
        );
    }


    const [resultado] = await conexao.execute<ResultSetHeader>(
        `
        UPDATE estoque
        SET quantidade_reservada = quantidade_reservada - ?
        WHERE produto_id = ?
          AND quantidade_reservada >= ?
        `,
        [
            quantidade,
            produtoId,
            quantidade
        ]
    );


    if (resultado.affectedRows === 0) {

        const [estoqueAtual] = await conexao.execute<EstoqueAtual[]>(
            `
            SELECT
                quantidade_fisica,
                quantidade_reservada,
                (quantidade_fisica - quantidade_reservada)
                    AS quantidade_disponivel
            FROM estoque
            WHERE produto_id = ?
            `,
            [produtoId]
        );


        if (estoqueAtual.length === 0) {
            throw new EstoqueServiceError(
                'Registro de estoque não encontrado.',
                404
            );
        }


        throw new EstoqueServiceError(
            'Quantidade reservada insuficiente para realizar a liberação.',
            409,
            estoqueAtual[0]
        );
    }
};

// CONFIRMAR SAÍDA FÍSICA DO ESTOQUE DENTRO DE UMA TRANSAÇÃO
export const confirmarSaidaEstoqueTransacional = async (
    conexao: PoolConnection,
    produtoId: number,
    quantidade: number
) => {

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        throw new EstoqueServiceError(
            'A quantidade deve ser um número inteiro maior que zero.',
            400
        );
    }

    const [resultado] = await conexao.execute<ResultSetHeader>(
        `
        UPDATE estoque
        SET
            quantidade_fisica = quantidade_fisica - ?,
            quantidade_reservada = quantidade_reservada - ?
        WHERE produto_id = ?
          AND quantidade_fisica >= ?
          AND quantidade_reservada >= ?
        `,
        [
            quantidade,
            quantidade,
            produtoId,
            quantidade,
            quantidade
        ]
    );

    if (resultado.affectedRows === 0) {

        const [estoqueAtual] = await conexao.execute<EstoqueAtual[]>(
            `
            SELECT
                quantidade_fisica,
                quantidade_reservada,
                (quantidade_fisica - quantidade_reservada)
                    AS quantidade_disponivel
            FROM estoque
            WHERE produto_id = ?
            `,
            [produtoId]
        );

        if (estoqueAtual.length === 0) {
            throw new EstoqueServiceError(
                'Registro de estoque não encontrado.',
                404
            );
        }

        throw new EstoqueServiceError(
            'Não foi possível confirmar a saída do estoque reservado.',
            409,
            estoqueAtual[0]
        );
    }
};