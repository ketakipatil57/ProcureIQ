import logging
from fastapi import FastAPI,UploadFile,File
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import MatchRequest, MatchResponse, TextExtractionResponse
from app.similarity import find_similar_standards
from app.pdf_parser import extract_text_from_pdf
from pathlib import Path
from tempfile import NamedTemporaryFile

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="ProcureIQ AI Service",
    description="Sematic Indian Standards Recommendation Engine",
    version ="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message":"ProcureIQ AI Service is running!"
    }

@app.post("/match",response_model = MatchResponse)
def match_standards(request:MatchRequest):
    results = find_similar_standards(request.text)

    return {
        "results":results
    }

@app.post("/match-pdf",response_model = MatchResponse)
async def match_pdf(file:UploadFile = File(...)):
    file_path = f"temp_{file.filename}"
    with open(file_path ,"wb") as buffer:
        buffer.write(await file.read())

    text = extract_text_from_pdf(file_path)
    results = find_similar_standards(text)

    return {
        "results":results
    }

@app.post("/extract-pdf", response_model=TextExtractionResponse)
async def extract_pdf(file:UploadFile = File(...)):
    file_name = (file.filename or "tender.pdf").replace("\r", "_").replace("\n", "_")[:255]
    file_bytes = await file.read()
    byte_count = len(file_bytes)
    suffix = Path(file_name).suffix or ".pdf"
    temporary_path = None
    try:
        with NamedTemporaryFile(suffix=suffix, delete=False) as temporary_file:
            temporary_path = temporary_file.name
            temporary_file.write(file_bytes)

        text = extract_text_from_pdf(temporary_path)
    except Exception as exception:
        exception_message = str(exception).replace("\r", " ").replace("\n", " ")[:500]
        logger.error(
            "PDF text extraction filename=%s byte_count=%d outcome=failed "
            "exception_type=%s exception_message=%s",
            file_name,
            byte_count,
            type(exception).__name__,
            exception_message,
        )
        raise
    finally:
        if temporary_path is not None:
            Path(temporary_path).unlink(missing_ok=True)

    outcome = "success" if text.strip() else "empty"
    logger.info(
        "PDF text extraction filename=%s byte_count=%d outcome=%s extracted_char_count=%d",
        file_name,
        byte_count,
        outcome,
        len(text),
    )
    return {"text": text}