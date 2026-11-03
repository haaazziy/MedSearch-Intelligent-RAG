from pathlib import Path
from tempfile import NamedTemporaryFile

from rag.ingestion.chunker import chunk_text
from rag.ingestion.loader import load_pdf
from rag.retrieval.vector_store import add_documents


# =========================================================
# MEDSEARCH AI PROJECT ROOT
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[3]


# =========================================================
# PERMANENT UPLOAD STORAGE
# =========================================================

UPLOAD_DIR = BASE_DIR / "data" / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# =========================================================
# REPAIR PDF TEXT ENCODING
#
# Fixes common PDF extraction issues such as:
#
#     12.0â€“16.0  -> 12.0–16.0
#     Ã—10         -> ×10
#
# This is performed BEFORE chunking and indexing.
# =========================================================

def _repair_encoding(
    text: str,
) -> str:

    if not text:
        return ""

    # -----------------------------------------------------
    # Attempt automatic UTF-8 / Latin-1 mojibake repair.
    # -----------------------------------------------------

    for _ in range(2):

        if not any(
            marker in text
            for marker in (
                "â",
                "Ã",
                "Â",
                "ð",
            )
        ):
            break

        try:

            repaired = (
                text
                .encode("latin1")
                .decode("utf-8")
            )

            if repaired == text:
                break

            text = repaired

        except (
            UnicodeEncodeError,
            UnicodeDecodeError,
        ):

            break

    # -----------------------------------------------------
    # Explicit replacements for common PDF corruption.
    # -----------------------------------------------------

    replacements = {
        "â€“": "–",
        "â€”": "—",
        "â€˜": "‘",
        "â€™": "’",
        "â€œ": "“",
        "â€": "”",
        "Ã—": "×",
        "Â±": "±",
        "Âµ": "µ",
        "Â°": "°",
        "Â²": "²",
        "Â³": "³",
        "Â ": " ",
        "â€¦": "…",
        "â†’": "→",
        "â†": "←",
    }

    for bad, good in replacements.items():

        text = text.replace(
            bad,
            good,
        )

    return text


# =========================================================
# PROCESS PDF
# =========================================================

def process_pdf(
    file_bytes: bytes,
    filename: str,
) -> dict:

    """
    Process an uploaded PDF.

    Flow:

        uploaded PDF
              ↓
        permanent PDF storage
              ↓
        temporary processing file
              ↓
        PDF text extraction
              ↓
        encoding repair
              ↓
        text chunking
              ↓
        embeddings
              ↓
        ChromaDB
    """

    # -----------------------------------------------------
    # VALIDATE FILE
    # -----------------------------------------------------

    if not file_bytes:

        raise ValueError(
            "The uploaded file is empty."
        )

    if not filename.lower().endswith(".pdf"):

        raise ValueError(
            "Only PDF files are supported."
        )

    # -----------------------------------------------------
    # PREVENT PATH TRAVERSAL
    # -----------------------------------------------------

    safe_filename = Path(
        filename
    ).name

    if not safe_filename:

        raise ValueError(
            "Invalid filename."
        )

    # -----------------------------------------------------
    # 1. SAVE ORIGINAL PDF PERMANENTLY
    # -----------------------------------------------------

    permanent_path = (
        UPLOAD_DIR
        / safe_filename
    )

    permanent_path.write_bytes(
        file_bytes
    )

    temporary_path = None

    try:

        # -------------------------------------------------
        # 2. CREATE TEMPORARY PDF
        # -------------------------------------------------

        with NamedTemporaryFile(
            suffix=".pdf",
            delete=False,
        ) as temporary_file:

            temporary_file.write(
                file_bytes
            )

            temporary_path = Path(
                temporary_file.name
            )

        # -------------------------------------------------
        # 3. EXTRACT PDF TEXT
        # -------------------------------------------------

        text = load_pdf(
            str(temporary_path)
        )

        # -------------------------------------------------
        # 4. REPAIR ENCODING
        #
        # IMPORTANT:
        # This happens BEFORE chunking and ChromaDB.
        # -------------------------------------------------

        text = _repair_encoding(
            text
        )

        if not text.strip():

            raise ValueError(
                "No readable text could be extracted from the PDF."
            )

        # -------------------------------------------------
        # 5. CREATE CHUNKS
        # -------------------------------------------------

        chunks = chunk_text(
            text
        )

        if not chunks:

            raise ValueError(
                "The PDF did not contain enough text to create chunks."
            )

        # -------------------------------------------------
        # 6. STORE CHUNKS IN CHROMADB
        # -------------------------------------------------

        add_documents(
            chunks,
            document_name=safe_filename,
        )

        # -------------------------------------------------
        # 7. RETURN SUCCESS
        # -------------------------------------------------

        return {
            "filename": safe_filename,
            "characters_extracted": len(
                text
            ),
            "chunks_created": len(
                chunks
            ),
            "storage_path": str(
                permanent_path.relative_to(
                    BASE_DIR
                )
            ),
            "status": "indexed",
        }

    except Exception:

        # -------------------------------------------------
        # REMOVE PDF IF PROCESSING FAILED
        # -------------------------------------------------

        if permanent_path.exists():

            permanent_path.unlink()

        raise

    finally:

        # -------------------------------------------------
        # REMOVE TEMPORARY PDF
        # -------------------------------------------------

        if (
            temporary_path
            and temporary_path.exists()
        ):

            temporary_path.unlink()