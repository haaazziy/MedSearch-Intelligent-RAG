from pathlib import Path
import sys

# ==========================================
# Project Root
# ==========================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# ==========================================
# RAG Imports
# ==========================================

from rag.ingestion.chunker import chunk_text
from rag.retrieval.vector_store import (
    add_medical_knowledge,
    get_medical_knowledge_count,
)


# ==========================================
# Paths
# ==========================================

KNOWLEDGE_FILE = (
    PROJECT_ROOT
    / "data"
    / "medical_knowledge"
    / "medical_knowledge.txt"
)


# ==========================================
# Main Indexing Function
# ==========================================

def index_medical_knowledge():
    print("=" * 60)
    print("MedSearch AI - Medical Knowledge Indexer")
    print("=" * 60)

    # --------------------------------------
    # Check knowledge file
    # --------------------------------------

    if not KNOWLEDGE_FILE.exists():
        print(
            f"\nERROR: Knowledge file not found:\n"
            f"{KNOWLEDGE_FILE}"
        )
        return

    print(
        f"\nKnowledge file:\n"
        f"{KNOWLEDGE_FILE}"
    )

    # --------------------------------------
    # Read knowledge
    # --------------------------------------

    text = KNOWLEDGE_FILE.read_text(
        encoding="utf-8"
    )

    if not text.strip():
        print("\nERROR: Knowledge file is empty.")
        return

    print(
        f"\nCharacters loaded: {len(text)}"
    )

    # --------------------------------------
    # Create chunks
    # --------------------------------------

    chunks = chunk_text(text)

    if not chunks:
        print(
            "\nERROR: No chunks were created."
        )
        return

    print(
        f"Chunks created: {len(chunks)}"
    )

    # --------------------------------------
    # Add to ChromaDB
    # --------------------------------------

    print(
        "\nGenerating embeddings and indexing..."
    )

    add_medical_knowledge(
        chunks,
        source_name="medical_knowledge.txt",
    )

    # --------------------------------------
    # Verify
    # --------------------------------------

    count = get_medical_knowledge_count()

    print(
        "\nMedical knowledge indexed successfully."
    )

    print(
        f"Knowledge collection count: {count}"
    )

    print("\n" + "=" * 60)
    print("Indexing complete")
    print("=" * 60)


# ==========================================
# Run
# ==========================================

if __name__ == "__main__":
    index_medical_knowledge()