"""Add the package flag that controls future public web capacity display."""

from sqlalchemy import inspect, text


def migrate(bind) -> None:
    columns = {column["name"] for column in inspect(bind).get_columns("packages")}
    if "cupo_web" in columns:
        return

    with bind.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE packages "
                "ADD COLUMN cupo_web BOOLEAN NOT NULL DEFAULT 1"
            )
        )


if __name__ == "__main__":
    from db.database import engine

    migrate(engine)
