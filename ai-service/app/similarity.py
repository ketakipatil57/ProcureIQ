#top 5 dot product se calulation jyada score hote unko stanadards cvs file ke sath map karo 

from pathlib import Path
import numpy as np
import pandas as pd
from app.model import model 

PROJECT_PATH = Path(__file__).resolve().parents[2]
CSV_PATH = PROJECT_PATH / "data" / "standards.csv"
EMBEDDINGS_PATH = PROJECT_PATH / "ai-service" / "embeddings.npy"
standards_df = pd.read_csv(CSV_PATH)

standard_embeddings = np.load(EMBEDDINGS_PATH)


def find_similar_standards(query:str,top_k: int = 5):
    query_embedding = model.encode(
        query ,
        normalize_embeddings= True
    )

    scores = np.dot(standard_embeddings,query_embedding)
    top_indices = np.argsort(scores)[::-1][:top_k]
#first top 5 desc order
    results = []
    for index in top_indices:
        standard = standards_df.iloc[index]
        results.append({
            "is_number":standard["is_number"],
            "title":standard["title"],
            "score":round(float(scores[index]),4)
             })
    return results
