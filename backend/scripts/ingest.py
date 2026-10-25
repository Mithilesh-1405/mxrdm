import argparse
from pathlib import Path
from backend.app.config import settings
from backend.services.ingestion import build_snapshot

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["refresh"], nargs="?", default="refresh")
    parser.parse_args()
    print(build_snapshot(Path(settings.data_path)))

if __name__ == "__main__":
    main()
