from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.api.auth import router as auth_router

import sys
from pathlib import Path


# ============================================================
# PROJECT ROOT
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# ============================================================
# RAG IMPORTS
# ============================================================

from rag.retrieval.vector_store import (
    collection,
    search_documents,
    search_medical_knowledge,
)

from rag.generation.llm import generate_answer


# ============================================================
# SERVICE IMPORTS
# ============================================================

from app.services.document_service import process_pdf

from app.services.report_service import (
    generate_report_summary,
    generate_report_analytics,
    analyze_report,
    compare_reports,
)


# ============================================================
# APP CONFIGURATION
# ============================================================

app = FastAPI(
    title="MedSearch AI",
    description="Intelligent Medical Knowledge Retrieval & RAG Assistant",
    version="1.0.0",
)
app.include_router(auth_router)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PATHS
# ============================================================

UPLOAD_DIR = PROJECT_ROOT / "data" / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# REQUEST SCHEMAS
# ============================================================


class AskRequest(BaseModel):
    question: str


class ReportExplainRequest(BaseModel):
    filename: str


class ReportComparisonRequest(BaseModel):
    previous_report: str
    latest_report: str


# ============================================================
# BASIC ROUTES
# ============================================================


@app.get("/")
def root():
    return {
        "name": "MedSearch AI",
        "description": "Intelligent Medical Knowledge Retrieval & RAG Assistant",
        "status": "online",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


# ============================================================
# SYSTEM STATS
# ============================================================


@app.get("/v1/stats")
def get_stats():

    try:

        document_count = collection.count()

        return {
            "documents": document_count,
            "status": "online",
            "rag_ready": document_count > 0,
        }

    except Exception as exc:

        return {
            "documents": 0,
            "status": "error",
            "rag_ready": False,
            "message": str(exc),
        }


# ============================================================
# ASK AI / RAG
# ============================================================


@app.post("/v1/ask")
def ask_ai(request: AskRequest):

    question = request.question.strip()

    if not question:

        return {
            "status": "error",
            "message": "Please enter a question.",
        }

    try:

        # ----------------------------------------------------
        # Search user documents
        # ----------------------------------------------------

        document_results = search_documents(
            question,
            top_k=3,
        )

        # ----------------------------------------------------
        # Search medical knowledge
        # ----------------------------------------------------

        knowledge_results = search_medical_knowledge(
            question,
            top_k=5,
        )

        # ----------------------------------------------------
        # Build TEXT-ONLY evidence
        #
        # generate_answer() expects:
        #
        # list[str]
        #
        # NOT:
        #
        # list[dict]
        # ----------------------------------------------------

        document_evidence = [
            item
            for item in document_results
            if isinstance(item, str)
            and item.strip()
        ]

        knowledge_evidence = [
            item
            for item in knowledge_results
            if isinstance(item, str)
            and item.strip()
        ]

        # ----------------------------------------------------
        # Combine both evidence sources
        # ----------------------------------------------------

        evidence = (
            document_evidence
            + knowledge_evidence
        )

        # ----------------------------------------------------
        # Generate answer
        # ----------------------------------------------------

        result = generate_answer(
            question=question,
            context=evidence,
            context_type="combined",
        )

        # ----------------------------------------------------
        # Return answer
        # ----------------------------------------------------

        return {
            "status": "success",
            "answer": str(result),
            "sources": (
                document_results
                + knowledge_results
            ),
        }

    except Exception as exc:

        return {
            "status": "error",
            "message": (
                f"Unable to generate an answer: "
                f"{exc}"
            ),
        }


# ============================================================
# DOCUMENT UPLOAD
# ============================================================


@app.post("/v1/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
):

    try:

        filename = Path(
            file.filename or ""
        ).name

        if not filename:

            return {
                "status": "error",
                "message": "Invalid filename.",
            }

        if not filename.lower().endswith(".pdf"):

            return {
                "status": "error",
                "message": "Only PDF files are supported.",
            }

        file_bytes = await file.read()

        result = process_pdf(
            file_bytes=file_bytes,
            filename=filename,
        )

        return {
            "status": "success",
            **result,
        }

    except Exception as exc:

        return {
            "status": "error",
            "message": str(exc),
        }


# ============================================================
# LIST SAVED DOCUMENTS
# ============================================================


@app.get("/v1/documents")
def list_documents():

    try:

        files = []

        for path in UPLOAD_DIR.iterdir():

            if not path.is_file():
                continue

            if path.suffix.lower() != ".pdf":
                continue

            stat = path.stat()

            files.append(
                {
                    "filename": path.name,
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                }
            )

        files.sort(
            key=lambda item: item["modified"],
            reverse=True,
        )

        return {
            "status": "success",
            "documents": files,
        }

    except Exception as exc:

        return {
            "status": "error",
            "message": str(exc),
            "documents": [],
        }


# ============================================================
# OPEN / VIEW DOCUMENT
# ============================================================


@app.get("/v1/documents/{filename}")
def get_document(filename: str):

    safe_filename = Path(filename).name

    file_path = UPLOAD_DIR / safe_filename

    if not file_path.exists():

        return {
            "status": "error",
            "message": "Document not found.",
        }

    if not file_path.is_file():

        return {
            "status": "error",
            "message": "Invalid document.",
        }

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=safe_filename,
    )


