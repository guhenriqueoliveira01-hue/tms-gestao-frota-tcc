"""cria modulo viagens

Revision ID: 95688b1fae34
Revises: 6a833f9ac456
Create Date: 2026-09-25
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "95688b1fae34"
down_revision: Union[str, Sequence[str], None] = "6a833f9ac456"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.execute(
        """
        CREATE TABLE viagens (
            id INT NOT NULL AUTO_INCREMENT,

            pedido_id INT NOT NULL,
            motorista_cnh VARCHAR(20) NOT NULL,
            caminhao_id INT NOT NULL,

            status ENUM(
                'PLANEJADA',
                'EM_ANDAMENTO',
                'CONCLUIDA',
                'CANCELADA'
            ) NOT NULL DEFAULT 'PLANEJADA',

            saida_prevista DATETIME NULL,
            iniciado_em DATETIME NULL,
            finalizado_em DATETIME NULL,

            criado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP NULL
                DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,

            PRIMARY KEY (id),

            UNIQUE KEY uq_viagens_pedido (pedido_id),

            KEY idx_viagens_status (status),
            KEY idx_viagens_motorista (motorista_cnh),
            KEY idx_viagens_caminhao (caminhao_id),

            CONSTRAINT fk_viagens_pedido
                FOREIGN KEY (pedido_id)
                REFERENCES pedidos(id)
                ON DELETE RESTRICT,

            CONSTRAINT fk_viagens_motorista
                FOREIGN KEY (motorista_cnh)
                REFERENCES motoristas(cnh)
                ON DELETE RESTRICT,

            CONSTRAINT fk_viagens_caminhao
                FOREIGN KEY (caminhao_id)
                REFERENCES caminhoes(id)
                ON DELETE RESTRICT

        ) ENGINE=InnoDB
          DEFAULT CHARSET=utf8mb4
          COLLATE=utf8mb4_general_ci;
        """
    )

    op.execute(
        """
        ALTER TABLE despesas
        ADD CONSTRAINT fk_despesas_viagem
            FOREIGN KEY (viagem_id)
            REFERENCES viagens(id)
            ON DELETE CASCADE;
        """
    )


def downgrade() -> None:

    op.execute(
        """
        ALTER TABLE despesas
        DROP FOREIGN KEY fk_despesas_viagem;
        """
    )

    op.execute(
        """
        DROP TABLE viagens;
        """
    )