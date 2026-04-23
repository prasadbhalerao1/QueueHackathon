import asyncio
import sys
from pathlib import Path

from bson import json_util
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.common.config.config import settings


async def export_all_collections() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client["queueos"]

    project_root = Path(__file__).resolve().parents[2]
    data_dir = project_root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    collection_names = await db.list_collection_names()
    if not collection_names:
        print("No collections found in database.")
        return

    total_docs = 0
    for collection_name in collection_names:
        documents = await db[collection_name].find({}).to_list(length=None)
        total_docs += len(documents)

        output_file = data_dir / f"{collection_name}.json"
        output_file.write_text(json_util.dumps(documents, indent=2), encoding="utf-8")

        print(f"Exported {len(documents)} docs from '{collection_name}' -> {output_file}")

    print(f"Done. Exported {len(collection_names)} collections and {total_docs} documents.")
    client.close()


if __name__ == "__main__":
    asyncio.run(export_all_collections())