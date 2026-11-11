from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MedSearch AI",
    description="Lightweight Cloud API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "status": "online",
        "message": "MedSearch AI Backend is running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "MedSearch AI",
    }


@app.get("/v1/stats")
def stats():
    return {
        "status": "success",
        "total_documents": 0,
        "rag_ready": False,
        "message": "AI services are not enabled in lightweight cloud mode.",
    }
