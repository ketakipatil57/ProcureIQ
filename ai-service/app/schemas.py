from pydantic import BaseModel 

class MatchRequest(BaseModel):
    text:str

class StandardResult(BaseModel):
    is_number:str
    title:str
    score:float

class  MatchResponse(BaseModel):
    results: list[StandardResult]