# ============================================================
# REPORT EXPLANATION
# ============================================================


@app.post("/v1/reports/explain")
def explain_report(
    request: ReportExplainRequest,
):

    safe_filename = Path(
        request.filename
    ).name

    if not safe_filename:

        return {
            "status": "error",
            "message": "Report filename is required.",
        }

    file_path = UPLOAD_DIR / safe_filename

    if not file_path.exists():

        return {
            "status": "error",
            "message": (
                f"Report not found: "
                f"{safe_filename}"
            ),
        }

    try:

        report = analyze_report(
            safe_filename
        )

        return {
            "status": "success",
            "report": report,
        }

    except Exception as exc:

        return {
            "status": "error",
            "message": (
                f"Unable to analyze report: "
                f"{exc}"
            ),
        }


# ============================================================
# REPORT COMPARISON
# ============================================================


@app.post("/v1/reports/compare")
def compare_medical_reports(
    request: ReportComparisonRequest,
):

    # --------------------------------------------------------
    # Sanitize filenames
    # --------------------------------------------------------

    previous_report_name = Path(
        request.previous_report
    ).name

    latest_report_name = Path(
        request.latest_report
    ).name

    # --------------------------------------------------------
    # Validate filenames
    # --------------------------------------------------------

    if not previous_report_name or not latest_report_name:

        return {
            "status": "error",
            "message": "Both report names are required.",
        }

    # --------------------------------------------------------
    # Prevent comparing the same report
    # --------------------------------------------------------

    if (
        previous_report_name.lower()
        == latest_report_name.lower()
    ):

        return {
            "status": "error",
            "message": (
                "Please select two different reports."
            ),
        }

    # --------------------------------------------------------
    # Build paths
    # --------------------------------------------------------

    previous_path = (
        UPLOAD_DIR / previous_report_name
    )

    latest_path = (
        UPLOAD_DIR / latest_report_name
    )

    # --------------------------------------------------------
    # Check previous report
    # --------------------------------------------------------

    if not previous_path.exists():

        return {
            "status": "error",
            "message": (
                f"Previous report not found: "
                f"{previous_report_name}"
            ),
        }

    if not previous_path.is_file():

        return {
            "status": "error",
            "message": (
                f"Previous report is invalid: "
                f"{previous_report_name}"
            ),
        }

    # --------------------------------------------------------
    # Check latest report
    # --------------------------------------------------------

    if not latest_path.exists():

        return {
            "status": "error",
            "message": (
                f"Latest report not found: "
                f"{latest_report_name}"
            ),
        }

    if not latest_path.is_file():

        return {
            "status": "error",
            "message": (
                f"Latest report is invalid: "
                f"{latest_report_name}"
            ),
        }

    # --------------------------------------------------------
    # Analyze both reports
    # --------------------------------------------------------

    try:

        previous_report = analyze_report(
            previous_report_name
        )

        latest_report = analyze_report(
            latest_report_name
        )

        # ----------------------------------------------------
        # Compare extracted laboratory values
        # ----------------------------------------------------

        comparison = compare_reports(
            previous_report,
            latest_report,
        )

        return {
            "status": "success",
            **comparison,
        }

    except Exception as exc:

        return {
            "status": "error",
            "message": (
                f"Report comparison failed: "
                f"{exc}"
            ),
        }


