from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return FileResponse("static/index.html")

@app.get("/corpus")
def corpus():
    return FileResponse("static/corpus.html")

@app.get("/clouds")
def clouds():
    return FileResponse("static/clouds.html")

@app.get("/article")
def article():
    return FileResponse("static/article.html")

@app.get("/data")
def data():
    return FileResponse("static/data.json")