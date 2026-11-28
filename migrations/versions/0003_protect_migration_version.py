"""Keep migration metadata private on Supabase."""

from alembic import op

revision = "0003_protect_migration_version"
down_revision = "0002_record_actors"


def upgrade():
    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TABLE public.alembic_version ENABLE ROW LEVEL SECURITY")
        op.execute("REVOKE ALL ON TABLE public.alembic_version FROM PUBLIC, anon, authenticated")
