from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "🚀 Resume Tailor API is running"}
