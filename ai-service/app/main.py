from fastapi import FastAPI,UploadFile,File
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import MatchRequest, MatchResponse
from app.similarity import find_similar_standards
from app.pdf_parser import extract_text_from_pdf

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