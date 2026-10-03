#csv file ho embed karate jisase ai samaj paaye 

from pathlib import Path 
import numpy as np 
import pandas as pd
from app.model import model 

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = PROJECT_ROOT / "data" / "standards.csv"
EMBEDDINGS_PATH = PROJECT_ROOT / "ai-service" / "embeddings.npy"

def generate_embeddings():
   df = pd.read_csv(CSV_PATH)
   print(f"Loaded {len(df)} standards")
   texts = df["search_text"].astype(str).tolist()
   print("Generating embedding...")

   embeddings = model.encode(texts,normalize_embeddings = True,show_progress_bar= True)

   np.save(EMBEDDINGS_PATH,embeddings)
   print(f"Embeddings shape: {embeddings.shape}")
   print(f"Saved to :{EMBEDDINGS_PATH}")

if __name__=="__main__":
    generate_embeddings()

