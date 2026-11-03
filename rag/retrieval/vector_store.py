from pathlib import Path
from uuid import uuid4

import chromadb
from sentence_transformers import SentenceTransformer


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

CHROMA_DIR = (
    BASE_DIR
    / "data"
    / "chroma"
)


# =========================================================
# EMBEDDING MODEL
# =========================================================

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


# =========================================================
# CHROMADB
# =========================================================

client = chromadb.PersistentClient(
    path=str(CHROMA_DIR)
)


# =========================================================
# COLLECTIONS
# =========================================================

# User-uploaded medical documents
document_collection = client.get_or_create_collection(
    name="medical_documents"
)


# General medical knowledge
medical_knowledge_collection = client.get_or_create_collection(
    name="medical_knowledge"
)


# Backward compatibility
# Existing code imports `collection`.
collection = document_collection


# =========================================================
# ADD / REPLACE USER DOCUMENT
# =========================================================

def add_documents(
    chunks: list[str],
    document_name: str = "unknown.pdf",
) -> None:
    """
    Add user-uploaded document chunks to ChromaDB.

    If the same document has already been indexed,
    its old chunks are deleted first.

    This prevents duplicate chunks when a PDF is
    uploaded again.

    Metadata:
        document_name
        chunk_index
        source_type
    """

    if not chunks:
        return

    # -----------------------------------------------------
    # Remove previous chunks belonging to this document.
    #
    # This is important because IDs are UUIDs and therefore
    # a normal upsert would otherwise create new records.
    # -----------------------------------------------------

    document_collection.delete(
        where={
            "document_name": document_name
        }
    )

    # -----------------------------------------------------
    # Generate embeddings
    # -----------------------------------------------------

    embeddings = model.encode(
        chunks
    ).tolist()

    # -----------------------------------------------------
    # Generate unique IDs
    # -----------------------------------------------------

    ids = [
        f"{uuid4()}-{index}"
        for index in range(len(chunks))
    ]

    # -----------------------------------------------------
    # Metadata
    # -----------------------------------------------------

    metadatas = [
        {
            "document_name": document_name,
            "chunk_index": index,
            "source_type": "user_document",
        }
        for index in range(len(chunks))
    ]

    # -----------------------------------------------------
    # Store new chunks
    # -----------------------------------------------------

    document_collection.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )


# =========================================================
# ADD GENERAL MEDICAL KNOWLEDGE
# =========================================================

def add_medical_knowledge(
    chunks: list[str],
    source_name: str = "medical_knowledge",
) -> None:
    """
    Add general medical knowledge to the separate
    medical_knowledge ChromaDB collection.

    This collection is independent from user-uploaded PDFs.
    """

    if not chunks:
        return

    embeddings = model.encode(
        chunks
    ).tolist()

    ids = [
        f"knowledge-{uuid4()}-{index}"
        for index in range(len(chunks))
    ]

    metadatas = [
        {
            "source_name": source_name,
            "chunk_index": index,
            "source_type": "medical_knowledge",
        }
        for index in range(len(chunks))
    ]

    medical_knowledge_collection.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )


# =========================================================
# SEARCH USER DOCUMENTS
# =========================================================

def search_documents(
    query: str,
    top_k: int = 3,
    document_name: str | None = None,
) -> list[str]:
    """
    Search user-uploaded medical documents.

    If document_name is provided:
        search only that document.

    If document_name is None:
        search all uploaded documents.
    """

    if not query.strip():
        return []

    # -----------------------------------------------------
    # Prevent invalid n_results when collection is empty.
    # -----------------------------------------------------

    if document_collection.count() == 0:
        return []

    query_embedding = model.encode(
        [query]
    ).tolist()

    query_kwargs = {
        "query_embeddings": query_embedding,
        "n_results": max(1, top_k),
    }

    if document_name:
        query_kwargs["where"] = {
            "document_name": document_name
        }

    results = document_collection.query(
        **query_kwargs
    )

    return _extract_unique_documents(
        results
    )


# =========================================================
# SEARCH GENERAL MEDICAL KNOWLEDGE
# =========================================================

def search_medical_knowledge(
    query: str,
    top_k: int = 5,
) -> list[str]:
    """
    Search the general medical knowledge collection.

    This is used for medical questions that do not
    require a user's uploaded PDF.
    """

    if not query.strip():
        return []

    # If the general knowledge collection is empty,
    # return an empty result safely.
    if medical_knowledge_collection.count() == 0:
        return []

    query_embedding = model.encode(
        [query]
    ).tolist()

    results = medical_knowledge_collection.query(
        query_embeddings=query_embedding,
        n_results=max(1, top_k),
    )

    return _extract_unique_documents(
        results
    )


# =========================================================
# COMBINED MEDICAL SEARCH
# =========================================================

def search_all_medical_knowledge(
    query: str,
    top_k: int = 5,
) -> list[str]:
    """
    Search general medical knowledge and uploaded
    documents together.

    This is useful when the user asks a question that
    could benefit from both general medical knowledge
    and their uploaded reports.
    """

    if not query.strip():
        return []

    general_results = search_medical_knowledge(
        query,
        top_k=top_k,
    )

    document_results = search_documents(
        query,
        top_k=top_k,
    )

    combined = (
        general_results
        + document_results
    )

    unique_documents = []

    seen = set()

    for document in combined:

        if not document:
            continue

        key = _normalize_for_comparison(
            document
        )

        if not key or key in seen:
            continue

        seen.add(key)
        unique_documents.append(document)

    return unique_documents[:top_k]


# =========================================================
# HELPERS
# =========================================================

def _extract_unique_documents(
    results: dict,
) -> list[str]:
    """
    Safely extract and deduplicate documents returned
    by ChromaDB.
    """

    documents = results.get(
        "documents",
        [[]],
    )

    if not documents:
        return []

    if not documents[0]:
        return []

    unique_documents = []

    seen = set()

    for document in documents[0]:

        if not document:
            continue

        key = _normalize_for_comparison(
            document
        )

        if not key:
            continue

        if key in seen:
            continue

        seen.add(key)

        # Preserve original document text.
        unique_documents.append(
            document
        )

    return unique_documents


def _normalize_for_comparison(
    document: str,
) -> str:
    """
    Normalize text only for duplicate detection.

    Original text is never modified in the result.
    """

    cleaned = (
        document
        .replace("\r", " ")
        .replace("\n", " ")
    )

    cleaned = " ".join(
        cleaned.split()
    ).strip()

    return cleaned.lower()


# =========================================================
# COUNTS
# =========================================================

def get_document_count() -> int:
    """
    Return the number of chunks in user-uploaded documents.
    """

    return document_collection.count()


def get_medical_knowledge_count() -> int:
    """
    Return the number of chunks in the general
    medical knowledge collection.
    """

    return medical_knowledge_collection.count()