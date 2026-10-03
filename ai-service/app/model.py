#multilanguage ke liye

from sentence_transformers import SentenceTransformer
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

model = SentenceTransformer(MODEL_NAME)

def get_embedding(text: str):
    return model.encode(text)