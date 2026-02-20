import os
import time
import re
import collections

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import nltk
from nltk.corpus import stopwords
from nltk.sentiment import SentimentIntensityAnalyzer


app = FastAPI()

# Allow all origins (since frontend is separate project)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRequest(BaseModel):
    text: str


WORD_RE = re.compile(r"\b\w+(?:'\w+)?\b")

STOP_WORDS = None
SIA = None


def initialize_nltk():
    """
    Lazy loads NLTK into Vercel's writable /tmp directory.
    """
    global STOP_WORDS, SIA

    if STOP_WORDS is not None and SIA is not None:
        return

    download_dir = "/tmp/nltk_data"
    os.makedirs(download_dir, exist_ok=True)
    nltk.data.path.append(download_dir)

    required = [
        ("corpora/stopwords", "stopwords"),
        ("sentiment/vader_lexicon", "vader_lexicon"),
    ]

    for path, pkg in required:
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(pkg, download_dir=download_dir, quiet=True)

    STOP_WORDS = set(stopwords.words("english"))
    SIA = SentimentIntensityAnalyzer()


def tokenize(text: str):
    return WORD_RE.findall(text.lower())


@app.post("/analyze")
async def analyze_text(req: TextRequest):
    start = time.perf_counter()

    initialize_nltk()

    text = (req.text or "").strip()
    if not text:
        return {"error": "Empty text"}

    tokens = tokenize(text)

    # ✅ Proper token stream format for frontend
    token_stream = [
        {
            "text": token,
            "is_stop": token in STOP_WORDS
        }
        for token in tokens
    ]

    content_words = [t for t in tokens if t not in STOP_WORDS]

    counts = collections.Counter(content_words).most_common()

    freq_data = [
        {"word": word, "count": count}
        for word, count in counts
    ]

    lexical_diversity = (
        len(set(content_words)) / len(content_words)
        if content_words
        else 0.0
    )

    scores = SIA.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.05:
        sentiment_label = "POSITIVE"
    elif compound <= -0.05:
        sentiment_label = "NEGATIVE"
    else:
        sentiment_label = "NEUTRAL"

    confidence = int(round(abs(compound) * 100))

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