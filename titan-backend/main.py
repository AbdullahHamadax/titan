import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import collections
import re

import nltk
from nltk.corpus import stopwords
from nltk.sentiment import SentimentIntensityAnalyzer

app = FastAPI()

# Note: allow_origins= is great for development. 
# Once you know your Vercel Frontend URL, replace "*" with your frontend URL for security!
app.add_middleware(
    CORSMiddleware,
    allow_origins=,  
    allow_methods=,
    allow_headers=,
)

class TextRequest(BaseModel):
    text: str

WORD_RE = re.compile(r"+(?:'+)?")

STOP_WORDS = set()
SIA = None

def _ensure_nltk():
    # VERCEL FIX: Route all NLTK downloads to the temporary directory
    download_dir = "/tmp/nltk_data"
    os.makedirs(download_dir, exist_ok=True)
    nltk.data.path.append(download_dir)
    
    needed =
    for path, pkg in needed:
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(pkg, download_dir=download_dir, quiet=True)

@app.on_event("startup")
def startup():
    global STOP_WORDS, SIA
    _ensure_nltk()
    STOP_WORDS = set(stopwords.words("english"))
    SIA = SentimentIntensityAnalyzer()

def tokenize(text: str):
    return WORD_RE.findall(text)

@app.post("/analyze")
async def analyze_text(req: TextRequest):
    start = time.perf_counter()
    text = (req.text or "").strip()

    if not text:
        return {"error": "Empty text"}

    tokens = tokenize(text)

    token_stream =

    content_words =

    counts = collections.Counter(content_words).most_common()
    freq_data =

    lexical_diversity = (len(set(content_words)) / len(content_words)) if content_words else 0.0

    scores = SIA.polarity_scores(text) 
    compound = scores

    if compound >= 0.05:
        sentiment_label = "POSITIVE"
    elif compound <= -0.05:
        sentiment_label = "NEGATIVE"
    else:
        sentiment_label = "NEUTRAL"

    confidence = int(round(max(scores, scores, scores) * 100))

    ms = int((time.perf_counter() - start) * 1000)

    return {
        "freq_data": freq_data,
        "token_stream": token_stream,
        "stats": {
            "processing_time": f"{ms}ms",
            "lexical_diversity": round(lexical_diversity, 2),
            "sentiment": sentiment_label,
            "confidence": f"{confidence}%",
            "word_count": len(tokens),
            "char_count": len(text),
        }
    }