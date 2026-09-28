"""permite replanejar pedido apos cancelamento

Revision ID: 202d598ab803
Revises: 95688b1fae34
Create Date: 2026-09-28
"""

from typing import Sequence, Union

from alembic import op


revision: str = "202d598ab803"
down_revision: Union[str, Sequence[str], None] = "95688b1fae34"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # Primeiro cria um índice normal para que a chave estrangeira
    # continue tendo um índice válido.
    op.execute(
        """
        CREATE INDEX idx_viagens_pedido
        ON viagens (pedido_id);
        """
    )

    # Depois remove a restrição UNIQUE antiga.
    op.execute(
        """
        DROP INDEX uq_viagens_pedido
        ON viagens;
        """
    )


def downgrade() -> None:

    # Primeiro recria o índice UNIQUE.
    op.execute(
        """
        CREATE UNIQUE INDEX uq_viagens_pedido
        ON viagens (pedido_id);
        """
    )

    # Só depois remove o índice normal.
    op.execute(
        """
        DROP INDEX idx_viagens_pedido
        ON viagens;
        """
    )