# ============================================================
# TEXT REPAIR HELPERS
# ============================================================


def repair_api_text(value):

    if not isinstance(value, str):
        return value

    replacements = {
        "â€“": "–",
        "â€”": "—",
        "â€˜": "‘",
        "â€™": "’",
        "â€œ": "“",
        "â€": "”",
        "Ã—": "×",
        "Âµ": "µ",
        "Â°": "°",
        "Â²": "²",
        "Â³": "³",
        "Â±": "±",
        "â€¦": "…",
        "â†’": "→",
        "â†": "←",
        "Â ": " ",
    }

    for bad, good in replacements.items():

        value = value.replace(
            bad,
            good,
        )

    return value


def clean_lab_row(row):

    if not isinstance(row, dict):
        return row

    cleaned = dict(row)

    for key in (
        "reference",
        "unit",
        "result",
        "display_value",
    ):

        if key in cleaned:

            cleaned[key] = repair_api_text(
                cleaned[key]
            )

    return cleaned


def repair_nested_api_text(value):

    if isinstance(value, str):

        return repair_api_text(value)

    if isinstance(value, list):

        return [
            repair_nested_api_text(item)
            for item in value
        ]

    if isinstance(value, dict):

        return {
            key: repair_nested_api_text(item)
            for key, item in value.items()
        }

    return value


# ============================================================
# REPORT ANALYTICS
# ============================================================


@app.get("/v1/analytics")
def get_report_analytics():

    try:

        # ----------------------------------------------------
        # Get uploaded PDF names
        # ----------------------------------------------------

        document_names = sorted(
            [
                path.name
                for path in UPLOAD_DIR.iterdir()
                if path.is_file()
                and path.suffix.lower() == ".pdf"
            ]
        )

        # ----------------------------------------------------
        # Generate analytics
        # ----------------------------------------------------

        analytics = generate_report_analytics(
            document_names
        )

        # ----------------------------------------------------
        # Repair nested encoding
        # ----------------------------------------------------

        analytics = repair_nested_api_text(
            analytics
        )

        # ----------------------------------------------------
        # Clean laboratory rows specifically
        # ----------------------------------------------------

        if isinstance(analytics, dict):

            latest_report = analytics.get(
                "latest_report"
            )

            if isinstance(latest_report, dict):

                laboratory_values = (
                    latest_report.get(
                        "laboratory_values",
                        [],
                    )
                )

                latest_report[
                    "laboratory_values"
                ] = [
                    clean_lab_row(row)
                    for row in laboratory_values
                ]

                analytics[
                    "latest_report"
                ] = latest_report

            # ------------------------------------------------
            # Clean reports list
            # ------------------------------------------------

            reports = analytics.get(
                "reports"
            )

            if isinstance(reports, list):

                cleaned_reports = []

                for report in reports:

                    if not isinstance(
                        report,
                        dict,
                    ):

                        cleaned_reports.append(
                            report
                        )

                        continue

                    report = dict(report)

                    laboratory_values = (
                        report.get(
                            "laboratory_values",
                            [],
                        )
                    )

                    report[
                        "laboratory_values"
                    ] = [
                        clean_lab_row(row)
                        for row in laboratory_values
                    ]

                    cleaned_reports.append(
                        report
                    )

                analytics[
                    "reports"
                ] = cleaned_reports

            # ------------------------------------------------
            # Clean comparison
            # ------------------------------------------------

            comparison = analytics.get(
                "comparison"
            )

            if isinstance(comparison, list):

                analytics[
                    "comparison"
                ] = [
                    repair_nested_api_text(
                        item
                    )
                    for item in comparison
                ]

        return analytics

    except Exception as exc:

        return {
            "status": "error",
            "message": (
                f"Unable to generate analytics: "
                f"{exc}"
            ),
        }


# ============================================================
# RUN DIRECTLY
# ============================================================


if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )