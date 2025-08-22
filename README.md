# Resume Tailor - MVP

A minimal FastAPI service that tailors resumes to job descriptions.  
Outputs ATS-friendly DOCX resumes with optional OpenAI rewriting.

---

## 🚀 Quick Start (Local)

```bash
# Clone repo
git clone https://github.com/yourusername/resume-tailor-mvp.git
cd resume-tailor-mvp

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # (Windows: .venv\Scripts\activate)

# Install deps
pip install -r requirements.txt

# Run
uvicorn app.main:app --reload
