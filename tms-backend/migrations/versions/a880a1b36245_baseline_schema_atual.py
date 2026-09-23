"""baseline schema atual

Revision ID: a880a1b36245
Revises:
Create Date: 2026-09-23

"""

from typing import Sequence, Union

from alembic import op


# Identificadores da migration
revision: str = "a880a1b36245"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Usuários
    op.execute(
        """
        CREATE TABLE usuarios (
            id INT NOT NULL AUTO_INCREMENT,
            nome VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            senha_hash VARCHAR(255) NOT NULL,
            tipo_perfil ENUM('ADMIN', 'MOTORISTA') NOT NULL,
            criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

            PRIMARY KEY (id),
            UNIQUE KEY email (email)
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_general_ci;
        """
    )

    # 2. Motoristas
    op.execute(
        """
        CREATE TABLE motoristas (
            cnh VARCHAR(20) NOT NULL,
            nome VARCHAR(100) NOT NULL,
            telefone VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL,

            PRIMARY KEY (cnh)
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_general_ci;
        """
    )

    # 3. Caminhões
    op.execute(
        """
        CREATE TABLE caminhoes (
            id INT NOT NULL AUTO_INCREMENT,
            placa VARCHAR(10) NOT NULL,
            modelo VARCHAR(100) NOT NULL,
            capacidade_kg DECIMAL(10,2) NOT NULL,
            status ENUM(
                'DISPONIVEL',
                'EM_MANUTENCAO',
                'INATIVO'
            ) DEFAULT 'DISPONIVEL',

            PRIMARY KEY (id),
            UNIQUE KEY placa (placa)
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_general_ci;
        """
    )

    # 4. Produtos
    op.execute(
        """
        CREATE TABLE produtos (
            id INT NOT NULL AUTO_INCREMENT,
            sku VARCHAR(50) NOT NULL,
            nome VARCHAR(150) NOT NULL,
            descricao TEXT,
            preco_base DECIMAL(10,2) NOT NULL,
            status ENUM('ATIVO', 'INATIVO')
                NOT NULL DEFAULT 'ATIVO',
            criado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP NULL
                DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,

            PRIMARY KEY (id),
            UNIQUE KEY sku (sku)
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_general_ci;
        """
    )

    # 5. Estoque
    op.execute(
        """
        CREATE TABLE estoque (
            id INT NOT NULL AUTO_INCREMENT,
            produto_id INT NOT NULL,
            quantidade_fisica INT UNSIGNED NOT NULL DEFAULT 0,
            quantidade_reservada INT UNSIGNED NOT NULL DEFAULT 0,
            atualizado_em TIMESTAMP NULL
                DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,

            PRIMARY KEY (id),
            UNIQUE KEY produto_id (produto_id),

            CONSTRAINT fk_estoque_produto
                FOREIGN KEY (produto_id)
                REFERENCES produtos (id)
                ON DELETE CASCADE
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_general_ci;
        """
    )

    # 6. Despesas
    op.execute(
        """
        CREATE TABLE despesas (
            id INT NOT NULL AUTO_INCREMENT,
            viagem_id INT NOT NULL,
            tipo_despesa ENUM(
                'COMBUSTIVEL',
                'PEDAGIO',
                'MANUTENCAO',
                'OUTROS'
            ) NOT NULL,
            valor DECIMAL(10,2) NOT NULL,
            descricao VARCHAR(255) DEFAULT NULL,
            data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,

            PRIMARY KEY (id),
            KEY viagem_id (viagem_id)
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_general_ci;
        """
    )


def downgrade() -> None:
    # Ordem inversa para respeitar dependências
    op.execute("DROP TABLE IF EXISTS despesas;")
    op.execute("DROP TABLE IF EXISTS estoque;")
    op.execute("DROP TABLE IF EXISTS produtos;")
    op.execute("DROP TABLE IF EXISTS caminhoes;")
    op.execute("DROP TABLE IF EXISTS motoristas;")
    op.execute("DROP TABLE IF EXISTS usuarios;")