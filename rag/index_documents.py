from pathlib import Path

from ingestion.loader import load_pdf
from ingestion.chunker import chunk_text
from retrieval.vector_store import add_documents


# Project root
BASE_DIR = Path(__file__).resolve().parents[1]

# PDF to index
PDF_PATH = BASE_DIR / "data" / "sample_medical_report.pdf"


def main():
    print("Loading PDF...")

    text = load_pdf(str(PDF_PATH))

    print(f"Characters extracted: {len(text)}")

    print("Creating chunks...")

    chunks = chunk_text(text)

    print(f"Chunks created: {len(chunks)}")

    print("Creating embeddings and storing in ChromaDB...")

    add_documents(chunks)

    print("Indexing complete!")


if __name__ == "__main__":
    main()
