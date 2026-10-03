from fastapi import FastAPI,UploadFile,File

from app.schemas import MatchRequest, MatchResponse
from app.similarity import find_similar_standards
from app.pdf_parser import extract_text_from_pdf

app = FastAPI(
    title="ProcureIQ AI Service",
    description="Sematic Indian Standards Recommendation Engine",
    version ="1.0.0"
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