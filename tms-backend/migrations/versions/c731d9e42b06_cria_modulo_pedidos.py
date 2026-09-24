"""Cria pedidos e itens_pedido.

Revision ID: c731d9e42b06
Revises: a880a1b36245
Create Date: 2026-09-24
"""

from alembic import op

revision = "c731d9e42b06"
down_revision = "a880a1b36245"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE pedidos (
            id INT NOT NULL AUTO_INCREMENT,
            cliente_nome VARCHAR(150) NOT NULL,
            cliente_email VARCHAR(254) NULL,
            cliente_telefone VARCHAR(20) NULL,
            endereco_entrega TEXT NOT NULL,
            status ENUM('PENDENTE', 'EM_TRANSPORTE', 'ENTREGUE', 'CANCELADO')
                NOT NULL DEFAULT 'PENDENTE',
            valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY ix_pedidos_status_criado_em (status, criado_em),
            CONSTRAINT ck_pedidos_valor_total CHECK (valor_total >= 0)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    """)
    op.execute("""
        CREATE TABLE itens_pedido (
            id INT NOT NULL AUTO_INCREMENT,
            pedido_id INT NOT NULL,
            produto_id INT NOT NULL,
            quantidade INT UNSIGNED NOT NULL,
            preco_unitario DECIMAL(10,2) NOT NULL,
            subtotal DECIMAL(12,2) NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_itens_pedido_produto (pedido_id, produto_id),
            KEY ix_itens_pedido_produto_id (produto_id),
            CONSTRAINT fk_itens_pedido_pedido FOREIGN KEY (pedido_id)
                REFERENCES pedidos (id) ON DELETE CASCADE,
            CONSTRAINT fk_itens_pedido_produto FOREIGN KEY (produto_id)
                REFERENCES produtos (id) ON DELETE RESTRICT,
            CONSTRAINT ck_itens_pedido_quantidade CHECK (quantidade > 0),
            CONSTRAINT ck_itens_pedido_preco CHECK (preco_unitario >= 0),
            CONSTRAINT ck_itens_pedido_subtotal
                CHECK (subtotal = quantidade * preco_unitario)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    """)


def downgrade() -> None:
    # Remove apenas o módulo novo. A reversão apaga seus pedidos e itens.
    op.drop_table("itens_pedido")
    op.drop_table("pedidos")
