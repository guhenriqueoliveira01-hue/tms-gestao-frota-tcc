"""ajusta status pedidos

Revision ID: 6a833f9ac456
Revises: c731d9e42b06
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "6a833f9ac456"
down_revision: Union[str, Sequence[str], None] = "c731d9e42b06"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE pedidos
        MODIFY COLUMN status ENUM(
            'PENDENTE',
            'SEPARANDO',
            'PRONTO_PARA_ENVIO',
            'EM_TRANSPORTE',
            'ENTREGUE',
            'CANCELADO'
        ) NOT NULL DEFAULT 'PENDENTE'
        """
    )


def downgrade() -> None:
    # Os status exclusivos da nova versão precisam ser convertidos
    # antes de restaurar o ENUM anterior.
    op.execute(
        """
        UPDATE pedidos
        SET status = 'PENDENTE'
        WHERE status IN ('SEPARANDO', 'PRONTO_PARA_ENVIO')
        """
    )

    op.execute(
        """
        ALTER TABLE pedidos
        MODIFY COLUMN status ENUM(
            'PENDENTE',
            'EM_TRANSPORTE',
            'ENTREGUE',
            'CANCELADO'
        ) NOT NULL DEFAULT 'PENDENTE'
        """
    )