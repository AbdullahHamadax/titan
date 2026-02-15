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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only — lock down in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str

WORD_RE = re.compile(r"[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?")

STOP_WORDS = set()
SIA = None

def _ensure_nltk():
    needed = [
        ("corpora/stopwords", "stopwords"),
        ("sentiment/vader_lexicon.zip", "vader_lexicon"),
    ]
    for path, pkg in needed:
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(pkg, quiet=True)

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

    token_stream = [
        {"text": t, "is_stop": (t.lower() in STOP_WORDS)}
        for t in tokens
    ]

    content_words = [t.lower() for t in tokens if t.lower() not in STOP_WORDS]

    counts = collections.Counter(content_words).most_common(4)
    freq_data = [{"word": w.capitalize(), "count": c} for w, c in counts]

    lexical_diversity = (len(set(content_words)) / len(content_words)) if content_words else 0.0

    scores = SIA.polarity_scores(text)  # neg/neu/pos/compound
    compound = scores["compound"]

    if compound >= 0.05:
        sentiment_label = "POSITIVE"
    elif compound <= -0.05:
        sentiment_label = "NEGATIVE"
    else:
        sentiment_label = "NEUTRAL"

    confidence = int(round(max(scores["pos"], scores["neu"], scores["neg"]) * 100))

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
