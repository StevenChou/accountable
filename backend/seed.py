from backend.db import database_path, initialize, make_engine


def main() -> None:
    engine = make_engine()
    try:
        initialize(engine, reset=True)
        print(f"已將 {database_path()} 重設為範例資料。")
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
